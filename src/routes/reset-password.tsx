import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MIN_PASSWORD_LENGTH, validNewPassword } from "@/lib/auth-policy";

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
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validNewPassword(pw)) { toast.error("A senha precisa ter pelo menos 8 caracteres."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error("Link expirado ou inválido. Peça um novo."); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/editor" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 font-sans text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-7 shadow-glow">
        <h1 className="font-display text-4xl">Nova senha</h1>
        <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha" className="w-full rounded-xl border border-input bg-background px-4 py-3" />
        <button disabled={busy} className="w-full rounded-full bg-ember py-3 font-bold text-primary-foreground disabled:opacity-50">{busy ? "Salvando..." : "Salvar senha"}</button>
      </form>
    </div>
  );
}
