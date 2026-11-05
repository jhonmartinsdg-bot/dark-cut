import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MIN_PASSWORD_LENGTH, validNewPassword } from "@/lib/auth-policy";
import { useSessionUser } from "@/hooks/use-session";
import { verifiedUser } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — DarkCut AI" },
      { name: "description", content: "Defina uma nova senha para sua conta DarkCut AI." },
      { property: "og:title", content: "Nova senha — DarkCut AI" },
      { property: "og:description", content: "Redefina sua senha do DarkCut AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, ready, recovery } = useSessionUser();
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !user || !recovery) { toast.error("Link expirado ou inválido. Peça um novo."); return; }
    if (!validNewPassword(pw)) { toast.error("A senha precisa ter pelo menos 8 caracteres."); return; }
    setBusy(true);
    try {
      await verifiedUser();
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Senha atualizada!");
      await navigate({ to: "/editor", replace: true });
    } catch { toast.error("Não foi possível atualizar a senha. Peça um novo link e tente novamente."); }
    finally { setBusy(false); }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 font-sans text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-7 shadow-glow">
        <h1 className="font-display text-4xl">Nova senha</h1>
        {!ready ? <p role="status">Verificando link...</p> : !user || !recovery ? <><p role="alert">Link expirado ou inválido. Solicite um novo link de recuperação.</p><Link to="/auth" className="text-primary underline">Voltar para entrar</Link></> : <>
        <input type="password" required autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha" className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        <p className="text-sm text-muted-foreground">No mínimo 8 caracteres.</p>
        <Button disabled={busy} className="h-auto w-full rounded-full bg-ember py-3 font-bold text-primary-foreground disabled:opacity-50">{busy ? "Salvando..." : "Salvar senha"}</Button>
        </>}
      </form>
    </div>
  );
}
