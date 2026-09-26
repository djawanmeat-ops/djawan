import { ChevronDown } from "lucide-react";

export function FAQItem({ question, answer, pending }: { question: string; answer: string; pending: boolean }) {
  return (
    <details className="faq-item border-b border-border">
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-6 text-left font-display text-lg font-bold text-brown">
        <span className="min-w-0">{question}</span><ChevronDown className="faq-icon shrink-0 text-primary transition-transform" size={20} />
      </summary>
      <div className="pb-6 pr-10 text-sm leading-7 text-muted-foreground">
        <p>{answer}</p>
        {pending ? <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Information à valider</p> : null}
      </div>
    </details>
  );
}