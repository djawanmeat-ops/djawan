import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/site/Button";
import { CartProvider } from "@/components/site/cart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { SITE_URL, shareMeta, whatsappUrl } from "@/data/djawan";
import { listPublicPromos } from "@/lib/promos.functions";

export const promosQuery = queryOptions({ queryKey: ["promos"], queryFn: () => listPublicPromos() });

export const Route = createFileRoute("/promo")({
  head: () => ({
    meta: [
      { title: "Promotions — Djawan Sahel Meat" },
      { name: "description", content: "Les offres Djawan Sahel Meat : la Promo Djawan toute l'année et les rendez-vous des grandes fêtes." },
      { property: "og:title", content: "Promotions — Djawan Sahel Meat" },
      { property: "og:description", content: "Promo Djawan, Ramadan, Tabaski, Maouloud et Achoura." },
      { property: "og:type", content: "website" },
      ...shareMeta("/promo"),
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/promo` }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(promosQuery),
  component: PromoPage,
  errorComponent: () => <p className="p-10 text-center">Les promotions sont momentanément indisponibles.</p>,
  notFoundComponent: () => <p className="p-10 text-center">Page introuvable.</p>,
});

function PromoPage() {
  const { data: promos } = useSuspenseQuery(promosQuery);
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-5 pt-36 pb-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Les offres de la maison</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1] font-black text-brown sm:text-6xl">Nos promotions.</h1>
            <p className="mt-6 max-w-xl text-muted-foreground">Une offre signature toute l'année, et des rendez-vous choisis pour les grandes fêtes.</p>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {promos.map((p, i) =>
                p.active ? (
                  <article key={p.id} className="flex flex-col rounded-lg bg-brown p-8 text-cream sm:p-10">
                    <div className="flex items-center justify-between"><span className="text-xs font-black text-gold">0{i + 1}</span><span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-brown">Disponible</span></div>
                    <h2 className="mt-6 font-display text-3xl font-black">{p.name}</h2>
                    <p className="mt-3 text-cream/75">{p.tagline}</p>
                    {p.offer && <p className="mt-6 border-t border-cream/15 pt-6 font-display text-xl font-bold text-gold">{p.offer}</p>}
                    <Button variant="light" className="mt-8 self-start" href={whatsappUrl(`Bonjour Djawan Sahel Meat, je souhaite profiter de la ${p.name}.`)} target="_blank" rel="noreferrer">Profiter de l'offre</Button>
                  </article>
                ) : (
                  <button
                    key={p.id}
                    type="button"
                    aria-disabled="true"
                    onClick={() => toast("Cette offre n'est pas encore disponible, à très bientôt.")}
                    className="flex cursor-not-allowed flex-col rounded-lg border border-border bg-muted/40 p-8 text-left opacity-60 transition hover:opacity-75 sm:p-10"
                  >
                    <div className="flex w-full items-center justify-between"><span className="text-xs font-black text-muted-foreground">0{i + 1}</span><span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground">Indisponible</span></div>
                    <h2 className="mt-6 font-display text-3xl font-black text-brown">{p.name}</h2>
                    <p className="mt-3 text-muted-foreground">{p.tagline}</p>
                  </button>
                ),
              )}
            </div>
            <p className="mt-12 text-sm"><Link to="/" className="font-semibold text-primary">← Retour à l'accueil</Link></p>
          </div>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
