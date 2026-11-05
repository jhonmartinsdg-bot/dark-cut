import { supabase } from "@/integrations/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import { validNewPassword } from "@/lib/auth-policy";

export async function verifiedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Sessão inválida. Entre novamente.");
  return data.user;
}

export async function signupAndAuthenticate(email: string, password: string, origin: string) {
  if (!validNewPassword(password)) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  const credentials = { email: email.trim(), password };
  const { data, error } = await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${origin}/auth` } });
  if (error) throw error;
  if (!data.session) {
    const { error: loginError } = await supabase.auth.signInWithPassword(credentials);
    if (loginError) throw loginError;
  }
  return verifiedUser();
}

export async function signOutAndClear(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}