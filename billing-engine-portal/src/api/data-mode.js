/**
 * Hardened VITE_BILLING_DATA_MODE resolver.
 *
 * ROOT CAUSE FIXED HERE (forensic evidence 2026-08-23):
 *   The Vercel project env var was set to "portal " (trailing space). The old
 *   inline parse `(import.meta.env.VITE_BILLING_DATA_MODE || 'portal').toLowerCase()`
 *   produced 'portal ' which matched neither 'portal' nor 'mock', so every
 *   live-data query was disabled (enabled: usePortalApi && ...) and the portal
 *   could never display real website transactions.
 *
 * This resolver is defensive against the exact failure modes observed in
 * production configuration paths:
 *   - surrounding whitespace ("portal ")
 *   - surrounding quotes ("portal" / 'portal')
 *   - mixed case ("PORTAL")
 *   - empty / undefined value (defaults to portal — production-safe default)
 *
 * Explicit 'mock' remains supported for controlled local development only.
 */

function cleanRawValue(rawValue) {
  return String(rawValue ?? '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim()
    .toLowerCase();
}

export function resolveDataMode(env = import.meta.env) {
  const rawValue = env?.VITE_BILLING_DATA_MODE;
  const cleaned = cleanRawValue(rawValue);
  // Empty/missing → production-safe default: portal (real website billing APIs).
  const mode = cleaned || 'portal';

  return {
    mode,
    rawValue: rawValue ?? '',
    usePortalApi: mode === 'portal',
    useMock: mode === 'mock',
    isValid: mode === 'portal' || mode === 'mock',
    invalidReason:
      mode === 'portal' || mode === 'mock'
        ? null
        : `Invalid VITE_BILLING_DATA_MODE="${mode}". Expected "portal" (or "mock" for local dev).`,
  };
}

// Pre-resolved singleton for components that just need the flags.
const resolved = resolveDataMode();
export const dataMode = resolved.mode;
export const usePortalApi = resolved.usePortalApi;
export const useMock = resolved.useMock;
export default resolveDataMode;