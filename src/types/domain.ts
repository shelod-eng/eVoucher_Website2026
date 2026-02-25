export interface MerchantOnboardingRequest {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  merchantType?: 'chain' | 'private';
  parentBrand?: string;
  branchName?: string;
  city?: string;
  province?: string;
  locationLat?: number;
  locationLng?: number;
  registrationNumber?: string;
  taxNumber?: string;
  physicalAddress?: string;
  businessType?: string;
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
  accountHolderName?: string;
  discountPercentage?: number;
  pharmacyLicenseNumber?: string;
  responsiblePharmacistName?: string;
  ownerIdNumber?: string;
  proofOfPremises?: string;
}

export interface PurchaseVoucherRequest {
  merchantId: string;
  productId?: string;
  faceValue?: number;
  paymentMethod: 'visa' | 'payfast' | 'eft' | 'debit_credit';
}

export interface VoucherPricingBreakdown {
  faceValue: number;
  totalDiscountPct: number;
  consumerBenefitPct: number;
  evoucherBenefitPct: number;
  totalDiscountAmount: number;
  consumerBenefitAmount: number;
  evoucherBenefitAmount: number;
  consumerPrice: number;
  merchantReceivableAfterTotalDiscount: number;
  merchantReceivableAfterEvoucherBenefit: number;
}

export interface PurchaseVoucherResponse {
  transactionReference: string;
  status: 'pending' | 'completed' | 'failed';
  checkoutUrl?: string | null;
  voucherCode?: string;
  pricing?: VoucherPricingBreakdown;
}

export interface RedeemVoucherRequest {
  voucherCode: string;
  merchantId: string;
  amount: number;
  idempotencyKey: string;
}

export interface RedeemVoucherResponse {
  remainingBalance: number;
  redemptionId: string;
  merchantPayoutQueued: boolean;
}

export interface AuditEvent {
  actorId?: string | null;
  actorRole?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  requestId?: string | null;
}

export interface FraudAlert {
  actorId?: string | null;
  relatedEntityType: string;
  relatedEntityId?: string | null;
  riskScore: number;
  ruleHit: string;
  status?: 'open' | 'investigating' | 'dismissed' | 'resolved';
  details?: Record<string, unknown>;
}
