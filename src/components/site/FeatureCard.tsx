export function FeatureCard({ index, title, text, dark = false }: { index: number; title: string; text: string; dark?: boolean }) {
  return (
    <article className={dark ? "border-t border-cream/20 pt-5" : "border-t border-brown/20 pt-5"}>
      <span className={dark ? "font-display text-sm font-bold text-gold" : "font-display text-sm font-bold text-primary"}>{String(index).padStart(2, "0")}</span>
      <h3 className={dark ? "mt-6 font-display text-xl font-bold text-cream" : "mt-6 font-display text-xl font-bold text-brown"}>{title}</h3>
      <p className={dark ? "mt-2 text-sm leading-6 text-cream/65" : "mt-2 text-sm leading-6 text-muted-foreground"}>{text}</p>
    </article>
  );
}
