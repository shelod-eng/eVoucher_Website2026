import { createClient } from '@base44/sdk';

const dataMode = (import.meta.env.VITE_BILLING_DATA_MODE || 'mock').toLowerCase();

function createEntityStub(entityName) {
  return {
    list: async () => {
      console.warn(`[base44 stub] ${entityName}.list() called while VITE_BILLING_DATA_MODE=${dataMode}`);
      return [];
    },
    filter: async () => {
      console.warn(`[base44 stub] ${entityName}.filter() called while VITE_BILLING_DATA_MODE=${dataMode}`);
      return [];
    },
    create: async () => {
      throw new Error(
        `[base44 stub] ${entityName}.create() is disabled. Set VITE_BILLING_DATA_MODE=base44 to enable Base44.`
      );
    },
    update: async () => {
      throw new Error(
        `[base44 stub] ${entityName}.update() is disabled. Set VITE_BILLING_DATA_MODE=base44 to enable Base44.`
      );
    },
  };
}

function createBase44Stub() {
  const entities = new Proxy(
    {},
    {
      get(_target, prop) {
        return createEntityStub(String(prop));
      },
    }
  );

  return {
    entities,
    integrations: {},
    auth: {
      me: async () => {
        throw new Error('[base44 stub] auth.me() disabled in mock mode.');
      },
    },
  };
}

// IMPORTANT:
// Base44 SDK can redirect to `base44.app/login` when `requiresAuth: true`.
// For the billing portal we default to `mock` so the UI runs without Base44 auth.
export const base44 =
  dataMode === 'base44'
    ? createClient({
        appId: '6928c7c5ca78f1ba1eef33ff',
        requiresAuth: true,
      })
    : createBase44Stub();
