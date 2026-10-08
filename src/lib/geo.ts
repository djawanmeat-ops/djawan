import type { GeoPoint } from "@/components/site/cart";

/** Position GPS du client. Le navigateur demande lui-même l'autorisation. */
export function getPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export function positionError(e: unknown) {
  const code = (e as GeolocationPositionError | undefined)?.code;
  if (code === 1) return "Accès à la position refusé. Vous pouvez l'autoriser dans les réglages de votre navigateur, ou indiquer votre quartier.";
  if (e instanceof Error && e.message === "unsupported") return "Votre appareil ne permet pas la localisation. Indiquez votre quartier.";
  return "Position introuvable pour le moment. Réessayez, ou indiquez votre quartier.";
}

/**
 * Nom du quartier et de la commune via OpenStreetMap (Nominatim, gratuit, sans clé).
 * Renvoie null en cas d'échec : la position GPS suffit pour livrer.
 */
export async function reverseGeocode({ lat, lng }: GeoPoint): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=fr`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    type Address = Partial<Record<"neighbourhood" | "suburb" | "quarter" | "village" | "hamlet" | "city_district" | "town" | "city", string>>;
    const a: Address = (await res.json()).address ?? {};
    const parts = [a.neighbourhood || a.suburb || a.quarter || a.village || a.hamlet, a.city_district || a.town || a.city];
    return [...new Set(parts.filter(Boolean))].join(", ") || null;
  } catch {
    return null;
  }
}
