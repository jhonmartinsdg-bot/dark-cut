import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { interpretKiwify } from "@/lib/kiwify";

export const Route = createFileRoute("/api/public/kiwify-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["KIWIFY_WEBHOOK_TOKEN"];
        if (!token) return new Response("Not configured", { status: 500 });
        const raw = await request.text();
        const sig = new URL(request.url).searchParams.get("signature") ?? "";
        const expected = createHmac("sha1", token).update(raw).digest("hex");
        if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
          return new Response("Invalid signature", { status: 401 });
        }
        let payload: any;
        try { payload = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
        const { email, status, plan } = interpretKiwify(payload);
        if (!email || !status) return new Response("ignored");

        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        let userId: string | null = null;
        for (let page = 1; page <= 20 && !userId; page++) {
          const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
          if (error || !data.users.length) break;
          userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
          if (data.users.length < 1000) break;
        }
        if (!userId) { console.warn("Kiwify: no account for buyer"); return new Response("no user"); }

        await db.from("user_access").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
        const update: Record<string, string | null> = { subscription_status: status, updated_at: new Date().toISOString() };
        if (status === "active" && plan) update["plan"] = plan;
        await db.from("user_access").update(update).eq("user_id", userId);
        return new Response("ok");
      },
    },
  },
});
