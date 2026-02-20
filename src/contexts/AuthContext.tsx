'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        const resolvedRole = await resolveUserRole(session?.user ?? null);
        setRole(resolvedRole);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting signIn...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('AuthContext: signIn error:', error);
      throw error;
    }
    
    console.log('AuthContext: signIn successful:', data.user?.id);
    const resolvedRole = await resolveUserRole(data.user ?? null);
    setRole(resolvedRole);
    router.refresh();
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setRole(null);
    router.refresh();
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
