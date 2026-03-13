const STORAGE_KEY = 'evoucher_billing_mock_settlement_batches_v1';

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeAll(batches) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
}

export function listBatches() {
  return readAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function createBatch({ createdByEmail, settlements }) {
  const totalAmount = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);
  const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Date.now()
    .toString()
    .slice(-4)}`;

  const batch = {
    id: `batch_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    batchNumber,
    status: 'pending_approval',
    createdByEmail,
    createdAt: new Date().toISOString(),
    merchantCount: settlements.length,
    totalAmount,
    settlements,
  };

  const next = [batch, ...readAll()];
  writeAll(next);
  return batch;
}

export function approveBatch({ batchId, approvedByEmail }) {
  const batches = readAll();
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx === -1) throw new Error('Batch not found.');

  const batch = batches[idx];
  if (batch.status !== 'pending_approval') throw new Error('Batch is not awaiting approval.');
  if ((batch.createdByEmail || '').toLowerCase() === (approvedByEmail || '').toLowerCase()) {
    throw new Error('2-person control: approver must be different from creator.');
  }

  const updated = {
    ...batch,
    status: 'approved',
    approvedByEmail,
    approvedAt: new Date().toISOString(),
  };

  batches[idx] = updated;
  writeAll(batches);
  return updated;
}

export function markExported({ batchId, exportedByEmail }) {
  const batches = readAll();
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx === -1) throw new Error('Batch not found.');
  const batch = batches[idx];
  if (batch.status !== 'approved' && batch.status !== 'exported') {
    throw new Error('Batch must be approved before export.');
  }
  const updated = {
    ...batch,
    status: 'exported',
    exportedByEmail,
    exportedAt: new Date().toISOString(),
  };
  batches[idx] = updated;
  writeAll(batches);
  return updated;
}

export function markSubmitted({ batchId, submittedByEmail }) {
  const batches = readAll();
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx === -1) throw new Error('Batch not found.');
  const batch = batches[idx];
  if (batch.status !== 'exported') throw new Error('Batch must be exported before submission.');
  const updated = {
    ...batch,
    status: 'submitted_to_bank',
    submittedByEmail,
    submittedAt: new Date().toISOString(),
  };
  batches[idx] = updated;
  writeAll(batches);
  return updated;
}

export function markConfirmed({ batchId, confirmedByEmail }) {
  const batches = readAll();
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx === -1) throw new Error('Batch not found.');
  const batch = batches[idx];
  if (batch.status !== 'submitted_to_bank') throw new Error('Batch must be submitted before confirmation.');
  const updated = {
    ...batch,
    status: 'confirmed',
    confirmedByEmail,
    confirmedAt: new Date().toISOString(),
  };
  batches[idx] = updated;
  writeAll(batches);
  return updated;
}

export function buildSettlementCsv(batch) {
  const header = [
    'batchNumber',
    'merchantName',
    'bankName',
    'branchCode',
    'accountNumber',
    'accountHolder',
    'amountZar',
    'reference',
  ];

  const rows = (batch.settlements || []).map((s) => [
    batch.batchNumber,
    s.merchantName,
    s.bankName,
    s.branchCode,
    s.accountNumber,
    s.accountHolder,
    (s.amount || 0).toFixed(2),
    s.reference || batch.batchNumber,
  ]);

  const escape = (val) => `"${String(val ?? '').replaceAll('"', '""')}"`;
  return [header.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

export function downloadTextFile(filename, content, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

