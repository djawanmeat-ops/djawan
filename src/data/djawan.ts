import hachee from "@/assets/meat-hachee.webp";
import sansGraisse from "@/assets/meat-sans-graisse.webp";
import beefSteak from "@/assets/meat-beef-steak.webp";
import coteBoeuf from "@/assets/meat-cote-boeuf.webp";
import avecOs from "@/assets/meat-avec-os.webp";
import foieCoeur from "@/assets/meat-foie-coeur.webp";
import rognon from "@/assets/meat-rognon.webp";
import os from "@/assets/meat-os.webp";
import mouton from "@/assets/meat-mouton.webp";
import filet from "@/assets/meat-filet.webp";
import pouletEntier from "@/assets/meat-poulet-entier.webp";
import blancPoulet from "@/assets/meat-blanc-poulet.webp";
import cuissePoulet from "@/assets/meat-cuisse-poulet.webp";
import ailePoulet from "@/assets/meat-aile-poulet.webp";
import melange from "@/assets/meat-melange.webp";

export const navItems = [
  { label: "Accueil", href: "/#accueil" },
  { label: "Nos Box", href: "/#box" },
  { label: "Promo", href: "/promo" },
  { label: "À propos", href: "/#apropos" },
  { label: "Comment ça marche", href: "/#commande" },
  { label: "Avatar Crédit", href: "/#credit" },
  { label: "FAQ", href: "/#faq" },
];

/** Préférences de découpe proposées sur chaque article. */
export const cutOptions = [
  { id: "aucune", label: "Sans préférence" },
  { id: "des", label: "En dés pour sauce" },
  { id: "grosses", label: "Grosses pièces" },
  { id: "soupe", label: "Morceaux pour soupe" },
  { id: "tranches", label: "Tranches fines" },
] as const;
export type CutId = (typeof cutOptions)[number]["id"];
export const getCut = (id?: string) => cutOptions.find((c) => c.id === id);

/**
 * Promotions. `offer` : texte de l'offre officielle — laisser vide tant qu'elle n'est pas validée
 * (le site affiche alors « Offre dévoilée prochainement »).
 * Fêtes : jour du calendrier hégirien (mois 1-12, jour). Ouverture 1 mois avant, fermeture 48 h après.
 */
export type Promo = {
  id: string;
  name: string;
  tagline: string;
  offer: string;
  hijri?: { month: number; day: number; feast: string };
};

export const promos: Promo[] = [
  { id: "djawan", name: "Promo Djawan", tagline: "Toute l'année, 12 mois sur 12.", offer: "" },
  { id: "ramadan", name: "Promo Ramadan", tagline: "Préparez le mois sacré et la Korité.", offer: "", hijri: { month: 10, day: 1, feast: "Aïd el-Fitr" } },
  { id: "tabaski", name: "Promo Tabaski", tagline: "Pour la grande fête en famille.", offer: "", hijri: { month: 12, day: 10, feast: "Tabaski" } },
  { id: "maouloud", name: "Promo Maouloud", tagline: "Pour célébrer le Maouloud.", offer: "", hijri: { month: 3, day: 12, feast: "Maouloud" } },
  { id: "achoura", name: "Promo Achoura", tagline: "Pour le repas de l'Achoura.", offer: "", hijri: { month: 1, day: 10, feast: "Achoura" } },
];

/** Moyens de paiement proposés à la validation du panier. */
export const paymentOptions = [
  { id: "orange-money", label: "Orange Money" },
  { id: "moov-money", label: "Moov Money" },
  { id: "especes", label: "Espèces à la livraison" },
] as const;
export const getPayment = (id?: string) => paymentOptions.find((p) => p.id === id);

export type Category = "boeuf" | "mouton" | "abats" | "poulet";

export const categories: { id: Category | "tout" | "melange"; label: string }[] = [
  { id: "tout", label: "Tout" },
  { id: "boeuf", label: "Bœuf" },
  { id: "mouton", label: "Mouton" },
  { id: "abats", label: "Abats et os" },
  { id: "poulet", label: "Poulet" },
  { id: "melange", label: "Mélange" },
];

export type Meat = { id: string; name: string; category: Category; pricePerKg: number; image: string };

/** Prix au kg — grille officielle Djawan Meat. */
export const meats: Meat[] = [
  { id: "hachee", name: "Viande hachée", category: "boeuf", pricePerKg: 6000, image: hachee },
  { id: "sans-graisse", name: "Viande sans graisse", category: "boeuf", pricePerKg: 6500, image: sansGraisse },
  { id: "beef-steak", name: "Beef steak", category: "boeuf", pricePerKg: 6500, image: beefSteak },
  { id: "cote-boeuf", name: "Côte de bœuf", category: "boeuf", pricePerKg: 9000, image: coteBoeuf },
  { id: "avec-os", name: "Viande avec os", category: "boeuf", pricePerKg: 5500, image: avecOs },
  { id: "filet-boeuf", name: "Filet de bœuf", category: "boeuf", pricePerKg: 9000, image: filet },
  { id: "mouton", name: "Viande de mouton", category: "mouton", pricePerKg: 6000, image: mouton },
  { id: "foie-coeur", name: "Foie et cœur", category: "abats", pricePerKg: 5000, image: foieCoeur },
  { id: "rognon", name: "Rognon", category: "abats", pricePerKg: 2500, image: rognon },
  { id: "os", name: "Os de viande", category: "abats", pricePerKg: 1000, image: os },
  { id: "poulet-entier", name: "Poulet entier", category: "poulet", pricePerKg: 5000, image: pouletEntier },
  { id: "blanc-poulet", name: "Blanc de poulet", category: "poulet", pricePerKg: 7500, image: blancPoulet },
  { id: "cuisse-poulet", name: "Cuisse de poulet", category: "poulet", pricePerKg: 4500, image: cuissePoulet },
  { id: "aile-poulet", name: "Aile de poulet", category: "poulet", pricePerKg: 4500, image: ailePoulet },
];

