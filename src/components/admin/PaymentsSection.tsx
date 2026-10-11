import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { formatFCFA, paymentLabel } from "@/data/djawan";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/orders.functions";
import {
  CASH_METHODS, cashLabel, decideJawan28, getOrderPayments, recordPayment, todayBamako, trancheState,
  type Schedule, type TrancheState,
} from "@/lib/payments.functions";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
export const fmtDay = (d: string) => dateFmt.format(new Date(`${d}T00:00:00Z`));
const fmtStamp = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Bamako", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const field = "mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-brown";

/** Tout ce qui dépend des paiements est rafraîchi après une action. */
export function useRefreshPayments(orderId: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      [["order-payments", orderId], ["order-logs", orderId], ["admin-orders"], ["jawan-schedules"]].map((queryKey) => qc.invalidateQueries({ queryKey })),
    );
}

export function TrancheBadge({ state, lateDays }: { state: TrancheState; lateDays: number }) {
  const map: Record<TrancheState, [string, string]> = {
    payee: ["Payée", "bg-whatsapp text-whatsapp-foreground"],
    aujourdhui: ["Due aujourd'hui", "bg-gold text-brown"],
    retard: [`En retard J+${lateDays}`, "bg-primary text-primary-foreground"],
    a_venir: ["À venir", "bg-muted text-muted-foreground"],
  };
  const [label, cls] = map[state];
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold", cls)}>{label}</span>;
}

