// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { handleKiwifyWebhook } from "@/lib/kiwify-webhook";

const mocks = vi.hoisted(() => ({ listUsers: vi.fn(), upsert: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { auth: { admin: { listUsers: mocks.listUsers } }, from: () => ({ upsert: mocks.upsert }) },
}));
const token = "test-only-webhook-token";
const customer = { email: "buyer@example.com" };
const product = { product_name: "DarkCut Agência" };
function request(payload: unknown, valid = true) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  const signature = valid ? createHmac("sha1", token).update(raw).digest("hex") : "0".repeat(40);
  return new Request(`https://dark-cut.lovable.app/api/public/kiwify-webhook?signature=${signature}`, {
    method: "POST", body: raw,
  });
}
beforeEach(() => {
  vi.stubEnv("KIWIFY_WEBHOOK_TOKEN", token);
  mocks.listUsers.mockReset().mockResolvedValue({ data: { users: [{ id: "test-user", email: customer.email }] }, error: null });
  mocks.upsert.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
describe("signed Kiwify callbacks", () => {
  it.each([
    ["order_approved", "paid", "active"],
    ["subscription_renewed", "paid", "active"],
    ["subscription_canceled", "paid", "canceled"],
    ["order_refunded", "refunded", "canceled"],
  ])("processes %s", async (event, orderStatus, status) => {
    const response = await handleKiwifyWebhook(request({ webhook_event_type: event, order_status: orderStatus, Customer: customer, Product: product }));
    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "test-user", subscription_status: status, ...(status === "active" ? { plan: "agencia" } : {}) }), { onConflict: "user_id" });
    expect(mocks.upsert.mock.calls[0][0]).not.toHaveProperty("free_videos_used");
  });
  it("rejects forged signatures before account lookup", async () => {
    expect((await handleKiwifyWebhook(request({ Customer: customer }, false))).status).toBe(401);
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });
  it.each(["{bad", { Customer: { email: "invalid" } }])("rejects malformed input", async (payload) => {
    expect((await handleKiwifyWebhook(request(payload))).status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("rejects approvals without a recognized plan", async () => {
    expect((await handleKiwifyWebhook(request({ Customer: customer, webhook_event_type: "order_approved" }))).status).toBe(422);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("requests retry when the account does not exist yet", async () => {
    mocks.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    expect((await handleKiwifyWebhook(request({ Customer: customer, Product: product, webhook_event_type: "order_approved" }))).status).toBe(503);
  });
  it("requests retry after a database write failure", async () => {
    mocks.upsert.mockResolvedValue({ error: { message: "database unavailable" } });
    expect((await handleKiwifyWebhook(request({ Customer: customer, Product: product, webhook_event_type: "order_approved" }))).status).toBe(503);
  });
  it("requests retry after an account lookup failure", async () => {
    mocks.listUsers.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    expect((await handleKiwifyWebhook(request({ Customer: customer, Product: product, webhook_event_type: "order_approved" }))).status).toBe(503);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("ignores events unrelated to access", async () => {
    expect((await handleKiwifyWebhook(request({ Customer: customer, webhook_event_type: "boleto_created" }))).status).toBe(200);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("prioritizes refund status over an approval event", async () => {
    await handleKiwifyWebhook(request({ Customer: customer, Product: product, webhook_event_type: "order_approved", order_status: "refunded" }));
    expect(mocks.upsert.mock.calls[0][0].subscription_status).toBe("canceled");
  });
});