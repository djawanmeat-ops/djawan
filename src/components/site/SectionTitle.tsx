import { cn } from "@/lib/utils";

export function SectionTitle({
  eyebrow,
  title,
  text,
  light = false,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  light?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
      <p className={cn("mb-4 text-xs font-extrabold uppercase tracking-[0.18em]", light ? "text-gold" : "text-primary")}>
        {eyebrow}
      </p>
      <h2 className={cn("font-display text-4xl leading-[1.05] font-bold sm:text-5xl", light ? "text-cream" : "text-brown")}>{title}</h2>
      {text ? <p className={cn("mt-5 text-base leading-7", light ? "text-cream/75" : "text-muted-foreground")}>{text}</p> : null}
    </div>
  );
}