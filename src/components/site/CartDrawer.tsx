import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatFCFA, getMeat, whatsappUrl } from "@/data/djawan";
import { cartMessage, lineLabel, linePrice, useCart } from "./cart";

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} aria-label={`Ouvrir le panier (${count} article${count > 1 ? "s" : ""})`} className="relative grid size-11 place-items-center rounded-md border border-border text-brown transition hover:border-brown/50">
      <ShoppingBag size={20} />
      {count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-black text-primary-foreground">{count}</span>}
    </button>
  );
}

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, total } = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl font-black text-brown">Votre panier</SheetTitle>
          <SheetDescription>Validez pour envoyer votre commande sur WhatsApp.</SheetDescription>
        </SheetHeader>
        {lines.length === 0 ? (
          <p className="flex-1 py-10 text-center text-sm text-muted-foreground">Votre panier est vide.</p>
        ) : (
          <ul className="-mx-6 flex-1 overflow-y-auto px-6">
            {lines.map((l) => (
              <li key={l.key} className="border-b border-border py-4">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-bold text-brown">{lineLabel(l)}</p>
                  <button type="button" onClick={() => remove(l.key)} className="shrink-0 text-xs font-semibold text-muted-foreground underline hover:text-primary">Retirer</button>
                </div>
                {l.mix && <p className="mt-1 text-xs text-muted-foreground">{Object.entries(l.mix).map(([id, kg]) => `${getMeat(id)?.name} ${kg} kg`).join(" · ")}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Diminuer" onClick={() => setQty(l.key, l.qty - 1)} className="size-8 rounded-md border border-border font-bold">−</button>
                    <span className="w-6 text-center text-sm font-black">{l.qty}</span>
                    <button type="button" aria-label="Augmenter" onClick={() => setQty(l.key, l.qty + 1)} className="size-8 rounded-md border border-border font-bold">+</button>
                  </div>
                  <span className="font-black text-brown">{formatFCFA(linePrice(l))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border pt-4">
          <div className="flex items-baseline justify-between"><span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total</span><span className="text-2xl font-black text-primary">{formatFCFA(total)}</span></div>
          <a href={lines.length ? whatsappUrl(cartMessage(lines, total)) : undefined} target="_blank" rel="noreferrer" aria-disabled={!lines.length}
            className={`mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 ${lines.length ? "" : "pointer-events-none opacity-40"}`}>
            Valider sur WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
