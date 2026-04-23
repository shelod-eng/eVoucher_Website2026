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

export async function createKalapengBillingInvoice(payload, session, role) {
  return portalFetchJson(
    '/api/billing/invoices',
    {
      method: 'POST',
      body: {
        ...payload,
        merchantId: payload?.merchantId || 'm_kalapeng',
        merchantName: payload?.merchantName || 'Kalapeng Pharmacy Group',
        metadata: {
          ...(payload?.metadata || {}),
          integration: 'kalapeng-enterprise',
          source: 'evoucher.co.za',
        },
      },
    },
    session,
    role
  );
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
  const match = disposition.match(/filename="?([^";]+)"?/);
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

// ---------------------------------------------------------------------------
// Billing Engine TRD v2.0 endpoints (/api/billing/*)
// ---------------------------------------------------------------------------

export async function listBillingInvoices(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.merchantId) search.set('merchantId', params.merchantId);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/billing/invoices${suffix}`, {}, session, role);
}

export async function createBillingInvoice(payload, session, role) {
  return portalFetchJson('/api/billing/invoices', { method: 'POST', body: payload }, session, role);
}

export async function getBillingInvoice(id, session, role) {
  return portalFetchJson(`/api/billing/invoices/${id}`, {}, session, role);
}

export async function updateBillingInvoice(id, payload, session, role) {
  return portalFetchJson(
    `/api/billing/invoices/${id}`,
    { method: 'PUT', body: payload },
    session,
    role
  );
}

export async function runBillingEngine(session, role) {
  return portalFetchJson('/api/billing/run-engine', { method: 'POST' }, session, role);
}

export async function listBillingSettlements(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.reconciliationStatus) search.set('reconciliationStatus', params.reconciliationStatus);
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/billing/settlements${suffix}`, {}, session, role);
}

export async function getBillingSettlement(id, session, role) {
  return portalFetchJson(`/api/billing/settlements/${id}`, {}, session, role);
}

export async function reconcileBillingSettlements(session, role) {
  return portalFetchJson('/api/billing/reconcile', { method: 'POST' }, session, role);
}

export async function listBankLinkages(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.merchantId) search.set('merchantId', params.merchantId);
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/billing/bank-linkage${suffix}`, {}, session, role);
}

export async function createBankLinkage(payload, session, role) {
  return portalFetchJson('/api/billing/bank-linkage', { method: 'POST', body: payload }, session, role);
}

export async function validateBankLinkage(linkageId, session, role) {
  return portalFetchJson(
    `/api/billing/bank-linkage/${linkageId}/validate`,
    { method: 'POST' },
    session,
    role
  );
}

export async function updateBankLinkage(linkageId, payload, session, role) {
  return portalFetchJson(
    `/api/billing/bank-linkage/${linkageId}`,
    { method: 'PUT', body: payload },
    session,
    role
  );
}

// ---------------------------------------------------------------------------
// Billing settlement batches (BankServ workflow) - /api/billing/settlement-batches/*
// ---------------------------------------------------------------------------

export async function listBillingSettlementBatches(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.offset) search.set('offset', String(params.offset));
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/billing/settlement-batches${suffix}`, {}, session, role);
}

export async function approveBillingSettlementBatch(batchId, session, role) {
  return portalFetchJson(
    `/api/billing/settlement-batches/${batchId}/approve`,
    { method: 'POST' },
    session,
    role
  );
}

export async function submitBillingSettlementBatch(batchId, session, role) {
  return portalFetchJson(
    `/api/billing/settlement-batches/${batchId}/submit`,
    { method: 'POST' },
    session,
    role
  );
}

export async function confirmBillingSettlementBatch(batchId, session, role) {
  return portalFetchJson(
    `/api/billing/settlement-batches/${batchId}/confirm`,
    { method: 'POST' },
    session,
    role
  );
}

export async function exportBillingSettlementBatchBankServ(batchId, session, role) {
  const response = await fetch(buildUrl(`/api/billing/settlement-batches/${batchId}/export`), {
    method: 'POST',
    headers: portalHeaders(session, role),
  });

  if (!response.ok) {
    const errorMessage = await readError(response);
    throw new Error(errorMessage || `Export failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] || `bankserv-batch-${batchId}.txt`;
  return { blob, filename };
}

export async function getBillingDashboard(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.from) search.set('from', String(params.from));
  if (params.to) search.set('to', String(params.to));
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/billing/dashboard${suffix}`, {}, session, role);
}

export async function getBankServStatus(session, role) {
  return portalFetchJson('/api/billing/bankserv/status', {}, session, role);
}

export async function listBillingEvents(session, role, params = {}) {
  const search = new URLSearchParams();
  if (params.merchantId) search.set('merchantId', params.merchantId);
  if (params.limit) search.set('limit', String(params.limit));
  const suffix = search.toString() ? `?${search}` : '';
  return portalFetchJson(`/api/billing/events${suffix}`, {}, session, role);
}

export async function listPortalMerchants(params = {}) {
  const search = new URLSearchParams();
  if (params.merchantId) search.set('merchant_id', params.merchantId);
  const suffix = search.toString() ? `?${search}` : '';
  const response = await fetch(buildUrl(`/api/merchants${suffix}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorMessage = await readError(response);
    throw new Error(errorMessage || `Request failed (${response.status})`);
  }

  return response.json();
}

function sandboxHeaders() {
  const apiKey = import.meta.env.VITE_SANDBOX_API_KEY || import.meta.env.VITE_ADMIN_PASSCODE;
  if (!apiKey) {
    throw new Error('Missing VITE_SANDBOX_API_KEY (or fallback VITE_ADMIN_PASSCODE) for sandbox gateway access.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

async function sandboxFetchJson(path, options) {
  const response = await fetch(buildUrl(path), {
    method: options?.method || 'GET',
    headers: {
      ...sandboxHeaders(),
      ...(options?.headers || {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorMessage = await readError(response);
    throw new Error(errorMessage || `Sandbox request failed (${response.status})`);
  }

  return response.json();
}

export async function runBillingSimulation(payload, session, role) {
  return portalFetchJson('/api/billing/simulator', { method: 'POST', body: payload }, session, role);
}

export async function initiateSandboxPurchase(payload) {
  return sandboxFetchJson('/api/v1/sandbox/payments/initiate', { method: 'POST', body: payload });
}

export async function authorizeSandboxPayment(payload) {
  return sandboxFetchJson('/api/v1/sandbox/payments/authorize', { method: 'POST', body: payload });
}

export async function getSandboxPaymentStatus(ref) {
  return sandboxFetchJson(`/api/v1/sandbox/payments/${encodeURIComponent(ref)}/status`, {});
}

export async function initiateSandboxTopup(payload) {
  return sandboxFetchJson('/api/v1/sandbox/topup/initiate', { method: 'POST', body: payload });
}

export async function addSandboxVoucher(payload) {
  return sandboxFetchJson('/api/v1/sandbox/voucher/add', { method: 'POST', body: payload });
}

export async function submitSandboxSettlement(payload = {}) {
  return sandboxFetchJson('/api/v1/sandbox/settlements/submit', { method: 'POST', body: payload });
}

export async function getSandboxSettlement(batchId) {
  return sandboxFetchJson(`/api/v1/sandbox/settlements/${encodeURIComponent(batchId)}`, {});
}

export async function refundSandboxPayment(ref, payload = {}) {
  return sandboxFetchJson(`/api/v1/sandbox/refunds/${encodeURIComponent(ref)}`, {
    method: 'POST',
    body: payload,
  });
}
