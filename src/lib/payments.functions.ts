import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

export type Schedule = Tables<"jawan28_schedules">;
export type Payment = Tables<"payment_transactions"> & { author: string };

/** Moyens d'encaissement (les mêmes que le panier, sans « à la livraison »). */
export const CASH_METHODS = [
  { id: "orange-money", label: "Orange Money" },
  { id: "wave", label: "Wave" },
  { id: "especes", label: "Espèces" },
] as const;
export const cashLabel = (id: string) => CASH_METHODS.find((m) => m.id === id)?.label ?? id;

export type TrancheState = "payee" | "retard" | "aujourdhui" | "a_venir";
const DAY = 86_400_000;
/** Date du jour à Bamako (UTC+0), au format AAAA-MM-JJ comme les échéances. */
export const todayBamako = () => new Date().toISOString().slice(0, 10);
export function trancheState(s: Pick<Schedule, "amount_due" | "amount_paid" | "due_date">, today = todayBamako()): { state: TrancheState; lateDays: number } {
  if (s.amount_paid >= s.amount_due) return { state: "payee", lateDays: 0 };
  const late = Math.round((Date.parse(today) - Date.parse(s.due_date)) / DAY);
  if (late > 0) return { state: "retard", lateDays: late };
  return { state: late === 0 ? "aujourdhui" : "a_venir", lateDays: 0 };
}

/** Message erreur des fonctions SQL : rédigés pour l'équipe, on les affiche tels quels. */
function dbError(error: { code?: string; message: string }) {
  console.error("payments", error);
  return new Error(error.code === "P0001" || error.code === "42501" ? error.message : "Opération impossible.");
}

export const getOrderPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: schedules, error: e1 }, { data: payments, error: e2 }] = await Promise.all([
      context.supabase.from("jawan28_schedules").select("*").eq("order_id", data.orderId).order("tranche"),
      context.supabase.from("payment_transactions").select("*").eq("order_id", data.orderId).order("paid_at"),
    ]);
    if (e1 || e2) throw new Error("Impossible de charger les paiements.");
    const { staffEmails } = await import("@/lib/staff-emails.server");
    const authors = await staffEmails((payments ?? []).map((p) => p.received_by));
    return {
      schedules: schedules ?? [],
      payments: (payments ?? []).map((p): Payment => ({ ...p, author: p.received_by ? (authors[p.received_by] ?? "Équipe") : "—" })),
    };
  });

export const decideJawan28 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderId: z.string().uuid(), accept: z.boolean(), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), comment: z.string().trim().max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("decide_jawan28", { _order_id: data.orderId, _accept: data.accept, _start: data.start, _comment: data.comment });
    if (error) throw dbError(error);
    return { ok: true };
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      orderId: z.string().uuid(),
      scheduleId: z.string().uuid().nullable(),
      method: z.enum(CASH_METHODS.map((m) => m.id) as [string, ...string[]]),
      reference: z.string().trim().max(80),
      amount: z.number().int().positive().max(10_000_000),
      comment: z.string().trim().max(300),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("record_payment", {
      _order_id: data.orderId, _schedule_id: data.scheduleId, _method: data.method, _reference: data.reference, _amount: data.amount, _comment: data.comment,
    });
    if (error) throw dbError(error);
    return { ok: true };
  });

/** Toutes les tranches des Jawan 28 validés, avec la commande correspondante. */
export const listJawanSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("jawan28_schedules")
      .select("*, orders(id, number, customer_name, customer_phone, status, total_fcfa)")
      .order("due_date");
    if (error) {
      console.error("listJawanSchedules", error);
      throw new Error("Impossible de charger les échéances.");
    }
    return data;
  });
