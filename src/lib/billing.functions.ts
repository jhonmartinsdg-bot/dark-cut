import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ACTIVE = ["active", "trialing"];

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
    const row = await loadRow(context.userId);
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
