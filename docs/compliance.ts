import { SupabaseClient } from '@supabase/supabase-js';
import { getComplianceGaps } from '@/docs/compliance-validator';

/**
 * Fetches merchant KYC documents and calculates the compliance state.
 * Used by the merchant portal and admin review screens to identify "Missing" items.
 */
export async function getMerchantComplianceSnapshot(
  admin: SupabaseClient,
  merchantId: string,
  merchantStatus: string | null
) {
  const { data: uploadedDocs, error } = await admin
    .from('merchant_kyc_documents')
    .select('document_type, status, notes, updated_at')
    .eq('merchant_id', merchantId);

  if (error) {
    console.error(`[compliance-snapshot] Error fetching docs for ${merchantId}:`, error);
    // Return a safe fallback snapshot rather than crashing the request
    return {
      isComplete: false,
      missingTypes: [],
      requiresAction: [],
      details: [],
      onboardingBlockedReason: 'Error loading compliance data.',
    };
  }

  return getComplianceGaps(uploadedDocs || []);
}