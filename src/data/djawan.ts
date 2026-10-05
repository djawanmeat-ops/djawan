import hachee from "@/assets/meat-hachee.jpg";
import sansGraisse from "@/assets/meat-sans-graisse.jpg";
import beefSteak from "@/assets/meat-beef-steak.jpg";
import coteBoeuf from "@/assets/meat-cote-boeuf.jpg";
import avecOs from "@/assets/meat-avec-os.jpg";
import foieCoeur from "@/assets/meat-foie-coeur.jpg";
import rognon from "@/assets/meat-rognon.jpg";
import os from "@/assets/meat-os.jpg";
import mouton from "@/assets/meat-mouton.jpg";
import filet from "@/assets/meat-filet.jpg";
import pouletEntier from "@/assets/meat-poulet-entier.jpg";
import blancPoulet from "@/assets/meat-blanc-poulet.jpg";
import cuissePoulet from "@/assets/meat-cuisse-poulet.jpg";
import ailePoulet from "@/assets/meat-aile-poulet.jpg";
import melange from "@/assets/meat-melange.jpg";

export const navItems = [
  { label: "Accueil", href: "#accueil" },
  { label: "Nos Box", href: "#box" },
  { label: "À propos", href: "#apropos" },
  { label: "Comment ça marche", href: "#commande" },
  { label: "Avatar Crédit", href: "#credit" },
  { label: "FAQ", href: "#faq" },
];

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

export const boxPrice = (meat: Meat, formatId: FormatId) => meat.pricePerKg * getFormat(formatId).kg;

export const mixPrice = (composition: Record<string, number>) =>
  Object.entries(composition).reduce((sum, [id, kg]) => sum + (getMeat(id)?.pricePerKg ?? 0) * kg, 0);

/** Numéro WhatsApp officiel Djawan Sahel Meat, format international sans « + ». */
export const WHATSAPP_NUMBER = "22371699120";

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
    answer: "Les moyens de paiement disponibles seront confirmés lors de votre échange sur WhatsApp.",
    pending: true,
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
