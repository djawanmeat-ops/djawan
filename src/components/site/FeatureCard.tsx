import type { LucideIcon } from "lucide-react";

export function FeatureCard({ icon: Icon, title, text, dark = false }: { icon: LucideIcon; title: string; text: string; dark?: boolean }) {
  return (
    <article className={dark ? "border-t border-cream/20 pt-5" : "border-t border-border pt-5"}>
      <Icon size={24} strokeWidth={1.8} className="mb-8 text-primary" />
      <h3 className={dark ? "font-display text-xl font-bold text-cream" : "font-display text-xl font-bold text-brown"}>{title}</h3>
      <p className={dark ? "mt-2 text-sm leading-6 text-cream/65" : "mt-2 text-sm leading-6 text-muted-foreground"}>{text}</p>
    </article>
  );
}