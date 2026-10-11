import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { normalizePhone } from "@/lib/phone";

export type Courier = Tables<"couriers">;

/** Messages levés par les fonctions SQL : rédigés pour l'équipe, affichés tels quels. */
function dbError(error: { code?: string; message: string }) {
  console.error("delivery", error);
  return new Error(error.code === "P0001" || error.code === "42501" ? error.message : "Opération impossible.");
}

export const listCouriers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Courier[]> => {
    const { data, error } = await context.supabase.from("couriers").select("*").order("active", { ascending: false }).order("name");
    if (error) throw new Error("Impossible de charger les livreurs.");
    return data ?? [];
  });

export const saveCourier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(2).max(60), phone: z.string().trim().max(30), vehicle: z.string().trim().max(40), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const phone = normalizePhone(data.phone);
    if (!phone) throw new Error("Numéro de téléphone invalide.");
    const row = { name: data.name, phone, vehicle: data.vehicle, active: data.active };
    const { error } = data.id
      ? await context.supabase.from("couriers").update(row).eq("id", data.id)
      : await context.supabase.from("couriers").insert(row);
    if (error) throw dbError(error);
    return { ok: true };
  });

export const assignCourier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), courierId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("assign_courier", { _order_id: data.orderId, _courier_id: data.courierId });
    if (error) throw dbError(error);
    return { ok: true };
  });

export const confirmDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderId: z.string().uuid(), code: z.string().trim().max(4).regex(/^\d{0,4}$/), receiver: z.string().trim().min(2).max(80), comment: z.string().trim().max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("confirm_delivery", { _order_id: data.orderId, _code: data.code, _receiver: data.receiver, _comment: data.comment });
    if (error) throw dbError(error);
    return { ok: true };
  });
