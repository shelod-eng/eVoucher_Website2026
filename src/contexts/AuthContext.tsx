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

function isRetryableAuthFetchError(error: any) {
  const name = String(error?.name ?? '');
  const message = String(error?.message ?? '').toLowerCase();
  const causeCode = String(error?.cause?.code ?? '');
  return (
    name === 'AuthRetryableFetchError' ||
    message.includes('fetch failed') ||
    causeCode === 'UND_ERR_CONNECT_TIMEOUT'
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const clearLocalAuthArtifacts = () => {
    if (typeof window === 'undefined') return;
    try {
      const shouldClearKey = (key: string) =>
        key.includes('auth-token') || (key.startsWith('sb-') && key.includes('-auth-token'));

      Object.keys(window.localStorage)
        .filter(shouldClearKey)
        .forEach((key) => window.localStorage.removeItem(key));

      Object.keys(window.sessionStorage)
        .filter(shouldClearKey)
        .forEach((key) => window.sessionStorage.removeItem(key));

      // Best-effort cleanup of non-HttpOnly auth cookies in case stale tokens linger.
      const cookieNames = document.cookie
        .split(';')
        .map((entry) => entry.split('=')[0]?.trim())
        .filter((name) => Boolean(name))
        .filter((name) => name.startsWith('sb-') || name.includes('auth-token'));
      cookieNames.forEach((name) => {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      });
    } catch (storageError) {
      console.warn('AuthContext: failed to clear local auth artifacts:', storageError);
    }
  };

  const clearServerSession = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });
    } catch (logoutError) {
      console.warn('AuthContext: server logout warning:', logoutError);
    } finally {
      clearTimeout(timer);
    }
  };

  const bestEffortLocalSignOut = async () => {
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch (signOutError) {
      console.warn('AuthContext: local signOut warning:', signOutError);
    }
  };

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
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        try {
          await applySessionState(session);
        } catch (authStateError) {
          console.warn('AuthContext: auth state change warning:', authStateError);
          if (isMounted) {
            setUser(session?.user ?? null);
            setRole(String(session?.user?.user_metadata?.role ?? '').toLowerCase() || null);
            setLoading(false);
          }
        }
      }
    );

    void bootstrap().catch((bootstrapError) => {
      console.warn('AuthContext: bootstrap warning:', bootstrapError);
      if (isMounted) {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting signIn...');
    const normalizedEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    const normalizedPassword = String(password ?? '').trim();

    // Clear only the current browser session before a role/account switch.
    // Do not revoke global sessions so other devices/users remain signed in.
    try {
      await bestEffortLocalSignOut();
      await clearServerSession();
      clearLocalAuthArtifacts();
    } catch (preSignInClearError) {
      console.warn('AuthContext: pre-signin session clear warning:', preSignInClearError);
    }

    try {
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
    } catch (error: any) {
      if (!isRetryableAuthFetchError(error)) {
        throw error;
      }

      console.warn('AuthContext: retryable browser auth failure, falling back to server login.');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error || 'Unable to contact the authentication service. Please try again.'
        );
      }

      const accessToken = String(payload?.accessToken ?? '');
      const refreshToken = String(payload?.refreshToken ?? '');
      if (!accessToken || !refreshToken) {
        throw new Error('Authentication fallback did not return a valid session.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        throw sessionError;
      }

      const signedInUser = sessionData?.user ?? null;
      const resolvedRole =
        String(payload?.user?.role ?? '')
          .toLowerCase()
          .trim() || (await resolveUserRole(signedInUser));
      setUser(signedInUser);
      setRole(resolvedRole || null);
      setLoading(false);
      return signedInUser;
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('AuthContext: Attempting signUp...');
    const normalizedMetadata = {
      ...metadata,
      role: metadata?.role ?? 'customer',
      acquisition_channel: metadata?.acquisition_channel ?? 'web',
      primary_access_channel:
        metadata?.primary_access_channel ?? metadata?.acquisition_channel ?? 'web',
      consumer_segment: metadata?.consumer_segment ?? 'unknown',
      popia_consent_at:
        metadata?.popia_consent_at ??
        (metadata?.popia_consent === false ? null : new Date().toISOString()),
      marketing_consent: Boolean(metadata?.marketing_consent ?? false),
    };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: normalizedMetadata },
    });

    if (error) {
      console.error('AuthContext: signUp error:', error);
      throw error;
    }

    console.log('AuthContext: signUp successful:', data.user?.id);
    if (data.user?.id) {
      try {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          email,
          full_name: String(
            normalizedMetadata.full_name ??
              normalizedMetadata.name ??
              data.user.user_metadata?.full_name ??
              email.split('@')[0]
          ),
          phone: String(normalizedMetadata.phone ?? ''),
          role: normalizedMetadata.role,
          acquisition_channel: normalizedMetadata.acquisition_channel,
          primary_access_channel: normalizedMetadata.primary_access_channel,
          consumer_segment: normalizedMetadata.consumer_segment,
          popia_consent_at: normalizedMetadata.popia_consent_at,
          popia_consent_version: normalizedMetadata.popia_consent_version ?? 'May2026',
          marketing_consent: normalizedMetadata.marketing_consent,
        });
      } catch (profileSyncError) {
        console.warn('AuthContext: profile sync warning:', profileSyncError);
      }
    }
    const resolvedRole = await resolveUserRole(data.user ?? null);
    setRole(resolvedRole);
    if (error) throw error;
  };

  const signOut = async () => {
    // Optimistic local clear so role-switch login feels immediate.
    setUser(null);
    setRole(null);
    setLoading(false);

    await bestEffortLocalSignOut();
    await clearServerSession();
    clearLocalAuthArtifacts();
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
