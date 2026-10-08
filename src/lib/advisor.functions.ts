import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { formats, meats } from "@/data/djawan";

export type Recommendation = { meatId: string; formatId: string; reason: string };
export type AdvisorResult = { intro: string; items: Recommendation[]; error?: string };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["intro", "items"],
  properties: {
    intro: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["meatId", "formatId", "reason"],
        properties: {
          meatId: { type: "string", enum: meats.map((m) => m.id) },
          formatId: { type: "string", enum: formats.map((f) => f.id) },
          reason: { type: "string" },
        },
      },
    },
  },
};

/**
 * Garde-fous contre l'abus des crédits IA. Mémoire propre à chaque instance serveur :
 * ce n'est pas une limite exacte, mais elle bloque les rafales et les boucles d'un même visiteur.
 */
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const PER_IP_MINUTE = 4;
const PER_IP_DAY = 20;
const GLOBAL_MINUTE = 60;
const hitsByIp = new Map<string, number[]>();
let globalHits: number[] = [];
const cache = new Map<string, AdvisorResult>();

const LIMIT_MESSAGE =
  "Vous avez atteint la limite de conseils pour le moment. Réessayez un peu plus tard, ou écrivez-nous directement sur WhatsApp.";

function clientIp() {
  const h = getRequest()?.headers;
  return h?.get("cf-connecting-ip") || h?.get("x-real-ip") || h?.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

function allow(ip: string | null) {
  const now = Date.now();
  globalHits = globalHits.filter((t) => now - t < MINUTE);
  if (globalHits.length >= GLOBAL_MINUTE) return false;
  if (ip) {
    const hits = (hitsByIp.get(ip) ?? []).filter((t) => now - t < DAY);
    if (hits.length >= PER_IP_DAY || hits.filter((t) => now - t < MINUTE).length >= PER_IP_MINUTE) {
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
}

const cacheKey = (request: string) => request.toLowerCase().replace(/\s+/g, " ").trim();

export const recommendCuts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ request: z.string().trim().min(3).max(300) }).parse(d))
  .handler(async ({ data }): Promise<AdvisorResult> => {
    const cached = cache.get(cacheKey(data.request));
    if (cached) return cached;
    if (!allow(clientIp())) return { intro: "", items: [], error: LIMIT_MESSAGE };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { intro: "", items: [], error: "Le conseiller n'est pas disponible pour le moment." };

    const catalogue = meats.map((m) => `${m.id} : ${m.name} (${m.category})`).join("\n");
    const sizes = formats.map((f) => `${f.id} : ${f.name} ${f.kg} kg`).join("\n");
    const instructions = `Tu es le boucher conseil de Djawan Sahel Meat à Bamako. Le client décrit un plat ou un besoin de cuisson.
Recommande 2 ou 3 viandes UNIQUEMENT parmi ce catalogue :\n${catalogue}\n
Et pour chacune un format de box adapté au nombre de personnes :\n${sizes}\n
Réponds en français, ton chaleureux et premium. "intro" : une phrase. "reason" : une phrase courte expliquant pourquoi ce morceau convient au plat.
N'invente jamais de prix, de promotion, de délai ni d'engagement commercial.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          instructions,
          input: data.request,
          stream: true,
          store: false,
          max_output_tokens: 2000,
          reasoning: { effort: "low", summary: "auto" },
          include: ["reasoning.encrypted_content"],
          text: { format: { type: "json_schema", name: "recommandations", strict: true, schema } },
        }),
      });
      if (!res.ok || !res.body) {
        console.error("advisor gateway", res.status, await res.text().catch(() => ""));
        const msg = res.status === 429 ? "Le conseiller est très sollicité, réessayez dans un instant."
          : res.status === 402 ? "Le conseiller est momentanément indisponible."
          : "Le conseiller n'a pas pu répondre. Réessayez plus tard.";
        return { intro: "", items: [], error: msg };
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "response.output_text.delta") text += ev.delta;
          } catch { /* ignore */ }
        }
      }
      if (!text) return { intro: "", items: [], error: "Le conseiller n'a pas pu répondre à cette demande." };
      const parsed = JSON.parse(text) as AdvisorResult;
      const ids = new Set(meats.map((m) => m.id));
      const result = { intro: parsed.intro, items: parsed.items.filter((i) => ids.has(i.meatId)).slice(0, 3) };
      if (result.items.length) {
        cache.set(cacheKey(data.request), result);
        if (cache.size > 300) cache.delete(cache.keys().next().value!);
      }
      return result;
    } catch (e) {
      console.error("advisor error", e);
      return { intro: "", items: [], error: "Le conseiller n'a pas pu répondre. Réessayez plus tard." };
    }
  });
