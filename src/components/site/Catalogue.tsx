import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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

/** Fiche compacte : le choix du format, de la découpe et de la quantité se fait dans ProductDialog. */
function ProductCard({ meat, onChoose }: { meat: Meat; onChoose: () => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <button type="button" onClick={onChoose} tabIndex={-1} aria-hidden="true" className="aspect-[4/3] overflow-hidden">
        <img src={meat.image} alt={`Box ${meat.name} — paquets sous vide dans le carton Djawan`} width={800} height={597} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-5">
        <div>
          <h3 className="font-display text-base leading-tight font-bold text-brown sm:text-xl">{meat.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{formatFCFA(meat.pricePerKg)} / kg</p>
        </div>
        <button type="button" className={cn(btn, "mt-auto min-h-11 px-3")} onClick={onChoose} aria-label={`Choisir ${meat.name}`}>
          Choisir
        </button>
      </div>
    </article>
  );
}

function ProductOptions({ meat, onAdded }: { meat: Meat; onAdded: () => void }) {
  const [format, setFormat] = useState<FormatId>("decouverte");
  const [qty, setQty] = useState(1);
  const [cut, setCut] = useState("aucune");
  const { add } = useCart();
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4 pr-8">
        <img src={meat.image} alt="" width={800} height={597} className="h-20 w-28 shrink-0 rounded-md object-cover sm:h-24 sm:w-32" />
        <div className="min-w-0">
          <DialogTitle className="font-display text-2xl font-black text-brown">{meat.name}</DialogTitle>
          <DialogDescription className="mt-1 text-sm">{formatFCFA(meat.pricePerKg)} / kg</DialogDescription>
        </div>
      </div>
      <FormatPicker value={format} onChange={setFormat} />
      <CutPicker value={cut} onChange={setCut} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantité</span>
        <div className="flex items-center rounded-md border border-border">
          <button type="button" aria-label="Diminuer la quantité" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11 text-lg font-bold text-brown hover:bg-muted">−</button>
          <span className="w-10 text-center font-bold text-brown" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Augmenter la quantité" onClick={() => setQty((q) => q + 1)} className="h-11 w-11 text-lg font-bold text-brown hover:bg-muted">+</button>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{qty} × Box {getFormat(format).name}</span>
        <span className="text-2xl font-black text-primary">{formatFCFA(boxPrice(meat, format) * qty)}</span>
      </div>
      <button type="button" className={btn} onClick={() => { add({ meatId: meat.id, formatId: format, cut }, qty); onAdded(); }}>
        Ajouter au panier
      </button>
    </div>
  );
}

/** Panneau bas sur mobile, fenêtre centrée à partir de sm. */
function ProductDialog({ meat, onClose }: { meat: Meat | null; onClose: () => void }) {
  return (
    <Dialog open={!!meat} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="top-auto bottom-0 left-0 max-h-[92svh] max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl p-5 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-7 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0">
        {meat && <ProductOptions key={meat.id} meat={meat} onAdded={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function MixTeaser({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-[0.6fr_1.4fr]">
      <img src={melangeImage} alt="Box Mélange — plusieurs viandes sous vide dans le carton Djawan" width={800} height={597} loading="lazy" decoding="async" className="aspect-[16/9] h-full w-full object-cover sm:aspect-auto" />
      <div className="flex flex-col justify-center gap-3 p-5 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Box Mélange</p>
        <h3 className="font-display text-2xl font-black text-brown sm:text-3xl">Composez votre box, kilo par kilo.</h3>
        <p className="text-sm text-muted-foreground">Associez plusieurs viandes dans un même format, jusqu'au poids exact.</p>
        <button type="button" onClick={onOpen} className={cn(btn, "mt-2 sm:w-auto sm:self-start")}>Composer ma box</button>
      </div>
    </div>
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
        <img src={melangeImage} alt="Box Mélange — plusieurs viandes sous vide dans le carton Djawan" width={800} height={597} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
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
                <button type="button" aria-label={`Retirer 1 kg de ${m.name}`} onClick={() => change(m.id, -1)} disabled={!mix[m.id]} className="size-10 rounded-md border border-border font-bold text-brown disabled:opacity-30">−</button>
                <span className="w-9 text-center text-sm font-black">{mix[m.id] ?? 0} kg</span>
                <button type="button" aria-label={`Ajouter 1 kg de ${m.name}`} onClick={() => change(m.id, 1)} disabled={used >= target} className="size-10 rounded-md border border-border font-bold text-brown disabled:opacity-30">+</button>
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
  const [selected, setSelected] = useState<Meat | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const list = cat === "tout" ? meats : meats.filter((m) => m.category === cat);
  const openMix = () => {
    setCat("melange");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="mt-10">
      <div ref={tabsRef} className="-mx-5 flex scroll-mt-24 gap-2 overflow-x-auto px-5 pb-2" role="tablist" aria-label="Familles de viande">
        {categories.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
            className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition", cat === c.id ? "border-brown bg-brown text-cream" : "border-border text-brown hover:border-brown/50")}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {cat === "melange" ? <MixBuilder /> : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((m) => <ProductCard key={m.id} meat={m} onChoose={() => setSelected(m)} />)}
          </div>
        )}
      </div>
      {cat !== "melange" && <div className="mt-10"><MixTeaser onOpen={openMix} /></div>}
      <ProductDialog meat={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
