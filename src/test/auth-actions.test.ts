import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
const auth = vi.hoisted(() => ({ signUp: vi.fn(), signInWithPassword: vi.fn(), getUser: vi.fn(), signOut: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { signupAndAuthenticate, signOutAndClear, verifiedUser } from "@/lib/auth-actions";

beforeEach(() => { vi.resetAllMocks(); });
describe("real authenticated signup", () => {
  it("accepts eight simple characters and verifies the returned authenticated user", async () => {
    auth.signUp.mockResolvedValue({ data: { session: { user: { id: "new-user" } } }, error: null });
    auth.getUser.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
    expect(await signupAndAuthenticate(" user@mail.com ", "abcdefgh", "https://dark-cut.lovable.app")).toEqual({ id: "new-user" });
    expect(auth.signUp).toHaveBeenCalledWith({ email: "user@mail.com", password: "abcdefgh", options: { emailRedirectTo: "https://dark-cut.lovable.app/auth" } });
    expect(auth.getUser).toHaveBeenCalledOnce();
  });
  it("never fabricates a session when hosted confirmation is still enabled", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    auth.signInWithPassword.mockResolvedValue({ error: new Error("Email not confirmed") });
    await expect(signupAndAuthenticate("user@mail.com", "abcdefgh", "https://dark-cut.lovable.app")).rejects.toThrow("Email not confirmed");
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it("rejects unverified accounts even when signup returned a session", async () => {
    auth.signUp.mockResolvedValue({ data: { session: {} }, error: null });
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Invalid token") });
    await expect(signupAndAuthenticate("user@mail.com", "abcdefgh", "https://dark-cut.lovable.app")).rejects.toThrow("Invalid token");
  });
  it("does not accept seven characters", async () => {
    await expect(signupAndAuthenticate("user@mail.com", "abcdefg", "https://dark-cut.lovable.app")).rejects.toThrow("8 caracteres");
    expect(auth.signUp).not.toHaveBeenCalled();
  });
});
describe("session protection", () => {
  it("rejects access with no verified user", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(verifiedUser()).rejects.toThrow("Sessão inválida");
  });
  it("cancels and clears private cache before signing out", async () => {
    const client = new QueryClient();
    client.setQueryData(["private"], { id: "secret-data" });
    const cancel = vi.spyOn(client, "cancelQueries");
    const clear = vi.spyOn(client, "clear");
    auth.signOut.mockImplementation(async () => {
      expect(client.getQueryData(["private"])).toBeUndefined();
      return { error: null };
    });
    await signOutAndClear(client);
    const cancelOrder = cancel.mock.invocationCallOrder[0];
    const clearOrder = clear.mock.invocationCallOrder[0];
    const signOutOrder = auth.signOut.mock.invocationCallOrder[0];
    if (cancelOrder === undefined || clearOrder === undefined || signOutOrder === undefined) throw new Error("Missing sign-out step");
    expect(cancelOrder).toBeLessThan(clearOrder);
    expect(clearOrder).toBeLessThan(signOutOrder);
  });
});