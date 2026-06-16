import { createAdminClient } from '@/lib/supabase/admin';
import { getComplianceGaps } from '@/server/utils/compliance-validator';

export type ComplianceDocumentType =
  | 'FICA_ID'
  | 'FICA_POA'
  | 'CIPC_CERTIFICATE'
  | 'SARS_TAX_CLEARANCE'
  | 'EFT_MANDATE'
  | 'AML_DECLARATION'
  | 'POPIA_CONSENT'
  | 'BANK_STATEMENT';

/**
 * Alias for MerchantDocumentType to maintain consistency with
 * EXPO_MOBILE_DOCUMENT_UPLOAD specifications.
 */
export type MerchantDocumentType = ComplianceDocumentType;

export type ComplianceStatusValue = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';

export const REQUIRED_COMPLIANCE_DOCUMENTS: ReadonlyArray<{
  type: ComplianceDocumentType;
  label: string;
  description: string;
}> = [
  { type: 'FICA_ID', label: 'FICA ID', description: 'Identity verification' },
  { type: 'FICA_POA', label: 'Proof of Address', description: 'FICA requirement' },
  { type: 'CIPC_CERTIFICATE', label: 'CIPC Certificate', description: 'Company registration' },
  { type: 'SARS_TAX_CLEARANCE', label: 'SARS Tax Clearance', description: 'Tax compliance' },
  { type: 'EFT_MANDATE', label: 'EFT Mandate', description: 'Payout authorization' },
  {
    type: 'AML_DECLARATION',
    label: 'AML Declaration',
    description: 'Anti-money laundering declaration',
  },
  { type: 'POPIA_CONSENT', label: 'POPIA Consent', description: 'Data processing consent' },
  { type: 'BANK_STATEMENT', label: 'Bank Statement', description: 'Banking verification' },
] as const;

type ComplianceDocumentRow = {
  id: string;
  merchant_id: string;
  document_type: string;
  document_url: string | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  original_file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  checksum_sha256?: string | null;
  verification_status: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  reviewed_by?: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
};

export type MerchantComplianceSnapshot = {
  overallStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  complianceApproved: boolean;
  canIssueVouchers: boolean;
  canReceivePayouts: boolean;
  missingDocuments: ComplianceDocumentType[];
  documents: Array<{
    documentType: ComplianceDocumentType;
    label: string;
    description: string;
    status: ComplianceStatusValue;
    fileName: string | null;
    fileUrl: string | null;
    storageBucket: string | null;
    storagePath: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
    checksumSha256: string | null;
    reviewerNotes: string | null;
    uploadedAt: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    expiresAt: string | null;
  }>;
};

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const code = String(error?.code ?? '').toLowerCase();
  const normalizedRelation = relationName.toLowerCase();
  return (
    code === '42p01' ||
    code.startsWith('pgrst') ||
    message.includes('schema cache') ||
    message.includes('could not find the table') ||
    message.includes(`relation "${normalizedRelation}" does not exist`) ||
    message.includes(`relation '${normalizedRelation}' does not exist`) ||
    message.includes(`could not find the "${normalizedRelation}" table`)
  );
}

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const code = String(error?.code ?? '').toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  return (
    code === '42703' ||
    code.startsWith('pgrst') ||
    message.includes('schema cache') ||
    message.includes(`column ${normalizedColumn} does not exist`) ||
    message.includes(`column "${normalizedColumn}" does not exist`) ||
    message.includes(`column merchant_kyc_documents.${normalizedColumn} does not exist`) ||
    message.includes(`could not find the '${normalizedColumn}' column`) ||
    message.includes(`could not find the "${normalizedColumn}" column`)
  );
}

function mapVerificationStatus(value: unknown): ComplianceStatusValue {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (normalized === 'approved') return 'VERIFIED';
  if (normalized === 'rejected') return 'FAILED';
  if (normalized === 'under_review') return 'PENDING';
  if (normalized === 'submitted') return 'PENDING';
  return 'PENDING';
}

function inferFileNameFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : null;
  } catch {
    const last = String(url).split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : null;
  }
}

function isMerchantStatusApproved(status: unknown) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();
  return normalized === 'approved' || normalized === 'active';
}

export function isOperationallyApproved(status: unknown) {
  if (isMerchantStatusApproved(status)) return true;
  const forcedMode =
    String(
      process.env.FORCE_MERCHANT_AUTO_APPROVAL ??
        process.env.NEXT_PUBLIC_FORCE_MERCHANT_AUTO_APPROVAL ??
        ''
    )
      .trim()
      .toLowerCase() !== 'false';
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();
  return forcedMode && normalized === 'pending';
}

