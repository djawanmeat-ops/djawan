import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { formatFCFA, getFormat, getMeat, mixPrice, type FormatId } from "@/data/djawan";

export type CartLine = {
  key: string;
  formatId: FormatId;
  qty: number;
  /** id de la viande pour une box simple, ou composition kg pour un mélange */
  meatId?: string;
  mix?: Record<string, number>;
};

type CartCtx = {
  lines: CartLine[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "djawan-cart";

export function linePrice(line: CartLine) {
  const unit = line.mix ? mixPrice(line.mix) : (getMeat(line.meatId!)?.pricePerKg ?? 0) * getFormat(line.formatId).kg;
  return unit * line.qty;
}

export function lineLabel(line: CartLine) {
  const f = getFormat(line.formatId);
  return line.mix ? `Box Mélange ${f.name} ${f.kg} kg` : `${getMeat(line.meatId!)?.name} — Box ${f.name} ${f.kg} kg`;
}

export function cartMessage(lines: CartLine[], total: number) {
  const rows = lines.map((l) => {
    let s = `• ${l.qty} × ${lineLabel(l)} : ${formatFCFA(linePrice(l))}`;
    if (l.mix) s += "\n" + Object.entries(l.mix).map(([id, kg]) => `   - ${getMeat(id)?.name} : ${kg} kg`).join("\n");
    return s;
  });
  return `Bonjour Djawan Sahel Meat, je souhaite commander :\n${rows.join("\n")}\n\nTotal : ${formatFCFA(total)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(STORAGE) || "[]")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE, JSON.stringify(lines)); }, [lines, ready]);

  const add: CartCtx["add"] = (line, n = 1) => {
    const key = line.mix
      ? `mix-${line.formatId}-${Object.entries(line.mix).sort().map(([k, v]) => `${k}${v}`).join("")}`
      : `${line.meatId}-${line.formatId}`;
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      return found ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + n } : l)) : [...prev, { ...line, key, qty: n }];
    });
    setOpen(true);
  };
  const setQty = (key: string, qty: number) =>
    setLines((prev) => (qty < 1 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))));
  const remove = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + linePrice(l), 0);

  return <Ctx.Provider value={{ lines, open, setOpen, add, setQty, remove, count, total }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
