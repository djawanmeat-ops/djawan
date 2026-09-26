import boxDecouverte from "@/assets/box-decouverte.jpg";
import boxFamily from "@/assets/box-family.jpg";

export const navItems = [
  { label: "Accueil", href: "#accueil" },
  { label: "Nos Box", href: "#box" },
  { label: "À propos", href: "#apropos" },
  { label: "Comment ça marche", href: "#commande" },
  { label: "Avatar Crédit", href: "#credit" },
  { label: "FAQ", href: "#faq" },
];

export const boxes = [
  {
    name: "Box Découverte",
    weight: "5 kg",
    description: "Idéal pour 1 à 2 personnes.",
    composition: ["Viande de bœuf", "Poulet", "Mouton", "Abats"],
    image: boxDecouverte,
  },
  {
    name: "Box Family",
    weight: "10 kg",
    description: "Parfait pour une famille.",
    composition: ["Viande de bœuf", "Poulet", "Mouton", "Abats"],
    image: boxFamily,
  },
  {
    name: "Box Conviviale",
    weight: "15 kg",
    description: "Pour les grands foyers.",
    composition: ["Viande de bœuf", "Poulet", "Mouton", "Abats"],
    image: boxDecouverte,
  },
  {
    name: "Box Festin",
    weight: "20 kg",
    description: "Le choix économique.",
    composition: ["Viande de bœuf", "Poulet", "Mouton", "Abats"],
    image: boxFamily,
  },
];

export function whatsappUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export const defaultWhatsappUrl = whatsappUrl(
  "Bonjour Djawan Sahel Meat, je souhaite commander une box.",
);

export const faqs = [
  {
    question: "Quels sont les formats disponibles ?",
    answer: "Nos box sont proposées en quatre formats : 5 kg, 10 kg, 15 kg et 20 kg.",
    pending: false,
  },
  {
    question: "Que contient chaque box ?",
    answer: "Chaque box est composée de viande de bœuf, de poulet, de mouton et d’abats.",
    pending: false,
  },
  {
    question: "Où livrez-vous ?",
    answer: "Nous livrons à Bamako et dans les environs. La zone exacte est confirmée au moment de la commande.",
    pending: true,
  },
  {
    question: "Comment commander ?",
    answer: "Choisissez votre box puis envoyez votre demande directement à Djawan Sahel Meat sur WhatsApp.",
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