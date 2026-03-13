import React from 'react';

// This file serves as documentation - not a functional component
// Technical Specification for eVoucher Consumer Web Application

/*
================================================================================
eVOUCHER CONSUMER WEB APPLICATION - TECHNICAL SPECIFICATION
================================================================================

Document Version: 1.0
Date: November 2025
Platform: React Web Application (Progressive Web App)
Purpose: Department of Trade and Industry Prototype Demonstration

================================================================================
TABLE OF CONTENTS
================================================================================
1. Executive Summary
2. Technology Stack
3. Design System & Theme
4. Data Models (Entities)
5. Pre-Seeded Demo Data
6. Consumer Journey & Features
7. Page-by-Page Specification
8. Component Architecture
9. API Integration Patterns
10. Rewards & Gamification System
11. Accessibility Features
12. Deployment Requirements

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
- Framer Motion (Animations - optional)

STATE MANAGEMENT:
- React Query for server state
- useState/useContext for local state

STYLING:
- TailwindCSS with custom theme variables
- Mobile-first responsive design
- CSS Variables for theming

BUILD & TOOLING:
- Vite or Create React App
- ESLint + Prettier

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
--text-muted: #9CA3AF 
--success: #10B981 (Green)
--warning: #F59E0B (Amber)
--error: #EF4444 (Red)
--border: #E5E7EB

TIER COLORS:
- Bronze: from-amber-600 to-amber-700
- Silver: from-gray-400 to-gray-500
- Gold: from-yellow-500 to-yellow-600
- Platinum: from-purple-500 to-purple-600

TYPOGRAPHY:
- Font Family: System fonts (Inter, -apple-system, sans-serif)
- Headings: font-bold, various sizes (text-xl to text-3xl)
- Body: text-sm to text-base
- Small/Labels: text-xs

SPACING & LAYOUT:
- Container max-width: 448px (max-w-md) - mobile-optimized
- Padding: px-4, py-6 standard
- Border Radius: rounded-xl (12px), rounded-2xl (16px), rounded-full
- Shadows: shadow-sm, shadow-md, shadow-lg

COMPONENT PATTERNS:
- Cards: White background, subtle border, rounded corners
- Buttons: Full-width primary actions, rounded-xl
- Headers: Teal gradient with white text, rounded-b-[32px]
- Bottom Navigation: Fixed, 5 items with icons

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
  totalRevenue: number (default: 0),
  totalRedemptions: number (default: 0)
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
  rewardsTier: enum ["bronze", "silver", "gold", "platinum"] (default: "bronze"),
  rewardsPoints: number (default: 0),
  referralCode: string (unique, e.g., "EVAB1234"),
  referredBy: string (optional),
  referralCount: number (default: 0),
  referralEarnings: number (default: 0),
  ussdEnabled: boolean (default: false),
  smsNotifications: boolean (default: true),
  isFeaturePhone: boolean (default: false)
}

4.5 TRANSACTION
{
  id: string,
  type: enum ["purchase", "redemption", "payout", "settlement"],
  amount: number,
  userId: string,
  userEmail: string,
  merchantId: string,
  merchantName: string,
  voucherInstanceId: string,
  paymentMethod: enum ["card", "eft", "wallet", "credit_card"],
  status: enum ["pending", "completed", "failed"],
  reference: string,
  description: string,
  created_date: datetime
}

4.6 WALLET_TRANSACTION
{
  id: string,
  userId: string,
  userEmail: string,
  type: enum ["deposit", "withdrawal", "transfer", "voucher_purchase", 
              "referral_bonus", "reward_cashback", "gift_voucher"],
  amount: number,
  balanceAfter: number,
  reference: string,
  description: string,
  recipientPhone: string (for gift vouchers),
  recipientName: string,
  status: enum ["pending", "completed", "failed"]
}

4.7 BADGE
{
  id: string,
  userId: string,
  userEmail: string,
  badgeType: enum ["first_purchase", "first_redemption", "referral_starter",
                   "referral_master", "big_spender", "loyal_customer",
                   "early_bird", "community_hero", "savings_champion", "streak_7_days"],
  earnedDate: datetime
}

4.8 POINTS_REWARD
{
  id: string,
  name: string,
  description: string,
  pointsCost: number,
  category: enum ["food", "discount", "voucher", "experience"],
  merchantId: string,
  merchantName: string,
  imageUrl: string,
  stock: number (default: 100),
  status: enum ["active", "inactive"]
}

4.9 REFERRAL
{
  id: string,
  referrerUserId: string,
  referrerEmail: string,
  referredUserId: string,
  referredEmail: string,
  referredPhone: string,
  referralCode: string,
  bonusAmount: number (default: 20),
  status: enum ["pending", "completed", "expired"],
  completedDate: datetime
}

================================================================================
5. PRE-SEEDED DEMO DATA
================================================================================

5.1 MERCHANTS (8 Community-Focused Stores)

[
  { name: "Shoprite", category: "grocery", logo: "[Shoprite logo URL]" },
  { name: "Pick n Pay", category: "grocery", logo: "[PnP logo URL]" },
  { name: "Clicks", category: "pharmacy", logo: "[Clicks logo URL]" },
  { name: "Mr Price", category: "fashion", logo: "[MrPrice logo URL]" },
  { name: "Pep", category: "fashion", logo: "[Pep logo URL]" },
  { name: "Boxer", category: "grocery", logo: "[Boxer logo URL]" },
  { name: "Ackermans", category: "fashion", logo: "[Ackermans logo URL]" },
  { name: "Spaza Shop (CWP)", category: "retail", logo: null }
]

5.2 VOUCHER PRODUCTS (Per Merchant)

For each merchant, create products at these face values:
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
  referralCount: 3,
  referralEarnings: 60
}

5.4 SAMPLE VOUCHER INSTANCES (For Demo)

[
  { merchantName: "Shoprite", faceValue: 500, remainingBalance: 320, status: "partially_redeemed" },
  { merchantName: "Clicks", faceValue: 200, remainingBalance: 200, status: "active" },
  { merchantName: "Pick n Pay", faceValue: 100, remainingBalance: 0, status: "fully_redeemed" }
]

5.5 SAMPLE BADGES (Pre-earned)

["first_purchase", "first_redemption", "referral_starter", "community_hero"]

5.6 POINTS REWARDS CATALOG

[
  { name: "Free Coffee", pointsCost: 200, category: "food", merchantName: "Vida e Caffè" },
  { name: "R10 Discount", pointsCost: 100, category: "discount" },
  { name: "R25 Bonus Voucher", pointsCost: 500, category: "voucher" },
  { name: "Double Points Day", pointsCost: 150, category: "experience" },
  { name: "Free Airtime R10", pointsCost: 250, category: "voucher" },
  { name: "Movie Ticket", pointsCost: 800, category: "experience", merchantName: "Ster-Kinekor" }
]

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
- Voucher detail cards with:
  - Merchant name & logo
  - Voucher code
  - Remaining balance
  - Usage progress bar
  - QR code display
  - Redeem button

✅ VOUCHER REDEMPTION
- QR code generation for each voucher
- Manual code display
- Partial redemption support
- Redemption confirmation

✅ SEND GIFT VOUCHER
- 3-step wizard:
  1. Enter recipient phone + name
  2. Select merchant + amount
  3. Review & send
- SMS delivery to recipient

✅ REWARDS PROGRAM
- Current tier display with icon
- Points balance
- Progress to next tier
- 4 tabs:
  - Overview: Progress, bonus merchants, recent badges
  - Badges: All 10 badges with locked/unlocked states
  - Store: Redeemable rewards catalog
  - Leaderboard: Top 10 users

✅ GAMIFICATION ELEMENTS
- 10 Achievable Badges
- Points multipliers per tier
- Bonus point merchants (2x, 3x)
- Weekly challenges (future)

✅ PROFILE & SETTINGS
- User info display
- Transaction history
- Payment methods management
- Notification preferences (Push, Email, SMS, USSD)
- Settings (Language, Biometric, Auto-lock)
- Help & Support (FAQs, Contact)
- Privacy & Security

✅ ACCESSIBILITY
- USSD access for non-smartphone users
- SMS voucher delivery
- High contrast UI
- Large touch targets

================================================================================
7. PAGE-BY-PAGE SPECIFICATION
================================================================================

7.1 LANDING PAGE (pages/Landing.jsx)
------------------------------------
LAYOUT:
- Teal header with rounded bottom
- Logo + tagline
- 4 value proposition cards
- "Get Started" CTA button
- Merchant/Admin access links (can hide for demo)

CONTENT:
- "Save 4% Instantly" - Pay R960 for R1,000 vouchers
- "Community Stores" - Shoprite, Spaza, Pep & more
- "Earn Rewards" - Bronze to Platinum tier benefits
- "USSD & SMS Access" - No smartphone needed


7.2 CONSUMER HOME (pages/ConsumerHome.jsx)
------------------------------------------
SECTIONS:
1. Header (Teal)
   - Greeting: "Good day, [Name]"
   - Notification bell icon
   - Tier badge (e.g., "Silver Member")

2. Balance Card (-mt-12, overlapping header)
   - "Wallet Balance: R[amount]"
   - "Add Funds" button
   - "Send Gift" button

3. Referral Card (Purple gradient)
   - "Your Referral Code: [CODE]"
   - Copy button
   - "Earn R20 for every friend!"

4. USSD Banner (Blue)
   - Phone icon
   - "No Smartphone? Dial *120*384#"

5. Featured Stores (Horizontal scroll)
   - Merchant logo circles
   - Merchant names

6. Hot Deals (2-column grid)
   - VoucherCard components (compact)


7.3 SHOP PAGE (pages/Shop.jsx)
------------------------------
SECTIONS:
1. Header with back button
2. Search input
3. Category filter chips (horizontal scroll)
4. Merchant filter chips
5. Results count
6. Voucher product list (full cards)

FILTERS:
- Categories: All, Grocery, Pharmacy, Fashion, Electronics, Retail
- Merchants: All Stores, [Each merchant]


7.4 CHECKOUT PAGE (pages/Checkout.jsx)
--------------------------------------
URL PARAMS: ?productId=[id]

SECTIONS:
1. Header
2. Order Summary Card
   - Merchant logo + name
   - Voucher value
   - Discount amount
   - Final price

3. Payment Method Selection
   - Credit/Debit Card (with form)
   - Instant EFT
   - eVoucher Wallet

4. Card Details Form (conditional)
   - Card number
   - Expiry (MM/YY)
   - CVV

5. Pay Button

SUCCESS STATE:
- Green checkmark
- "Purchase Successful!"
- "View My Vouchers" button
- "Buy More" button


7.5 CONSUMER WALLET (pages/ConsumerWallet.jsx)
----------------------------------------------
SECTIONS:
1. Header (Teal)
   - "Total Voucher Balance: R[amount]"
   - Active voucher count

2. Quick Actions (3-column grid)
   - Buy Voucher
   - Send Gift
   - History

3. Vouchers List
   - For each voucher:
     - Merchant name + initial
     - Voucher code (with copy)
     - Remaining balance
     - Progress bar
     - Redeem button
     - QR code button

EMPTY STATE:
- Gift icon
- "No vouchers yet"
- "Browse Vouchers" button


7.6 VOUCHER QR MODAL (components/pos/VoucherQRModal.jsx)
--------------------------------------------------------
CONTENT:
- QR code (180x180)
- Merchant name
- Balance amount
- Voucher code with copy button
- "Show this QR code to the cashier"


7.7 SEND VOUCHER (pages/SendVoucher.jsx)
----------------------------------------
3-STEP WIZARD:

Step 1 - Recipient:
- Phone number input
- Recipient name (optional)
- "They'll receive via SMS"

Step 2 - Voucher Details:
- Merchant dropdown
- Amount input
- Quick amount buttons (R50, R100, R200, R500)
- Personal message (optional)

Step 3 - Confirmation:
- Gift summary card
- Message preview
- Note about SMS delivery
- Send button

SUCCESS STATE:
- Checkmark animation
- "Voucher Sent!"
- "Back to Home" button


7.8 REWARDS PAGE (pages/Rewards.jsx)
------------------------------------
HEADER:
- Tier-colored gradient
- Tier icon (Award/Star/Crown/Gem)
- "[Tier] Member"
- Points balance with sparkle icon

4 TABS:

TAB 1 - Overview:
- Progress to next tier (progress bar)
- Bonus Point Merchants card
- Recent badges (horizontal scroll)
- "How to Earn Points" info card

TAB 2 - Badges:
- Count: "X / 10 earned"
- Badge list with locked/unlocked states
- Badge details: icon, name, description, earned date

TAB 3 - Store:
- Points balance card
- Reward cards:
  - Category icon
  - Reward name
  - Description
  - Points cost
  - Redeem button

TAB 4 - Leaderboard:
- Trophy icon header
- Top 10 users
- Rank medals (gold/silver/bronze)
- User avatar, name, points, badge count
- "You" indicator for current user


7.9 PROFILE PAGE (pages/Profile.jsx)
------------------------------------
SECTIONS:
1. Header (Teal)
2. Profile Card
   - Avatar placeholder
   - Name, email
   - Tier badge
   - Stats: Total Spent | Referrals | Tier

3. USSD Info Card

4. Menu Items (Links):
   - Transaction History
   - Payment Methods
   - Notifications
   - Settings
   - Help & Support
   - Privacy & Security

5. Logout button
6. App version footer


7.10 TRANSACTION HISTORY (pages/TransactionHistory.jsx)
-------------------------------------------------------
FILTERS: All, Purchases, Redemptions

LIST:
- Transaction icon (by type)
- Description
- Date/time
- Amount (+/-)
- Status badge


7.11 PAYMENT METHODS (pages/PaymentMethods.jsx)
-----------------------------------------------
SECTIONS:
1. Cards list
   - Card type icon
   - Last 4 digits
   - Expiry
   - Default badge
   - Delete button
   - Add card button

2. Bank Accounts list


7.12 NOTIFICATIONS (pages/Notifications.jsx)
--------------------------------------------
SECTIONS:
1. Channels
   - Push Notifications (toggle)
   - Email Notifications (toggle)
   - SMS Notifications (toggle)
   - USSD Access (toggle)

2. Preferences
   - Promotions & Deals (toggle)
   - Rewards Updates (toggle)
   - Transactions (toggle)


7.13 SETTINGS (pages/Settings.jsx)
----------------------------------
SECTIONS:
1. Install App Banner (PWA prompt)
2. USSD Info Card
3. Appearance
   - Language selector (EN, Zulu, Afrikaans, Xhosa, etc.)
4. Security
   - Biometric Login (toggle)
   - Auto-Lock (toggle)
5. Actions
   - Share with Friends
   - Rate Us


7.14 HELP & SUPPORT (pages/HelpSupport.jsx)
-------------------------------------------
SECTIONS:
1. Search bar
2. Contact options (3-column)
   - Live Chat
   - Call Us
   - Email
3. USSD Help Card
4. FAQs (Accordion)
5. Send Message form


7.15 PRIVACY & SECURITY (pages/PrivacySecurity.jsx)
---------------------------------------------------
SECTIONS:
1. Security Status Card (green if all enabled)
2. Security Settings
   - Two-Factor Authentication (toggle)
   - Biometric Login (toggle)
   - Login Alerts (toggle)
3. Privacy Settings
   - Share Usage Data (toggle)
4. Legal Links
   - Privacy Policy
   - Terms of Service
   - Cookie Policy
5. Actions
   - Change Password
   - Delete Account


================================================================================
8. COMPONENT ARCHITECTURE
================================================================================

8.1 LAYOUT COMPONENTS
---------------------
MobileContainer - Main wrapper (max-w-md, centered)
BottomNav - Fixed bottom navigation (5 items)
GoldButton - Primary CTA button (teal themed)

8.2 UI COMPONENTS (from shadcn/ui)
----------------------------------
Card, Button, Input, Dialog, Select, Switch, Badge, Tabs

8.3 CUSTOM COMPONENTS
---------------------
/components/ui/
  - MobileContainer.jsx
  - GoldButton.jsx
  - VoucherCard.jsx
  - WalletVoucherCard.jsx
  - RewardsTierBadge.jsx

/components/navigation/
  - BottomNav.jsx

/components/rewards/
  - BadgeCard.jsx
  - Leaderboard.jsx
  - RewardCard.jsx

/components/pos/
  - QRCodeDisplay.jsx
  - VoucherQRModal.jsx


================================================================================
9. API INTEGRATION PATTERNS
================================================================================

DATA FETCHING (React Query):

// List entities
const { data, isLoading } = useQuery({
  queryKey: ['entityName'],
  queryFn: () => api.entities.EntityName.list()
});

// Filter entities
const { data } = useQuery({
  queryKey: ['entityName', filters],
  queryFn: () => api.entities.EntityName.filter(filters)
});

// Create entity
const mutation = useMutation({
  mutationFn: (data) => api.entities.EntityName.create(data),
  onSuccess: () => queryClient.invalidateQueries(['entityName'])
});

// Update entity
const mutation = useMutation({
  mutationFn: ({ id, data }) => api.entities.EntityName.update(id, data)
});


================================================================================
10. REWARDS & GAMIFICATION SYSTEM
================================================================================

10.1 TIER STRUCTURE
-------------------
BRONZE (R0 - R1,999 spent):
- 4% discount on vouchers
- 1x points multiplier
- Basic support
- SMS notifications

SILVER (R2,000 - R4,999 spent):
- 5% discount on vouchers
- 1.5x points multiplier
- Early deal access
- R25 referral bonus

GOLD (R5,000 - R9,999 spent):
- 6% discount on vouchers
- 2x points multiplier
- Birthday R50 bonus
- R35 referral bonus
- Flash sale access

PLATINUM (R10,000+ spent):
- 8% discount on vouchers
- 3x points multiplier
- Monthly R100 bonus
- R50 referral bonus
- VIP support
- Free gift voucher delivery

10.2 POINTS EARNING
-------------------
- Every R10 spent = 10 points
- First purchase = 50 bonus points
- Refer a friend = 100 points
- Daily login streak = 5 points/day
- Badge earned = 25 points

10.3 BONUS POINT MERCHANTS
--------------------------
- Shoprite: 2x points
- Clicks: 3x points
- Pick n Pay: 2x points

10.4 BADGE SYSTEM
-----------------
| Badge ID          | Name              | Criteria                    |
|-------------------|-------------------|----------------------------|
| first_purchase    | First Steps       | Made first voucher purchase |
| first_redemption  | First Redemption  | Redeemed first voucher     |
| referral_starter  | Referral Starter  | Referred first friend      |
| referral_master   | Referral Master   | Referred 10+ friends       |
| big_spender       | Big Spender       | Spent over R5,000          |
| loyal_customer    | Loyal Customer    | Active for 3+ months       |
| early_bird        | Early Bird        | First 100 users            |
| community_hero    | Community Hero    | Supported 5+ merchants     |
| savings_champion  | Savings Champion  | Saved over R500            |
| streak_7_days     | 7-Day Streak      | Active 7 days in a row     |


================================================================================
11. ACCESSIBILITY FEATURES
================================================================================

- USSD fallback: *120*384# for non-smartphone users
- SMS voucher delivery for gift recipients
- High contrast color scheme
- Touch target minimum 44x44px
- Font size minimum 14px (16px for inputs)
- Language support: English, isiZulu, Afrikaans, isiXhosa, Sesotho, Setswana


================================================================================
12. DEPLOYMENT REQUIREMENTS
================================================================================

HOSTING:
- Static site hosting (Vercel, Netlify, AWS S3 + CloudFront)
- CDN for assets
- SSL certificate required

ENVIRONMENT VARIABLES:
- API_BASE_URL
- ANALYTICS_ID (optional)

PWA REQUIREMENTS:
- manifest.json with app icons
- Service worker for offline caching
- Add to home screen capability

BROWSER SUPPORT:
- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+
- Samsung Internet 12+

================================================================================
END OF SPECIFICATION
================================================================================
*/

export default function TechnicalSpec() {
  return null;
}