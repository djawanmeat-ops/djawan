/** E-mails des comptes de l'équipe, pour afficher l'auteur d'une action (seul le serveur peut les lire). */
export async function staffEmails(ids: (string | null)[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  const out: Record<string, string> = {};
  if (!unique.length) return out;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await Promise.all(
    unique.map(async (id) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id);
      if (data.user?.email) out[id] = data.user.email;
    }),
  );
  return out;
}
