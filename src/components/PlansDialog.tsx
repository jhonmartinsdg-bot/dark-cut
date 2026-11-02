import type React from "react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createCheckout } from "@/lib/billing.functions";
import { PLANS, type PlanKey } from "@/lib/plans";

export function PlansDialog({ open, onOpenChange, locked, title, subtitle }: {
  open: boolean; onOpenChange?: (o: boolean) => void; locked?: boolean; title?: React.ReactNode; subtitle?: string;
}) {
  const checkout = useServerFn(createCheckout);
  const [busy, setBusy] = useState<PlanKey | null>(null);
  async function buy(plan: PlanKey) {
    setBusy(plan);
    try {
      const { url } = await checkout({ data: { plan } });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao abrir o pagamento");
      setBusy(null);
    }
  }
  return (
    <Dialog open={open} onOpenChange={locked ? undefined : onOpenChange}>
      <DialogContent
        className="max-h-[92dvh] max-w-4xl overflow-y-auto border-primary/50 bg-background p-6 sm:p-8 [&>button]:hidden"
        onInteractOutside={(e) => locked && e.preventDefault()}
        onEscapeKeyDown={(e) => locked && e.preventDefault()}
      >
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 px-3 py-1 text-xs uppercase tracking-widest text-accent"><Crown className="h-3.5 w-3.5" /> Desbloqueie o DarkCut</span>
          <DialogTitle className="mt-4 font-display text-4xl font-normal leading-none sm:text-6xl">{title ?? <>Seu teste acabou. <span className="text-ember">O viral não.</span></>}</DialogTitle>
          <DialogDescription className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">{subtitle ?? "Escolha um plano para continuar criando vídeos sem limites de tempo e sem perder o ritmo do seu canal."}</DialogDescription>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.key} className={`relative flex flex-col rounded-3xl border p-6 ${p.hot ? "border-primary bg-card shadow-glow" : "border-border"}`}>
              {p.hot && <span className="absolute -top-3 left-6 rounded-full bg-ember px-3 py-1 text-xs font-bold text-primary-foreground">MAIS POPULAR</span>}
              <div className="font-bold">{p.n}</div>
              <div className="mt-2 font-display text-5xl">R${p.p}<span className="font-sans text-sm text-muted-foreground">/mês</span></div>
              <ul className="mt-4 flex-1 space-y-2 text-sm">{p.f.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul>
              <button disabled={!!busy} onClick={() => buy(p.key)} className={`mt-6 rounded-full py-3 font-bold disabled:opacity-50 ${p.hot ? "bg-ember text-primary-foreground" : "border border-border"}`}>
                {busy === p.key ? "Abrindo..." : "Assinar agora"}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Pagamento seguro via Stripe · Cancele quando quiser · Garantia de 7 dias</p>
      </DialogContent>
    </Dialog>
  );
}
