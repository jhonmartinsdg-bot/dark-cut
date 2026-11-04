import { createHmac, timingSafeEqual } from "node:crypto";
import { interpretKiwify, kiwifyPayloadSchema } from "./kiwify";

/** Verify the provider before loading privileged clients or changing access. */
export async function handleKiwifyWebhook(request: Request): Promise<Response> {
  const token = process.env["KIWIFY_WEBHOOK_TOKEN"];
  if (!token) return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (raw.length > 256_000) return new Response("Payload too large", { status: 413 });
  const sig = new URL(request.url).searchParams.get("signature") ?? "";
  const expected = createHmac("sha1", token).update(raw).digest("hex");
  if (!/^[a-f0-9]{40}$/.test(sig) || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return new Response("Invalid signature", { status: 401 });
  }
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  const parsed = kiwifyPayloadSchema.safeParse(json);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });
  const { email, status, plan } = interpretKiwify(parsed.data);
  if (!status) return new Response("ignored");
  // An approval must never activate an empty or a stale plan.
  if (status === "active" && !plan) return new Response("Unknown plan", { status: 422 });

  try {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    let userId: string | undefined;
    for (let page = 1; !userId; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Account lookup failed");
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 1000) break;
    }
    // A non-2xx response allows Kiwify to retry instead of losing the payment.
    if (!userId) return new Response("Account not available; retry", { status: 503 });
    const update = {
      user_id: userId,
      subscription_status: status,
      updated_at: new Date().toISOString(),
      ...(status === "active" && plan ? { plan } : {}),
    };
    // One atomic upsert; omitted columns preserve the free-video counter.
    const { error } = await db.from("user_access").upsert(update, { onConflict: "user_id" });
    if (error) throw new Error("Access update failed");
    return new Response("ok");
  } catch {
    console.error("Kiwify processing failed; delivery should be retried");
    return new Response("Processing failed; retry", { status: 503 });
  }
}