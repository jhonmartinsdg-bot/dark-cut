import { describe, it, expect } from "vitest";
import { interpretKiwify } from "@/lib/kiwify";
describe("kiwify webhook", () => {
  it("approved order activates the matching plan", () => {
    expect(interpretKiwify({ webhook_event_type: "order_approved", Customer: { email: "A@B.com" }, Product: { product_name: "DarkCut Agência" } }))
      .toEqual({ email: "a@b.com", status: "active", plan: "agencia" });
  });
  it("cancellation removes access", () => {
    expect(interpretKiwify({ webhook_event_type: "subscription_canceled", Customer: { email: "a@b.com" } }).status).toBe("canceled");
  });
});
