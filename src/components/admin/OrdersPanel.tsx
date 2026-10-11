import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, MessageCircle, Phone, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatFCFA, getMeat, paymentLabel } from "@/data/djawan";
import { PaymentsSection } from "./PaymentsSection";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";
import { NEXT_STATUS, ORDER_STATUSES, canCancel, getOrderLogs, listOrders, statusLabel, updateOrderStatus, type OrderWithItems } from "@/lib/orders.functions";

const dateTime = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Bamako", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso: string) => dateTime.format(new Date(iso)).replace(" ", " · ");
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

const statusStyle: Record<string, string> = {
  nouvelle: "bg-primary text-primary-foreground",
  confirmee: "bg-gold text-brown",
  en_preparation: "bg-secondary text-secondary-foreground",
  en_livraison: "bg-brown text-cream",
  livree: "bg-whatsapp text-whatsapp-foreground",
  annulee: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold", statusStyle[status] ?? "bg-muted")}>{statusLabel(status)}</span>;
}

export function OrdersPanel() {
  const list = useServerFn(listOrders);
  const q = useQuery({ queryKey: ["admin-orders"], queryFn: () => list({ data: {} }), refetchInterval: 30_000 });
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Toujours la version fraîche de la commande ouverte (après un changement de statut).
  const selected = q.data?.find((o) => o.id === selectedId) ?? null;

  const orders = q.data ?? [];
  const counts = useMemo(() => Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, orders.filter((o) => o.status === s.id).length])), [orders]);
  const today = orders.filter((o) => isToday(o.created_at) && o.status !== "annulee");
  const term = search.trim().toLowerCase();
  const shown = orders.filter((o) => (!status || o.status === status) && (!term || [o.number, o.customer_name, o.customer_phone, o.area].some((v) => v.toLowerCase().includes(term))));

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="À traiter" value={String(counts["nouvelle"] ?? 0)} accent />
        <Stat label="Commandes du jour" value={String(today.length)} />
        <Stat label="Montant du jour" value={formatFCFA(today.reduce((s, o) => s + o.total_fcfa, 0))} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <Chip active={!status} onClick={() => setStatus("")}>Toutes ({orders.length})</Chip>
          {ORDER_STATUSES.map((s) => <Chip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>{s.label} ({counts[s.id] ?? 0})</Chip>)}
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N°, nom, téléphone, quartier…" className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm sm:w-64" />
          <button type="button" onClick={() => q.refetch()} aria-label="Actualiser" className="grid size-10 shrink-0 place-items-center rounded-md border border-border text-brown"><RefreshCw size={16} className={q.isFetching ? "animate-spin" : ""} /></button>
        </div>
      </div>

      {q.isLoading && <p className="mt-8 text-sm text-muted-foreground">Chargement des commandes…</p>}
      {q.error && <p className="mt-8 text-sm font-semibold text-primary">{(q.error as Error).message}</p>}
      {q.data && shown.length === 0 && <p className="mt-8 rounded-md bg-background p-6 text-sm text-muted-foreground">Aucune commande{status || term ? " pour ce filtre" : " pour le moment"}.</p>}

      <ul className="mt-5 grid gap-2">
        {shown.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => setSelectedId(o.id)} className="grid w-full gap-1 rounded-lg border border-border bg-background p-4 text-left transition hover:border-brown/40 sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:gap-4">
              <span>
                <span className="block font-display text-lg font-black text-brown">{o.number}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-brown">{o.customer_name} · {formatPhone(o.customer_phone)}</span>
                <span className="block truncate text-xs text-muted-foreground">{o.area || (o.lat ? "Position GPS" : "—")} · {o.order_items.length} article{o.order_items.length > 1 ? "s" : ""} · {o.total_kg} kg · {paymentLabel(o.payment_method)}</span>
              </span>
              <span className="flex items-center gap-2 sm:flex-col sm:items-end">
                <span className="font-black text-primary">{formatFCFA(o.total_fcfa)}</span>
                <span className="flex gap-1">{o.jawan28_requested && o.jawan28_decision !== "refuse" && <span className="rounded-full bg-gold/30 px-2 py-0.5 text-[11px] font-bold text-brown">{o.jawan28_decision ? "Jawan 28" : "Jawan 28 à valider"}</span>}<StatusBadge status={o.status} /></span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <OrderSheet order={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-lg p-4", accent ? "bg-primary text-primary-foreground" : "bg-background")}>
      <p className={cn("text-xs font-bold uppercase tracking-wider", accent ? "opacity-80" : "text-muted-foreground")}>{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-black", !accent && "text-brown")}>{value}</p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition", active ? "border-brown bg-brown text-cream" : "border-border bg-background text-brown")}>{children}</button>;
}

