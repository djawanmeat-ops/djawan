import { deliveryCommunes, formatFCFA, meats, priceRange, type Category } from "@/data/djawan";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

const families: { id: Category; title: string; text: string }[] = [
  { id: "boeuf", title: "Viande de bœuf à Bamako", text: "Pour les sauces, les grillades et les grandes tablées." },
  { id: "mouton", title: "Viande de mouton", text: "Pour le tiguadèguèna, les ragoûts et les repas de fête." },
  { id: "poulet", title: "Poulet frais", text: "Entier ou en morceaux, pour toute la semaine." },
  { id: "abats", title: "Abats et os", text: "Pour les soupes et les bouillons qui ont du goût." },
];

const price = (c: Category) => {
  const { min, max } = priceRange(c);
  return min === max ? `${formatFCFA(min)} / kg` : `de ${formatFCFA(min)} à ${formatFCFA(max)} / kg`;
};

/** Texte de référencement local : n'utilise que des informations validées (prix, zones, paiement). */
export function LocalSeo() {
  return (
    <section id="bamako" className="scroll-mt-20 px-5 py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionTitle
            eyebrow="Livraison à domicile"
            title="Votre boucherie en ligne à Bamako."
            text="Djawan Sahel Meat livre de la viande fraîche à domicile dans tout Bamako. Bœuf, mouton, poulet et abats sont sélectionnés avec soin, conditionnés sous vide et réunis dans des box de 5, 10, 15 ou 20 kg. Vous composez votre commande en ligne, au prix affiché, puis vous la validez sur WhatsApp."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {families.map((f) => (
            <Reveal key={f.id}>
              <article className="h-full rounded-lg border border-border bg-card p-6">
                <h3 className="font-display text-xl font-bold text-brown">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.text}</p>
                <p className="mt-3 text-sm text-brown">{meats.filter((m) => m.category === f.id).map((m) => m.name).join(", ")}.</p>
                <p className="mt-3 text-sm font-black text-primary">{price(f.id)}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 grid gap-8 rounded-lg bg-cream p-6 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <h3 className="font-display text-2xl font-black text-brown">Livraison dans les six communes de Bamako</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Nous livrons à la maison comme au bureau, dans toutes les communes du district et dans les environs. Partagez votre position GPS au moment de commander : le livreur vient directement à votre porte.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Communes desservies">
                {deliveryCommunes.map((c) => <li key={c} className="rounded-full border border-brown/30 bg-background px-3 py-1.5 text-sm font-semibold text-brown">{c}</li>)}
                <li className="rounded-full border border-brown/30 bg-background px-3 py-1.5 text-sm font-semibold text-brown">et environs</li>
              </ul>
            </div>
            <div className="text-sm leading-6 text-muted-foreground">
              <p><strong className="text-brown">Paiement :</strong> Orange Money, Wave ou espèces à la livraison.</p>
              <p className="mt-2"><strong className="text-brown">Avatar Crédit :</strong> votre box maintenant, réglée en 3 tranches sur 28 jours.</p>
              <p className="mt-2"><strong className="text-brown">Fêtes :</strong> Tabaski, Ramadan, Maouloud — retrouvez nos offres sur la <a href="/promo" className="font-semibold text-primary underline">page Promotions</a>.</p>
              <a href="/#box" className="mt-5 inline-flex min-h-12 items-center rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground">Voir les {meats.length} viandes et les prix</a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
