import { describe, expect, it } from "vitest";
import { oauthReturnUrl, safeAuthDestination, validNewPassword } from "@/lib/auth-policy";

describe("simple password policy", () => {
  it("accepts eight lowercase characters without numbers or symbols", () => {
    expect(validNewPassword("abcdefgh")).toBe(true);
    expect(validNewPassword("abcdefg")).toBe(false);
  });
  it("does not restrict existing or new longer passwords", () => {
    expect(validNewPassword("abcdefghijklmno")).toBe(true);
  });
});
describe("Google return destination", () => {
  it("returns to a public same-origin auth page", () => {
    expect(oauthReturnUrl("https://dark-cut.lovable.app")).toBe("https://dark-cut.lovable.app/auth");
  });
  it("preserves a plan selection after sign-in", () => {
    expect(safeAuthDestination("/assinar?plan=criador")).toBe("/assinar?plan=criador");
  });
  it.each(["//evil.example", "/\\evil.example", "https://evil.example"])("rejects an external destination %s", (url) => {
    expect(safeAuthDestination(url)).toBe("/editor");
  });
});