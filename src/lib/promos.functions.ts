import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type PublicPromo = { id: string; name: string; tagline: string; offer: string; active: boolean };

export const listPublicPromos = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPromo[]> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client.rpc("get_public_promos");
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
