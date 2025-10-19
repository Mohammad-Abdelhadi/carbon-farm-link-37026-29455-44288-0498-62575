import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type UserRole = "farmer" | "investor" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  accountId?: string;
  privateKey?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, role: UserRole) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  connectWallet: (accountId: string, privateKey: string) => void;
  isWalletConnected: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(async () => {
            const { data: roleData } = await (supabase as any)
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();

            const walletData = JSON.parse(localStorage.getItem(`wallet_${session.user.id}`) || "{}");

            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: (roleData?.role as UserRole) || "farmer",
              accountId: walletData.accountId,
              privateKey: walletData.privateKey,
            });
          }, 0);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setTimeout(async () => {
          const { data: roleData } = await (supabase as any)
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          const walletData = JSON.parse(localStorage.getItem(`wallet_${session.user.id}`) || "{}");

          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: (roleData?.role as UserRole) || "farmer",
            accountId: walletData.accountId,
            privateKey: walletData.privateKey,
          });
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (email: string, password: string, role: UserRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: role
        }
      }
    });

    return { error };
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const connectWallet = (accountId: string, privateKey: string) => {
    if (!user) return;
    
    const updatedUser = { ...user, accountId, privateKey };
    setUser(updatedUser);
    localStorage.setItem(`wallet_${user.id}`, JSON.stringify({ accountId, privateKey }));
  };

  const isWalletConnected = !!(user?.accountId && user?.privateKey);

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, connectWallet, isWalletConnected, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
