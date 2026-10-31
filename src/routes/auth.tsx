import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined;
    return r ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Entrar — DarkCut AI" },
      { name: "description", content: "Entre ou crie sua conta no DarkCut AI para editar vídeos virais." },
      { property: "og:title", content: "Entrar no DarkCut AI" },
      { property: "og:description", content: "Acesse o editor de vídeos virais com IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const dest = redirect ?? "/editor";
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: dest, replace: true }); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: dest, replace: true }); });
    return () => sub.subscription.unsubscribe();
  }, [dest, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + dest } });
        if (error) throw error;
        if (!data.session) setNotice("Conta criada! Confirme pelo link que enviamos ao seu e-mail.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("Enviamos um link para redefinir sua senha.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? translate(err.message) : "Algo deu errado");
    } finally { setBusy(false); }
  }

  async function oauth(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : "") });
    if (r.error) toast.error("Não foi possível entrar agora.");
  }

  const title = mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Crie sua conta" : "Recuperar senha";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 font-sans text-foreground">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center font-display text-4xl tracking-wider">DARK<span className="text-ember">CUT</span></Link>
        <div className="mt-6 rounded-3xl border border-border bg-card p-7 shadow-glow">
          <h1 className="font-display text-4xl">{title}</h1>
          {notice ? <p className="mt-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p> : null}
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full rounded-xl border border-input bg-background px-4 py-3" />
            {mode !== "forgot" && <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full rounded-xl border border-input bg-background px-4 py-3" />}
            <button disabled={busy} className="w-full rounded-full bg-ember py-3 font-bold text-primary-foreground disabled:opacity-50">
              {busy ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
            </button>
          </form>
          {mode === "login" && <button onClick={() => setMode("forgot")} className="mt-3 text-sm text-muted-foreground underline">Esqueci minha senha</button>}
          {mode !== "forgot" && (
            <div className="mt-5 space-y-2">
              <div className="text-center text-xs text-muted-foreground">ou</div>
              <button type="button" onClick={() => oauth("google")} className="w-full rounded-full border border-border py-3 font-semibold">Continuar com Google</button>
              <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
            </div>
          )}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Já tem conta? " : mode === "login" ? "Ainda não tem conta? " : "Lembrou? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setNotice(""); }} className="font-bold text-foreground underline">
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function translate(m: string) {
  if (/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
  if (/not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar.";
  if (/already registered/i.test(m)) return "Este e-mail já tem conta.";
  return m;
}
