
import { Brand } from "./Header";
import { defaultWhatsappUrl, navItems } from "@/data/djawan";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream px-5 py-14 text-brown lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-border pb-10 lg:grid-cols-[1.2fr_1fr_0.8fr]">
          <div><Brand /><p className="mt-5 text-xs font-bold tracking-[0.16em] text-primary">VIANDE FRAÎCHE • QUALITÉ • CONFIANCE</p></div>
          <nav className="grid grid-cols-2 gap-x-5 gap-y-3" aria-label="Navigation de pied de page">{navItems.map((item) => <a className="text-sm text-brown/70 hover:text-primary" key={item.href} href={item.href}>{item.label}</a>)}</nav>
          <div className="text-sm text-brown/70"><p className="font-bold text-brown">Bamako et environs</p><div className="mt-4 flex flex-wrap gap-4"><a className="inline-flex items-center gap-2 hover:text-primary" href={defaultWhatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a><span>Facebook</span><span>Instagram</span></div></div>
        </div>
        <p className="pt-6 text-xs text-brown/50">© {new Date().getFullYear()} Djawan Sahel Meat — Tous droits réservés.</p>
      </div>
    </footer>
  );
}