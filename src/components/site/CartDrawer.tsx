import { Loader2, LocateFixed, MapPin, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatFCFA, getMeat, getPayment, paymentOptions, whatsappUrl } from "@/data/djawan";
import { getPosition, positionError, reverseGeocode } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { cartMessage, deliveryIssues, lineCut, lineLabel, linePrice, mapsUrl, useCart } from "./cart";

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

function LocationPicker() {
  const { delivery, setDelivery } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const locate = async () => {
    setBusy(true);
    setError("");
    try {
      const location = await getPosition();
      setDelivery((d) => ({ ...d, location }));
      const area = await reverseGeocode(location);
      // On ne remplace jamais un quartier déjà saisi par le client.
      if (area) setDelivery((d) => (d.area.trim() ? d : { ...d, area }));
    } catch (e) {
      setError(positionError(e));
    } finally {
      setBusy(false);
    }
  };

  const loc = delivery.location;
  return (
    <div>
      <p className="text-xs font-bold text-brown">Adresse de livraison</p>
      {loc ? (
        <div className="mt-1 flex items-start gap-2 rounded-md border border-whatsapp/40 bg-whatsapp/10 p-3 text-xs text-brown">
          <MapPin size={16} className="mt-0.5 shrink-0 text-whatsapp" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Position enregistrée{loc.accuracy ? ` (précision ± ${loc.accuracy} m)` : ""}</p>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <a href={mapsUrl(loc)} target="_blank" rel="noreferrer" className="font-semibold underline">Voir sur la carte</a>
              <button type="button" onClick={locate} disabled={busy} className="font-semibold underline">{busy ? "Localisation…" : "Mettre à jour"}</button>
              <button type="button" onClick={() => setDelivery((d) => ({ ...d, location: null }))} className="font-semibold underline">Retirer</button>
            </p>
          </div>
        </div>
      ) : (
        <button type="button" onClick={locate} disabled={busy}
          className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-brown px-4 py-2 text-sm font-bold text-brown transition hover:bg-brown hover:text-cream disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
          {busy ? "Localisation en cours…" : "Utiliser ma position actuelle"}
        </button>
      )}
      {error && <p className="mt-1.5 text-xs font-semibold text-primary">{error}</p>}
      <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">Votre position est seulement ajoutée à votre message WhatsApp pour guider le livreur.</p>
    </div>
  );
}

function PaymentPicker({ invalid }: { invalid: boolean }) {
  const { delivery, setDelivery } = useCart();
  return (
    <fieldset>
      <legend className="text-xs font-bold text-brown">Moyen de paiement *</legend>
      <div className="mt-1 grid gap-2" role="radiogroup">
        {paymentOptions.map((p) => {
          const active = delivery.payment === p.id;
          return (
            <label key={p.id} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm font-semibold transition", active ? "border-brown bg-brown text-cream" : invalid ? "border-primary text-brown" : "border-border text-brown hover:border-brown/50")}>
              <input type="radio" name="payment" value={p.id} checked={active} onChange={() => setDelivery((d) => ({ ...d, payment: p.id }))} className="size-4 accent-gold" />
              {p.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, total, delivery, setDelivery } = useCart();
  const [tried, setTried] = useState(false);
  const issues = deliveryIssues(delivery);
  const set = (k: "name" | "area" | "when" | "note") => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setDelivery((d) => ({ ...d, [k]: value }));
  };

  const submit = () => {
    setTried(true);
    if (!lines.length || issues.length) return;
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
              <LocationPicker />
              <label className="text-xs font-bold text-brown">Commune ou quartier{delivery.location ? "" : " *"}<input value={delivery.area} onChange={set("area")} placeholder="Ex. Badalabougou, Hamdallaye…" className={field} autoComplete="address-level3" /></label>
              <label className="text-xs font-bold text-brown">Date ou créneau souhaité<input value={delivery.when} onChange={set("when")} placeholder="Ex. samedi matin" className={field} /></label>
              <label className="text-xs font-bold text-brown">Remarque<textarea value={delivery.note} onChange={set("note")} rows={2} placeholder="Ex. portail bleu, après la pharmacie…" className={`${field} h-auto py-2`} /></label>
            </fieldset>
            <div className="mt-5">
              <PaymentPicker invalid={tried && !getPayment(delivery.payment)} />
            </div>
            {tried && issues.length > 0 && <p className="mt-3 text-xs font-semibold text-primary">Pour valider, indiquez {issues.join(", ").replace(/, ([^,]*)$/, " et $1")}.</p>}
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
