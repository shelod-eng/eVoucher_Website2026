const API_BASE = (import.meta.env.VITE_PORTAL_API_BASE_URL || '').replace(/\/$/, '');

function buildUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function portalHeaders(session, role) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (session?.email) {
    headers['X-Portal-User'] = session.email;
  }
  if (role) {
    headers['X-Portal-Role'] = role;
  }

  const passcode = import.meta.env.VITE_ADMIN_PASSCODE;
  if (passcode) {
    headers['X-Portal-Passcode'] = passcode;
  }

  return headers;
}

async function readError(response) {
  try {
    const data = await response.json();
    return data?.error || data?.message;
  } catch {
    return null;
  }
}

async function portalFetchJson(path, options, session, role) {
  const response = await fetch(buildUrl(path), {
    method: options?.method || 'GET',
    headers: {
      ...portalHeaders(session, role),
      ...(options?.headers || {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorMessage = await readError(response);
    throw new Error(errorMessage || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function listSettlementBatches(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.offset) search.set('offset', String(params.offset));
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/v1/admin/settlements/batches${suffix}`, {}, session, role);
}

export async function getSettlementBatch(batchId, session, role) {
  return portalFetchJson(`/api/v1/admin/settlements/batches/${batchId}`, {}, session, role);
}

export async function createSettlementBatch(payload, session, role) {
  return portalFetchJson(
    '/api/v1/admin/settlements/batches',
    { method: 'POST', body: payload },
    session,
    role
  );
}

export async function approveSettlementBatch(batchId, session, role) {
  return portalFetchJson(
    `/api/v1/admin/settlements/batches/${batchId}/approve`,
    { method: 'POST' },
    session,
    role
  );
}

export async function submitSettlementBatch(batchId, session, role) {
  return portalFetchJson(
    `/api/v1/admin/settlements/batches/${batchId}/submit`,
    { method: 'POST' },
    session,
    role
  );
}

export async function confirmSettlementBatch(batchId, session, role) {
  return portalFetchJson(
    `/api/v1/admin/settlements/batches/${batchId}/confirm`,
    { method: 'POST' },
    session,
    role
  );
}

export async function exportSettlementBatchCsv(batchId, session, role) {
  const response = await fetch(buildUrl(`/api/v1/admin/settlements/batches/${batchId}/export`), {
    method: 'POST',
    headers: portalHeaders(session, role),
  });

  if (!response.ok) {
    const errorMessage = await readError(response);
    throw new Error(errorMessage || `Export failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename=\"?([^\";]+)\"?/);
  const filename = match?.[1] || `settlement-batch-${batchId}.csv`;

  return { blob, filename };
}

export async function listAuditEvents(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.entityType) search.set('entityType', params.entityType);
  if (params.entityId) search.set('entityId', params.entityId);
  if (params.limit) search.set('limit', String(params.limit));
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/v1/admin/audit-events${suffix}`, {}, session, role);
}

export async function provisionPortalUser(payload, session, role) {
  return portalFetchJson('/api/v1/admin/portal-users', { method: 'POST', body: payload }, session, role);
}

