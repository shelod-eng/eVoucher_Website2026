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
  mimeType?: string | null;
  sizeBytes?: number | null;
  reviewerNotes?: string | null;
  uploadedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
};

const REQUIRED_CLIENT_COMPLIANCE_DOCUMENTS: ComplianceDocument[] = [
  {
    documentType: 'FICA_ID',
    label: 'FICA ID',
    description: 'Identity verification for the merchant owner or authorised representative',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
  {
    documentType: 'FICA_POA',
    label: 'Proof of Address',
    description: 'FICA address verification for the merchant trading or registered address',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
  {
    documentType: 'CIPC_CERTIFICATE',
    label: 'CIPC Certificate',
    description: 'Company registration evidence for KYB onboarding',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
  {
    documentType: 'SARS_TAX_CLEARANCE',
    label: 'SARS Tax Clearance',
    description: 'Tax compliance evidence before activation and payouts',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
  {
    documentType: 'EFT_MANDATE',
    label: 'EFT Mandate',
    description: 'Payout authorisation and settlement mandate',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
  {
    documentType: 'AML_DECLARATION',
    label: 'AML Declaration',
    description: 'Anti-money laundering declaration for merchant activation',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
  {
    documentType: 'POPIA_CONSENT',
    label: 'POPIA Consent',
    description: 'Consent for lawful processing of compliance and onboarding data',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
  {
    documentType: 'BANK_STATEMENT',
    label: 'Bank Statement',
    description: 'Bank account verification for merchant payouts',
    status: 'PENDING',
    fileName: null,
    fileUrl: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  },
];

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
    return 'border border-success/30 bg-success/10 text-success';
  }
  if (normalized === 'FAILED' || normalized === 'REJECTED' || normalized === 'SUSPENDED') {
    return 'border border-error/30 bg-error/10 text-error';
  }
  if (normalized === 'EXPIRED') {
    return 'border border-warning/30 bg-warning/10 text-warning';
  }
  return 'border border-warning/30 bg-warning/10 text-warning';
}

function formatBytes(value?: number | null) {
  if (!value) return null;
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name);
}

async function normalizeMobileImage(file: File) {
  if (!isImageFile(file)) return file;

  const bitmap = await createImageBitmap(file);
  const maxEdge = 2048;
  const ratio = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  if (ratio === 1 && !/\.(heic|heif)$/i.test(file.name)) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.88)
  );
  if (!blob) return file;

  const jpegName = file.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg');
  return new File([blob], jpegName === file.name ? `${file.name}.jpg` : jpegName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

export default function MerchantCompliancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<ComplianceDocumentType | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
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

  const orderedDocuments = useMemo(
    () => snapshot?.documents ?? REQUIRED_CLIENT_COMPLIANCE_DOCUMENTS,
    [snapshot]
  );

  const handleUpload = async (
    documentType: ComplianceDocumentType,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSubmitting(documentType);
    setUploadProgress((current) => ({ ...current, [documentType]: 12 }));
    setError('');
    setMessage('');
    try {
      const uploadFile = await normalizeMobileImage(file);
      setUploadProgress((current) => ({ ...current, [documentType]: 36 }));

      const formData = new FormData();
      formData.set('documentType', documentType);
      formData.set('file', uploadFile);

      const res = await fetch('/api/v1/merchant/compliance/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      setUploadProgress((current) => ({ ...current, [documentType]: 78 }));
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Upload failed.');
      }
      setUploadProgress((current) => ({ ...current, [documentType]: 100 }));
      setMessage(`${documentType.replaceAll('_', ' ')} uploaded successfully.`);
      await fetchStatus();
    } catch (uploadError: any) {
      setError(
        String(
          uploadError?.message ||
            'Upload failed. HEIC conversion depends on device browser support; try camera capture or JPEG/PDF upload.'
        )
      );
    } finally {
      setSubmitting(null);
      event.target.value = '';
      window.setTimeout(() => {
        setUploadProgress((current) => ({ ...current, [documentType]: 0 }));
      }, 900);
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
            <p className="mt-2 text-sm text-muted-foreground">
              Capture documents from your phone camera or upload PDF, JPG, PNG, and WebP files.
              Mobile images are resized to 2048px and converted to JPEG where the browser supports
              it.
            </p>
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
                    {doc.status === 'FAILED' && doc.reviewerNotes && (
                      <div className="mt-3 rounded-lg border border-error/25 bg-error/10 p-3 text-sm text-error">
                        Rejection reason: {doc.reviewerNotes}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-headline text-primary-foreground">
                        {submitting === doc.documentType
                          ? 'Uploading...'
                          : doc.status === 'FAILED'
                            ? `Resubmit ${doc.label}`
                            : `Upload ${doc.label}`}
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                          capture={doc.documentType === 'FICA_ID' ? 'environment' : undefined}
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
                      {formatBytes(doc.sizeBytes) && (
                        <span className="text-xs text-muted-foreground">
                          Size: {formatBytes(doc.sizeBytes)}
                        </span>
                      )}
                      {doc.uploadedAt && (
                        <span className="text-xs text-muted-foreground">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {Boolean(uploadProgress[doc.documentType]) && (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${uploadProgress[doc.documentType]}%` }}
                        />
                      </div>
                    )}
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
