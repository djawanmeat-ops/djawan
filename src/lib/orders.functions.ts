import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { formats, getCut, getMeat, mixPrice, paymentOptions } from "@/data/djawan";
import { normalizePhone } from "@/lib/phone";

export const ORDER_STATUSES = [
  { id: "nouvelle", label: "Nouvelle" },
  { id: "confirmee", label: "Confirmée" },
  { id: "en_preparation", label: "En préparation" },
  { id: "en_livraison", label: "En livraison" },
  { id: "livree", label: "Livrée" },
  { id: "annulee", label: "Annulée" },
] as const;
export const statusLabel = (id: string) => ORDER_STATUSES.find((s) => s.id === id)?.label ?? id;

export type StaffRole = "admin" | "pdg" | "gestionnaire";
export const ROLE_LABELS: Record<StaffRole, string> = { admin: "Administrateur", pdg: "PDG", gestionnaire: "Gestionnaire" };

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderLog = Tables<"order_status_logs">;
export type OrderWithItems = Order & { order_items: OrderItem[] };

// ---------------------------------------------------------------------------------------------
// Création d'une commande depuis le panier (public)

const lineSchema = z.object({
  formatId: z.string(),
  qty: z.number().int().min(1).max(50),
  meatId: z.string().optional(),
  mix: z.record(z.string(), z.number().int().min(1).max(20)).optional(),
  cut: z.string().max(20).optional(),
});

const orderSchema = z.object({
  lines: z.array(lineSchema).min(1).max(30),
  delivery: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().max(30),
    area: z.string().trim().max(120),
    when: z.string().trim().max(120),
    note: z.string().trim().max(500),
    payment: z.enum(paymentOptions.map((p) => p.id) as [string, ...string[]]),
    location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().min(0).max(100_000) }).nullable(),
    jawan28: z.boolean(),
  }),
});

export type CreatedOrder = { ok: true; number: string; total: number } | { ok: false; error: string };

/**
 * Les prix et les libellés sont recalculés ici à partir de la grille officielle :
 * le total envoyé par le navigateur n'est jamais utilisé.
 */
function priceLines(lines: z.infer<typeof lineSchema>[]) {
  return lines.map((l) => {
    const format = formats.find((f) => f.id === l.formatId);
    if (!format) throw new Error("format inconnu");
    const cut = getCut(l.cut);
    const cutLabel = cut && cut.id !== "aucune" ? cut.label : null;
    if (l.mix) {
      const entries = Object.entries(l.mix);
      if (!entries.length || entries.some(([id]) => !getMeat(id))) throw new Error("mélange invalide");
      if (entries.reduce((s, [, kg]) => s + kg, 0) !== format.kg) throw new Error("poids du mélange incorrect");
      const unit = mixPrice(l.mix);
      return { label: `Box Mélange ${format.name} ${format.kg} kg`, meat_id: null, mix: l.mix, format_id: format.id, format_kg: format.kg, cut: cutLabel, qty: l.qty, unit_price: unit, line_total: unit * l.qty };
    }
    const meat = getMeat(l.meatId ?? "");
    if (!meat) throw new Error("viande inconnue");
    const unit = meat.pricePerKg * format.kg;
    return { label: `${meat.name} — Box ${format.name} ${format.kg} kg`, meat_id: meat.id, mix: null, format_id: format.id, format_kg: format.kg, cut: cutLabel, qty: l.qty, unit_price: unit, line_total: unit * l.qty };
  });
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<CreatedOrder> => {
    const { allowOrder } = await import("@/lib/rate-limit.server");
    if (!allowOrder()) return { ok: false, error: "Trop de commandes envoyées depuis cet appareil. Réessayez dans un moment." };

    const d = data.delivery;
    const phone = normalizePhone(d.phone);
    if (!phone) return { ok: false, error: "Numéro de téléphone invalide." };
    if (!d.area && !d.location) return { ok: false, error: "Indiquez votre quartier ou votre position." };

    let items;
    try {
      items = priceLines(data.lines);
    } catch {
      return { ok: false, error: "Le panier contient un article invalide. Rechargez la page et réessayez." };
    }
    const total = items.reduce((s, i) => s + i.line_total, 0);
    const totalKg = items.reduce((s, i) => s + i.format_kg * i.qty, 0);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("create_web_order", {
      _order: {
        customer_name: d.name, customer_phone: phone, area: d.area, delivery_when: d.when, note: d.note,
        lat: d.location?.lat ?? null, lng: d.location?.lng ?? null, gps_accuracy: d.location ? Math.round(d.location.accuracy) : null,
        payment_method: d.payment, jawan28_requested: d.jawan28, total_kg: totalKg, total_fcfa: total,
      },
      _items: items,
    });
    const created = rows?.[0];
    if (error || !created) {
      console.error("createOrder", error);
      return { ok: false, error: "Enregistrement impossible pour le moment." };
    }
    return { ok: true, number: created.order_number, total };
  });

// ---------------------------------------------------------------------------------------------
// Back-office (équipe connectée ; la base vérifie aussi les droits via RLS)

export const getStaffContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role).filter((r): r is StaffRole => r === "admin" || r === "pdg" || r === "gestionnaire");
    return { roles, email: (context.claims.email as string | undefined) ?? "" };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ status: z.string().max(20).optional(), search: z.string().trim().max(60).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) {
      const s = data.search.replace(/[%,()]/g, "");
      q = q.or(`number.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,area.ilike.%${s}%`);
    }
    const { data: orders, error } = await q;
    if (error) {
      console.error("listOrders", error);
      throw new Error("Impossible de charger les commandes.");
    }
    return orders as OrderWithItems[];
  });

export const getOrderLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: logs, error } = await context.supabase
      .from("order_status_logs").select("*").eq("order_id", data.orderId).order("created_at");
    if (error) throw new Error("Impossible de charger l'historique.");
    // Noms des auteurs : seul le serveur peut lire les e-mails des comptes.
    const ids = [...new Set((logs ?? []).map((l) => l.changed_by).filter((x): x is string => !!x))];
    const authors: Record<string, string> = {};
    if (ids.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await Promise.all(ids.map(async (id) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        if (u.user?.email) authors[id] = u.user.email;
      }));
    }
    return (logs ?? []).map((l) => ({ ...l, author: l.changed_by ? (authors[l.changed_by] ?? "Équipe") : "Site web" }));
  });
