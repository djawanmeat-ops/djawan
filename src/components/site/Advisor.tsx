import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { boxPrice, formatFCFA, getFormat, getMeat, type FormatId } from "@/data/djawan";
import { recommendCuts, type AdvisorResult } from "@/lib/advisor.functions";
import { useCart } from "./cart";

const examples = ["Tiguadèguèna pour 8 personnes", "Grillades du week-end", "Soupe pour la famille"];

export function Advisor() {
  const ask = useServerFn(recommendCuts);
  const { add } = useCart();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<AdvisorResult | null>(null);

  const submit = async (value = text) => {
    if (value.trim().length < 3 || loading) return;
    setLoading(true); setRes(null);
    try { setRes(await ask({ data: { request: value } })); }
    catch { setRes({ intro: "", items: [], error: "Le conseiller n'a pas pu répondre. Réessayez plus tard." }); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-16 grid gap-10 rounded-lg border border-border bg-cream p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Votre boucher conseil</p>
        <h3 className="mt-3 font-display text-3xl font-black text-brown">Dites-nous ce que vous cuisinez.</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Décrivez votre plat et le nombre de convives : nous vous suggérons les morceaux les plus adaptés de notre sélection.</p>
        <form className="mt-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={600} placeholder="Ex. Un mafé pour 6 personnes dimanche"
            className="w-full rounded-md border border-border bg-background p-3 text-sm text-brown outline-none focus:border-brown" />
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((ex) => <button key={ex} type="button" onClick={() => { setText(ex); submit(ex); }} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-brown hover:border-brown/50">{ex}</button>)}
          </div>
          <button type="submit" disabled={loading || text.trim().length < 3} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40">
            {loading ? "Le boucher réfléchit…" : "Obtenir mes conseils"}
          </button>
        </form>
      </div>
      <div aria-live="polite">
        {!res && !loading && <p className="flex h-full items-center border-l border-border pl-6 text-sm text-muted-foreground">Vos recommandations apparaîtront ici.</p>}
        {loading && <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-md bg-muted" />)}</div>}
        {res?.error && <p className="text-sm font-semibold text-primary">{res.error}</p>}
        {res && !res.error && (
          <div>
            <p className="font-display text-lg font-bold text-brown">{res.intro}</p>
            <ul className="mt-4 grid gap-3">
              {res.items.map((r) => {
                const m = getMeat(r.meatId)!; const f = getFormat(r.formatId as FormatId);
                return (
                  <li key={r.meatId} className="flex gap-4 rounded-md border border-border bg-background p-3">
                    <img src={m.image} alt={m.name} width={96} height={72} loading="lazy" decoding="async" className="h-18 w-24 shrink-0 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-brown">{m.name} <span className="text-xs font-semibold text-muted-foreground">· Box {f.name} {f.kg} kg</span></p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{r.reason}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-primary">{formatFCFA(boxPrice(m, f.id))}</span>
                        <button type="button" onClick={() => add({ meatId: m.id, formatId: f.id })} className="rounded-md border border-brown px-3 py-1.5 text-xs font-bold text-brown hover:bg-brown hover:text-cream">Ajouter au panier</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
