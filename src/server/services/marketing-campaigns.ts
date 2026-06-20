/**
 * Marketing & Campaign Tools Service
 * Manages promotional campaigns, referral programs, and customer engagement
 */

export type CampaignType = 'email' | 'sms' | 'push' | 'in_app' | 'social';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
export type AudienceSegment =
  | 'all'
  | 'new_users'
  | 'grant_recipients'
  | 'high_value'
  | 'inactive'
  | 'rural';

export interface Campaign {
  id: string;
  merchantId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  audience: AudienceSegment;
  message: string;
  discount: number;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  reach: number;
  conversions: number;
}

export interface PromoCode {
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  minPurchase: number;
  applicableProducts: string[];
  userSegment: AudienceSegment;
}

export interface ReferralProgram {
  id: string;
  referrerReward: number;
  refereeReward: number;
  active: boolean;
  tier: 'basic' | 'silver' | 'gold';
  requirements: {
    minReferrals: number;
    minPurchasePerReferral: number;
  };
}

export interface ReferralTracking {
  referrerId: string;
  refereeId: string;
  status: 'pending' | 'completed' | 'rewarded';
  referralCode: string;
  rewardAmount: number;
  createdAt: string;
}

// Inclusive campaign templates
export const CAMPAIGN_TEMPLATES = {
  grant_day: {
    name: 'SASSA Grant Day Special',
    message: {
      en: 'Its Grant Day! Get extra 5% off on all groceries today. Shop at Shoprite, Pick n Pay, Boxer.',
      zu: 'Usuku Lwesibonelelo! Thola isaphulelo esingeziwe sika-5% kuwo wonke amagrosari namuhla.',
      xh: 'Usuku Lwesibonelelo! Fumana isaphulelo esingeziwe se-5% kuyo yonke imveliso yamhlanje.',
    },
    discount: 5,
    audience: 'grant_recipients' as AudienceSegment,
    channels: ['sms', 'ussd'] as CampaignType[],
  },
  first_time: {
    name: 'Welcome Voucher',
    message: {
      en: 'Welcome to eVoucher! Heres R10 off your first purchase of R50 or more.',
      zu: 'Siyakwamukela ku-eVoucher! Nansi R10 ekhuluma ekuthengeni kwakho kokuqala okuba R50 noma ngaphezulu.',
      xh: 'Wamkelekile kwi-eVoucher! Nantsi i-R10 ekuthengeni kwakho kokuqala okungange-R50 okanye ngaphezulu.',
    },
    discount: 10,
    audience: 'new_users' as AudienceSegment,
    channels: ['sms', 'email', 'in_app'] as CampaignType[],
  },
  rural_special: {
    name: 'Rural Community Support',
    message: {
      en: 'Supporting our rural communities! Extra savings for you. Use code RURAL10 at checkout.',
      zu: 'Sisekela imiphakathi yethu yasemakhaya! Ukonga okwengeziwe kuwe.',
      xh: 'Sixhasa uluntu lwethu lasemaphandleni! Ukonga okongezelelweyo kuwe.',
    },
    discount: 10,
    audience: 'rural' as AudienceSegment,
    channels: ['sms', 'ussd'] as CampaignType[],
  },
};

export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'spent' | 'reach' | 'conversions'>
): Promise<Campaign> {
  return {
    ...campaign,
    id: `CAMP-${Date.now()}`,
    spent: 0,
    reach: 0,
    conversions: 0,
  };
}

export async function generatePromoCode(
  merchantId: string,
  discount: number,
  segment: AudienceSegment,
  validDays: number = 30
): Promise<PromoCode> {
  const code = `${segment.toUpperCase()}-${discount}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  return {
    code,
    discount,
    maxUses: segment === 'all' ? 1000 : 100,
    usedCount: 0,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString(),
    minPurchase: discount >= 10 ? 50 : 20,
    applicableProducts: [],
    userSegment: segment,
  };
}

export async function validatePromoCode(
  code: string,
  userId: string,
  purchaseAmount: number
): Promise<{ valid: boolean; discount: number; message: string }> {
  // Mock validation - integrate with database
  const promoCode: PromoCode = {
    code,
    discount: 10,
    maxUses: 100,
    usedCount: 45,
    validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    minPurchase: 50,
    applicableProducts: [],
    userSegment: 'all',
  };

  if (promoCode.usedCount >= promoCode.maxUses) {
    return { valid: false, discount: 0, message: 'Promo code limit reached' };
  }

  if (new Date() > new Date(promoCode.validUntil)) {
    return { valid: false, discount: 0, message: 'Promo code expired' };
  }

  if (purchaseAmount < promoCode.minPurchase) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum purchase of R${promoCode.minPurchase} required`,
    };
  }

  return {
    valid: true,
    discount: promoCode.discount,
    message: `R${promoCode.discount} discount applied`,
  };
}

export async function createReferralProgram(merchantId: string): Promise<ReferralProgram> {
  return {
    id: `REF-${merchantId}`,
    referrerReward: 20,
    refereeReward: 10,
    active: true,
    tier: 'basic',
    requirements: {
      minReferrals: 1,
      minPurchasePerReferral: 50,
    },
  };
}

export async function generateReferralCode(userId: string): Promise<string> {
  // Memorable referral codes for easy sharing
  const adjectives = ['SAVE', 'SHOP', 'WIN', 'BONUS', 'LUCKY'];
  const numbers = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${numbers}`;
}

export async function trackReferral(
  referrerCode: string,
  refereeId: string
): Promise<ReferralTracking> {
  return {
    referrerId: 'user-referrer-id',
    refereeId,
    status: 'pending',
    referralCode: referrerCode,
    rewardAmount: 20,
    createdAt: new Date().toISOString(),
  };
}

export async function sendCampaignMessage(
  campaign: Campaign,
  recipients: string[],
  language: string = 'en'
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      if (campaign.type === 'sms') {
        // Send SMS via gateway
        console.log(`SMS to ${recipient}: ${campaign.message}`);
        sent++;
      } else if (campaign.type === 'email') {
        // Send email
        console.log(`Email to ${recipient}: ${campaign.message}`);
        sent++;
      } else if (campaign.type === 'push') {
        // Send push notification
        console.log(`Push to ${recipient}: ${campaign.message}`);
        sent++;
      }
    } catch (error) {
      failed++;
    }
  }

  return { sent, failed };
}

export async function getAudienceSize(segment: AudienceSegment): Promise<number> {
  // Mock audience sizes
  const sizes: Record<AudienceSegment, number> = {
    all: 50000,
    new_users: 5000,
    grant_recipients: 12000,
    high_value: 3000,
    inactive: 8000,
    rural: 15000,
  };

  return sizes[segment] || 0;
}

export async function optimizeCampaignBudget(
  budget: number,
  channels: CampaignType[]
): Promise<Record<CampaignType, number>> {
  // Smart budget allocation
  const allocation: Record<string, number> = {};

  // SMS is most effective for grant recipients and rural users
  if (channels.includes('sms')) {
    allocation.sms = budget * 0.5;
  }

  // USSD for feature phone users
  if (channels.includes('push')) {
    allocation.push = budget * 0.3;
  }

  // Email for higher-income users
  if (channels.includes('email')) {
    allocation.email = budget * 0.2;
  }

  return allocation as Record<CampaignType, number>;
}

export async function getCampaignPerformance(campaignId: string): Promise<{
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
}> {
  return {
    impressions: 10000,
    clicks: 2500,
    conversions: 875,
    revenue: 43750,
    roi: 3.5,
  };
}
