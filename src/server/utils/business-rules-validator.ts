/**
 * CRITICAL BUSINESS RULES VALIDATOR
 * Enforces all business logic rules from the Merchant Business Logic Portal Technical Specification v2.0
 *
 * Rule R1: 50/50 Discount Split is IMMUTABLE
 * Rule R2: Consumer ALWAYS pays LESS than face value
 * Rule R3: Price Snapshot at Purchase
 * Rule R4: Active Products = Immediately Visible to Consumers
 * Rule R5: Merchant Session Protection
 * Rule R6: Discount Range Enforcement (UI slider 3-15%, default 5%)
 */

import { DiscountPricingBreakdown } from '@/lib/pricing';

export class BusinessRuleViolation extends Error {
  constructor(
    public rule: string,
    message: string
  ) {
    super(`Business Rule Violation [${rule}]: ${message}`);
    this.name = 'BusinessRuleViolation';
  }
}

/**
 * RULE R1: 50/50 Discount Split is IMMUTABLE
 * Consumer benefit and platform margin must ALWAYS be exactly half of total discount.
 * This cannot be overridden by any UI or API call.
 */
export function validateR1_DiscountSplitImmutable(pricing: DiscountPricingBreakdown): void {
  const expectedConsumerBenefit = pricing.totalDiscountAmount / 2;
  const expectedPlatformMargin = pricing.totalDiscountAmount / 2;

  const consumerDiff = Math.abs(pricing.consumerBenefitAmount - expectedConsumerBenefit);
  const platformDiff = Math.abs(pricing.evoucherBenefitAmount - expectedPlatformMargin);

  // Allow 0.01 rounding tolerance
  if (consumerDiff > 0.01 || platformDiff > 0.01) {
    throw new BusinessRuleViolation(
      'R1',
      `Discount split must be exactly 50/50. Consumer: ${pricing.consumerBenefitAmount} (expected ${expectedConsumerBenefit}), Platform: ${pricing.evoucherBenefitAmount} (expected ${expectedPlatformMargin})`
    );
  }
}

/**
 * RULE R2: Consumer ALWAYS pays LESS than face value
 * Consumer price (after discount) must always be strictly less than face value.
 * Validates on every create/update/purchase operation.
 */
export function validateR2_ConsumerPaysLessThanFaceValue(
  faceValue: number,
  consumerPrice: number,
  totalDiscountPct: number,
  consumerBenefitPct?: number | null
): void {
  if (consumerPrice >= faceValue) {
    throw new BusinessRuleViolation(
      'R2',
      `Consumer price (R${consumerPrice}) must be less than face value (R${faceValue}). Total discount percentage: ${totalDiscountPct}%`
    );
  }

  // Additional validation: ensure consumer price matches the consumer-facing share.
  // In this platform model, total discount is split 50/50 between consumer and platform.
  const effectiveConsumerPct =
    Number.isFinite(Number(consumerBenefitPct))
      ? Number(consumerBenefitPct)
      : Number(totalDiscountPct) / 2;
  const expectedConsumerPrice = faceValue * (1 - effectiveConsumerPct / 100);
  const priceDiff = Math.abs(consumerPrice - expectedConsumerPrice);
  if (priceDiff > 0.01) {
    throw new BusinessRuleViolation(
      'R2',
      `Consumer price calculation mismatch. Got R${consumerPrice}, expected R${expectedConsumerPrice.toFixed(2)}`
    );
  }
}

/**
 * RULE R3: Price Snapshot at Purchase
 * When VoucherInstance is created, snapshot ALL pricing fields from VoucherProduct.
 * Never re-read or recalculate pricing from VoucherProduct at redemption time.
 * Prevents price manipulation between product edit and purchase.
 */
export function validateR3_PriceSnapshotCaptured(
  snapshotTime: Date | null,
  productId: string | null
): void {
  if (!snapshotTime) {
    throw new BusinessRuleViolation(
      'R3',
      `Price snapshot timestamp must be captured at purchase time. Product: ${productId ?? 'custom'}`
    );
  }

  // Ensure snapshot is recent (within last hour)
  const age = Date.now() - snapshotTime.getTime();
  if (age > 3600000) {
    throw new BusinessRuleViolation(
      'R3',
      `Price snapshot is too old (${Math.round(age / 1000)}s). Must be captured at purchase time.`
    );
  }
}

/**
 * RULE R4: Active Products = Immediately Visible to Consumers
 * When merchant sets status='active', product MUST appear in consumer shop instantly (via React Query invalidation).
 * No approval queue or delay. Validates on product status change.
 */
