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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Back-office Promos — Djawan Sahel Meat" },
      { name: "description", content: "Gestion des promotions Djawan." },
      { property: "og:title", content: "Back-office — Djawan Sahel Meat" },
      { property: "og:description", content: "Gestion des promotions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const list = useServerFn(listAdminPromos);
  const q = useQuery({ queryKey: ["admin-promos"], queryFn: () => list() });
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-black text-brown">Back-office Promos</h1>
          <button onClick={signOut} className="text-sm font-semibold text-primary underline">Se déconnecter</button>
        </div>
        {q.isLoading && <p className="mt-8">Chargement…</p>}
        {q.error && <p className="mt-8 text-primary">Erreur de chargement.</p>}
        {q.data && !q.data.isAdmin && <p className="mt-8 rounded-md bg-background p-6">Ce compte n'a pas encore les droits administrateur. Contactez le responsable du site.</p>}
        {q.data?.isAdmin && <div className="mt-10 grid gap-5">{q.data.promos.map((p) => <PromoRow key={p.id} promo={p} />)}</div>}
      </div>
    </main>
  );
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