/** Relance WhatsApp courtoise, rédigée selon l'état de la tranche. */
export function reminderUrl(o: Pick<Order, "customer_name" | "customer_phone" | "number">, s: Schedule) {
  const rest = formatFCFA(s.amount_due - s.amount_paid);
  const { state } = trancheState(s);
  const when = state === "retard" ? `était prévue le ${fmtDay(s.due_date)}` : state === "aujourdhui" ? "est prévue aujourd'hui" : `est prévue le ${fmtDay(s.due_date)}`;
  const ask = state === "retard" ? " Pouvez-vous nous dire quand vous pourrez la régler ?" : "";
  const msg = `Bonjour ${o.customer_name}, ici Djawan Sahel Meat. Petit rappel amical : la tranche ${s.tranche}/3 de votre Avatar Crédit (commande ${o.number}), soit ${rest}, ${when}.${ask} Vous pouvez régler par Orange Money, Wave ou en espèces. Merci pour votre confiance !`;
  return `https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
}

export function ReminderButton({ order, schedule }: { order: Pick<Order, "customer_name" | "customer_phone" | "number">; schedule: Schedule }) {
  return (
    <a href={reminderUrl(order, schedule)} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-whatsapp px-3 text-xs font-bold text-whatsapp-foreground">
      <MessageCircle size={14} /> Relancer
    </a>
  );
}

export function PaymentForm({ order, schedule, remaining, onDone }: { order: Order; schedule: Schedule | null; remaining: number; onDone: () => void }) {
  const save = useServerFn(recordPayment);
  const refresh = useRefreshPayments(order.id);
  const preferred = CASH_METHODS.some((m) => m.id === order.payment_method) ? order.payment_method : "especes";
  const [method, setMethod] = useState<string>(preferred);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(String(remaining));
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const needsRef = method !== "especes";
  const value = Number(amount.replace(/\s/g, ""));
  const valid = Number.isInteger(value) && value > 0 && value <= remaining && (!needsRef || reference.trim().length >= 4);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      await save({ data: { orderId: order.id, scheduleId: schedule?.id ?? null, method, reference, amount: value, comment } });
      toast.success(`${formatFCFA(value)} encaissés (${cashLabel(method)})`);
      await refresh();
      onDone();
    } catch (err) {
      toast.error((err as Error).message || "Encaissement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 grid gap-2 rounded-md border border-brown/30 bg-cream/60 p-3 sm:grid-cols-2">
      <p className="text-xs font-bold text-brown sm:col-span-2">Encaisser {schedule ? `la tranche ${schedule.tranche}` : "la commande"} — reste {formatFCFA(remaining)}</p>
      <label className="text-xs font-semibold text-brown">Moyen
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
          {CASH_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-brown">Montant (FCFA)
        <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className={field} />
      </label>
      <label className="text-xs font-semibold text-brown sm:col-span-2">Référence de la transaction{needsRef ? " *" : " (facultatif)"}
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} placeholder={needsRef ? "ID reçu par SMS de l'opérateur" : "Ex. reçu n°…"} className={field} />
      </label>
      <label className="text-xs font-semibold text-brown sm:col-span-2">Commentaire (facultatif)
        <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} className={field} />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={!valid || busy} className="inline-flex min-h-10 items-center rounded-md bg-brown px-4 text-sm font-bold text-cream disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer l'encaissement"}</button>
        <button type="button" onClick={onDone} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-bold text-brown">Fermer</button>
      </div>
      {value > remaining && <p className="text-xs font-semibold text-primary sm:col-span-2">Le montant dépasse le reste à payer.</p>}
    </form>
  );
}

export function JawanDecision({ order }: { order: Order }) {
  const decide = useServerFn(decideJawan28);
  const refresh = useRefreshPayments(order.id);
  const [start, setStart] = useState(todayBamako());
  const [comment, setComment] = useState("");
  const [refusing, setRefusing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function apply(accept: boolean) {
    setBusy(true);
    try {
      await decide({ data: { orderId: order.id, accept, start, comment } });
      toast.success(accept ? `${order.number} : Jawan 28 validé, échéancier créé` : `${order.number} : Jawan 28 refusé`);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message || "Décision impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border-2 border-gold bg-gold/10 p-3">
      <p className="text-sm font-bold text-brown">Jawan 28 demandé par le client — à valider</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {!refusing && (
          <label className="text-xs font-semibold text-brown">Date de la 1re tranche (J0)
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
          </label>
        )}
        <label className={cn("text-xs font-semibold text-brown", refusing ? "sm:col-span-2" : "")}>{refusing ? "Motif du refus *" : "Commentaire (facultatif)"}
          <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} className={field} />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {refusing ? (
          <>
            <button type="button" disabled={busy || comment.trim().length < 3} onClick={() => apply(false)} className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-40">Confirmer le refus</button>
            <button type="button" onClick={() => setRefusing(false)} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-bold text-brown">Retour</button>
          </>
        ) : (
          <>
            <button type="button" disabled={busy || !start} onClick={() => apply(true)} className="inline-flex min-h-10 items-center rounded-md bg-brown px-4 text-sm font-bold text-cream disabled:opacity-40">Valider et créer l'échéancier</button>
            <button type="button" onClick={() => setRefusing(true)} className="inline-flex min-h-10 items-center rounded-md border border-primary px-4 text-sm font-bold text-primary">Refuser</button>
          </>
        )}
      </div>
    </div>
  );
}

/** Section « Paiement » de la fiche commande. */
export function PaymentsSection({ order }: { order: Order }) {
  const fetchPayments = useServerFn(getOrderPayments);
  const q = useQuery({ queryKey: ["order-payments", order.id], queryFn: () => fetchPayments({ data: { orderId: order.id } }) });
  const [open, setOpen] = useState<string | null>(null); // id de tranche, ou "order"
  const schedules = q.data?.schedules ?? [];
  const payments = q.data?.payments ?? [];
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = order.total_fcfa - paid;
  const cancelled = order.status === "annulee";

  return (
    <section className="mt-3 rounded-lg bg-background p-4">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Paiement</h3>
      <p className="mt-2 text-sm text-brown">Choix du client : <span className="font-semibold">{paymentLabel(order.payment_method)}</span>{order.jawan28_requested ? " · Jawan 28 demandé" : ""}</p>
      {order.jawan28_decision === "refuse" && <p className="mt-1 text-sm font-semibold text-primary">Jawan 28 refusé : paiement en une fois.</p>}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/60 p-2"><p className="text-[11px] text-muted-foreground">Total</p><p className="font-black text-brown">{formatFCFA(order.total_fcfa)}</p></div>
        <div className="rounded-md bg-muted/60 p-2"><p className="text-[11px] text-muted-foreground">Encaissé</p><p className="font-black text-whatsapp">{formatFCFA(paid)}</p></div>
        <div className="rounded-md bg-muted/60 p-2"><p className="text-[11px] text-muted-foreground">Reste</p><p className={cn("font-black", remaining > 0 ? "text-primary" : "text-brown")}>{formatFCFA(remaining)}</p></div>
      </div>

      {q.isLoading && <p className="mt-2 text-xs text-muted-foreground">Chargement…</p>}
      {!cancelled && order.jawan28_requested && !order.jawan28_decision && <JawanDecision order={order} />}

      {schedules.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {schedules.map((s) => {
            const st = trancheState(s);
            const rest = s.amount_due - s.amount_paid;
            return (
              <li key={s.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-brown">Tranche {s.tranche}/3 · {fmtDay(s.due_date)}</span>
                  <TrancheBadge {...st} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatFCFA(s.amount_due)} · payé {formatFCFA(s.amount_paid)}{rest > 0 ? ` · reste ${formatFCFA(rest)}` : ""}</p>
                {rest > 0 && !cancelled && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} className="inline-flex min-h-9 items-center rounded-md border border-brown px-3 text-xs font-bold text-brown">Encaisser</button>
                    {(st.state === "retard" || st.state === "aujourdhui") && <ReminderButton order={order} schedule={s} />}
                  </div>
                )}
                {open === s.id && <PaymentForm order={order} schedule={s} remaining={rest} onDone={() => setOpen(null)} />}
              </li>
            );
          })}
        </ul>
      )}

      {!schedules.length && remaining > 0 && !cancelled && !(order.jawan28_requested && !order.jawan28_decision) && (
        <div className="mt-3">
          {open !== "order" && <button type="button" onClick={() => setOpen("order")} className="inline-flex min-h-10 items-center rounded-md border border-brown px-4 text-sm font-bold text-brown">Encaisser</button>}
          {open === "order" && <PaymentForm order={order} schedule={null} remaining={remaining} onDone={() => setOpen(null)} />}
        </div>
      )}

      {payments.length > 0 && (
        <>
          <h4 className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Journal des encaissements</h4>
          <ul className="mt-1 divide-y divide-border text-xs text-brown">
            {payments.map((p) => (
              <li key={p.id} className="py-1.5">
                <span className="font-bold">{fmtStamp(p.paid_at)}</span> · {formatFCFA(p.amount)} · {cashLabel(p.method)}{p.reference ? ` · réf. ${p.reference}` : ""}
                {p.schedule_id && ` · tranche ${schedules.find((s) => s.id === p.schedule_id)?.tranche ?? "?"}`}
                <span className="block text-muted-foreground">par {p.author}{p.comment ? ` — ${p.comment}` : ""}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
