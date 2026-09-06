import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isCloudEnabled } from "./supabase";
import { useStore } from "./store";
import { pull, push, toSyncDoc } from "./cloud";
import type { AppState } from "./types";

interface AuthValue {
  cloudEnabled: boolean;
  session: Session | null;
  email: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isCloudEnabled);
  const lastPushed = useRef<string>("");
  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  // Subscribe to Supabase auth state.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // When a user signs in, merge cloud data down; when they sign out, clear the
  // account marker (local data stays on the device).
  useEffect(() => {
    if (!supabase) return;
    const userId = session?.user.id ?? null;
    const email = session?.user.email ?? null;

    if (!userId) {
      if (stateRef.current.account.userId) {
        dispatch({
          type: "setAccount",
          account: { userId: null, email: null, lastSyncedAt: null },
        });
      }
      return;
    }

    (async () => {
      const { doc, subscription } = await pull(userId);
      const local = stateRef.current;
      if (doc && doc.profiles?.length) {
        // Cloud wins for synced data.
        dispatch({
          type: "hydrate",
          state: {
            ...local,
            onboarded: doc.onboarded,
            profiles: doc.profiles,
            activeProfileId: doc.activeProfileId,
            data: doc.data,
            subscription: subscription ?? local.subscription,
            account: { userId, email, lastSyncedAt: Date.now() },
          },
        });
      } else {
        // First cloud login — seed the cloud with local (guest) data.
        await push(userId, toSyncDoc(local));
        lastPushed.current = JSON.stringify(toSyncDoc(local));
        dispatch({
          type: "hydrate",
          state: {
            ...local,
            subscription: subscription ?? local.subscription,
            account: { userId, email, lastSyncedAt: Date.now() },
          },
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  // Debounced push of synced data whenever it changes while signed in.
  useEffect(() => {
    if (!supabase || !state.account.userId) return;
    const doc = toSyncDoc(state);
    const json = JSON.stringify(doc);
    if (json === lastPushed.current) return;
    const t = setTimeout(async () => {
      const ok = await push(state.account.userId!, doc);
      if (ok) lastPushed.current = json;
    }, 800);
    return () => clearTimeout(t);
  }, [state]);

  const value = useMemo<AuthValue>(
    () => ({
      cloudEnabled: isCloudEnabled,
      session,
      email: session?.user.email ?? null,
      loading,
      async signUp(email, password) {
        if (!supabase) return { error: "Cloud sync isn't configured yet." };
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message };
      },
      async signIn(email, password) {
        if (!supabase) return { error: "Cloud sync isn't configured yet." };
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message };
      },
      async signInWithGoogle() {
        if (!supabase) return { error: "Cloud sync isn't configured yet." };
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        return { error: error?.message };
      },
      async signOut() {
        await supabase?.auth.signOut();
      },
      async syncNow() {
        if (!supabase || !stateRef.current.account.userId) return;
        await push(stateRef.current.account.userId, toSyncDoc(stateRef.current));
        dispatch({
          type: "setAccount",
          account: { ...stateRef.current.account, lastSyncedAt: Date.now() },
        });
      },
    }),
    [session, loading, dispatch],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
