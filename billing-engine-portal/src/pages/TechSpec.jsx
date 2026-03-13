import React from 'react';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useState } from 'react';

const specContent = `
================================================================================
eVOUCHER CONSUMER WEB APPLICATION - TECHNICAL SPECIFICATION
================================================================================

Document Version: 1.0
Date: November 2025
Platform: React Web Application (Progressive Web App)
Purpose: Department of Trade and Industry Prototype Demonstration

================================================================================
1. EXECUTIVE SUMMARY
================================================================================

eVoucher is a community-focused digital voucher platform enabling South African 
consumers to purchase vouchers at a 4% discount, supporting local merchants 
while providing a modern, accessible savings tool.

KEY VALUE PROPOSITIONS:
- 4% instant savings on every voucher purchase
- Support for community merchants (Shoprite, Pick n Pay, Spaza shops, etc.)
- USSD/SMS access for users without smartphones (*120*384#)
- Gamified rewards with Bronze → Platinum tier progression
- Gift voucher sending to any phone number
- Referral program with R20 bonus per successful referral

================================================================================
2. TECHNOLOGY STACK
================================================================================

FRONTEND:
- React 18.x (Functional Components with Hooks)
- TailwindCSS (Utility-first styling)
- shadcn/ui (Component library)
- Lucide React (Icon library)
- React Router DOM (Navigation)
- TanStack React Query (Data fetching & caching)

STATE MANAGEMENT:
- React Query for server state
- useState/useContext for local state

STYLING:
- TailwindCSS with custom theme variables
- Mobile-first responsive design
- CSS Variables for theming

================================================================================
3. DESIGN SYSTEM & THEME
================================================================================

COLOR PALETTE (Discovery-style Teal/White Theme):
--primary: #00A89D (Teal - main brand color)
--primary-hover: #008F86
--background: #F3F4F6 (Light gray)
--card-bg: #FFFFFF
--text-primary: #111827 (Near black)
--text-secondary: #6B7280 (Gray)
--success: #10B981 (Green)
--warning: #F59E0B (Amber)
--error: #EF4444 (Red)

TIER COLORS:
- Bronze: from-amber-600 to-amber-700
- Silver: from-gray-400 to-gray-500
- Gold: from-yellow-500 to-yellow-600
- Platinum: from-purple-500 to-purple-600

================================================================================
4. DATA MODELS (ENTITIES)
================================================================================

4.1 MERCHANT
{
  id: string,
  name: string,
  logo: string (URL),
  category: enum ["retail", "pharmacy", "grocery", "fashion", "electronics"],
  email: string,
  status: enum ["active", "pending", "suspended"],
  totalRevenue: number,
  totalRedemptions: number
}

4.2 VOUCHER_PRODUCT
{
  id: string,
  merchantId: string,
  merchantName: string,
  description: string,
  faceValue: number,
  consumerPrice: number (96% of faceValue),
  merchantPayout: number (92% of faceValue),
  platformMargin: number (4% of faceValue),
  status: enum ["active", "inactive"]
}

4.3 VOUCHER_INSTANCE
{
  id: string,
  voucherProductId: string,
  merchantId: string,
  merchantName: string,
  consumerId: string,
  consumerEmail: string,
  faceValue: number,
  remainingBalance: number,
  purchasePrice: number,
  voucherCode: string (e.g., "EV1ABC234"),
  status: enum ["active", "partially_redeemed", "fully_redeemed", "expired"],
  purchaseDate: datetime
}

4.4 CONSUMER_PROFILE
{
  id: string,
  userId: string,
  email: string,
  fullName: string,
  phone: string,
  walletBalance: number (default: 0),
  totalSpent: number (default: 0),
  rewardsTier: enum ["bronze", "silver", "gold", "platinum"],
  rewardsPoints: number (default: 0),
  referralCode: string (unique),
  referredBy: string (optional),
  referralCount: number,
  referralEarnings: number,
  ussdEnabled: boolean,
  smsNotifications: boolean,
  isFeaturePhone: boolean
}

4.5 TRANSACTION
{
  id: string,
  type: enum ["purchase", "redemption", "payout", "settlement"],
  amount: number,
  userId: string,
  merchantId: string,
  merchantName: string,
  voucherInstanceId: string,
  paymentMethod: enum ["card", "eft", "wallet"],
  status: enum ["pending", "completed", "failed"],
  reference: string,
  description: string
}

4.6 BADGE
{
  id: string,
  userId: string,
  badgeType: enum ["first_purchase", "first_redemption", "referral_starter",
                   "referral_master", "big_spender", "loyal_customer",
                   "early_bird", "community_hero", "savings_champion", "streak_7_days"],
  earnedDate: datetime
}

4.7 POINTS_REWARD
{
  id: string,
  name: string,
  description: string,
  pointsCost: number,
  category: enum ["food", "discount", "voucher", "experience"],
  merchantName: string,
  status: enum ["active", "inactive"]
}

================================================================================
5. PRE-SEEDED DEMO DATA
================================================================================

5.1 MERCHANTS (8 Community-Focused Stores)
- Shoprite (grocery)
- Pick n Pay (grocery)
- Clicks (pharmacy)
- Mr Price (fashion)
- Pep (fashion)
- Boxer (grocery)
- Ackermans (fashion)
- Spaza Shop CWP (retail)

5.2 VOUCHER PRODUCTS (Per Merchant)
- R50 (Consumer pays R48)
- R100 (Consumer pays R96)
- R200 (Consumer pays R192)
- R500 (Consumer pays R480)
- R1,000 (Consumer pays R960)

5.3 DEMO CONSUMER PROFILE
{
  fullName: "Thabo Mokoena",
  email: "demo@evoucher.co.za",
  phone: "082 123 4567",
  walletBalance: 150,
  totalSpent: 2450,
  rewardsTier: "silver",
  rewardsPoints: 520,
  referralCode: "EVTHABO24",
  referralCount: 3
}

5.4 POINTS REWARDS CATALOG
- Free Coffee (200 pts) - Vida e Caffè
- R10 Discount (100 pts)
- R25 Bonus Voucher (500 pts)
- Double Points Day (150 pts)
- Free Airtime R10 (250 pts)
- Movie Ticket (800 pts) - Ster-Kinekor

================================================================================
6. CONSUMER JOURNEY & FEATURES
================================================================================

JOURNEY FLOW:
Landing → Sign Up/Login → Home Dashboard → Browse Shop → Purchase Voucher 
→ Checkout → Wallet (View Vouchers) → Redeem (QR Code) → Earn Rewards

FEATURE LIST:

✅ AUTHENTICATION & ONBOARDING
- Landing page with value propositions
- Sign up / Login flow
- Profile setup

✅ HOME DASHBOARD
- Wallet balance display
- Rewards tier badge
- Referral code with copy function
- USSD access banner (*120*384#)
- Featured merchants carousel
- Hot deals grid

✅ SHOP / BROWSE VOUCHERS
- Search functionality
- Category filters (All, Grocery, Pharmacy, Fashion, etc.)
- Merchant filter
- Voucher cards showing savings

✅ CHECKOUT & PAYMENT
- Order summary
- Payment method selection (Card, EFT, Wallet)
- Card details input
- Purchase confirmation

✅ WALLET & VOUCHER MANAGEMENT
- Total voucher balance
- List of active vouchers
- QR code display per voucher
- Partial redemption support

✅ SEND GIFT VOUCHER
- 3-step wizard (Recipient → Amount → Confirm)
- SMS delivery to recipient

✅ REWARDS PROGRAM
- 4-tier system (Bronze/Silver/Gold/Platinum)
- Points earning & redemption
- 10 achievable badges
- Leaderboard

✅ PROFILE & SETTINGS
- Transaction history
- Payment methods
- Notifications (Push, Email, SMS, USSD)
- Help & Support
- Privacy & Security

================================================================================
7. PAGE STRUCTURE
================================================================================

/pages/Landing.jsx - Welcome & value props
/pages/ConsumerHome.jsx - Main dashboard
/pages/Shop.jsx - Browse vouchers
/pages/Checkout.jsx - Purchase flow
/pages/ConsumerWallet.jsx - View vouchers
/pages/SendVoucher.jsx - Gift voucher wizard
/pages/Rewards.jsx - Rewards & gamification
/pages/Profile.jsx - User profile
/pages/TransactionHistory.jsx - Past transactions
/pages/PaymentMethods.jsx - Saved cards
/pages/Notifications.jsx - Notification settings
/pages/Settings.jsx - App settings
/pages/HelpSupport.jsx - FAQs & contact
/pages/PrivacySecurity.jsx - Security settings
/pages/Wallet.jsx - Fund wallet

================================================================================
8. COMPONENT ARCHITECTURE
================================================================================

/components/ui/
  - MobileContainer.jsx (Main wrapper)
  - GoldButton.jsx (Primary CTA)
  - VoucherCard.jsx (Product display)

/components/navigation/
  - BottomNav.jsx (5-tab navigation)

/components/rewards/
  - BadgeCard.jsx (Badge display)
  - Leaderboard.jsx (Top users)
  - RewardCard.jsx (Redeemable items)

/components/pos/
  - QRCodeDisplay.jsx (QR generator)
  - VoucherQRModal.jsx (QR modal)

================================================================================
9. REWARDS & GAMIFICATION SYSTEM
================================================================================

TIER STRUCTURE:
| Tier     | Spend Range      | Discount | Points Multiplier |
|----------|------------------|----------|-------------------|
| Bronze   | R0 - R1,999      | 4%       | 1x                |
| Silver   | R2,000 - R4,999  | 5%       | 1.5x              |
| Gold     | R5,000 - R9,999  | 6%       | 2x                |
| Platinum | R10,000+         | 8%       | 3x                |

POINTS EARNING:
- Every R10 spent = 10 points
- First purchase = 50 bonus points
- Refer a friend = 100 points
- Daily login = 5 points

BONUS MERCHANTS:
- Shoprite: 2x points
- Clicks: 3x points
- Pick n Pay: 2x points

BADGES (10 Total):
1. First Steps - First purchase
2. First Redemption - First voucher use
3. Referral Starter - First referral
4. Referral Master - 10+ referrals
5. Big Spender - R5,000+ spent
6. Loyal Customer - 3+ months active
7. Early Bird - First 100 users
8. Community Hero - 5+ merchants supported
9. Savings Champion - R500+ saved
10. 7-Day Streak - Active 7 consecutive days

================================================================================
10. ACCESSIBILITY FEATURES
================================================================================

- USSD fallback: *120*384# for non-smartphone users
- SMS voucher delivery for gift recipients
- High contrast color scheme
- Touch target minimum 44x44px
- Language support: English, isiZulu, Afrikaans, isiXhosa, Sesotho, Setswana

================================================================================
11. DEPLOYMENT REQUIREMENTS
================================================================================

HOSTING: Static site (Vercel, Netlify, AWS)
PWA: manifest.json + Service Worker
SSL: Required
BROWSERS: Chrome 80+, Safari 13+, Firefox 75+, Edge 80+

================================================================================
END OF SPECIFICATION
================================================================================
`;

