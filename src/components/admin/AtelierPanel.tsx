import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { categories, getMeat, meats } from "@/data/djawan";
import { UNAVAILABLE_KEY, useUnavailableMeats } from "@/hooks/use-unavailable-meats";
import { setMeatAvailability } from "@/lib/availability.functions";
import { listOrders, statusLabel, type OrderWithItems } from "@/lib/orders.functions";
import { formatPhone } from "@/lib/phone";

const TO_PREPARE = ["confirmee", "en_preparation"];

/** Kilos à préparer par viande et par découpe, toutes commandes confondues (box simples et mélanges). */
function cutSheet(orders: OrderWithItems[]) {
  const totals = new Map<string, number>();
  for (const o of orders)
    for (const i of o.order_items) {
      const parts = i.mix ? Object.entries(i.mix as Record<string, number>) : [[i.meat_id ?? "", i.format_kg] as [string, number]];
      for (const [id, kg] of parts) {
        const key = `${getMeat(id)?.name ?? id}|${i.cut ?? "Sans préférence"}`;
        totals.set(key, (totals.get(key) ?? 0) + kg * i.qty);
      }
    }
  return [...totals.entries()].map(([k, kg]) => ({ meat: k.split("|")[0]!, cut: k.split("|")[1]!, kg })).sort((a, b) => a.meat.localeCompare(b.meat));
}

export function AtelierPanel() {
  return (
    <div className="grid gap-8">
      <PrepSheet />
      <Availability />
    </div>
  );
}

function PrepSheet() {
  const list = useServerFn(listOrders);
  const q = useQuery({ queryKey: ["admin-orders"], queryFn: () => list({ data: {} }), refetchInterval: 30_000 });
  const orders = (q.data ?? []).filter((o) => TO_PREPARE.includes(o.status)).reverse();
  const sheet = cutSheet(orders);
  const printedAt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Bamako", dateStyle: "full", timeStyle: "short" }).format(new Date());

  return (
    <section>
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black text-brown">Bon de préparation</h2>
          <p className="text-sm text-muted-foreground">Commandes « Confirmée » et « En préparation ».</p>
        </div>
        <button type="button" onClick={() => window.print()} disabled={!orders.length} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brown px-4 text-sm font-bold text-cream disabled:opacity-40"><Printer size={16} /> Imprimer</button>
      </div>

      {q.isLoading && <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>}
      {q.data && !orders.length && <p className="no-print mt-4 rounded-md bg-background p-6 text-sm text-muted-foreground">Aucune commande à préparer. Passez une commande à « Confirmée » pour qu'elle apparaisse ici.</p>}

      {orders.length > 0 && (
        <div className="print-area mt-4 rounded-lg bg-background p-5 text-brown">
          <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
            <p className="font-display text-xl font-black">Djawan Sahel Meat — Bon de préparation</p>
            <p className="text-xs text-muted-foreground">{printedAt}</p>
          </div>

          <h3 className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-secondary">À découper ({orders.length} commande{orders.length > 1 ? "s" : ""})</h3>
          <table className="mt-2 w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-1">Viande</th><th>Découpe</th><th className="text-right">Kilos</th></tr></thead>
            <tbody>{sheet.map((r) => <tr key={r.meat + r.cut} className="border-b border-border/60"><td className="py-1.5 font-semibold">{r.meat}</td><td>{r.cut}</td><td className="text-right font-black">{r.kg} kg</td></tr>)}</tbody>
          </table>

          <h3 className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-secondary">Détail par commande</h3>
          <ol className="mt-2 grid gap-3">
            {orders.map((o) => (
              <li key={o.id} className="break-inside-avoid rounded-md border border-border p-3">
                <p className="flex flex-wrap justify-between gap-2 font-bold"><span>{o.number} · {o.customer_name}</span><span className="text-xs font-semibold text-muted-foreground">{statusLabel(o.status)} · {o.total_kg} kg</span></p>
                <p className="text-xs text-muted-foreground">{formatPhone(o.customer_phone)} · {o.area || "Position GPS"}{o.delivery_when ? ` · ${o.delivery_when}` : ""}</p>
                <ul className="mt-2 text-sm">
                  {o.order_items.map((i) => (
                    <li key={i.id}>
                      <span className="mr-2 inline-block size-3 border border-brown align-middle" aria-hidden="true" />
                      {i.qty} × {i.label}{i.cut ? ` — ${i.cut}` : ""}
                      {i.mix && <span className="block pl-5 text-xs text-muted-foreground">{Object.entries(i.mix as Record<string, number>).map(([id, kg]) => `${getMeat(id)?.name ?? id} ${kg} kg`).join(" · ")}</span>}
                    </li>
                  ))}
                </ul>
                {o.note && <p className="mt-1 text-xs italic">Remarque : {o.note}</p>}
                <p className="mt-2 text-[11px] text-muted-foreground">☐ Sachets étiquetés · ☐ Carton intact · ☐ Découpe conforme</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function Availability() {
  const unavailable = useUnavailableMeats();
  const save = useServerFn(setMeatAvailability);
  const qc = useQueryClient();

  async function toggle(meatId: string, available: boolean) {
    try {
      await save({ data: { meatId, available } });
      await qc.invalidateQueries({ queryKey: UNAVAILABLE_KEY });
      toast.success(`${getMeat(meatId)?.name} : ${available ? "disponible" : "indisponible sur le site"}`);
    } catch (e) {
      toast.error((e as Error).message || "Modification impossible.");
    }
  }

  return (
    <section className="no-print">
      <h2 className="font-display text-2xl font-black text-brown">Disponibilité des viandes</h2>
      <p className="text-sm text-muted-foreground">Une viande désactivée est grisée sur le site et ne peut plus être commandée.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {categories.filter((c) => c.id !== "tout" && c.id !== "melange").map((c) => (
          <div key={c.id} className="rounded-lg bg-background p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">{c.label}</h3>
            <ul className="mt-2 divide-y divide-border">
              {meats.filter((m) => m.category === c.id).map((m) => {
                const available = !unavailable.has(m.id);
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className={available ? "text-sm font-semibold text-brown" : "text-sm font-semibold text-muted-foreground line-through"}>{m.name}</span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      {available ? "Disponible" : "Indisponible"}
                      <Switch checked={available} onCheckedChange={(v) => toggle(m.id, v)} aria-label={`${m.name} disponible`} />
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
