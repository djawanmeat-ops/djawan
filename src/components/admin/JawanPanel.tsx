import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatFCFA } from "@/data/djawan";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";
import { listOrders, type Order } from "@/lib/orders.functions";
import { listJawanSchedules, trancheState, type Schedule, type TrancheState } from "@/lib/payments.functions";
import { JawanDecision, PaymentForm, ReminderButton, TrancheBadge, fmtDay } from "./PaymentsSection";

type Filter = "relancer" | "a_venir" | "payee" | "toutes";
const FILTERS: { id: Filter; label: string; states: TrancheState[] }[] = [
  { id: "relancer", label: "À encaisser / relancer", states: ["retard", "aujourdhui"] },
  { id: "a_venir", label: "À venir", states: ["a_venir"] },
  { id: "payee", label: "Payées", states: ["payee"] },
  { id: "toutes", label: "Toutes", states: ["retard", "aujourdhui", "a_venir", "payee"] },
];

export function JawanPanel() {
  const fetchSchedules = useServerFn(listJawanSchedules);
  const fetchOrders = useServerFn(listOrders);
  const sq = useQuery({ queryKey: ["jawan-schedules"], queryFn: () => fetchSchedules(), refetchInterval: 60_000 });
  const oq = useQuery({ queryKey: ["admin-orders"], queryFn: () => fetchOrders({ data: {} }), refetchInterval: 30_000 });
  const [filter, setFilter] = useState<Filter>("relancer");
  const [open, setOpen] = useState<string | null>(null);

  const pending = (oq.data ?? []).filter((o) => o.jawan28_requested && !o.jawan28_decision && o.status !== "annulee");
  // Les tranches d'une commande annulée ne sont plus à encaisser.
  const rows = (sq.data ?? []).filter((s) => s.orders && s.orders.status !== "annulee").map((s) => ({ ...s, ...trancheState(s) }));
  const sum = (states: TrancheState[]) => rows.filter((r) => states.includes(r.state)).reduce((t, r) => t + r.amount_due - r.amount_paid, 0);
  const count = (states: TrancheState[]) => rows.filter((r) => states.includes(r.state)).length;
  const shown = rows.filter((r) => FILTERS.find((f) => f.id === filter)!.states.includes(r.state));
  const fullOrder = (id: string) => oq.data?.find((o) => o.id === id);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="En retard" value={formatFCFA(sum(["retard"]))} sub={`${count(["retard"])} tranche(s)`} tone="danger" />
        <Stat label="Dues aujourd'hui" value={formatFCFA(sum(["aujourdhui"]))} sub={`${count(["aujourdhui"])} tranche(s)`} tone="gold" />
        <Stat label="À venir" value={formatFCFA(sum(["a_venir"]))} sub={`${count(["a_venir"])} tranche(s)`} />
        <Stat label="Encours total" value={formatFCFA(sum(["retard", "aujourdhui", "a_venir"]))} sub="reste à encaisser" />
      </div>

      {pending.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-xl font-black text-brown">Demandes à valider ({pending.length})</h2>
          <ul className="mt-2 grid gap-2">
            {pending.map((o) => (
              <li key={o.id} className="rounded-lg bg-background p-4">
                <p className="font-bold text-brown">{o.number} · {o.customer_name} · {formatFCFA(o.total_fcfa)}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(o.customer_phone)} · {o.area || "Position GPS"}</p>
                <JawanDecision order={o} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold", filter === f.id ? "border-brown bg-brown text-cream" : "border-border bg-background text-brown")}>
            {f.label} ({count(f.states)})
          </button>
        ))}
      </div>

      {sq.isLoading && <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>}
      {sq.error && <p className="mt-6 text-sm font-semibold text-primary">{(sq.error as Error).message}</p>}
      {sq.data && shown.length === 0 && <p className="mt-6 rounded-md bg-background p-6 text-sm text-muted-foreground">Aucune tranche dans cette catégorie.</p>}

      <ul className="mt-4 grid gap-2">
        {shown.map((r) => {
          const o = r.orders!;
          const order = fullOrder(o.id);
          const rest = r.amount_due - r.amount_paid;
          return (
            <li key={r.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-brown">{o.number} · {o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">Tranche {r.tranche}/3 · échéance {fmtDay(r.due_date)} · {formatPhone(o.customer_phone)}</p>
                </div>
                <div className="text-right">
                  <TrancheBadge state={r.state} lateDays={r.lateDays} />
                  <p className="mt-1 font-black text-primary">{formatFCFA(rest > 0 ? rest : r.amount_due)}</p>
                </div>
              </div>
              {rest > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {order && <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="inline-flex min-h-9 items-center rounded-md border border-brown px-3 text-xs font-bold text-brown">Encaisser</button>}
                  <ReminderButton order={o} schedule={r as Schedule} />
                </div>
              )}
              {open === r.id && order && <PaymentForm order={order as Order} schedule={r as Schedule} remaining={rest} onDone={() => setOpen(null)} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "danger" | "gold" }) {
  return (
    <div className={cn("rounded-lg p-4", tone === "danger" ? "bg-primary text-primary-foreground" : tone === "gold" ? "bg-gold text-brown" : "bg-background text-brown")}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-display text-xl font-black">{value}</p>
      <p className="text-xs opacity-75">{sub}</p>
    </div>
  );
}
