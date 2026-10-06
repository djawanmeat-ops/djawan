import { createServerFn } from "@tanstack/react-start";
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

export const recommendCuts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ request: z.string().trim().min(3).max(600) }).parse(d))
  .handler(async ({ data }): Promise<AdvisorResult> => {
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
      return { intro: parsed.intro, items: parsed.items.filter((i) => ids.has(i.meatId)).slice(0, 3) };
    } catch (e) {
      console.error("advisor error", e);
      return { intro: "", items: [], error: "Le conseiller n'a pas pu répondre. Réessayez plus tard." };
    }
  });
