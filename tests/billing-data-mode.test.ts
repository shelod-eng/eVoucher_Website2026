import { describe, expect, it } from 'vitest';
// @ts-expect-error — portal module is plain JS (allowJs enabled for vitest).
import { resolveDataMode } from '@portal/api/data-mode.js';

describe('resolveDataMode — production env-config hardening', () => {
  it('defaults to portal mode when the env var is missing or empty', () => {
    expect(resolveDataMode({}).mode).toBe('portal');
    expect(resolveDataMode({ VITE_BILLING_DATA_MODE: '' }).mode).toBe('portal');
    expect(resolveDataMode({ VITE_BILLING_DATA_MODE: '   ' }).mode).toBe('portal');
  });

  it('tolerates the exact production failure: trailing whitespace ("portal ")', () => {
    // ROOT CAUSE REGRESSION TEST: the deployed Vercel env var was "portal "
    // which previously disabled every live-data query in the portal.
    const resolved = resolveDataMode({ VITE_BILLING_DATA_MODE: 'portal ' });
    expect(resolved.mode).toBe('portal');
    expect(resolved.usePortalApi).toBe(true);
    expect(resolved.useMock).toBe(false);
    expect(resolved.isValid).toBe(true);
    expect(resolved.invalidReason).toBeNull();
  });

  it('strips surrounding quotes and handles casing', () => {
    expect(resolveDataMode({ VITE_BILLING_DATA_MODE: '"portal"' }).mode).toBe('portal');
    expect(resolveDataMode({ VITE_BILLING_DATA_MODE: "'PORTAL'" }).mode).toBe('portal');
  });

  it('keeps explicit mock mode available for controlled local development', () => {
    const resolved = resolveDataMode({ VITE_BILLING_DATA_MODE: 'mock' });
    expect(resolved.mode).toBe('mock');
    expect(resolved.useMock).toBe(true);
    expect(resolved.usePortalApi).toBe(false);
    expect(resolved.isValid).toBe(true);
  });

  it('mock mode does not leak into portal mode and vice versa', () => {
    const portal = resolveDataMode({ VITE_BILLING_DATA_MODE: 'portal' });
    const mock = resolveDataMode({ VITE_BILLING_DATA_MODE: 'mock' });
    expect(portal.useMock).toBe(false);
    expect(mock.usePortalApi).toBe(false);
  });

  it('reports an explicit error for genuinely invalid modes', () => {
    const resolved = resolveDataMode({ VITE_BILLING_DATA_MODE: 'bogus' });
    expect(resolved.isValid).toBe(false);
    expect(resolved.invalidReason).toContain('bogus');
  });
});