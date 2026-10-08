import { ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatFCFA, getMeat, whatsappUrl } from "@/data/djawan";
import { cartMessage, lineCut, lineLabel, linePrice, useCart } from "./cart";

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} aria-label={`Ouvrir le panier (${count} article${count > 1 ? "s" : ""})`} className="relative grid size-11 place-items-center rounded-md border border-border text-brown transition hover:border-brown/50">
      <ShoppingBag size={20} />
      {count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-black text-primary-foreground">{count}</span>}
    </button>
  );
}

const field = "mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-brown outline-none focus:border-brown";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, total, delivery, setDelivery } = useCart();
  const [tried, setTried] = useState(false);
  const valid = delivery.name.trim() && delivery.area.trim();
  const set = (k: keyof typeof delivery) => (e: { target: { value: string } }) => setDelivery({ ...delivery, [k]: e.target.value });

  const submit = () => {
    setTried(true);
    if (!lines.length || !valid) return;
    window.open(whatsappUrl(cartMessage(lines, total, delivery)), "_blank", "noopener");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col overflow-y-auto bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl font-black text-brown">Votre panier</SheetTitle>
          <SheetDescription>Validez pour envoyer votre commande sur WhatsApp.</SheetDescription>
        </SheetHeader>
        {lines.length === 0 ? (
          <p className="flex-1 py-10 text-center text-sm text-muted-foreground">Votre panier est vide.</p>
        ) : (
          <>
            <ul>
              {lines.map((l) => (
                <li key={l.key} className="border-b border-border py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-brown">{lineLabel(l)}</p>
                    <button type="button" onClick={() => remove(l.key)} aria-label={`Retirer ${lineLabel(l)} du panier`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-bold text-primary transition hover:border-primary">
                      <Trash2 size={14} /> Retirer
                    </button>
                  </div>
                  {l.mix && <p className="mt-1 text-xs text-muted-foreground">{Object.entries(l.mix).map(([id, kg]) => `${getMeat(id)?.name} ${kg} kg`).join(" · ")}</p>}
                  {lineCut(l) && <p className="mt-1 text-xs font-semibold text-secondary">Découpe : {lineCut(l)}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Diminuer" onClick={() => setQty(l.key, l.qty - 1)} className="size-10 rounded-md border border-border font-bold">−</button>
                      <span className="w-6 text-center text-sm font-black">{l.qty}</span>
                      <button type="button" aria-label="Augmenter" onClick={() => setQty(l.key, l.qty + 1)} className="size-10 rounded-md border border-border font-bold">+</button>
                    </div>
                    <span className="font-black text-brown">{formatFCFA(linePrice(l))}</span>
                  </div>
                </li>
              ))}
            </ul>
            <fieldset className="mt-5 grid gap-3">
              <legend className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-secondary">Livraison</legend>
              <label className="text-xs font-bold text-brown">Nom et prénom *<input value={delivery.name} onChange={set("name")} className={field} autoComplete="name" /></label>
              <label className="text-xs font-bold text-brown">Commune ou quartier *<input value={delivery.area} onChange={set("area")} placeholder="Ex. Badalabougou, Hamdallaye…" className={field} /></label>
              <label className="text-xs font-bold text-brown">Date ou créneau souhaité<input value={delivery.when} onChange={set("when")} placeholder="Ex. samedi matin" className={field} /></label>
              <label className="text-xs font-bold text-brown">Remarque<textarea value={delivery.note} onChange={set("note")} rows={2} className={`${field} h-auto py-2`} /></label>
              {tried && !valid && <p className="text-xs font-semibold text-primary">Indiquez votre nom et votre quartier pour valider.</p>}
            </fieldset>
          </>
        )}
        <div className="mt-auto border-t border-border pt-4">
          <div className="flex items-baseline justify-between"><span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total</span><span className="text-2xl font-black text-primary">{formatFCFA(total)}</span></div>
          <button type="button" onClick={submit} disabled={!lines.length}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40">
            Valider sur WhatsApp
          </button>
          <button type="button" onClick={() => setOpen(false)}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-5 py-2 text-sm font-bold text-brown transition hover:border-brown/50">
            Continuer mes achats
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
