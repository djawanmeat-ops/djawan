import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { formatFCFA, getMeat, paymentLabel } from "@/data/djawan";
import { assignCourier, confirmDelivery, listCouriers, type Courier } from "@/lib/delivery.functions";
import { formatPhone } from "@/lib/phone";
import type { OrderWithItems } from "@/lib/orders.functions";
import { getOrderPayments, todayBamako, type Payment, type Schedule } from "@/lib/payments.functions";

const field = "mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-brown";
const wa = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
const mapsLink = (o: { lat: number | null; lng: number | null }) => (o.lat != null && o.lng != null ? `https://maps.google.com/?q=${o.lat},${o.lng}` : null);

export function useCouriers() {
  const fetch = useServerFn(listCouriers);
  return useQuery({ queryKey: ["couriers"], queryFn: () => fetch(), staleTime: 60_000 });
}

/** Montant que le livreur doit encaisser à la remise. */
export function amountToCollect(o: OrderWithItems, schedules: Schedule[], payments: Payment[]) {
  if (schedules.length) {
    const today = todayBamako();
    return schedules.filter((s) => s.due_date <= today).reduce((t, s) => t + s.amount_due - s.amount_paid, 0);
  }
  return o.total_fcfa - payments.reduce((t, p) => t + p.amount, 0);
}

export function deliverySlip(o: OrderWithItems, toCollect: number) {
  const items = o.order_items
    .map((i) => `• ${i.qty} × ${i.label}${i.cut ? ` (${i.cut})` : ""}${i.mix ? ` : ${Object.entries(i.mix as Record<string, number>).map(([id, kg]) => `${getMeat(id)?.name ?? id} ${kg} kg`).join(", ")}` : ""}`)
    .join("\n");
  const gps = mapsLink(o);
  const header = [
    `Bon de livraison Djawan — ${o.number}`,
    `Client : ${o.customer_name} — ${formatPhone(o.customer_phone)}`,
    o.area ? `Quartier : ${o.area}` : null,
    gps ? `Position : ${gps}` : null,
    o.delivery_when ? `Créneau : ${o.delivery_when}` : null,
    o.note ? `Remarque : ${o.note}` : null,
  ].filter(Boolean);
  return [
    header.join("\n"),
    `Colis (${o.total_kg} kg) :\n${items}`,
    toCollect > 0 ? `À encaisser : ${formatFCFA(toCollect)} (${paymentLabel(o.payment_method)})` : "Rien à encaisser.",
    "À la remise : demandez au client son CODE DE RÉCEPTION (4 chiffres) et le nom de la personne qui reçoit, puis envoyez-les à l'équipe.",
  ].join("\n\n");
}

export function DeliverySection({ order: o }: { order: OrderWithItems }) {
  const couriers = useCouriers();
  const assign = useServerFn(assignCourier);
  const confirm = useServerFn(confirmDelivery);
  const fetchPayments = useServerFn(getOrderPayments);
  const pay = useQuery({ queryKey: ["order-payments", o.id], queryFn: () => fetchPayments({ data: { orderId: o.id } }) });
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [receiver, setReceiver] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const courier = couriers.data?.find((c) => c.id === o.courier_id);
  const toCollect = amountToCollect(o, pay.data?.schedules ?? [], pay.data?.payments ?? []);
  const refresh = () => Promise.all([["admin-orders"], ["order-logs", o.id]].map((queryKey) => qc.invalidateQueries({ queryKey })));

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await action();
      toast.success(ok);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message || "Opération impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (o.status === "livree") {
    return (
      <section className="mt-3 rounded-lg bg-background p-4">
        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Remise</h3>
        <p className="mt-2 text-sm text-brown">
          Remis à <span className="font-semibold">{o.delivered_to}</span>
          {o.delivered_at && ` le ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Bamako", dateStyle: "short", timeStyle: "short" }).format(new Date(o.delivered_at))}`}
          {courier && ` par ${courier.name}`}
        </p>
        <p className={o.delivery_code_verified ? "mt-1 text-xs font-bold text-whatsapp" : "mt-1 text-xs font-bold text-primary"}>{o.delivery_code_verified ? "Code de réception vérifié" : "Remise SANS code de réception (voir l'historique)"}</p>
      </section>
    );
  }
  if (o.status === "annulee") return null;

  const active = (couriers.data ?? []).filter((c) => c.active || c.id === o.courier_id);
  return (
    <section className="mt-3 rounded-lg bg-background p-4">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Livreur & remise</h3>
      <label className="mt-2 block text-xs font-semibold text-brown">Livreur
        <select value={o.courier_id ?? ""} disabled={busy} onChange={(e) => run(() => assign({ data: { orderId: o.id, courierId: e.target.value || null } }), e.target.value ? "Livreur attribué" : "Livreur retiré")} className={field}>
          <option value="">— Aucun —</option>
          {active.map((c: Courier) => <option key={c.id} value={c.id}>{c.name} · {formatPhone(c.phone)}{c.vehicle ? ` · ${c.vehicle}` : ""}</option>)}
        </select>
      </label>
      {!couriers.data?.length && !couriers.isLoading && <p className="mt-1 text-xs text-muted-foreground">Ajoutez vos livreurs dans l'onglet Livraisons.</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {courier && (
          <a href={wa(courier.phone, deliverySlip(o, toCollect))} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-whatsapp px-3 text-sm font-bold text-whatsapp-foreground"><Send size={15} /> Envoyer le bon au livreur</a>
        )}
        <a href={wa(o.customer_phone, `Bonjour ${o.customer_name}, ici Djawan Sahel Meat. Pour votre commande ${o.number}, votre code de réception est ${o.delivery_code}. Donnez-le au livreur à la remise de votre box. Merci !`)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-brown"><MessageCircle size={15} /> Renvoyer le code au client</a>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">À encaisser à la remise : <span className="font-bold text-brown">{toCollect > 0 ? formatFCFA(toCollect) : "rien"}</span></p>

      {o.status === "en_livraison" ? (
        <div className="mt-3 rounded-md border-2 border-whatsapp/40 p-3">
          <p className="text-sm font-bold text-brown">Confirmer la remise</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-brown">Code donné par le client
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="4 chiffres" className={`${field} tracking-[0.3em]`} />
            </label>
            <label className="text-xs font-semibold text-brown">Reçu par *
              <input value={receiver} onChange={(e) => setReceiver(e.target.value)} maxLength={80} placeholder="Nom de la personne" className={field} />
            </label>
            <label className="text-xs font-semibold text-brown sm:col-span-2">Commentaire {code.length === 4 ? "(facultatif)" : "(obligatoire sans code)"}
              <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} className={field} />
            </label>
          </div>
          <button type="button" disabled={busy || receiver.trim().length < 2 || (code.length !== 4 && comment.trim().length < 3) || (code.length > 0 && code.length < 4)}
            onClick={() => run(() => confirm({ data: { orderId: o.id, code, receiver, comment } }), `${o.number} livrée`)}
            className="mt-2 inline-flex min-h-10 items-center rounded-md bg-whatsapp px-4 text-sm font-bold text-whatsapp-foreground disabled:opacity-40">
            Confirmer la remise
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">La remise se confirme quand la commande est « En livraison ».</p>
      )}
    </section>
  );
}
