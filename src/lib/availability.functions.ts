import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMeat } from "@/data/djawan";

/** Identifiants des viandes marquées « momentanément indisponibles » par l'équipe. */
export const listUnavailableMeats = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => {
  const { createPublicClient } = await import("@/lib/public-supabase.server");
  const { data, error } = await createPublicClient().from("meat_availability").select("meat_id").eq("available", false);
  if (error) {
    console.error("availability", error);
    return [];
  }
  return (data ?? []).map((r) => r.meat_id);
});

export const setMeatAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ meatId: z.string().refine((id) => !!getMeat(id)), available: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_meat_availability", { _meat_id: data.meatId, _available: data.available });
    if (error) throw new Error(error.code === "42501" ? "Accès réservé à l'équipe." : "Modification impossible.");
    return { ok: true };
  });
