import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_PRICES, type PlanKey } from "./plans";

const ACTIVE = ["active", "trialing"];

async function stripe(path: string, init?: { method?: string; body?: Record<string, string> }) {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Pagamentos indisponíveis no momento.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: init?.body ? new URLSearchParams(init.body).toString() : null,
  });
  const json = (await res.json()) as any;
  if (!res.ok) {
    console.error("Stripe error", json?.error?.message);
    throw new Error("Não foi possível falar com o sistema de pagamento.");
  }
  return json;
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function loadRow(userId: string) {
  const db = await admin();
  await db.from("user_access").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data } = await db.from("user_access").select("*").eq("user_id", userId).single();
  return data!;
}

export const getAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    let row = await loadRow(context.userId);
    if (row.stripe_subscription_id) {
      try {
        const sub = await stripe(`subscriptions/${row.stripe_subscription_id}`);
        if (sub.status !== row.subscription_status) {
          await db.from("user_access").update({ subscription_status: sub.status, updated_at: new Date().toISOString() }).eq("user_id", context.userId);
          row = { ...row, subscription_status: sub.status };
        }
      } catch { /* keep stored status */ }
    }
    const active = !!row.subscription_status && ACTIVE.includes(row.subscription_status);
    return { plan: active ? row.plan : null, active, freeLeft: Math.max(0, 1 - row.free_videos_used) };
  });

export const startExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const row = await loadRow(context.userId);
    if (row.subscription_status && ACTIVE.includes(row.subscription_status)) return { ok: true, wasFree: false };
    const db = await admin();
    const { data } = await db.from("user_access").update({ free_videos_used: 1, updated_at: new Date().toISOString() })
      .eq("user_id", context.userId).eq("free_videos_used", 0).select("user_id");
    return { ok: !!data?.length, wasFree: true };
  });

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { plan: string }) => {
    if (!(d.plan in PLAN_PRICES)) throw new Error("Plano inválido");
    return { plan: d.plan as PlanKey };
  })
  .handler(async ({ data, context }) => {
    const row = await loadRow(context.userId);
    const req = getRequest();
    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const body: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": PLAN_PRICES[data.plan],
      "line_items[0][quantity]": "1",
      client_reference_id: context.userId,
      "metadata[user_id]": context.userId,
      "metadata[plan]": data.plan,
      "subscription_data[metadata][user_id]": context.userId,
      success_url: `${origin}/assinatura-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#planos`,
      allow_promotion_codes: "true",
    };
    if (row.stripe_customer_id) body["customer"] = row.stripe_customer_id;
    else if (typeof context.claims.email === "string") body["customer_email"] = context.claims.email;
    const s = await stripe("checkout/sessions", { method: "POST", body });
    return { url: s.url as string };
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => {
    if (!/^cs_[A-Za-z0-9_]+$/.test(d.sessionId)) throw new Error("Sessão inválida");
    return d;
  })
  .handler(async ({ data, context }) => {
    const s = await stripe(`checkout/sessions/${data.sessionId}?expand[]=subscription`);
    if (s.client_reference_id !== context.userId) throw new Error("Esta compra não pertence à sua conta.");
    const sub = s.subscription as any;
    if (s.status !== "complete" || !sub) return { active: false, plan: null };
    await loadRow(context.userId);
    const db = await admin();
    await db.from("user_access").update({
      plan: s.metadata?.plan ?? null,
      subscription_status: sub.status,
      stripe_customer_id: s.customer,
      stripe_subscription_id: sub.id,
      updated_at: new Date().toISOString(),
    }).eq("user_id", context.userId);
    return { active: ACTIVE.includes(sub.status), plan: (s.metadata?.plan ?? null) as string | null };
  });
