import type { PlanKey } from "./plans";

const ACTIVE_EVENTS = ["order_approved", "subscription_renewed"];
const INACTIVE_EVENTS = ["order_refunded", "chargeback", "subscription_canceled", "subscription_late"];

/** Decide what a Kiwify webhook means for the buyer's access. */
export function interpretKiwify(p: any): { email: string; status: "active" | "canceled" | null; plan: PlanKey | null } {
  const email = String(p?.Customer?.email ?? "").trim().toLowerCase();
  const event = String(p?.webhook_event_type ?? "");
  const orderStatus = String(p?.order_status ?? "");
  let status: "active" | "canceled" | null = null;
  if (ACTIVE_EVENTS.includes(event) || (!event && orderStatus === "paid")) status = "active";
  else if (INACTIVE_EVENTS.includes(event) || ["refunded", "chargedback"].includes(orderStatus)) status = "canceled";
  const name = `${p?.Product?.product_name ?? ""} ${p?.Subscription?.plan?.name ?? ""}`
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const plan: PlanKey | null = name.includes("agencia") ? "agencia" : name.includes("criador") ? "criador" : name.includes("iniciante") ? "iniciante" : null;
  return { email, status, plan };
}