export async function getMerchantComplianceSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  merchantId: string,
  merchantStatus: unknown
): Promise<MerchantComplianceSnapshot> {
  const merchantApproved = isOperationallyApproved(merchantStatus);

  const defaultDocs = REQUIRED_COMPLIANCE_DOCUMENTS.map((doc) => ({
    documentType: doc.type,
    label: doc.label,
    description: doc.description,
    status: (merchantApproved ? 'VERIFIED' : 'PENDING') as ComplianceStatusValue,
    fileName: null,
    fileUrl: null,
    storageBucket: null,
    storagePath: null,
    mimeType: null,
    sizeBytes: null,
    checksumSha256: null,
    reviewerNotes: null,
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  }));

  const fullSelect =
    'id,merchant_id,document_type,document_url,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,checksum_sha256,verification_status,uploaded_by,uploaded_at,reviewed_by,reviewed_at,reviewer_notes';
  const legacySelect =
    'id,merchant_id,document_type,document_url,verification_status,uploaded_by,uploaded_at,reviewed_at,reviewer_notes';

  let { data, error }: { data: ComplianceDocumentRow[] | null; error: any } = await admin
    .from('merchant_kyc_documents')
    .select(fullSelect)
    .eq('merchant_id', merchantId)
    .order('uploaded_at', { ascending: false });

  if (error && isMissingRelation(error, 'merchant_kyc_documents')) {
    return {
      overallStatus: merchantApproved ? 'VERIFIED' : 'PENDING',
      complianceApproved: merchantApproved,
      canIssueVouchers: merchantApproved,
      canReceivePayouts: merchantApproved,
      missingDocuments: merchantApproved
        ? []
        : REQUIRED_COMPLIANCE_DOCUMENTS.map((doc) => doc.type),
      documents: defaultDocs,
    };
  }
  if (error && isMissingColumn(error, 'storage_bucket')) {
    const legacyResult = await admin
      .from('merchant_kyc_documents')
      .select(legacySelect)
      .eq('merchant_id', merchantId)
      .order('uploaded_at', { ascending: false });
    data = legacyResult.data as ComplianceDocumentRow[] | null;
    error = legacyResult.error;
  }
  if (error) throw error;

  const latestByType = new Map<ComplianceDocumentType, ComplianceDocumentRow>();
  (data as ComplianceDocumentRow[]).forEach((row) => {
    const docType = String(row.document_type ?? '').toUpperCase() as ComplianceDocumentType;
    if (!REQUIRED_COMPLIANCE_DOCUMENTS.some((doc) => doc.type === docType)) return;
    if (!latestByType.has(docType)) latestByType.set(docType, row);
  });

  const docs = REQUIRED_COMPLIANCE_DOCUMENTS.map((doc) => {
    const row = latestByType.get(doc.type);
    return {
      documentType: doc.type,
      label: doc.label,
      description: doc.description,
      status: row ? mapVerificationStatus(row.verification_status) : ('PENDING' as ComplianceStatusValue),
      fileName: row ? row.original_file_name ?? inferFileNameFromUrl(row.document_url) : null,
      fileUrl: row?.document_url?.startsWith('http') ? row.document_url : null,
      storageBucket: row?.storage_bucket ?? null,
      storagePath: row?.storage_path ?? null,
      mimeType: row?.mime_type ?? null,
      sizeBytes: row?.size_bytes ?? null,
      checksumSha256: row?.checksum_sha256 ?? null,
      reviewerNotes: row?.reviewer_notes ?? null,
      uploadedAt: row?.uploaded_at ?? null,
      reviewedBy: row?.reviewed_by ?? null,
      reviewedAt: row?.reviewed_at ?? null,
      expiresAt: null,
    };
  });

  // Use the new consolidated validator logic
  const gaps = getComplianceGaps(
    (data || []).map((row) => ({
      document_type: row.document_type,
      status:
        row.verification_status === 'approved'
          ? 'approved'
          : row.verification_status === 'rejected'
            ? 'rejected'
            : 'pending',
      notes: row.reviewer_notes,
      updated_at: row.uploaded_at,
    }))
  );
  
  const hasFailure = docs.some((doc) => doc.status === 'FAILED');
  const hasExpired = docs.some((doc) => doc.status === 'EXPIRED');
  const allVerified = docs.every((doc) => doc.status === 'VERIFIED');
  
  // Map the new overall status to the expected return type
  const overallStatus: MerchantComplianceSnapshot['overallStatus'] = 
    gaps.isComplete ? 'VERIFIED' : (hasFailure ? 'FAILED' : 'PENDING');

  const complianceApproved = merchantApproved && allVerified;

  return {
    overallStatus,
    complianceApproved,
    canIssueVouchers: complianceApproved,
    canReceivePayouts: complianceApproved,
    missingDocuments: gaps.missingTypes,
    documents: docs,
  };
}