export const melangeImage = melange;

export const formats = [
  { id: "decouverte", name: "Découverte", kg: 5 },
  { id: "familiale", name: "Familiale", kg: 10 },
  { id: "conviviale", name: "Conviviale", kg: 15 },
  { id: "festive", name: "Festive", kg: 20 },
] as const;

export type FormatId = (typeof formats)[number]["id"];

export const getFormat = (id: FormatId) => formats.find((f) => f.id === id)!;
export const getMeat = (id: string) => meats.find((m) => m.id === id);

export const formatFCFA = (value: number) =>
  `${value.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")} FCFA`;

/** Trois parts égales pour l'Avatar Crédit (Jawan 28) ; l'arrondi éventuel est reporté sur la dernière. */
export function splitInThree(total: number) {
  const part = Math.floor(total / 3);
  return [part, part, total - part * 2];
}

export const boxPrice =(meat: Meat, formatId: FormatId) => meat.pricePerKg * getFormat(formatId).kg;

export const mixPrice = (composition: Record<string, number>) =>
  Object.entries(composition).reduce((sum, [id, kg]) => sum + (getMeat(id)?.pricePerKg ?? 0) * kg, 0);

/** Adresse publique du site — à changer ici (et dans public/sitemap.xml, public/robots.txt) en cas de nom de domaine. */
export const SITE_URL = "https://djawan.lovable.app";

/** Balises de partage (WhatsApp, Facebook…) communes à toutes les pages publiques. */
export const shareMeta = (path: string) => [
  { property: "og:url", content: `${SITE_URL}${path}` },
  { property: "og:site_name", content: "Djawan Sahel Meat" },
  { property: "og:locale", content: "fr_FR" },
  { property: "og:image", content: `${SITE_URL}/og-image.jpg` },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: "Djawan Sahel Meat — box de viande fraîche livrées à Bamako" },
  { name: "twitter:image", content: `${SITE_URL}/og-image.jpg` },
];

/** Numéro WhatsApp officiel Djawan Sahel Meat, format international sans « + ». */
export const WHATSAPP_NUMBER = "22371699120";

/** Fiche « commerce local » pour Google. N'y mettre que des informations validées. */
export const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Djawan Sahel Meat",
  description: "Box de viande fraîche (bœuf, mouton, poulet, abats) avec livraison à domicile à Bamako et environs. Commande sur WhatsApp.",
  slogan: "Viande fraîche • Qualité • Confiance",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  telephone: `+${WHATSAPP_NUMBER}`,
  currenciesAccepted: "XOF",
  address: { "@type": "PostalAddress", addressLocality: "Bamako", addressCountry: "ML" },
  areaServed: { "@type": "City", name: "Bamako" },
};

export function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const defaultWhatsappUrl = whatsappUrl(
  "Bonjour Djawan Sahel Meat, je souhaite commander une box.",
);

export const faqs = [
  {
    question: "Quels sont les formats disponibles ?",
    answer: "Nos box sont proposées en quatre formats : Découverte 5 kg, Familiale 10 kg, Conviviale 15 kg et Festive 20 kg.",
    pending: false,
  },
  {
    question: "Que contient chaque box ?",
    answer: "Chaque box contient un seul type de viande, au choix parmi notre catalogue. La Box Mélange vous permet de composer vous-même votre box, kilo par kilo.",
    pending: false,
  },
  {
    question: "Où livrez-vous ?",
    answer: "Nous livrons à Bamako et dans les environs. La zone exacte est confirmée au moment de la commande.",
    pending: true,
  },
  {
    question: "Comment commander ?",
    answer: "Ajoutez vos box au panier, puis validez : votre commande est envoyée directement à Djawan Sahel Meat sur WhatsApp.",
    pending: false,
  },
  {
    question: "Quels sont les moyens de paiement ?",
    answer: "Vous pouvez payer par Orange Money, par Moov Money ou en espèces à la livraison. Choisissez votre moyen de paiement au moment de valider votre panier.",
    pending: false,
  },
  {
    question: "Comment fonctionne l’Avatar Crédit ?",
    answer: "Vous choisissez votre box et réglez votre paiement en trois tranches sur une période de 28 jours.",
    pending: true,
  },
  {
    question: "Quel est le délai de livraison ?",
    answer: "Le délai de livraison vous sera confirmé au moment de votre commande sur WhatsApp.",
    pending: true,
  },
];
