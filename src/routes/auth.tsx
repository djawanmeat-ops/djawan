import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion administrateur — Djawan Sahel Meat" },
      { name: "description", content: "Accès réservé à l'équipe Djawan Sahel Meat." },
      { property: "og:title", content: "Connexion — Djawan Sahel Meat" },
      { property: "og:description", content: "Accès réservé à l'équipe Djawan." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg("Identifiants incorrects.");
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      setMsg(error ? error.message : "Compte créé. Confirmez votre e-mail, puis connectez-vous.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-background p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Back-office</p>
        <h1 className="mt-2 font-display text-3xl font-black text-brown">{mode === "in" ? "Connexion" : "Créer un compte"}</h1>
        <label className="mt-6 block text-sm font-semibold">E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2" /></label>
        <label className="mt-4 block text-sm font-semibold">Mot de passe<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2" /></label>
        {msg && <p className="mt-4 text-sm text-muted-foreground">{msg}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{mode === "in" ? "Se connecter" : "Créer le compte"}</button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-sm text-muted-foreground underline">
          {mode === "in" ? "Première connexion ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </form>
    </main>
  );
}
