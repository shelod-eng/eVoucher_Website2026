import { createBrowserClient } from '@supabase/ssr';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function resolveSessionStorage(): StorageLike {
  if (typeof window === 'undefined') {
    return createMemoryStorage();
  }

  try {
    const storage = window.sessionStorage;
    const probeKey = '__evoucher_supabase_session_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return createMemoryStorage();
  }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Keep sessions for the current browser session only.
        // This prevents a shared device from reopening into the previous
        // user's account after the browser has been closed.
        persistSession: true,
        autoRefreshToken: true,
        storage: resolveSessionStorage(),
      },
    }
  );
}
