import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { promos as promoDefaults } from "@/data/djawan";
import { promoStatus, formatDate } from "@/lib/promo";
import { listAdminPromos, updatePromo, type PublicPromo } from "@/lib/promos.functions";
import { ROLE_LABELS, getStaffContext } from "@/lib/orders.functions";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { TeamPanel } from "@/components/admin/TeamPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Back-office — Djawan Sahel Meat" },
      { name: "description", content: "Commandes, promotions et équipe Djawan." },
      { property: "og:title", content: "Back-office — Djawan Sahel Meat" },
      { property: "og:description", content: "Gestion des promotions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "commandes" | "promos" | "equipe";

function AdminPage() {
  const me = useServerFn(getStaffContext);
  const ctx = useQuery({ queryKey: ["staff-context"], queryFn: () => me() });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("commandes");

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const roles = ctx.data?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const tabs: { id: Tab; label: string }[] = [
    { id: "commandes", label: "Commandes" },
    ...(isAdmin ? [{ id: "promos" as const, label: "Promos" }, { id: "equipe" as const, label: "Équipe" }] : []),
  ];

  return (
    <main className="min-h-screen bg-cream px-4 py-8 sm:px-5 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Back-office Djawan</p>
            <h1 className="font-display text-3xl font-black text-brown sm:text-4xl">{tabs.find((t) => t.id === tab)?.label ?? "Back-office"}</h1>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {ctx.data && <p>{ctx.data.email}{roles[0] ? ` · ${ROLE_LABELS[roles[0]]}` : ""}</p>}
            <button onClick={signOut} className="mt-1 text-sm font-semibold text-primary underline">Se déconnecter</button>
          </div>
        </div>

        {ctx.isLoading && <p className="mt-8">Chargement…</p>}
        {ctx.error && <p className="mt-8 text-primary">Erreur de chargement.</p>}
        {ctx.data && roles.length === 0 && <p className="mt-8 rounded-md bg-background p-6">Ce compte n'a pas encore accès au back-office. Demandez à l'administrateur de vous attribuer un rôle.</p>}

        {roles.length > 0 && (
          <>
            {tabs.length > 1 && (
              <nav className="mt-6 flex gap-1 rounded-lg bg-background p-1" aria-label="Sections du back-office">
                {tabs.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
                    className={tab === t.id ? "flex-1 rounded-md bg-brown px-3 py-2 text-sm font-bold text-cream" : "flex-1 rounded-md px-3 py-2 text-sm font-bold text-brown hover:bg-muted"}>
                    {t.label}
                  </button>
                ))}
              </nav>
            )}
            <div className="mt-6">
              {tab === "commandes" && <OrdersPanel />}
              {tab === "promos" && isAdmin && <PromosPanel />}
              {tab === "equipe" && isAdmin && <TeamPanel myEmail={ctx.data!.email} />}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function PromosPanel() {
  const list = useServerFn(listAdminPromos);
  const q = useQuery({ queryKey: ["admin-promos"], queryFn: () => list() });
  if (q.isLoading) return <p>Chargement…</p>;
  if (q.error || !q.data?.isAdmin) return <p className="text-primary">Erreur de chargement.</p>;
  return <div className="grid gap-5">{q.data.promos.map((p) => <PromoRow key={p.id} promo={p} />)}</div>;
}

function PromoRow({ promo }: { promo: PublicPromo }) {
  const save = useServerFn(updatePromo);
  const qc = useQueryClient();
  const [tagline, setTagline] = useState(promo.tagline);
  const [offer, setOffer] = useState(promo.offer);
  const [active, setActive] = useState(promo.active);
  const [busy, setBusy] = useState(false);
  const def = promoDefaults.find((d) => d.id === promo.id);
  const st = def?.hijri ? promoStatus(def) : null;

  async function submit(nextActive = active) {
    setBusy(true);
    try {
      await save({ data: { id: promo.id, tagline, offer, active: nextActive } });
      toast.success("Enregistré");
      qc.invalidateQueries({ queryKey: ["promos"] });
    } catch {
      toast.error("Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg bg-background p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-brown">{promo.name}</h2>
        <label className="flex items-center gap-3 text-sm font-semibold">
          {active ? "Activée" : "Désactivée"}
          <Switch checked={active} disabled={busy} onCheckedChange={(v) => { setActive(v); submit(v); }} />
        </label>
      </div>
      {st?.opens && <p className="mt-2 text-xs text-muted-foreground">Ouverture conseillée le {formatDate(st.opens)} · fête le {formatDate(st.feast!)}</p>}
      <label className="mt-4 block text-sm font-semibold">Description<textarea value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={300} className="mt-1 w-full rounded-md border border-border px-3 py-2" rows={2} /></label>
      <label className="mt-3 block text-sm font-semibold">Offre (visible seulement si activée)<textarea value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={500} className="mt-1 w-full rounded-md border border-border px-3 py-2" rows={2} placeholder="Ex. : 1 kg offert pour toute box Festive" /></label>
      <button disabled={busy} onClick={() => submit()} className="mt-4 rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">Enregistrer</button>
    </section>
  );
}
