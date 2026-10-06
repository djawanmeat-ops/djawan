import { useState } from "react";
import { cn } from "@/lib/utils";
import { boxPrice, categories, cutOptions, formatFCFA, formats, getFormat, melangeImage, meats, mixPrice, type FormatId, type Meat } from "@/data/djawan";
import { useCart } from "./cart";

const btn = "inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";

function FormatPicker({ value, onChange }: { value: FormatId; onChange: (f: FormatId) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Format de la box">
      {formats.map((f) => (
        <button key={f.id} type="button" role="radio" aria-checked={value === f.id} onClick={() => onChange(f.id)}
          className={cn("rounded-md border px-1 py-2 text-center transition", value === f.id ? "border-brown bg-brown text-cream" : "border-border text-brown hover:border-brown/50")}>
          <span className="block text-sm font-black">{f.kg} kg</span>
          <span className="block text-[10px] font-semibold opacity-75">{f.name}</span>
        </button>
      ))}
    </div>
  );
}

export function CutPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Découpe</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm font-semibold text-brown sm:max-w-[60%]">
        {cutOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
    </label>
  );
}

function ProductCard({ meat }: { meat: Meat }) {
  const [format, setFormat] = useState<FormatId>("decouverte");
  const [qty, setQty] = useState(1);
  const [cut, setCut] = useState("aucune");
  const { add } = useCart();
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={meat.image} alt={`Box ${meat.name} — paquets sous vide dans le carton Djawan`} width={1200} height={896} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-display text-xl font-bold text-brown">{meat.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{formatFCFA(meat.pricePerKg)} / kg</p>
        </div>
        <FormatPicker value={format} onChange={setFormat} />
        <CutPicker value={cut} onChange={setCut} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantité</span>
          <div className="flex items-center rounded-md border border-border">
            <button type="button" aria-label="Diminuer la quantité" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-10 text-lg font-bold text-brown hover:bg-muted">−</button>
            <span className="w-10 text-center font-bold text-brown" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Augmenter la quantité" onClick={() => setQty((q) => q + 1)} className="h-10 w-10 text-lg font-bold text-brown hover:bg-muted">+</button>
          </div>
        </div>
        <div className="mt-auto flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{qty} × Box {getFormat(format).name}</span>
          <span className="text-xl font-black text-primary">{formatFCFA(boxPrice(meat, format) * qty)}</span>
        </div>
        <button type="button" className={btn} onClick={() => { add({ meatId: meat.id, formatId: format, cut }, qty); setQty(1); }}>Ajouter au panier</button>
      </div>
    </article>
  );
}

function MixBuilder() {
  const [format, setFormat] = useState<FormatId>("decouverte");
  const [mix, setMix] = useState<Record<string, number>>({});
  const [cut, setCut] = useState("aucune");
  const { add } = useCart();
  const target = getFormat(format).kg;
  const used = Object.values(mix).reduce((a, b) => a + b, 0);
  const change = (id: string, d: number) => setMix((m) => {
    const next = Math.max(0, (m[id] ?? 0) + d);
    if (d > 0 && used >= target) return m;
    const copy = { ...m, [id]: next };
    if (!next) delete copy[id];
    return copy;
  });
  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[0.8fr_1.2fr]">
      <div className="relative min-h-64 bg-brown">
        <img src={melangeImage} alt="Box Mélange — plusieurs viandes sous vide dans le carton Djawan" width={1200} height={896} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Box Mélange</p>
        <h3 className="mt-2 font-display text-3xl font-black text-brown">Composez votre box, kilo par kilo.</h3>
        <p className="mt-2 text-sm text-muted-foreground">Choisissez un format, puis répartissez vos viandes jusqu'au poids exact.</p>
        <div className="mt-5"><FormatPicker value={format} onChange={(f) => { setFormat(f); setMix({}); }} /></div>
        <div className="mt-5 flex items-center justify-between text-sm font-bold">
          <span className="text-brown">Poids : <span className={used === target ? "text-primary" : ""}>{used} / {target} kg</span></span>
          <span className="text-muted-foreground">{target - used} kg restant{target - used > 1 ? "s" : ""}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${(used / target) * 100}%` }} /></div>
        <ul className="mt-5 grid max-h-80 gap-x-6 overflow-y-auto pr-1 sm:grid-cols-2">
          {meats.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-brown">{m.name}</p><p className="text-xs text-muted-foreground">{formatFCFA(m.pricePerKg)} / kg</p></div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" aria-label={`Retirer 1 kg de ${m.name}`} onClick={() => change(m.id, -1)} disabled={!mix[m.id]} className="size-8 rounded-md border border-border font-bold text-brown disabled:opacity-30">−</button>
                <span className="w-9 text-center text-sm font-black">{mix[m.id] ?? 0} kg</span>
                <button type="button" aria-label={`Ajouter 1 kg de ${m.name}`} onClick={() => change(m.id, 1)} disabled={used >= target} className="size-8 rounded-md border border-border font-bold text-brown disabled:opacity-30">+</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5"><CutPicker value={cut} onChange={setCut} /></div>
        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
          <span className="text-2xl font-black text-primary">{formatFCFA(mixPrice(mix))}</span>
        </div>
        <button type="button" className={cn(btn, "mt-4")} disabled={used !== target} onClick={() => { add({ formatId: format, mix, cut }); setMix({}); }}>
          {used === target ? "Ajouter au panier" : `Complétez jusqu'à ${target} kg`}
        </button>
      </div>
    </div>
  );
}

export function Catalogue() {
  const [cat, setCat] = useState<(typeof categories)[number]["id"]>("tout");
  const list = cat === "tout" ? meats : meats.filter((m) => m.category === cat);
  return (
    <div className="mt-10">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2" role="tablist" aria-label="Familles de viande">
        {categories.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
            className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition", cat === c.id ? "border-brown bg-brown text-cream" : "border-border text-brown hover:border-brown/50")}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {cat === "melange" ? <MixBuilder /> : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {list.map((m) => <ProductCard key={m.id} meat={m} />)}
          </div>
        )}
      </div>
      {cat !== "melange" && <div className="mt-10"><MixBuilder /></div>}
    </div>
  );
}
