import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

const SessionContext = createContext<{ user: User | null; ready: boolean; recovery: boolean }>({ user: null, ready: false, recovery: false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    let revision = 0;
    setRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
    const refresh = async () => {
      const current = ++revision;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (mounted && current === revision) { setUser(error ? null : data.user); setReady(true); }
      } catch {
        if (mounted && current === revision) { setUser(null); setReady(true); }
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        revision++; setUser(null); setReady(true); setRecovery(false);
        void router.invalidate();
        return;
      }
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (!["INITIAL_SESSION", "SIGNED_IN", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)) return;
      // Auth callbacks must return before calling another Auth method.
      queueMicrotask(() => {
        if (!mounted) return;
        void refresh().then(() => {
          if (!mounted || event === "INITIAL_SESSION") return;
          void router.invalidate();
          void queryClient.invalidateQueries();
        });
      });
    });
    void refresh();
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [queryClient, router]);
  return createElement(SessionContext.Provider, { value: { user, ready, recovery } }, children);
}

export function useSessionUser() { return useContext(SessionContext); }
