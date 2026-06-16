import { MerchantDocumentType } from '@/server/utils/compliance';

/**
 * Core requirements for a merchant to be considered "Impact Ready"
 * as per the SPONSOR_READY_IMPLEMENTATION_GUIDELINE.
 */
export const REQUIRED_MERCHANT_DOCUMENTS: MerchantDocumentType[] = [
  'FICA_ID',
  'FICA_POA',
  'CIPC_CERTIFICATE',
  'SARS_TAX_CLEARANCE',
  'EFT_MANDATE',
  'AML_DECLARATION',
  'POPIA_CONSENT',
  'BANK_STATEMENT',
];

export type DocumentStatus = {
  type: MerchantDocumentType;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  lastUpdated?: string;
  rejectionReason?: string;
};

export type ComplianceSummary = {
  isComplete: boolean;
  missingTypes: MerchantDocumentType[];
  requiresAction: MerchantDocumentType[];
  details: DocumentStatus[];
  onboardingBlockedReason: string | null;
};

/**
 * Validates which documents are missing or need attention.
 * This should be used before attempting to approve a merchant.
 */
export function getComplianceGaps(uploadedDocs: any[]): ComplianceSummary {
  const details: DocumentStatus[] = REQUIRED_MERCHANT_DOCUMENTS.map((type) => {
    const doc = uploadedDocs.find((d) => d.document_type === type);
    
    if (!doc) {
      return { type, status: 'missing' };
    }

    return {
      type,
      status: doc.status, // approved, rejected, or pending
      lastUpdated: doc.updated_at,
      rejectionReason: doc.notes,
    };
  });

  const missingTypes = details.filter((d) => d.status === 'missing').map((d) => d.type);
  const requiresAction = details.filter((d) => d.status === 'rejected' || d.status === 'missing').map((d) => d.type);

  // Determine the primary reason for the block to show on the dashboard
  let blockingReason = null;
  if (missingTypes.length > 0) {
    blockingReason = `Missing ${missingTypes.length} required document(s).`;
  } else if (details.some(d => d.status === 'rejected')) {
    blockingReason = "Some documents were rejected. Please check reviewer notes and resubmit.";
  } else if (details.some(d => d.status === 'pending')) {
    blockingReason = "Documents are currently under review by the compliance team.";
  }

  return {
    isComplete: missingTypes.length === 0 && details.every(d => d.status === 'approved'),
    missingTypes,
    requiresAction,
    details,
    onboardingBlockedReason: blockingReason,
  };
}