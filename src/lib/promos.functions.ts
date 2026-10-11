import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PublicPromo = { id: string; name: string; tagline: string; offer: string; active: boolean };

export const listPublicPromos = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPromo[]> => {
  const { createPublicClient } = await import("@/lib/public-supabase.server");
  const { data, error } = await createPublicClient().rpc("get_public_promos");
  if (error) {
    console.error("promos", error);
    return [];
  }
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, tagline: p.tagline, offer: p.offer, active: p.active }));
});

export const listAdminPromos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { isAdmin: false, promos: [] as PublicPromo[] };
    const { data, error } = await context.supabase.from("promos").select("id,name,tagline,offer,active").order("sort");
    if (error) throw new Error("Impossible de charger les promotions.");
    return { isAdmin: true, promos: data as PublicPromo[] };
  });

export const updatePromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().min(1).max(40), tagline: z.string().max(300), offer: z.string().max(500), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Accès réservé à l'administrateur.");
    const { error } = await context.supabase
      .from("promos")
      .update({ tagline: data.tagline, offer: data.offer, active: data.active, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error("Enregistrement impossible.");
    return { ok: true };
  });