export function validateR4_ActiveProductsVisibleToConsumers(
  isActive: boolean,
  productId: string,
  merchantId: string
): void {
  // This rule is enforced via:
  // 1. RLS Policies: Only active products visible in SELECT
  // 2. Real-time Subscriptions: Consumers see changes instantly
  // 3. Cache Invalidation: React Query invalidates 'shopProducts' on merchant update
  
  if (!isActive) {
    // Product is inactive - should NOT appear in consumer shop
    // This should be verified via RLS when querying VoucherProduct
    return;
  }

  // Product is active - must be immediately visible
  // Validation happens in realtime via Supabase RLS policies
  console.debug(
    `[R4] Product ${productId} from merchant ${merchantId} marked active - consumer visibility via RLS policy`
  );
}

/**
 * RULE R5: Merchant Session Protection
 * All /merchant/* routes MUST:
 * 1. Verify user has valid merchant_session in localStorage
 * 2. Validate session is not expired (within last 24 hours)
 * 3. Match session merchant_id to request merchant_id
 * Redirect to /merchant/login if invalid.
 */
export function validateR5_MerchantSessionWithin24Hours(
  sessionCreatedAt: Date | null,
  sessionMerchantId: string | null,
  requestMerchantId: string
): void {
  if (!sessionCreatedAt || !sessionMerchantId) {
    throw new BusinessRuleViolation(
      'R5',
      `No valid merchant session found. Redirect to /MerchantPortal for login.`
    );
  }

  if (sessionMerchantId !== requestMerchantId) {
    throw new BusinessRuleViolation(
      'R5',
      `Session merchant (${sessionMerchantId}) does not match request merchant (${requestMerchantId}). Session hijacking attempt detected.`
    );
  }

  const sessionAge = Date.now() - sessionCreatedAt.getTime();
  const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

  if (sessionAge > maxSessionAge) {
    throw new BusinessRuleViolation(
      'R5',
      `Merchant session expired. Age: ${Math.round(sessionAge / 1000)}s. Max: ${Math.round(maxSessionAge / 1000)}s`
    );
  }
}

/**
 * RULE R6: Discount Range Enforcement (UI slider 3%-15%, default 5%)
 * Server-side validation enforces:
 * - Minimum: 3%
 * - Default: 5%
 * - Maximum: 15%
 * Applied to both merchant product creation and specials.
 */
export function validateR6_DiscountRangeEnforcement(
  totalDiscountPct: number,
  minPct: number = 3,
  maxPct: number = 15,
  defaultPct: number = 5
): {
  isValid: boolean;
  adjustedValue: number;
  violations: string[];
} {
  const violations: string[] = [];
  let adjustedValue = totalDiscountPct;

  if (!Number.isFinite(totalDiscountPct)) {
    violations.push(
      `Total discount must be a finite number. Got: ${totalDiscountPct}`
    );
    adjustedValue = defaultPct;
  }

  if (totalDiscountPct < minPct) {
    violations.push(
      `Total discount ${totalDiscountPct}% is below minimum ${minPct}%`
    );
    adjustedValue = minPct;
  }

  if (totalDiscountPct > maxPct) {
    violations.push(
      `Total discount ${totalDiscountPct}% exceeds maximum ${maxPct}%`
    );
    adjustedValue = maxPct;
  }

  return {
    isValid: violations.length === 0,
    adjustedValue,
    violations,
  };
}

/**
 * Validate entire pricing breakdown against all critical rules
 */
export function validateAllCriticalRules(pricing: DiscountPricingBreakdown): {
  isValid: boolean;
  violations: BusinessRuleViolation[];
} {
  const violations: BusinessRuleViolation[] = [];

  // R1: 50/50 Split
  try {
    validateR1_DiscountSplitImmutable(pricing);
  } catch (err) {
    if (err instanceof BusinessRuleViolation) {
      violations.push(err);
    }
  }

  // R2: Consumer pays less
  try {
    validateR2_ConsumerPaysLessThanFaceValue(
      pricing.faceValue,
      pricing.consumerPrice,
      pricing.totalDiscountPct,
      pricing.consumerBenefitPct
    );
  } catch (err) {
    if (err instanceof BusinessRuleViolation) {
      violations.push(err);
    }
  }

  // R6: Discount range
  const r6 = validateR6_DiscountRangeEnforcement(pricing.totalDiscountPct);
  if (!r6.isValid) {
    violations.push(
      new BusinessRuleViolation(
        'R6',
        `Discount range violations: ${r6.violations.join(', ')}`
      )
    );
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