function OrderSheet({ order, onClose }: { order: OrderWithItems | null; onClose: () => void }) {
  const fetchLogs = useServerFn(getOrderLogs);
  const logs = useQuery({ queryKey: ["order-logs", order?.id], queryFn: () => fetchLogs({ data: { orderId: order!.id } }), enabled: !!order });
  const o = order;
  const waClient = o ? `https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${o.customer_name}, ici Djawan Sahel Meat au sujet de votre commande ${o.number}.`)}` : "";

  return (
    <Sheet open={!!o} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto bg-cream sm:max-w-lg">
        {o && (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-3 font-display text-3xl font-black text-brown">{o.number} <StatusBadge status={o.status} /></SheetTitle>
              <SheetDescription>Reçue le {fmtDate(o.created_at)} · {o.source === "web" ? "site web" : o.source}</SheetDescription>
            </SheetHeader>

            <StatusActions order={o} />

            <section className="mt-3 rounded-lg bg-background p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Client</h3>
              <p className="mt-2 font-bold text-brown">{o.customer_name}</p>
              <p className="text-sm text-brown">{formatPhone(o.customer_phone)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={waClient} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-whatsapp px-3 text-sm font-bold text-whatsapp-foreground"><MessageCircle size={16} /> WhatsApp</a>
                <a href={`tel:${o.customer_phone}`} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-brown"><Phone size={16} /> Appeler</a>
              </div>
            </section>

            <section className="mt-3 rounded-lg bg-background p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Livraison</h3>
              <dl className="mt-2 grid gap-1 text-sm text-brown">
                <Row label="Quartier" value={o.area || "—"} />
                <Row label="Créneau" value={o.delivery_when || "—"} />
                <Row label="Remarque" value={o.note || "—"} />
              </dl>
              {o.lat != null && o.lng != null && (
                <a href={`https://maps.google.com/?q=${o.lat},${o.lng}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-brown px-3 text-sm font-bold text-brown"><MapPin size={16} /> Ouvrir la position GPS{o.gps_accuracy ? ` (± ${o.gps_accuracy} m)` : ""}</a>
              )}
            </section>

            <section className="mt-3 rounded-lg bg-background p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Articles · {o.total_kg} kg</h3>
              <ul className="mt-2 divide-y divide-border">
                {o.order_items.map((i) => (
                  <li key={i.id} className="py-2 text-sm">
                    <div className="flex justify-between gap-3"><span className="font-semibold text-brown">{i.qty} × {i.label}</span><span className="shrink-0 font-bold text-brown">{formatFCFA(i.line_total)}</span></div>
                    {i.mix && <p className="text-xs text-muted-foreground">{Object.entries(i.mix as Record<string, number>).map(([id, kg]) => `${getMeat(id)?.name ?? id} ${kg} kg`).join(" · ")}</p>}
                    {i.cut && <p className="text-xs font-semibold text-secondary">Découpe : {i.cut}</p>}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-border pt-3"><span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total</span><span className="text-xl font-black text-primary">{formatFCFA(o.total_fcfa)}</span></div>
            </section>

            <PaymentsSection order={o} />

            <section className="mt-3 rounded-lg bg-background p-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Historique</h3>
              {logs.isLoading && <p className="mt-2 text-xs text-muted-foreground">Chargement…</p>}
              <ol className="mt-2 grid gap-2 border-l border-border pl-4">
                {(logs.data ?? []).map((l) => (
                  <li key={l.id} className="text-xs text-brown">
                    <span className="font-bold">{fmtDate(l.created_at)}</span> · {l.author} : {l.old_status ? `${statusLabel(l.old_status)} → ` : ""}<span className="font-semibold">{statusLabel(l.new_status)}</span>
                    {l.comment && <span className="block text-muted-foreground">{l.comment}</span>}
                  </li>
                ))}
              </ol>

            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatusActions({ order }: { order: OrderWithItems }) {
  const save = useServerFn(updateOrderStatus);
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const next = NEXT_STATUS[order.status];

  async function apply(status: string) {
    setBusy(true);
    try {
      await save({ data: { orderId: order.id, status, comment } });
      toast.success(`${order.number} : ${statusLabel(status)}`);
      setComment("");
      setCancelling(false);
      await Promise.all([qc.invalidateQueries({ queryKey: ["admin-orders"] }), qc.invalidateQueries({ queryKey: ["order-logs", order.id] })]);
    } catch (e) {
      toast.error((e as Error).message || "Modification impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!next && !canCancel(order.status)) {
    return <p className="mt-6 rounded-lg bg-background p-4 text-sm text-muted-foreground">Commande {order.status === "livree" ? "livrée" : "annulée"} : plus aucune modification possible.</p>;
  }
  return (
    <section className="mt-6 rounded-lg border-2 border-brown/20 bg-background p-4">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Faire avancer la commande</h3>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={2}
        placeholder={cancelling ? "Motif de l'annulation (obligatoire)" : "Commentaire pour l'historique (facultatif) — ex. confirmé par téléphone"}
        className={cn("mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm", cancelling ? "border-primary" : "border-border")} />
      <div className="mt-2 flex flex-wrap gap-2">
        {cancelling ? (
          <>
            <button type="button" disabled={busy || comment.trim().length < 3} onClick={() => apply("annulee")} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-40">Confirmer l'annulation</button>
            <button type="button" disabled={busy} onClick={() => setCancelling(false)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-bold text-brown">Retour</button>
          </>
        ) : (
          <>
            {next && <button type="button" disabled={busy} onClick={() => apply(next)} className="inline-flex min-h-11 items-center rounded-md bg-brown px-4 text-sm font-bold text-cream disabled:opacity-40">{busy ? "Enregistrement…" : `Passer à « ${statusLabel(next)} »`}</button>}
            <button type="button" disabled={busy} onClick={() => setCancelling(true)} className="inline-flex min-h-11 items-center rounded-md border border-primary px-4 text-sm font-bold text-primary">Annuler la commande</button>
          </>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Chaque changement est inscrit dans l'historique avec votre nom et l'heure.</p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[6rem_1fr] gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words">{value}</dd></div>;
}
