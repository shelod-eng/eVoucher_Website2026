'use client';

import { useEffect, useMemo, useState } from 'react';

type ReviewStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';

type ComplianceDocumentQueueItem = {
  id: string;
  merchantId: string;
  merchantName: string | null;
  merchantEmail: string | null;
  merchantStatus: string | null;
  documentType: string;
  fileName: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  checksumSha256: string | null;
  status: ReviewStatus;
  rawStatus: string | null;
  uploadedAt: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
};

function statusBadge(status: string) {
  const normalized = String(status).toUpperCase();
  if (normalized === 'VERIFIED') return 'border-emerald-300/30 bg-emerald-400/12 text-emerald-100';
  if (normalized === 'FAILED') return 'border-rose-300/30 bg-rose-400/12 text-rose-100';
  if (normalized === 'EXPIRED') return 'border-amber-300/30 bg-amber-400/12 text-amber-100';
  return 'border-sky-300/30 bg-sky-400/12 text-sky-100';
}

function formatDateTime(value: string | null) {
  if (!value) return 'Awaiting activity';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Awaiting activity';
  return date.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(value: number | null) {
  if (!value) return 'Size pending';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function PortalCompliancePage() {
  const [documents, setDocuments] = useState<ComplianceDocumentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const response = await fetch(`/api/v1/admin/compliance/documents${query}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load compliance queue.');
      }
      setDocuments(payload.documents ?? []);
    } catch (loadError: any) {
      setError(String(loadError?.message || 'Failed to load compliance queue.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDocuments();
  }, [statusFilter]);

  const counts = useMemo(
    () => ({
      total: documents.length,
      pending: documents.filter((document) => document.status === 'PENDING').length,
      verified: documents.filter((document) => document.status === 'VERIFIED').length,
      failed: documents.filter((document) => document.status === 'FAILED').length,
    }),
    [documents]
  );

  const reviewDocument = async (documentId: string, status: 'VERIFIED' | 'FAILED' | 'NEEDS_MORE') => {
    setSavingId(documentId);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/v1/admin/compliance/review', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          status,
          notes: notesById[documentId] ?? '',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to review document.');
      }
      setMessage('Document review saved.');
      await fetchDocuments();
    } catch (reviewError: any) {
      setError(String(reviewError?.message || 'Failed to review document.'));
    } finally {
      setSavingId(null);
    }
  };

  const openPreview = async (documentId: string) => {
    setError('');
    try {
      const response = await fetch(`/api/v1/admin/compliance/documents/${documentId}/signed-url`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create preview URL.');
      }
      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (previewError: any) {
      setError(String(previewError?.message || 'Failed to create preview URL.'));
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.42)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-200/75">
              Compliance Review
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">
              Merchant document queue
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Review private KYC and onboarding evidence, approve clean submissions, and request
              corrections with an auditable trail.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-sky-300/24 bg-[#102647] px-4 py-2 text-sm font-semibold text-white outline-none transition focus:border-cyan-200"
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ['Total', counts.total],
            ['Pending', counts.pending],
            ['Approved', counts.verified],
            ['Rejected', counts.failed],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.3rem] border border-sky-400/12 bg-[#102647]/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-100/80">
                {label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-[1.2rem] border border-rose-300/24 bg-rose-400/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-5 rounded-[1.2rem] border border-emerald-300/24 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {message}
          </div>
        )}
      </section>

      <section className="space-y-4">
        {loading && (
          <div className="rounded-[1.5rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 text-sm text-slate-300">
            Loading compliance queue...
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="rounded-[1.5rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-6 text-sm text-slate-300">
            No documents match this queue.
          </div>
        )}

        {documents.map((document) => (
          <article
            key={document.id}
            className="rounded-[1.6rem] border border-sky-400/16 bg-[#0b1d3a]/95 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.38)]"
          >
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${statusBadge(document.status)}`}>
                    {document.status}
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {document.documentType.replaceAll('_', ' ')}
                  </span>
                </div>

                <h2 className="mt-3 truncate text-2xl font-semibold text-white">
                  {document.merchantName ?? 'Unnamed merchant'}
                </h2>
                <p className="mt-1 text-sm text-slate-300">{document.merchantEmail ?? 'No email captured'}</p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1rem] border border-sky-400/10 bg-[#102647]/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">File</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {document.fileName ?? 'Unnamed upload'}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-sky-400/10 bg-[#102647]/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Format</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {document.mimeType ?? 'Unknown'} | {formatBytes(document.sizeBytes)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-sky-400/10 bg-[#102647]/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Uploaded</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatDateTime(document.uploadedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  value={notesById[document.id] ?? document.reviewerNotes ?? ''}
                  onChange={(event) =>
                    setNotesById((current) => ({ ...current, [document.id]: event.target.value }))
                  }
                  placeholder="Reviewer notes for rejection or more information request"
                  className="min-h-24 w-full rounded-[1.1rem] border border-sky-300/20 bg-[#102647] p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-200"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void openPreview(document.id)}
                    className="rounded-full border border-cyan-300/24 bg-[#102647] px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    disabled={savingId === document.id}
                    onClick={() => void reviewDocument(document.id, 'VERIFIED')}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={savingId === document.id}
                    onClick={() => void reviewDocument(document.id, 'NEEDS_MORE')}
                    className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
                  >
                    Request More
                  </button>
                  <button
                    type="button"
                    disabled={savingId === document.id}
                    onClick={() => void reviewDocument(document.id, 'FAILED')}
                    className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
