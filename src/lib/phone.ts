/**
 * Numéro au format international. 8 chiffres = numéro malien (+223) ; sinon numéro étranger
 * (clients de la diaspora) saisi avec son indicatif. Renvoie null si le numéro est invalide.
 */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) return `+223${digits}`;
  if (digits.startsWith("223") && digits.length === 11) return `+${digits}`;
  if (!digits.startsWith("223") && digits.length >= 9 && digits.length <= 15 && raw.trim().match(/^(\+|00)/)) return `+${digits}`;
  return null;
}

/** +22370123456 → +223 70 12 34 56 */
export const formatPhone = (phone: string) =>
  phone.startsWith("+223") && phone.length === 12 ? `+223 ${phone.slice(4).replace(/(\d{2})(?=\d)/g, "$1 ")}` : phone;
