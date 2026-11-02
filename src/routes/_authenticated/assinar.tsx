import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { createCheckout } from "@/lib/billing.functions";
import { PLAN_PRICES, type PlanKey } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/assinar")({
  validateSearch: (s: Record<string, unknown>): { plan: PlanKey } => ({
    plan: typeof s["plan"] === "string" && s["plan"] in PLAN_PRICES ? (s["plan"] as PlanKey) : "criador",
  }),
  head: () => ({ meta: [{ title: "Assinar — DarkCut AI" }, { name: "description", content: "Finalize sua assinatura do DarkCut AI." }, { property: "og:title", content: "Assinar DarkCut AI" }, { property: "og:description", content: "Pagamento seguro do seu plano." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Assinar,
});

function Assinar() {
  const { plan } = Route.useSearch();
  const checkout = useServerFn(createCheckout);
  const [err, setErr] = useState("");
  useEffect(() => {
    checkout({ data: { plan } }).then(({ url }) => { window.location.href = url; }).catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, [plan, checkout]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center text-foreground">
      <div>
        <div className="font-display text-5xl">{err ? "Ops..." : <>Abrindo o <span className="text-ember">pagamento</span></>}</div>
        <p className="mt-3 text-muted-foreground">{err || "Você será levado ao checkout seguro da Stripe."}</p>
      </div>
    </div>
  );
}