export default function TechSpec() {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([specContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eVoucher_Technical_Specification.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(specContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileContainer>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Technical Specification</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <Card className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#00A89D]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#00A89D]" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">eVoucher Consumer App</h2>
                <p className="text-gray-500 text-sm">Technical Specification v1.0</p>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Complete technical specification for the eVoucher consumer web application, 
              including data models, UI specifications, rewards system, and deployment requirements.
            </p>

            <div className="space-y-3">
              <GoldButton className="w-full h-12" onClick={handleDownload}>
                <Download className="w-5 h-5 mr-2" />
                Download Specification (.txt)
              </GoldButton>
              
              <GoldButton variant="outline" className="w-full h-12" onClick={handleCopy}>
                {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </GoldButton>
            </div>
          </Card>

          {/* Preview */}
          <Card className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Document Contents:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>1. Executive Summary</li>
              <li>2. Technology Stack</li>
              <li>3. Design System & Theme</li>
              <li>4. Data Models (7 Entities)</li>
              <li>5. Pre-Seeded Demo Data</li>
              <li>6. Consumer Journey & Features</li>
              <li>7. Page Structure (15 Pages)</li>
              <li>8. Component Architecture</li>
              <li>9. Rewards & Gamification System</li>
              <li>10. Accessibility Features</li>
              <li>11. Deployment Requirements</li>
            </ul>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
}