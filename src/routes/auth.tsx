import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

type Mode = "in" | "up" | "forgot" | "reset";

const titles: Record<Mode, string> = {
  in: "Connexion",
  up: "Créer un compte",
  forgot: "Mot de passe oublié",
  reset: "Nouveau mot de passe",
};

const input = "mt-1 w-full rounded-md border border-border px-3 py-2";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Retour depuis le lien « réinitialiser le mot de passe » reçu par e-mail (/auth?reinit=1#access_token=…).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.hash.includes("error")) {
      setMsg("Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.");
      setMode("forgot");
      return;
    }
    if (url.searchParams.get("reinit") !== "1") return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) setMode("reset");
    });
    supabase.auth.getSession().then(({ data: s }) => s.session && setMode("reset"));
    return () => data.subscription.unsubscribe();
  }, []);

  const go = (m: Mode) => {
    setMode(m);
    setMsg("");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg("Identifiants incorrects.");
      navigate({ to: "/admin" });
    } else if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      // Message générique : ne pas révéler quelles adresses ont déjà un compte.
      if (error) console.error("signup", error.message);
      setMsg(error ? "Création du compte impossible. Vérifiez l'adresse e-mail et choisissez un mot de passe d'au moins 8 caractères." : "Si cette adresse est valide, un e-mail de confirmation vient de vous être envoyé.");
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?reinit=1` });
      setBusy(false);
      if (error) console.error("reset", error.message);
      // Même message dans tous les cas : ne pas révéler quelles adresses ont un compte.
      setMsg("Si un compte existe pour cette adresse, un e-mail avec un lien de réinitialisation vient d'être envoyé. Pensez à regarder dans les spams.");
    } else {
      if (password !== confirm) {
        setBusy(false);
        return setMsg("Les deux mots de passe ne sont pas identiques.");
      }
      const { error } = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (error) {
        console.error("updateUser", error.message);
        return setMsg("Modification impossible. Le lien a peut-être expiré : demandez-en un nouveau.");
      }
      window.history.replaceState(null, "", "/auth");
      navigate({ to: "/admin" });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-background p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Back-office</p>
        <h1 className="mt-2 font-display text-3xl font-black text-brown">{titles[mode]}</h1>
        {mode === "forgot" && <p className="mt-2 text-sm text-muted-foreground">Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.</p>}
        {mode === "reset" && <p className="mt-2 text-sm text-muted-foreground">Choisissez votre nouveau mot de passe (8 caractères minimum).</p>}
        {mode !== "reset" && (
          <label className="mt-6 block text-sm font-semibold">E-mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
        )}
        {mode !== "forgot" && (
          <label className="mt-4 block text-sm font-semibold">{mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}
            <input type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </label>
        )}
        {mode === "reset" && (
          <label className="mt-4 block text-sm font-semibold">Confirmer le mot de passe<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} /></label>
        )}
        {msg && <p className="mt-4 text-sm text-muted-foreground" role="status">{msg}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {{ in: "Se connecter", up: "Créer le compte", forgot: "Envoyer le lien", reset: "Enregistrer et se connecter" }[mode]}
        </button>
        {mode === "in" && <button type="button" onClick={() => go("forgot")} className="mt-4 w-full text-sm text-muted-foreground underline">Mot de passe oublié ?</button>}
        {mode !== "reset" && (
          <button type="button" onClick={() => go(mode === "in" ? "up" : "in")} className="mt-3 w-full text-sm text-muted-foreground underline">
            {mode === "in" ? "Première connexion ? Créer un compte" : "Retour à la connexion"}
          </button>
        )}
      </form>
    </main>
  );
}
