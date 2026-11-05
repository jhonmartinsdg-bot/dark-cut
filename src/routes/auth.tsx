import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { MIN_PASSWORD_LENGTH, oauthReturnUrl, safeAuthDestination, validNewPassword } from "@/lib/auth-policy";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; mode?: "signup"; email?: string } => {
    const v = s["redirect"]; const r = typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : undefined;
    return { ...(r ? { redirect: r } : {}), ...(s["mode"] === "signup" ? { mode: "signup" as const } : {}), ...(typeof s["email"] === "string" ? { email: s["email"].slice(0, 200) } : {}) };
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
  const { redirect, mode: initialMode, email: initialEmail } = Route.useSearch();
  const dest = redirect ?? "/editor";
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode ?? "login");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const finishSignIn = () => {
      const target = safeAuthDestination(redirect ?? sessionStorage.getItem("darkcut-auth-destination") ?? dest);
      sessionStorage.removeItem("darkcut-auth-destination");
      navigate({ href: target, replace: true });
    };
    supabase.auth.getSession().then(({ data }) => { if (data.session) finishSignIn(); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) finishSignIn(); });
    return () => sub.subscription.unsubscribe();
  }, [dest, redirect, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        if (!validNewPassword(password)) throw new Error("Password too short");
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(safeAuthDestination(dest))}` } });
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

  async function oauth() {
    setBusy(true);
    try {
      sessionStorage.setItem("darkcut-auth-destination", safeAuthDestination(dest));
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: oauthReturnUrl(window.location.origin),
      });
      if (result.error) { toast.error("Não foi possível entrar com Google agora. Tente novamente."); return; }
      if (result.redirected) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ href: safeAuthDestination(dest), replace: true });
    } catch {
      toast.error("Não foi possível entrar com Google agora. Tente novamente.");
    } finally { setBusy(false); }
  }

  const title = mode === "login" ? "Bem-vindo de volta" : mode === "signup" ? "Crie sua conta" : "Recuperar senha";
  return (
    <div className="flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-background px-5 py-8 font-sans text-foreground sm:items-center sm:py-5">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center font-display text-4xl tracking-wider">DARK<span className="text-ember">CUT</span></Link>
        <div className="mt-6 rounded-3xl border border-border bg-card p-7 shadow-glow">
          <h1 className="font-display text-4xl">{title}</h1>
          {mode === "signup" && !notice ? <p className="mt-2 text-sm text-accent">🎁 Teste grátis: crie sua conta e edite 1 vídeo sem pagar nada.</p> : null}
          {notice ? <p className="mt-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p> : null}
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input type="text" name="email" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} placeholder="seu@email.com" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" enterKeyHint="next" className="block w-full min-w-0 touch-manipulation rounded-xl border border-input bg-background px-4 py-3 text-base leading-normal outline-none focus:ring-2 focus:ring-primary" />
            {mode !== "forgot" && <>
              <input type="password" name="password" required minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined} value={password} onChange={(e) => setPassword(e.currentTarget.value)} placeholder="Senha" autoComplete={mode === "login" ? "current-password" : "new-password"} enterKeyHint="go" className="block w-full min-w-0 touch-manipulation rounded-xl border border-input bg-background px-4 py-3 text-base leading-normal outline-none focus:ring-2 focus:ring-primary" />
              {mode === "signup" && <p className="text-sm text-muted-foreground">No mínimo 8 caracteres.</p>}
            </>}
            <button disabled={busy} className="w-full rounded-full bg-ember py-3 font-bold text-primary-foreground disabled:opacity-50">
              {busy ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
            </button>
          </form>
          {mode === "login" && <button onClick={() => setMode("forgot")} className="mt-3 text-sm text-muted-foreground underline">Esqueci minha senha</button>}
          {mode !== "forgot" && (
            <div className="mt-5 space-y-2">
              <div className="text-center text-xs text-muted-foreground">ou</div>
              <button type="button" disabled={busy} onClick={oauth} className="w-full rounded-full border border-border py-3 font-semibold disabled:opacity-50">Continuar com Google</button>
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
  if (/password.*weak|weak password|known to be weak|easy to guess/i.test(m)) return "Esta senha é conhecida por vazamentos. Escolha outra senha com 8 caracteres ou mais.";
  if (/password.*(length|short)|at least \d+ characters/i.test(m)) return "A senha precisa ter pelo menos 8 caracteres.";
  if (/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
  if (/not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar.";
  if (/already registered/i.test(m)) return "Este e-mail já tem conta.";
  if (/not allowed/i.test(m)) return "Use um e-mail real, que possa receber mensagens.";
  return m;
}
