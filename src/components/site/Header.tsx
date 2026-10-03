import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { CartButton } from "./CartDrawer";
import { defaultWhatsappUrl, navItems } from "@/data/djawan";
import logo from "@/assets/djawan-logo.png";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a href="#accueil" aria-label="Djawan Sahel Meat — Accueil" className="block shrink-0">
      <img src={logo} alt="Djawan Sahel Meat" width={983} height={965} className="h-16 w-auto object-contain" />
    </a>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 lg:px-8 xl:flex xl:justify-between">
        <Brand />
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 xl:flex">
          {navItems.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-brown/70 transition hover:text-primary">{item.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <CartButton />
          <div className="hidden xl:block">
            <Button href={defaultWhatsappUrl} target="_blank" rel="noreferrer">Commander</Button>
          </div>
          <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} className="grid size-11 place-items-center rounded-md border border-border text-brown xl:hidden">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <div className={open ? "mobile-menu is-open xl:hidden" : "mobile-menu xl:hidden"}>
        <nav className="grid gap-1 border-t border-border bg-background px-5 py-4" aria-label="Navigation mobile">
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-semibold text-brown hover:bg-muted">{item.label}</a>)}
          <Button href={defaultWhatsappUrl} target="_blank" rel="noreferrer" className="mt-2">Commander sur WhatsApp</Button>
        </nav>
      </div>
    </header>
  );
}