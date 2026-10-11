import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPinned, Route, Send } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { formatFCFA } from "@/data/djawan";
import { cn } from "@/lib/utils";
import { assignCourier, saveCourier, type Courier } from "@/lib/delivery.functions";
import { formatPhone } from "@/lib/phone";
import { listOrders, statusLabel, type OrderWithItems } from "@/lib/orders.functions";
import { useCouriers } from "./DeliverySection";
import { StatusBadge } from "./OrdersPanel";

const ACTIVE = ["confirmee", "en_preparation", "en_livraison"];
const BAMAKO: [number, number] = [12.6392, -8.0029];
const COLORS: Record<string, string> = { confirmee: "#d9a21b", en_preparation: "#c2410c", en_livraison: "#15803d" };

/** Itinéraire Google Maps passant par toutes les commandes géolocalisées (départ : position du livreur). */
function routeUrl(orders: OrderWithItems[]) {
  const pts = orders.filter((o) => o.lat != null && o.lng != null).map((o) => `${o.lat},${o.lng}`).slice(0, 10);
  if (!pts.length) return null;
  const destination = pts[pts.length - 1];
  const waypoints = pts.slice(0, -1).join("|");
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}`;
}

function tourMessage(c: Courier, orders: OrderWithItems[]) {
  const lines = orders.map((o, i) => `${i + 1}. ${o.number} — ${o.customer_name} (${formatPhone(o.customer_phone)}) — ${o.area || "position GPS"}${o.lat != null ? ` — https://maps.google.com/?q=${o.lat},${o.lng}` : ""}`);
  const route = routeUrl(orders);
  return `Bonjour ${c.name}, voici votre tournée Djawan (${orders.length} livraison${orders.length > 1 ? "s" : ""}) :\n\n${lines.join("\n")}${route ? `\n\nItinéraire complet : ${route}` : ""}\n\nPour chaque remise, demandez le code de réception du client. Merci !`;
}

// Leaflet est chargé à la demande depuis un CDN, seulement dans le back-office.
type LeafletLike = { map: Function; tileLayer: Function; circleMarker: Function; latLngBounds: Function };
let leafletPromise: Promise<LeafletLike> | null = null;
function loadLeaflet(): Promise<LeafletLike> {
  const w = window as unknown as { L?: LeafletLike };
  if (w.L) return Promise.resolve(w.L);
  leafletPromise ??= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload = () => (w.L ? resolve(w.L) : reject(new Error("Leaflet")));
    js.onerror = reject;
    document.head.appendChild(js);
  });
  return leafletPromise;
}

function DeliveryMap({ orders, couriers }: { orders: OrderWithItems[]; couriers: Courier[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const located = orders.filter((o) => o.lat != null && o.lng != null);

  useEffect(() => {
    let map: { remove: () => void } | undefined;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        const m = L.map(ref.current, { scrollWheelZoom: false }).setView(BAMAKO, 12);
        map = m;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(m);
        for (const o of located) {
          const c = couriers.find((x) => x.id === o.courier_id);
          L.circleMarker([o.lat, o.lng], { radius: 9, color: "#fff", weight: 2, fillColor: COLORS[o.status] ?? "#555", fillOpacity: 0.95 })
            .addTo(m)
            .bindPopup(`<b>${o.number}</b> · ${statusLabel(o.status)}<br>${o.customer_name}<br>${o.area}<br>${c ? `Livreur : ${c.name}` : "<i>Pas de livreur</i>"}`);
        }
        if (located.length) m.fitBounds(L.latLngBounds(located.map((o) => [o.lat, o.lng])), { padding: [30, 30], maxZoom: 15 });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
    // Redessine quand la liste ou les attributions changent.
  }, [located.map((o) => `${o.id}${o.status}${o.courier_id}`).join(), couriers.length]);

  return (
    <div>
      <div ref={ref} className="h-80 w-full overflow-hidden rounded-lg bg-muted sm:h-96" />
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(COLORS).map(([s, c]) => <span key={s} className="inline-flex items-center gap-1"><span className="inline-block size-3 rounded-full" style={{ background: c }} />{statusLabel(s)}</span>)}
        <span>· {located.length}/{orders.length} commande(s) avec position GPS</span>
      </div>
      {failed && <p className="mt-2 text-xs font-semibold text-primary">La carte n'a pas pu se charger (connexion ?). La liste ci-dessous reste utilisable.</p>}
    </div>
  );
}

function CourierManager({ couriers }: { couriers: Courier[] }) {
  const save = useServerFn(saveCourier);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(data: { id?: string; name: string; phone: string; vehicle: string; active: boolean }, ok: string) {
    setBusy(true);
    try {
      await save({ data });
      toast.success(ok);
      await qc.invalidateQueries({ queryKey: ["couriers"] });
      return true;
    } catch (e) {
      toast.error((e as Error).message || "Enregistrement impossible.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg bg-background p-4">
      <h2 className="font-display text-xl font-black text-brown">Livreurs</h2>
      <ul className="mt-2 divide-y divide-border">
        {couriers.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2">
            <span className={cn("text-sm", c.active ? "text-brown" : "text-muted-foreground line-through")}><span className="font-semibold">{c.name}</span> · {formatPhone(c.phone)}{c.vehicle ? ` · ${c.vehicle}` : ""}</span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">{c.active ? "Actif" : "Inactif"}
              <Switch checked={c.active} disabled={busy} onCheckedChange={(v) => submit({ id: c.id, name: c.name, phone: c.phone, vehicle: c.vehicle, active: v }, `${c.name} : ${v ? "actif" : "inactif"}`)} aria-label={`${c.name} actif`} />
            </label>
          </li>
        ))}
        {!couriers.length && <li className="py-2 text-sm text-muted-foreground">Aucun livreur pour l'instant.</li>}
      </ul>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await submit({ name, phone, vehicle, active: true }, `${name} ajouté`)) { setName(""); setPhone(""); setVehicle(""); }
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" maxLength={60} className="h-10 rounded-md border border-border px-3 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (WhatsApp)" inputMode="tel" className="h-10 rounded-md border border-border px-3 text-sm" />
        <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Véhicule (ex. Moto 02)" maxLength={40} className="h-10 rounded-md border border-border px-3 text-sm" />
        <button disabled={busy || name.trim().length < 2 || !phone.trim()} className="h-10 rounded-md bg-brown px-4 text-sm font-bold text-cream disabled:opacity-40">Ajouter</button>
      </form>
    </section>
  );
}

export function LivraisonsPanel() {
  const list = useServerFn(listOrders);
  const assign = useServerFn(assignCourier);
  const qc = useQueryClient();
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => list({ data: {} }), refetchInterval: 30_000 });
  const couriers = useCouriers();
  const allCouriers = couriers.data ?? [];
  const active = (orders.data ?? []).filter((o) => ACTIVE.includes(o.status)).reverse();
  const groups = [
    ...allCouriers.map((c) => ({ courier: c as Courier | null, orders: active.filter((o) => o.courier_id === c.id) })).filter((g) => g.orders.length),
    { courier: null, orders: active.filter((o) => !o.courier_id) },
  ];

  async function setCourier(o: OrderWithItems, courierId: string | null) {
    try {
      await assign({ data: { orderId: o.id, courierId } });
      toast.success(`${o.number} : ${courierId ? "livreur attribué" : "livreur retiré"}`);
      await qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) {
      toast.error((e as Error).message || "Attribution impossible.");
    }
  }

  return (
    <div className="grid gap-6">
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-black text-brown"><MapPinned size={20} /> Carte des livraisons ({active.length})</h2>
        <p className="mb-3 text-sm text-muted-foreground">Commandes confirmées, en préparation et en livraison.</p>
        {orders.isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : <DeliveryMap orders={active} couriers={allCouriers} />}
      </section>

      {groups.map((g) => g.orders.length > 0 && (
        <section key={g.courier?.id ?? "none"} className="rounded-lg bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-black text-brown">{g.courier ? `${g.courier.name} · ${formatPhone(g.courier.phone)}` : "Sans livreur"} <span className="text-sm font-semibold text-muted-foreground">({g.orders.length})</span></h3>
            {g.courier && (
              <div className="flex flex-wrap gap-2">
                {routeUrl(g.orders) && <a href={routeUrl(g.orders)!} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-brown px-3 text-xs font-bold text-brown"><Route size={14} /> Itinéraire</a>}
                <a href={`https://wa.me/${g.courier.phone.replace(/\D/g, "")}?text=${encodeURIComponent(tourMessage(g.courier, g.orders))}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-whatsapp px-3 text-xs font-bold text-whatsapp-foreground"><Send size={14} /> Envoyer la tournée</a>
              </div>
            )}
          </div>
          <ul className="mt-2 divide-y divide-border">
            {g.orders.map((o) => (
              <li key={o.id} className="grid gap-2 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-brown">{o.number} · {o.customer_name} <StatusBadge status={o.status} /></p>
                  <p className="truncate text-xs text-muted-foreground">{o.area || "—"}{o.lat == null ? " · sans GPS" : ""} · {o.total_kg} kg · {formatFCFA(o.total_fcfa)}{o.delivery_when ? ` · ${o.delivery_when}` : ""}</p>
                </div>
                <select value={o.courier_id ?? ""} onChange={(e) => setCourier(o, e.target.value || null)} className="h-9 rounded-md border border-border bg-background px-2 text-xs font-semibold text-brown" aria-label={`Livreur de ${o.number}`}>
                  <option value="">— Aucun livreur —</option>
                  {allCouriers.filter((c) => c.active || c.id === o.courier_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!orders.isLoading && !active.length && <p className="rounded-md bg-background p-6 text-sm text-muted-foreground">Aucune livraison en cours. Les commandes apparaissent ici dès qu'elles sont confirmées.</p>}

      <CourierManager couriers={allCouriers} />
    </div>
  );
}
