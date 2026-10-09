import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { StaffRole } from "@/lib/orders.functions";

const STAFF_ROLES = ["admin", "pdg", "gestionnaire"] as const;

export type TeamMember = { id: string; email: string; confirmed: boolean; lastSignIn: string | null; role: StaffRole | null };

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

/** Comptes créés sur /auth et rôle d'équipe de chacun. */
export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamMember[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: users, error }, { data: roles }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw new Error("Impossible de charger les comptes.");
    const roleOf = (id: string) => (roles ?? []).find((r) => r.user_id === id && (STAFF_ROLES as readonly string[]).includes(r.role))?.role as StaffRole | undefined;
    return users.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      confirmed: !!u.email_confirmed_at,
      lastSignIn: u.last_sign_in_at ?? null,
      role: roleOf(u.id) ?? null,
    }));
  });

export const setTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), role: z.enum([...STAFF_ROLES, "aucun"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role !== "admin") throw new Error("Vous ne pouvez pas retirer votre propre accès administrateur.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (!target.user?.email_confirmed_at) throw new Error("Ce compte n'a pas encore confirmé son adresse e-mail.");
    const { error: delError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).in("role", [...STAFF_ROLES]);
    if (delError) throw new Error("Modification impossible.");
    if (data.role !== "aucun") {
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
      if (error) throw new Error("Modification impossible.");
    }
    return { ok: true };
  });
