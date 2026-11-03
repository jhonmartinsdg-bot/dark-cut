import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSessionUser } from "@/hooks/use-session";
import { PLAN_PRICES, checkoutUrl, type PlanKey } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/assinar")({
  validateSearch: (s: Record<string, unknown>): { plan: PlanKey } => ({
    plan: typeof s["plan"] === "string" && s["plan"] in PLAN_PRICES ? (s["plan"] as PlanKey) : "criador",
  }),
  head: () => ({ meta: [{ title: "Assinar — DarkCut AI" }, { name: "description", content: "Finalize sua assinatura do DarkCut AI." }, { property: "og:title", content: "Assinar DarkCut AI" }, { property: "og:description", content: "Pagamento seguro do seu plano." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Assinar,
});

function Assinar() {
  const { plan } = Route.useSearch();
  const { user, ready } = useSessionUser();
  useEffect(() => { if (ready) window.location.href = checkoutUrl(plan, user?.email); }, [ready, plan, user]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center text-foreground">
      <div>
        <div className="font-display text-5xl">Abrindo o <span className="text-ember">pagamento</span></div>
        <p className="mt-3 text-muted-foreground">Você será levado ao checkout seguro da Kiwify. Use o mesmo e-mail da sua conta.</p>
      </div>
    </div>
  );
}
