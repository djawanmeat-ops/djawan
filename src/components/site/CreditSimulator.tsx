import { useState } from "react";
import { cn } from "@/lib/utils";
import { boxPrice, formatFCFA, formats, getFormat, getMeat, meats, splitInThree, whatsappUrl, type FormatId } from "@/data/djawan";
import { useCart } from "./cart";

export function CreditSimulator() {
  const { total: cartTotal } = useCart();
  const [mode, setMode] = useState<"box" | "panier">("box");
  const [meatId, setMeatId] = useState(meats[0]!.id);
  const [format, setFormat] = useState<FormatId>("familiale");
  const meat = getMeat(meatId)!;
  const total = mode === "panier" ? cartTotal : boxPrice(meat, format);
  const parts = splitInThree(total);
  const label = mode === "panier" ? "mon panier" : `une Box ${getFormat(format).name} ${getFormat(format).kg} kg de ${meat.name}`;
  const msg = `Bonjour Djawan Sahel Meat, je souhaite vérifier mon éligibilité à l'Avatar Crédit (Jawan 28) pour ${label}, d'un montant de ${formatFCFA(total)} en 3 tranches de ${parts.map(formatFCFA).join(" / ")}.`;
  const tab = (active: boolean) => cn("flex-1 rounded-md px-3 py-2 text-sm font-bold transition", active ? "bg-gold text-brown" : "text-cream/70 hover:text-cream");
  const select = "h-11 w-full rounded-md border border-cream/25 bg-brown px-3 text-sm font-semibold text-cream";

  return (
    <div className="rounded-lg bg-brown p-7 text-cream sm:p-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-gold">Simulateur Jawan 28</p>
      <div className="mt-5 flex gap-1 rounded-lg border border-cream/20 p-1">
        <button type="button" className={tab(mode === "box")} onClick={() => setMode("box")}>Une box</button>
        <button type="button" className={tab(mode === "panier")} onClick={() => setMode("panier")}>Mon panier</button>
      </div>
      {mode === "box" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select aria-label="Viande" value={meatId} onChange={(e) => setMeatId(e.target.value)} className={select}>
            {meats.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select aria-label="Format" value={format} onChange={(e) => setFormat(e.target.value as FormatId)} className={select}>
            {formats.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.kg} kg</option>)}
          </select>
        </div>
      ) : (
        <p className="mt-4 text-sm text-cream/70">{cartTotal ? "Basé sur le total actuel de votre panier." : "Votre panier est vide : ajoutez une box depuis le catalogue."}</p>
      )}
      <div className="mt-6 flex items-baseline justify-between border-b border-cream/15 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-cream/60">Montant total</span>
        <span className="font-display text-2xl font-black text-gold">{formatFCFA(total)}</span>
      </div>
      <ol className="mt-5 grid gap-5 sm:grid-cols-3">
        {["Jour 0", "Jour 14", "Jour 28"].map((d, i) => (
          <li key={d} className="credit-step border-l border-gold/60 pl-4">
            <span className="text-xs font-black text-gold">Tranche {i + 1} · {d}</span>
            <p className="mt-2 font-display text-xl font-bold">{formatFCFA(parts[i] ?? 0)}</p>
          </li>
        ))}
      </ol>
      <a href={total ? whatsappUrl(msg) : undefined} target="_blank" rel="noreferrer" aria-disabled={!total}
        className={cn("mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cream px-5 py-3 text-sm font-bold text-brown transition hover:bg-gold sm:w-auto", !total && "pointer-events-none opacity-40")}>
        Demander l'éligibilité sur WhatsApp
      </a>
      <p className="mt-5 text-xs text-cream/50">Simulation indicative, sans frais ajoutés. Sous réserve de validation par Djawan Sahel Meat.</p>
    </div>
  );
}
