import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { confirmCheckout } from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/assinatura-sucesso")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => (typeof s["session_id"] === "string" ? { session_id: s["session_id"] } : {}),
  head: () => ({ meta: [{ title: "Assinatura confirmada — DarkCut AI" }, { name: "description", content: "Sua assinatura do DarkCut AI está ativa." }, { property: "og:title", content: "Assinatura confirmada" }, { property: "og:description", content: "Bem-vindo ao DarkCut AI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Sucesso,
});

function Sucesso() {
  const { session_id } = Route.useSearch();
  const confirm = useServerFn(confirmCheckout);
  const [state, setState] = useState<"wait" | "ok" | "fail">("wait");
  useEffect(() => {
    if (!session_id) { setState("fail"); return; }
    confirm({ data: { sessionId: session_id } }).then((r) => setState(r.active ? "ok" : "fail")).catch(() => setState("fail"));
  }, [session_id, confirm]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center text-foreground">
      <div className="max-w-md">
        <div className="font-display text-6xl">{state === "wait" ? "Confirmando..." : state === "ok" ? <>Bem-vindo ao <span className="text-ember">DarkCut!</span></> : "Pagamento não confirmado"}</div>
        <p className="mt-4 text-muted-foreground">{state === "ok" ? "Sua assinatura está ativa. Crie quantos vídeos quiser." : state === "fail" ? "Não encontramos um pagamento concluído. Se você pagou, aguarde um instante e recarregue." : "Estamos verificando seu pagamento."}</p>
        {state !== "wait" && <Link to="/editor" className="mt-8 inline-block rounded-full bg-ember px-8 py-4 font-bold text-primary-foreground shadow-glow">Abrir o editor</Link>}
      </div>
    </div>
  );
}
