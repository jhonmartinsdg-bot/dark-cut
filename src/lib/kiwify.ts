import type { PlanKey } from "./plans";
import { z } from "zod";

export const kiwifyPayloadSchema = z.object({
  webhook_event_type: z.string().max(100).optional(),
  order_status: z.string().max(100).optional(),
  Customer: z.object({ email: z.string().trim().email().max(254) }),
  Product: z.object({ product_name: z.string().max(500).optional() }).optional(),
  Subscription: z.object({
    plan: z.object({ name: z.string().max(500).optional() }).nullish(),
  }).nullish(),
});

const ACTIVE_EVENTS = ["order_approved", "subscription_renewed"];
const INACTIVE_EVENTS = ["order_refunded", "chargeback", "subscription_canceled", "subscription_late"];

/** Decide what a Kiwify webhook means for the buyer's access. */
export function interpretKiwify(p: z.infer<typeof kiwifyPayloadSchema>): { email: string; status: "active" | "canceled" | null; plan: PlanKey | null } {
  const email = String(p?.Customer?.email ?? "").trim().toLowerCase();
  const event = String(p?.webhook_event_type ?? "");
  const orderStatus = String(p?.order_status ?? "");
  let status: "active" | "canceled" | null = null;
  if (["refunded", "chargedback"].includes(orderStatus) || INACTIVE_EVENTS.includes(event)) status = "canceled";
  else if (ACTIVE_EVENTS.includes(event) || (!event && orderStatus === "paid")) status = "active";
  const name = `${p?.Product?.product_name ?? ""} ${p?.Subscription?.plan?.name ?? ""}`
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const plan: PlanKey | null = name.includes("agencia") ? "agencia" : name.includes("criador") ? "criador" : name.includes("iniciante") ? "iniciante" : null;
  return { email, status, plan };
}
