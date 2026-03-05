'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const resolveUserRole = async (currentUser: User | null): Promise<string | null> => {
    if (!currentUser) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('AuthContext: failed to resolve role from profile:', error.message);
      } else if (data?.role) {
        return String(data.role).toLowerCase();
      }
    } catch (roleError) {
      console.warn('AuthContext: unexpected role lookup error:', roleError);
    }

    const metadataRole = String(currentUser.user_metadata?.role ?? '')
      .toLowerCase()
      .trim();
    return metadataRole || null;
  };

  useEffect(() => {
    let isMounted = true;

    const applySessionState = async (session: Session | null) => {
      if (!isMounted) return;
      const sessionUser = session?.user ?? null;
      let resolvedUser = sessionUser;

      if (sessionUser) {
        try {
          const {
            data: { user: latestUser },
            error: latestUserError,
          } = await supabase.auth.getUser();
          if (!latestUserError && latestUser) {
            resolvedUser = latestUser;
          }
        } catch (latestUserLookupError) {
          console.warn('AuthContext: failed to fetch latest auth user:', latestUserLookupError);
        }
      }

      setUser(resolvedUser);
      const resolvedRole = await resolveUserRole(resolvedUser);
      if (!isMounted) return;
      setRole(resolvedRole);
      setLoading(false);
    };

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await applySessionState(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      await applySessionState(session);
    });

    void bootstrap();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting signIn...');
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '').trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    
    if (error) {
      console.error('AuthContext: signIn error:', error);
      throw error;
    }
    
    console.log('AuthContext: signIn successful:', data.user?.id);
    const resolvedRole = await resolveUserRole(data.user ?? null);
    setRole(resolvedRole);
    return data.user ?? null;
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('AuthContext: Attempting signUp...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    
    if (error) {
      console.error('AuthContext: signUp error:', error);
      throw error;
    }
    
    console.log('AuthContext: signUp successful:', data.user?.id);
    const resolvedRole = await resolveUserRole(data.user ?? null);
    setRole(resolvedRole);
    if (error) throw error;
  };

  const signOut = async () => {
    // Optimistic local clear so role-switch login feels immediate.
    setUser(null);
    setRole(null);
    setLoading(false);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('AuthContext: signOut warning:', error.message);
      const fallback = await supabase.auth.signOut({ scope: 'local' });
      if (fallback.error) {
        console.warn('AuthContext: local signOut fallback warning:', fallback.error.message);
      }
    }

  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
