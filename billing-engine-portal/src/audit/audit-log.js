const STORAGE_KEY = 'evoucher_billing_audit_log_v1';
const MAX_EVENTS = 500;

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function listAuditEvents() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function appendAuditEvent(event) {
  if (typeof window === 'undefined') return;
  const next = [event, ...listAuditEvents()].slice(0, MAX_EVENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function logAuditEvent(action, details = {}) {
  appendAuditEvent({
    id: `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    action,
    details,
    createdAt: new Date().toISOString(),
  });
}

