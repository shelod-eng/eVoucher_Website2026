import { createAdminClient } from '@/lib/supabase/admin';

export type ComplianceDocumentType =
  | 'FICA_ID'
  | 'FICA_POA'
  | 'CIPC_CERTIFICATE'
  | 'SARS_TAX_CLEARANCE'
  | 'EFT_MANDATE'
  | 'AML_DECLARATION'
  | 'POPIA_CONSENT'
  | 'BANK_STATEMENT';

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
  file_name: string | null;
  file_url: string | null;
  status: string | null;
  uploaded_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
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

function normalizeComplianceStatus(value: unknown): ComplianceStatusValue {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  if (normalized === 'VERIFIED') return 'VERIFIED';
  if (normalized === 'FAILED') return 'FAILED';
  if (normalized === 'EXPIRED') return 'EXPIRED';
  return 'PENDING';
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
    uploadedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  }));

  const { data, error } = await admin
    .from('compliance_documents')
    .select(
      'id,merchant_id,document_type,file_name,file_url,status,uploaded_at,reviewed_by,reviewed_at,expires_at'
    )
    .eq('merchant_id', merchantId)
    .order('uploaded_at', { ascending: false });

  if (error && isMissingRelation(error, 'compliance_documents')) {
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
      status: row ? normalizeComplianceStatus(row.status) : ('PENDING' as ComplianceStatusValue),
      fileName: row?.file_name ?? null,
      fileUrl: row?.file_url ?? null,
      uploadedAt: row?.uploaded_at ?? null,
      reviewedBy: row?.reviewed_by ?? null,
      reviewedAt: row?.reviewed_at ?? null,
      expiresAt: row?.expires_at ?? null,
    };
  });

  const missingDocuments = docs
    .filter((doc) => doc.status !== 'VERIFIED')
    .map((doc) => doc.documentType);

  const hasFailure = docs.some((doc) => doc.status === 'FAILED');
  const hasExpired = docs.some((doc) => doc.status === 'EXPIRED');
  const allVerified = docs.every((doc) => doc.status === 'VERIFIED');

  const overallStatus: MerchantComplianceSnapshot['overallStatus'] = hasFailure
    ? 'FAILED'
    : hasExpired
      ? 'EXPIRED'
      : allVerified
        ? 'VERIFIED'
        : 'PENDING';

  const complianceApproved = merchantApproved && allVerified;

  return {
    overallStatus,
    complianceApproved,
    canIssueVouchers: complianceApproved,
    canReceivePayouts: complianceApproved,
    missingDocuments,
    documents: docs,
  };
}
