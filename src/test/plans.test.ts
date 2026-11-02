import { describe, it, expect } from "vitest";
import { PLAN_PRICES, PLANS } from "@/lib/plans";
describe("plans", () => {
  it("maps each plan to its Stripe price", () => {
    expect(PLAN_PRICES.iniciante).toBe("price_1UXNr42eVubo4B6iL3QgC18m");
    expect(PLAN_PRICES.criador).toBe("price_1UXNu52eVubo4B6ix8Arw6tV");
    expect(PLAN_PRICES.agencia).toBe("price_1UXNvh2eVubo4B6ieGcoxKln");
  });
  it("keeps the advertised monthly prices", () => {
    expect(PLANS.map((p) => p.p)).toEqual(["47", "97", "247"]);
  });
});
