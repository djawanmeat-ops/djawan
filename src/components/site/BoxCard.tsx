import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "./Button";
import { whatsappUrl } from "@/data/djawan";

type Box = { name: string; weight: string; description: string; composition: string[]; image: string };

export function BoxCard({ box, index }: { box: Box; index: number }) {
  const url = whatsappUrl(`Bonjour Djawan Sahel Meat, je souhaite commander la ${box.name} ${box.weight}.`);
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={box.image} alt={`${box.name} de viande fraîche — ${box.weight}`} width={1200} height={912} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        <span className="absolute left-4 top-4 rounded-full bg-cream px-3 py-1 text-xs font-black text-brown">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0"><h3 className="font-display text-2xl font-bold text-brown">{box.name}</h3><p className="mt-1 text-sm text-muted-foreground">{box.description}</p></div>
          <span className="shrink-0 text-2xl font-black text-primary">{box.weight}</span>
        </div>
        <ul className="my-5 grid grid-cols-2 gap-2 border-y border-border py-4">
          {box.composition.map((item) => <li key={item} className="flex items-center gap-2 text-sm text-brown/75"><Check size={14} className="shrink-0 text-primary" />{item}</li>)}
        </ul>
        <Button href={url} target="_blank" rel="noreferrer" className="w-full">Commander cette box <ArrowUpRight size={17} /></Button>
      </div>
    </article>
  );
}