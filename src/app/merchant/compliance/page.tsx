'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';

type ComplianceStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
type OverallStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
type ComplianceDocumentType =
  | 'FICA_ID'
  | 'FICA_POA'
  | 'CIPC_CERTIFICATE'
  | 'SARS_TAX_CLEARANCE'
  | 'EFT_MANDATE'
  | 'AML_DECLARATION'
  | 'POPIA_CONSENT'
  | 'BANK_STATEMENT';

type ComplianceDocument = {
  documentType: ComplianceDocumentType;
  label: string;
  description: string;
  status: ComplianceStatus;
  fileName: string | null;
  fileUrl: string | null;
  uploadedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
};

type ComplianceResponse = {
  merchantId: string;
  merchantName: string | null;
  merchantStatus: string | null;
  overallStatus: OverallStatus;
  complianceApproved: boolean;
  canIssueVouchers: boolean;
  canReceivePayouts: boolean;
  missingDocuments: ComplianceDocumentType[];
  documents: ComplianceDocument[];
};

function statusBadge(status: string) {
  const normalized = String(status).toUpperCase();
  if (normalized === 'VERIFIED' || normalized === 'APPROVED') {
    return 'bg-success/10 text-success';
  }
  if (normalized === 'FAILED' || normalized === 'REJECTED' || normalized === 'SUSPENDED') {
    return 'bg-error/10 text-error';
  }
  if (normalized === 'EXPIRED') {
    return 'bg-warning/10 text-warning';
  }
  return 'bg-warning/10 text-warning';
}

export default function MerchantCompliancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<ComplianceDocumentType | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [snapshot, setSnapshot] = useState<ComplianceResponse | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/merchant/compliance/status', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace('/merchant/login');
        return;
      }
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to load compliance status.');
      }
      setSnapshot(payload as ComplianceResponse);
    } catch (statusError: any) {
      setError(String(statusError?.message || 'Failed to load compliance status.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const orderedDocuments = useMemo(() => snapshot?.documents ?? [], [snapshot]);

  const handleUpload = async (
    documentType: ComplianceDocumentType,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSubmitting(documentType);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.set('documentType', documentType);
      formData.set('file', file);

      const res = await fetch('/api/v1/merchant/compliance/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Upload failed.');
      }
      setMessage(`${documentType.replaceAll('_', ' ')} uploaded successfully.`);
      await fetchStatus();
    } catch (uploadError: any) {
      setError(String(uploadError?.message || 'Upload failed.'));
    } finally {
      setSubmitting(null);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 px-4 pb-12">
        <div className="max-w-6xl mx-auto space-y-4">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-headline text-2xl text-foreground">Compliance</h1>
                <p className="text-sm text-muted-foreground">
                  Upload required compliance documents to unlock voucher issuance and payouts.
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-headline ${statusBadge(snapshot?.overallStatus ?? 'PENDING')}`}
              >
                Compliance Status: {snapshot?.overallStatus ?? 'PENDING'}
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Merchant Status</div>
                <div className="font-headline text-lg">{snapshot?.merchantStatus ?? 'PENDING'}</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Voucher Issuance</div>
                <div
                  className={`font-headline text-lg ${snapshot?.canIssueVouchers ? 'text-success' : 'text-warning'}`}
                >
                  {snapshot?.canIssueVouchers ? 'Enabled' : 'Blocked'}
                </div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Payouts</div>
                <div
                  className={`font-headline text-lg ${snapshot?.canReceivePayouts ? 'text-success' : 'text-warning'}`}
                >
                  {snapshot?.canReceivePayouts ? 'Enabled' : 'Blocked'}
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-3 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                {message}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-headline text-xl text-foreground">Required Documents</h2>
            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading compliance checklist...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {orderedDocuments.map((doc) => (
                  <div key={doc.documentType} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-headline text-base text-foreground">{doc.label}</div>
                        <div className="text-xs text-muted-foreground">{doc.description}</div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-headline ${statusBadge(doc.status)}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-headline text-primary-foreground">
                        {submitting === doc.documentType ? 'Uploading...' : `Upload ${doc.label}`}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(event) => {
                            void handleUpload(doc.documentType, event);
                          }}
                          disabled={Boolean(submitting)}
                        />
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {doc.fileName ? `Latest: ${doc.fileName}` : 'No file uploaded yet.'}
                      </span>
                      {doc.uploadedAt && (
                        <span className="text-xs text-muted-foreground">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
