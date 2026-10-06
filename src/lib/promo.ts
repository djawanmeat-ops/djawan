import type { Promo } from "@/data/djawan";

const DAY = 86_400_000;
const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: "UTC", month: "numeric", day: "numeric" });

function hijri(d: Date) {
  const parts = fmt.formatToParts(d);
  return { month: Number(parts.find((p) => p.type === "month")?.value), day: Number(parts.find((p) => p.type === "day")?.value) };
}

/** Prochaine date (UTC minuit) du jour hégirien donné, dont la fenêtre n'est pas encore close. */
function nextFeast(month: number, day: number, now: Date) {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 3 * DAY;
  for (let t = start; t < start + 400 * DAY; t += DAY) {
    const h = hijri(new Date(t));
    if (h.month === month && h.day === day) return new Date(t);
  }
  return null;
}

export type PromoStatus = { open: boolean; feast?: Date; opens?: Date; closes?: Date };

export function promoStatus(promo: Promo, now = new Date()): PromoStatus {
  if (!promo.hijri) return { open: true };
  const feast = nextFeast(promo.hijri.month, promo.hijri.day, now);
  if (!feast) return { open: false };
  const opens = new Date(feast.getTime() - 30 * DAY);
  // fermeture 48 h après la fin du jour de fête
  const closes = new Date(feast.getTime() + 3 * DAY);
  return { open: now >= opens && now < closes, feast, opens, closes };
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });

export const daysUntil = (d: Date, now = new Date()) => Math.max(0, Math.ceil((d.getTime() - now.getTime()) / DAY));
