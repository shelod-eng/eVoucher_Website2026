import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Billing Engine portal (separate Vite app) — lets website tests cover
      // shared portal modules such as the hardened data-mode resolver.
      '@portal': path.resolve(__dirname, 'billing-engine-portal/src'),
    },
  },
});