import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { toast } from "sonner";
import { formatFCFA, getCut, getFormat, getMeat, getPayment, mixPrice, splitInThree, type FormatId } from "@/data/djawan";
import { normalizePhone } from "@/lib/phone";

export type CartLine = {
  key: string;
  formatId: FormatId;
  qty: number;
  /** id de la viande pour une box simple, ou composition kg pour un mélange */
  meatId?: string;
  mix?: Record<string, number>;
  cut?: string;
};

export type GeoPoint = { lat: number; lng: number; accuracy: number };
export type Delivery = {
  name: string;
  phone: string;
  area: string;
  when: string;
  note: string;
  payment: string;
  location: GeoPoint | null;
  jawan28: boolean;
};
const emptyDelivery: Delivery = { name: "", phone: "", area: "", when: "", note: "", payment: "", location: null, jawan28: false };

export const mapsUrl = (p: GeoPoint) => `https://maps.google.com/?q=${p.lat},${p.lng}`;

/** Nom, téléphone, quartier ou position, moyen de paiement : le minimum pour livrer. */
export const deliveryIssues = (d: Delivery) =>
  [
    !d.name.trim() && "votre nom",
    !normalizePhone(d.phone) && "un numéro de téléphone valide",
    !d.area.trim() && !d.location && "votre quartier ou votre position",
    !getPayment(d.payment) && "un moyen de paiement",
  ].filter(Boolean) as string[];

type CartCtx = {
  lines: CartLine[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  delivery: Delivery;
  setDelivery: Dispatch<SetStateAction<Delivery>>;
  /** Vide le panier après une commande enregistrée (garde nom, téléphone, quartier et paiement). */
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "djawan-cart";
const STORAGE_DELIVERY = "djawan-delivery";

export function linePrice(line: CartLine) {
  const unit = line.mix ? mixPrice(line.mix) : (getMeat(line.meatId!)?.pricePerKg ?? 0) * getFormat(line.formatId).kg;
  return unit * line.qty;
}

export function lineLabel(line: CartLine) {
  const f = getFormat(line.formatId);
  return line.mix ? `Box Mélange ${f.name} ${f.kg} kg` : `${getMeat(line.meatId!)?.name} — Box ${f.name} ${f.kg} kg`;
}

export function lineCut(line: CartLine) {
  const c = getCut(line.cut);
  return c && c.id !== "aucune" ? c.label : null;
}

export function cartMessage(lines: CartLine[], total: number, d?: Delivery, orderNumber?: string) {
  const rows = lines.map((l) => {
    let s = `• ${l.qty} × ${lineLabel(l)} : ${formatFCFA(linePrice(l))}`;
    if (l.mix) s += "\n" + Object.entries(l.mix).map(([id, kg]) => `   - ${getMeat(id)?.name} : ${kg} kg`).join("\n");
    const cut = lineCut(l);
    if (cut) s += `\n   Découpe : ${cut}`;
    return s;
  });
  const intro = orderNumber ? `Bonjour Djawan Sahel Meat, voici ma commande ${orderNumber} :` : "Bonjour Djawan Sahel Meat, je souhaite commander :";
  let msg = `${intro}\n${rows.join("\n")}\n\nTotal : ${formatFCFA(total)}`;
  if (d) {
    msg += `\n\nLivraison :\n• Nom : ${d.name}`;
    const phone = normalizePhone(d.phone);
    if (phone) msg += `\n• Téléphone : ${phone}`;
    if (d.area.trim()) msg += `\n• Quartier : ${d.area}`;
    if (d.location) msg += `\n• Position : ${mapsUrl(d.location)}`;
    if (d.when.trim()) msg += `\n• Date / créneau : ${d.when}`;
    if (d.note.trim()) msg += `\n• Remarque : ${d.note}`;
    const payment = getPayment(d.payment);
    if (payment) msg += `\n\nPaiement : ${payment.label}`;
    if (d.jawan28) msg += `\nAvatar Crédit (Jawan 28) demandé : 3 tranches de ${splitInThree(total).map(formatFCFA).join(" / ")} (J0, J14, J28), sous réserve de validation.`;
  }
  return msg;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [delivery, setDelivery] = useState<Delivery>(emptyDelivery);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(STORAGE) || "[]")); } catch { /* ignore */ }
    try { setDelivery({ ...emptyDelivery, ...JSON.parse(localStorage.getItem(STORAGE_DELIVERY) || "{}") }); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE, JSON.stringify(lines)); }, [lines, ready]);
  // La position GPS n'est jamais conservée sur l'appareil : elle ne sert qu'à la commande en cours.
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_DELIVERY, JSON.stringify({ ...delivery, location: null })); }, [delivery, ready]);

  const add: CartCtx["add"] = (line, n = 1) => {
    const cut = line.cut ?? "aucune";
    const base = line.mix
      ? `mix-${line.formatId}-${Object.entries(line.mix).sort().map(([k, v]) => `${k}${v}`).join("")}`
      : `${line.meatId}-${line.formatId}`;
    const key = `${base}-${cut}`;
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      return found ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + n } : l)) : [...prev, { ...line, cut, key, qty: n }];
    });
    // Le panier reste fermé pour que le client continue d'ajouter d'autres articles.
    toast.success(`${n} × ${lineLabel({ ...line, key, qty: n })} ajouté${n > 1 ? "s" : ""} au panier`, {
      action: { label: "Voir le panier", onClick: () => setOpen(true) },
    });
  };
  const setQty = (key: string, qty: number) =>
    setLines((prev) => (qty < 1 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))));
  const remove = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));
  const clear = () => {
    setLines([]);
    setDelivery((d) => ({ ...d, when: "", note: "", location: null, jawan28: false }));
  };

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + linePrice(l), 0);

  return <Ctx.Provider value={{ lines, open, setOpen, add, setQty, remove, delivery, setDelivery, clear, count, total }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
