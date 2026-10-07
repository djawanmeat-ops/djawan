import { useQuery } from "@tanstack/react-query";
import { listPublicPromos } from "@/lib/promos.functions";

export function PromoBanner() {
  const { data } = useQuery({ queryKey: ["promos"], queryFn: () => listPublicPromos() });
  const feast = data?.find((p) => p.active && p.id !== "djawan");
  if (!feast) return null;
  return (
    <a href="/promo" className="fixed inset-x-0 top-20 z-40 block bg-gold px-5 py-2 text-center text-sm font-bold text-brown">
      {feast.name} disponible — découvrir l'offre →
    </a>
  );
}
