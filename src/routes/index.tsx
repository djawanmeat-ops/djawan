import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import heroImage from "@/assets/djawan-hero.webp";
import storyImage from "@/assets/djawan-story.webp";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/site/Button";
import { SectionTitle } from "@/components/site/SectionTitle";
import { FeatureCard } from "@/components/site/FeatureCard";
import { FAQItem } from "@/components/site/FAQItem";
import { Reveal } from "@/components/site/Reveal";
import { Catalogue } from "@/components/site/Catalogue";
import { CartProvider } from "@/components/site/cart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { Advisor } from "@/components/site/Advisor";
import { CreditSimulator } from "@/components/site/CreditSimulator";
import { PromoBanner } from "@/components/site/PromoBanner";
import { SITE_URL, businessJsonLd, defaultWhatsappUrl, faqs, shareMeta, whatsappUrl } from "@/data/djawan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Djawan Sahel Meat — Viande fraîche et box à Bamako" },
      { name: "description", content: "Djawan Sahel Meat propose des box de viande fraîche avec livraison à domicile à Bamako et environs. Découvrez nos formats et commandez facilement sur WhatsApp." },
      { property: "og:title", content: "Djawan Sahel Meat — Viande fraîche et box à Bamako" },
      { property: "og:description", content: "Des box de viande fraîche, adaptées à vos besoins et livrées à Bamako et environs." },
      { property: "og:type", content: "website" },
      ...shareMeta("/"),
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(businessJsonLd) }],
  }),
  component: Index,
});

