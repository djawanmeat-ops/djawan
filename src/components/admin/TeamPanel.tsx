import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ROLE_LABELS, type StaffRole } from "@/lib/orders.functions";
import { listTeam, setTeamRole } from "@/lib/team.functions";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Bamako", day: "2-digit", month: "2-digit", year: "numeric" });

export function TeamPanel({ myEmail }: { myEmail: string }) {
  const list = useServerFn(listTeam);
  const save = useServerFn(setTeamRole);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-team"], queryFn: () => list() });

  async function change(userId: string, role: StaffRole | "aucun") {
    try {
      await save({ data: { userId, role } });
      toast.success("Rôle mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-team"] });
    } catch (e) {
      toast.error((e as Error).message || "Modification impossible.");
    }
  }

  return (
    <div>
      <div className="rounded-lg bg-background p-5 text-sm leading-6 text-brown">
        <p className="font-bold">Ajouter un membre de l'équipe</p>
        <ol className="mt-1 list-decimal pl-5 text-muted-foreground">
          <li>La personne crée son compte sur <span className="font-semibold text-brown">/auth</span> (« Première connexion ? Créer un compte »).</li>
          <li>Elle confirme son adresse e-mail grâce au lien reçu.</li>
          <li>Vous lui attribuez son rôle ci-dessous.</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Les trois rôles voient les commandes. Les promotions et l'équipe restent réservées à l'administrateur.</p>
      </div>

      {q.isLoading && <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>}
      {q.error && <p className="mt-6 text-sm font-semibold text-primary">{(q.error as Error).message}</p>}
      <ul className="mt-5 grid gap-2">
        {(q.data ?? []).map((m) => (
          <li key={m.id} className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold text-brown">{m.email}{m.email === myEmail && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}</p>
              <p className="text-xs text-muted-foreground">
                {m.confirmed ? "E-mail confirmé" : "E-mail non confirmé"}
                {m.lastSignIn ? ` · dernière connexion le ${dateFmt.format(new Date(m.lastSignIn))}` : " · jamais connecté"}
              </p>
            </div>
            <select
              value={m.role ?? "aucun"}
              disabled={!m.confirmed || m.email === myEmail}
              onChange={(e) => change(m.id, e.target.value as StaffRole | "aucun")}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-brown disabled:opacity-60"
              aria-label={`Rôle de ${m.email}`}
            >
              <option value="aucun">Aucun accès</option>
              {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
