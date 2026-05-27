import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function classifyError(err: { message: string }): string {
  const msg = err.message.toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "Wrong email or password.";
  }
  if (
    msg.includes("already registered") ||
    msg.includes("already been registered")
  ) {
    return "An account with this email already exists. Try logging in.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Couldn't connect. Check your internet and try again.";
  }
  if (msg.includes("password") && msg.includes("characters")) {
    return "Password must be at least 6 characters.";
  }
  return err.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: classifyError(error) };
      return { error: null };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: classifyError(error) };
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    setSession(null);
    await supabase.auth.signOut({ scope: "local" });
  }, []);

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
