import { getRequest } from "@tanstack/react-start/server";

/**
 * Limiteur en mémoire, propre à chaque instance serveur : ce n'est pas une limite exacte,
 * mais il bloque les rafales et les boucles d'un même visiteur. À n'utiliser que dans un handler serveur.
 */
const MINUTE = 60_000;

export function clientIp() {
  const h = getRequest()?.headers;
  return h?.get("cf-connecting-ip") || h?.get("x-real-ip") || h?.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export function createLimiter({ perIp, windowMs, globalPerMinute }: { perIp: number; windowMs: number; globalPerMinute: number }) {
  const hitsByIp = new Map<string, number[]>();
  let globalHits: number[] = [];

  return function allow(ip: string | null) {
    const now = Date.now();
    globalHits = globalHits.filter((t) => now - t < MINUTE);
    if (globalHits.length >= globalPerMinute) return false;
    if (ip) {
      const hits = (hitsByIp.get(ip) ?? []).filter((t) => now - t < windowMs);
      if (hits.length >= perIp) {
        hitsByIp.set(ip, hits);
        return false;
      }
      hits.push(now);
      hitsByIp.delete(ip); // réinsertion : la Map reste triée du plus ancien au plus récent
      hitsByIp.set(ip, hits);
      if (hitsByIp.size > 5000) hitsByIp.delete(hitsByIp.keys().next().value!);
    }
    globalHits.push(now);
    return true;
  };
}

const allowAdvisorToday = createLimiter({ perIp: 20, windowMs: 24 * 60 * MINUTE, globalPerMinute: Infinity });
const allowAdvisorNow = createLimiter({ perIp: 4, windowMs: MINUTE, globalPerMinute: 60 });

/** Conseiller IA : 20 demandes par jour et 4 par minute et par visiteur. */
export const allowAdvisor = () => {
  const ip = clientIp();
  return allowAdvisorToday(ip) && allowAdvisorNow(ip);
};

/** Commandes : 8 par heure et par visiteur, 30 par minute au total. */
const allowOrderHour = createLimiter({ perIp: 8, windowMs: 60 * MINUTE, globalPerMinute: 30 });
export const allowOrder = () => allowOrderHour(clientIp());
