/**
 * Subscription Service
 * Manages recurring voucher purchases with plans for all income levels
 */

export type SubscriptionTier = 'basic' | 'standard' | 'premium' | 'corporate';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'pending';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  voucherValue: number;
  savingsPercentage: number;
  minIncome: number;
  description: string;
  features: string[];
  paymentMethods: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  vouchersIssued: number;
  totalSavings: number;
}

// Affordable subscription plans including options for grant recipients
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'grant-friendly',
    tier: 'basic',
    name: 'Grant Saver',
    monthlyPrice: 50,
    voucherValue: 55,
    savingsPercentage: 10,
    minIncome: 0,
    description: 'Perfect for SASSA grant recipients. R50/month gets you R55 in vouchers.',
    features: [
      'R55 monthly voucher value',
      'R5 instant savings',
      'SASSA card payment accepted',
      'SMS delivery (no data needed)',
      'Cancel anytime',
      'Use at Shoprite, Pick n Pay, Boxer',
    ],
    paymentMethods: ['sassa_card', 'cash_voucher', 'airtime', 'ussd'],
  },
  {
    id: 'family-essentials',
    tier: 'standard',
    name: 'Family Essentials',
    monthlyPrice: 200,
    voucherValue: 220,
    savingsPercentage: 10,
    minIncome: 1000,
    description: 'For families needing weekly grocery support. R200/month for R220 value.',
    features: [
      'R220 monthly voucher value',
      'R20 instant savings',
      'Split into 4 weekly vouchers',
      'All payment methods accepted',
      'Family sharing option',
      'Priority customer support',
    ],
    paymentMethods: ['sassa_card', 'eft', 'cash_voucher', 'payfast', 'airtime'],
  },
  {
    id: 'bulk-saver',
    tier: 'premium',
    name: 'Bulk Saver',
    monthlyPrice: 500,
    voucherValue: 575,
    savingsPercentage: 15,
    minIncome: 3000,
    description: 'Maximum savings for regular shoppers. R500/month for R575 value.',
    features: [
      'R575 monthly voucher value',
      'R75 instant savings (15%)',
      'Flexible voucher denominations',
      'Stokvel-friendly (group option)',
      'Bonus birthday voucher',
      'Extended 120-day validity',
    ],
    paymentMethods: ['eft', 'payfast', 'ozow', 'cash_voucher'],
  },
  {
    id: 'corporate-bundle',
    tier: 'corporate',
    name: 'Corporate Bundle',
    monthlyPrice: 5000,
    voucherValue: 6000,
    savingsPercentage: 20,
    minIncome: 0,
    description: 'For businesses providing employee benefits. Bulk discounts available.',
    features: [
      'R6000+ monthly voucher value',
      '20% savings on bulk',
      'Employee distribution dashboard',
      'Custom voucher amounts',
      'Dedicated account manager',
      'Invoice billing available',
    ],
    paymentMethods: ['eft', 'invoice'],
  },
];

export async function createSubscription(
  userId: string,
  planId: string,
  paymentMethod: string
): Promise<{ success: boolean; subscription?: Subscription; message: string }> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

  if (!plan) {
    return {
      success: false,
      message: 'Subscription plan not found',
    };
  }

  if (!plan.paymentMethods.includes(paymentMethod)) {
    return {
      success: false,
      message: `Payment method ${paymentMethod} not supported for this plan`,
    };
  }

  const subscription: Subscription = {
    id: `SUB-${Date.now()}`,
    userId,
    planId,
    status: 'active',
    startDate: new Date().toISOString(),
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    vouchersIssued: 0,
    totalSavings: 0,
  };

  return {
    success: true,
    subscription,
    message: `Successfully subscribed to ${plan.name}`,
  };
}

export async function issueMonthlyVouchers(subscription: Subscription): Promise<string[]> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId);
  if (!plan) return [];

  // Issue vouchers based on plan
  const voucherCodes: string[] = [];

  if (plan.id === 'grant-friendly') {
    // Single R55 voucher
    voucherCodes.push(
      `GRANT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    );
  } else if (plan.id === 'family-essentials') {
    // 4 weekly vouchers of R55 each
    for (let i = 0; i < 4; i++) {
      voucherCodes.push(
        `WEEKLY-${Date.now()}-W${i + 1}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      );
    }
  } else {
    // Single voucher for premium/corporate
    voucherCodes.push(
      `PREM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    );
  }

  return voucherCodes;
}

export async function pauseSubscription(subscriptionId: string): Promise<boolean> {
  // Allow users to pause (useful for tight months)
  return true;
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  // No penalty cancellation (user-friendly)
  return true;
}

export async function createStokveLSubscription(
  memberIds: string[],
  planId: string,
  contributionPerMember: number
): Promise<{ success: boolean; groupId?: string; message: string }> {
  // Stokvel/group buying feature
  const totalContribution = memberIds.length * contributionPerMember;

  if (totalContribution < 200) {
    return {
      success: false,
      message: 'Minimum group contribution is R200',
    };
  }

  const groupId = `STOKVEL-${Date.now()}`;

  return {
    success: true,
    groupId,
    message: `Stokvel subscription created for ${memberIds.length} members. Total value: R${totalContribution * 1.15}`,
  };
}

export function getRecommendedPlan(monthlyIncome: number, householdSize: number): SubscriptionPlan {
  if (monthlyIncome <= 350) {
    return SUBSCRIPTION_PLANS.find((p) => p.id === 'grant-friendly')!;
  }

  if (monthlyIncome <= 2000) {
    return SUBSCRIPTION_PLANS.find((p) => p.id === 'family-essentials')!;
  }

  return SUBSCRIPTION_PLANS.find((p) => p.id === 'bulk-saver')!;
}
