import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Gift, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSessionUser } from "@/hooks/use-session";

const KEY = "darkcut-trial-bump-seen";

export function FreeTrialBump() {
  const { user, ready } = useSessionUser();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready || user || sessionStorage.getItem(KEY)) return;
    const t = setTimeout(() => setOpen(true), 1800);
    return () => clearTimeout(t);
  }, [ready, user]);

  const close = (o: boolean) => { setOpen(o); if (!o) sessionStorage.setItem(KEY, "1"); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem(KEY, "1");
    navigate({ to: "/auth", search: { mode: "signup", email: email.trim() } });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md overflow-hidden border-primary/60 bg-background p-0">
        <div className="bg-ember px-6 py-4 text-center text-primary-foreground">
          <div className="text-xs font-bold uppercase tracking-[0.3em]">Oferta para novos criadores</div>
        </div>
        <div className="p-7 text-center">
          <Gift className="mx-auto h-12 w-12 text-accent" />
          <DialogTitle className="mt-3 font-display text-5xl font-normal leading-none">Teste <span className="text-ember">grátis</span></DialogTitle>
          <DialogDescription className="mt-3 text-base text-muted-foreground">Crie sua conta e edite seu primeiro vídeo viral sem pagar nada. Sem cartão de crédito.</DialogDescription>
          <ul className="mx-auto mt-5 w-fit space-y-1.5 text-left text-sm">
            {["1 vídeo completo grátis", "Cortes, legendas e trilha com IA", "Download liberado em 9:16"].map((f) => (
              <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
            ))}
          </ul>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} placeholder="seu@email.com" className="block w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary" />
            <button className="w-full rounded-full bg-ember py-4 font-bold text-primary-foreground shadow-glow transition hover:scale-[1.02]">Quero meu teste grátis</button>
          </form>
          <button onClick={() => close(false)} className="mt-3 text-xs text-muted-foreground underline">Agora não</button>
          <p className="mt-2 text-[11px] text-muted-foreground">Válido uma única vez por e-mail.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