function Index() {
  return (
    <CartProvider><div className="overflow-x-clip bg-background">
      <Header />
      <main>
        <PromoBanner />
        <section id="accueil" className="relative min-h-[92svh] overflow-hidden bg-brown pt-20 text-cream">
          <img src={heroImage} alt="Sélection de viandes fraîches Djawan Sahel Meat" width={1264} height={848} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
          <div className="absolute inset-0 bg-hero-overlay" />
          <div className="relative mx-auto flex min-h-[calc(92svh-5rem)] max-w-7xl items-center px-5 py-16 lg:px-8">
            <div className="hero-enter max-w-3xl">
              <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gold"><span className="h-px w-10 bg-gold" />Bamako & environs</p>
              <h1 className="font-display max-w-2xl text-5xl leading-[0.96] font-black sm:text-7xl lg:text-[5.5rem]">L'excellence de la viande, livrée chez vous.</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-cream/80 sm:text-lg">Des pièces choisies une à une, conditionnées sous vide et réunies dans nos box signature. Livrées à domicile, à Bamako et environs.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href={defaultWhatsappUrl} target="_blank" rel="noreferrer">Commander sur WhatsApp</Button>
                <Button href="#box" variant="light">Découvrir la sélection</Button>
              </div>
            </div>
          </div>
          <div className="relative border-t border-cream/20 px-5 py-5 lg:px-8"><p className="mx-auto max-w-7xl text-xs font-extrabold tracking-[0.2em] text-cream/80">VIANDE FRAÎCHE <span className="text-gold">•</span> QUALITÉ <span className="text-gold">•</span> CONFIANCE</p></div>
        </section>

        <section className="border-b border-border bg-cream px-5 py-10 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-7 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard index={1} title="Viande fraîche" text="Des produits sélectionnés avec attention." />
            <FeatureCard index={2} title="Qualité" text="Une attention portée à la qualité." />
            <FeatureCard index={3} title="Livraison" text="Bamako et environs." />
            <FeatureCard index={4} title="Commande simple" text="Directement sur WhatsApp." />
          </div>
        </section>

        <section id="box" className="scroll-mt-20 px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal><SectionTitle eyebrow="La sélection" title="Nos box, pièce par pièce." text="Quatorze viandes, quatre formats. Chaque box est préparée et conditionnée sous vide pour préserver toute sa fraîcheur." /></Reveal>
            <div>
              <Catalogue />
            </div>
            <div className="mt-20"><Advisor /></div>
          </div>
        </section>

        <section id="apropos" className="scroll-mt-20 bg-cream px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal><div className="overflow-hidden rounded-lg"><img src={storyImage} alt="Préparation attentive de viande fraîche chez Djawan Sahel Meat" width={1200} height={896} loading="lazy" decoding="async" className="aspect-[4/3] h-full w-full object-cover" /></div></Reveal>
            <Reveal><SectionTitle eyebrow="Notre histoire" title="L'art de bien choisir, le soin de bien servir." text="Chez Djawan Sahel Meat, chaque pièce est sélectionnée avec exigence, puis conditionnée avec soin. Notre maison repose sur trois valeurs : la fraîcheur, la qualité et la confiance que nous accordent les familles de Bamako." /></Reveal>
          </div>
        </section>

        <section className="bg-brown px-5 py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal><SectionTitle eyebrow="Pourquoi Djawan ?" title="L'exigence, à chaque étape." light /></Reveal>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard dark index={1} title="Fraîcheur" text="Des viandes sélectionnées avec attention." />
              <FeatureCard dark index={2} title="Qualité" text="Une attention portée à la qualité des produits." />
              <FeatureCard dark index={3} title="Livraison" text="Vos commandes livrées à Bamako et environs." />
              <FeatureCard dark index={4} title="Confiance" text="Un service pensé pour construire une relation durable." />
            </div>
          </div>
        </section>

        <section id="commande" className="scroll-mt-20 px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal><SectionTitle eyebrow="Comment ça marche ?" title="Trois gestes, et c'est servi." centered /></Reveal>
            <div className="relative mt-16 grid gap-10 md:grid-cols-3">
              {[{n:"01",t:"Choisissez votre box",d:"5 kg, 10 kg, 15 kg ou 20 kg."},{n:"02",t:"Commandez sur WhatsApp",d:"Envoyez votre demande directement à Djawan Sahel Meat."},{n:"03",t:"Recevez votre commande",d:"Votre box est livrée à Bamako et environs."}].map((step, index) => <Reveal key={step.n} delay={index*100}><div className="text-center"><p className="font-display text-6xl font-black text-secondary">{step.n}</p><h3 className="mt-2 font-display text-2xl font-bold text-brown">{step.t}</h3><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{step.d}</p></div></Reveal>)}
            </div>
            <div className="mt-12 text-center"><Button href={defaultWhatsappUrl} target="_blank" rel="noreferrer">Commander maintenant</Button></div>
          </div>
        </section>

        <section id="credit" className="scroll-mt-20 bg-sun px-5 py-24 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <Reveal><SectionTitle eyebrow="Avatar Crédit" title="Votre box maintenant. Votre paiement en 3 tranches." text="Avec l'Avatar Crédit, choisissez la box qui vous convient et payez en trois tranches sur 28 jours." /></Reveal>
            <Reveal>
              <div className="rounded-lg bg-brown p-7 text-cream sm:p-10">
                <div className="grid gap-5 sm:grid-cols-3">
                  {["Choisissez votre box", "Payez en 3 tranches", "Sur 28 jours"].map((item, index) => <div key={item} className="credit-step border-l border-gold/60 pl-4"><span className="text-xs font-black text-gold">0{index+1}</span><p className="mt-2 font-display text-xl font-bold">{item}</p></div>)}
                </div>
                <p className="my-8 border-y border-cream/15 py-5 text-sm font-bold tracking-[0.12em] text-gold">5 KG • 10 KG • 15 KG • 20 KG</p>
                <Button variant="light" href={whatsappUrl("Bonjour Djawan Sahel Meat, je souhaite en savoir plus sur l’Avatar Crédit.")} target="_blank" rel="noreferrer">Découvrir l'Avatar Crédit</Button>
                <p className="mt-5 text-xs text-cream/50">Conditions officielles détaillées à venir.</p>
              </div>
            </Reveal>
            <div className="lg:col-span-2"><CreditSimulator /></div>
          </div>
        </section>

        <section className="relative min-h-[620px] overflow-hidden bg-brown px-5 py-24 text-cream lg:px-8 lg:py-32">
          <img src={heroImage} alt="Viandes fraîches sélectionnées avec soin" width={1264} height={848} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-commitment-overlay" />
          <Reveal className="relative mx-auto max-w-7xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-gold">Nos engagements</p><h2 className="mt-8 max-w-3xl font-display text-5xl leading-[1.05] font-black sm:text-7xl">La fraîcheur.<br />La qualité.<br />La confiance.</h2><p className="mt-8 max-w-lg leading-7 text-cream/75">Trois piliers qui guident chacune de nos box, de la sélection jusqu'à votre table.</p></Reveal>
        </section>

        <section id="faq" className="scroll-mt-20 bg-cream px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.65fr_1fr] lg:gap-24">
            <Reveal><SectionTitle eyebrow="Questions fréquentes" title="Tout ce qu'il faut savoir." text="Une question supplémentaire ? Écrivez-nous directement sur WhatsApp." /></Reveal>
            <Reveal><div>{faqs.map((faq) => <FAQItem key={faq.question} {...faq} />)}</div></Reveal>
          </div>
        </section>

        <section className="bg-primary px-5 py-20 text-center text-primary-foreground lg:px-8">
          <Reveal><div className="mx-auto max-w-3xl"><h2 className="font-display text-4xl font-black sm:text-5xl">Votre prochaine box vous attend.</h2><p className="mt-5 text-primary-foreground/75">Composez-la en quelques instants et finalisez votre commande sur WhatsApp.</p><Button variant="light" href={defaultWhatsappUrl} target="_blank" rel="noreferrer" className="mt-8">Commander sur WhatsApp</Button></div></Reveal>
        </section>
      </main>
      <Footer />
      <a href={defaultWhatsappUrl} target="_blank" rel="noreferrer" aria-label="Commander sur WhatsApp" className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition hover:scale-105 md:hidden"><MessageCircle size={25} /></a>
      <CartDrawer />
    </div></CartProvider>
  );
}
