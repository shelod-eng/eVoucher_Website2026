import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, FileText, Copy, Check, ArrowLeft, 
  Shield, Users, Building2, TrendingUp, Lock, 
  Smartphone, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Printer } from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/67132f111_evoucher_logo.png";

const reportContent = `
================================================================================
eVOUCHER PLATFORM - STAKEHOLDER SUMMARY REPORT
================================================================================

Document: Government Stakeholder Summary
Date: 2 December 2025
Status: For Stakeholder Review
Prepared for: Department of Trade and Industry (DTI)

================================================================================
EXECUTIVE SUMMARY
================================================================================

eVoucher is a secure, inclusive national-ready digital voucher platform designed 
to support South African households, merchants, and government priorities through 
innovative digital commerce for social impact.

TARGET BENEFICIARIES:
• Social grant recipients (SASSA households)
• Low-income households
• Township communities
• Non-smartphone users (via USSD/SMS)

CORE VALUE PROPOSITION:
• 4% instant savings on voucher purchases
• One digital system serving all merchants and consumers
• Built for government alignment (SARB, PASA, POPIA)
• Inspired by Discovery's shared-value model

================================================================================
1. CYBER SECURITY & RISK MITIGATION
================================================================================

Ministerial Concern: Robust cyber security, POPIA compliance, and data protection.

SECURITY INFRASTRUCTURE:
• AES-256 encryption for personal & voucher data
• TLS 1.3 for secure communication
• Multi-Factor Authentication for merchants
• Role-based access control
• Full audit logging & fraud detection
• Zero-cash system prevents leakage
• Offline encrypted voucher tokens
• POPIA-aligned data governance

COMPLIANCE FRAMEWORK:
• POPIA (Protection of Personal Information Act)
• PASA (Payment Association of South Africa)
• SARB (South African Reserve Bank - stored value system)
• FIC alignment
• Regular cybersecurity audits

================================================================================
2. IMPACT ON THE POOREST OF THE POOR
================================================================================

TARGET BENEFICIARIES:
• SASSA households: pensioners, disability, child grants
• Unemployed youth and informal workers
• Rural and township families
• Non-smartphone users via USSD/SMS (*120*384#)

PLATFORM BENEFITS:
• Merchant-funded discounts reduce cost of living
• No data/Wi-Fi required (offline mode)
• Secure encrypted voucher distribution
• Township merchant upliftment
• Real cash savings on everyday essentials

PROJECTED IMPACT:
• 26 million potential beneficiaries
• R779 average monthly spend per household
• Significant reduction in cost of living burden

================================================================================
3. GOVERNMENT PARTNERSHIP & MERCHANT ONBOARDING
================================================================================

WHAT WE NEED FROM DTI:
• National endorsement to onboard major retailers
• Access to Pick-It-Up / CWP community worker database
• Support in POPIA compliance, consumer protection, data governance
• A seat in Digital Transformation Committees

TARGET MERCHANT PARTNERS:
• Shoprite / uSave
• Pick n Pay
• Boxer
• Pep / Ackermans
• Mr Price
• Clicks
• Township merchants via CWP network

GOVERNMENT BENEFITS:
• Social impact analytics and reporting
• Economic activity uplift measurement
• Fraud-resistant voucher delivery
• Transparency in grant spending
• Support for township economy + CWP integration

================================================================================
4. DISCOUNT LOGIC & BENEFIT DISTRIBUTION
================================================================================

DISCOUNT MODEL:
Total Merchant Discount: 5%
• 2.5% → Consumer savings (direct benefit)
• 2.5% → Platform sustainability (operations, marketing, upliftment)

Consumer Example:
• R1,000 voucher → Pay R975 → Save R25
• R500 voucher → Pay R487.50 → Save R12.50

MARKETING STRATEGY:
• Daily SMS discount alerts
• Push notifications for app users
• Targeted ads on monthly statements
• CWP ambassadors educate communities
• Township-focused awareness campaigns

================================================================================
5. INFRASTRUCTURE, SCALABILITY & COMMUNITY ROLLOUT
================================================================================

DATABASE & ARCHITECTURE:
• High-availability PostgreSQL cluster
• Handles millions of transactions
• Real-time fraud-resistant ledger
• Scalable cloud infrastructure

APP RESILIENCE:
• Works offline without data/Wi-Fi
• USSD & SMS fallback for non-smartphones
• Progressive Web App (PWA) for easy access
• Low data consumption design

COMMUNITY ROLLOUT PLAN:
• Phase 1: Pilot in 3 townships with CWP support
• Phase 2: National retailer integration
• Phase 3: Full national rollout
• Marketing team negotiates merchant discounts
• Township education via CWP ambassadors

================================================================================
6. PLATFORM FEATURES - WHAT HAS BEEN DEVELOPED
================================================================================

CONSUMER FEATURES:
✅ Browse deals from major stores
✅ Buy discounted vouchers (offline-capable)
✅ Redeem in-store via QR code or voucher code
✅ Earn tier rewards (Bronze → Silver → Gold → Platinum)
✅ Receive transaction statements
✅ Available via App, USSD (*120*384#), and SMS
✅ Gift voucher sending to any phone number
✅ Referral program with R20 bonus

MERCHANT FEATURES:
✅ Merchant dashboard with analytics
✅ POS terminal for voucher redemption
✅ Real-time transaction tracking
✅ Automated payout calculations

ADMIN FEATURES:
✅ Platform-wide analytics
✅ Merchant management
✅ Consumer insights
✅ Financial reconciliation

================================================================================
7. REWARDS & GAMIFICATION SYSTEM
================================================================================

TIER STRUCTURE:
| Tier     | Min Spend   | Discount | Points Multiplier |
|----------|-------------|----------|-------------------|
| Bronze   | R0          | 4%       | 1x                |
| Silver   | R2,000      | 5%       | 1.5x              |
| Gold     | R5,000      | 6%       | 2x                |
| Platinum | R10,000     | 8%       | 3x                |

BADGES & ACHIEVEMENTS:
• First Purchase • First Redemption • Referral Starter
• Big Spender • Loyal Customer • Community Hero
• Savings Champion • 7-Day Streak

================================================================================
8. NEXT STEPS & REQUESTED SUPPORT
================================================================================

IMMEDIATE PRIORITIES:
1. DTI endorsement for national retailer engagement
2. Access to CWP/Pick-It-Up database for community outreach
3. POPIA compliance support and guidance
4. Integration with SASSA promotional campaigns
5. Seat in Digital Transformation Committees

TIMELINE:
• Month 1-2: DTI partnership formalization
• Month 3-4: Major retailer onboarding
• Month 5-6: Township pilot launch
• Month 7-12: National rollout

================================================================================
CONTACT & FURTHER INFORMATION
================================================================================

For technical demonstrations, partnership discussions, or further documentation,
please contact the eVoucher project team.

================================================================================
END OF STAKEHOLDER SUMMARY REPORT
================================================================================
`;

export default function StakeholderReport() {
  const [copied, setCopied] = useState(false);
  const [showOrganogram, setShowOrganogram] = useState(true);

  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eVoucher_Stakeholder_Summary_Report_Dec2025.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a5653] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="eVoucher" className="w-12 h-12 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold">Stakeholder Summary Report</h1>
                <p className="text-white/80 text-sm">Government Stakeholder Review</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Logo & Title Card */}
        <Card className="bg-white rounded-xl p-6 mb-6 border-0 shadow-md">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img src={LOGO_URL} alt="eVoucher Logo" className="w-32 h-32 rounded-2xl shadow-lg" />
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">eVoucher Platform</h2>
              <p className="text-[#00A89D] font-semibold mb-1">Digital Commerce for Social Impact</p>
              <p className="text-gray-600 text-sm">
                A secure, inclusive national-ready platform supporting households, merchants, and government priorities.
              </p>
              <p className="text-gray-400 text-xs mt-2">Document Date: 2 December 2025</p>
            </div>
          </div>
        </Card>

        {/* Key Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-white p-4 rounded-xl border-0 shadow-sm text-center">
            <Users className="w-8 h-8 text-[#00A89D] mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">26M</p>
            <p className="text-xs text-gray-500">Potential Users</p>
          </Card>
          <Card className="bg-white p-4 rounded-xl border-0 shadow-sm text-center">
            <TrendingUp className="w-8 h-8 text-[#00A89D] mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">4%</p>
            <p className="text-xs text-gray-500">Consumer Savings</p>
          </Card>
          <Card className="bg-white p-4 rounded-xl border-0 shadow-sm text-center">
            <Building2 className="w-8 h-8 text-[#00A89D] mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">8+</p>
            <p className="text-xs text-gray-500">Target Retailers</p>
          </Card>
          <Card className="bg-white p-4 rounded-xl border-0 shadow-sm text-center">
            <Shield className="w-8 h-8 text-[#00A89D] mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">100%</p>
            <p className="text-xs text-gray-500">POPIA Aligned</p>
          </Card>
        </div>

        {/* Download Card */}
        <Card className="bg-white rounded-xl p-6 border-0 shadow-md mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#00A89D]/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#00A89D]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Full Stakeholder Report</h3>
              <p className="text-gray-500 text-sm">Comprehensive overview for DTI review</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link to={createPageUrl('StakeholderReportPrint')}>
              <Button className="w-full h-12 bg-[#00A89D] hover:bg-[#008F86] text-white">
                <Download className="w-5 h-5 mr-2" />
                Print / Save as PDF
              </Button>
            </Link>
            
            <Button className="w-full h-12 bg-gray-700 hover:bg-gray-800 text-white" onClick={handleDownload}>
              <FileText className="w-5 h-5 mr-2" />
              Download as Text
            </Button>
            
            <Button variant="outline" className="w-full h-12 border-[#00A89D] text-[#00A89D]" onClick={handleCopy}>
              {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        </Card>

        {/* Report Contents */}
        <Card className="bg-white rounded-xl p-6 border-0 shadow-md mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Report Contents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Shield, title: '1. Cyber Security & Risk Mitigation' },
              { icon: Users, title: '2. Impact on the Poorest of the Poor' },
              { icon: Building2, title: '3. Government Partnership & Onboarding' },
              { icon: TrendingUp, title: '4. Discount Logic & Benefit Distribution' },
              { icon: Smartphone, title: '5. Infrastructure & Scalability' },
              { icon: Lock, title: '6. Platform Features Developed' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <item.icon className="w-5 h-5 text-[#00A89D]" />
                <span className="text-sm text-gray-700">{item.title}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Organogram Section */}
        <Card className="bg-white rounded-xl border-0 shadow-md mb-6 overflow-hidden">
          <button 
            className="w-full p-4 flex items-center justify-between bg-[#1a5653] text-white"
            onClick={() => setShowOrganogram(!showOrganogram)}
          >
            <h3 className="font-bold">Proposed Organisational Structure</h3>
            {showOrganogram ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showOrganogram && (
            <div className="p-6">
              {/* CEO Level */}
              <div className="flex justify-center mb-6">
                <div className="bg-[#1a5653] text-white px-6 py-3 rounded-xl text-center shadow-lg">
                  <p className="font-bold">Chief Executive Officer</p>
                  <p className="text-xs text-white/70">Strategic Leadership</p>
                </div>
              </div>
              
              {/* Connector Line */}
              <div className="flex justify-center mb-2">
                <div className="w-0.5 h-8 bg-gray-300"></div>
              </div>
              
              {/* Second Level */}
              <div className="flex justify-center mb-6">
                <div className="flex gap-4 flex-wrap justify-center">
                  <div className="bg-[#00A89D] text-white px-4 py-2 rounded-lg text-center text-sm shadow">
                    <p className="font-semibold">Chief Operations Officer</p>
                    <p className="text-xs text-white/70">Operations & Rollout</p>
                  </div>
                  <div className="bg-[#00A89D] text-white px-4 py-2 rounded-lg text-center text-sm shadow">
                    <p className="font-semibold">Chief Technology Officer</p>
                    <p className="text-xs text-white/70">Platform & Security</p>
                  </div>
                  <div className="bg-[#00A89D] text-white px-4 py-2 rounded-lg text-center text-sm shadow">
                    <p className="font-semibold">Chief Financial Officer</p>
                    <p className="text-xs text-white/70">Finance & Compliance</p>
                  </div>
                </div>
              </div>
              
              {/* Connector Lines */}
              <div className="flex justify-center gap-20 mb-2">
                <div className="w-0.5 h-6 bg-gray-300"></div>
                <div className="w-0.5 h-6 bg-gray-300"></div>
                <div className="w-0.5 h-6 bg-gray-300"></div>
              </div>
              
              {/* Third Level - Departments */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Operations */}
                <div className="space-y-2">
                  <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Marketing & Communications</p>
                  </div>
                  <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Merchant Relations</p>
                  </div>
                  <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">CWP Coordination</p>
                  </div>
                  <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Customer Support</p>
                  </div>
                </div>
                
                {/* Technology */}
                <div className="space-y-2">
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Platform Development</p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Cyber Security</p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Infrastructure & DevOps</p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Data Analytics</p>
                  </div>
                </div>
                
                {/* Finance */}
                <div className="space-y-2">
                  <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Financial Control</p>
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">POPIA & Legal Compliance</p>
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Merchant Settlements</p>
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-center text-xs">
                    <p className="font-semibold">Audit & Risk</p>
                  </div>
                </div>
              </div>
              
              {/* External Stakeholders */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs text-gray-500 text-center mb-3">EXTERNAL STAKEHOLDERS & PARTNERS</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['DTI', 'SASSA', 'SARB', 'PASA', 'CWP/Pick-It-Up', 'National Retailers', 'Township Merchants'].map((partner) => (
                    <span key={partner} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                      {partner}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <img src={LOGO_URL} alt="eVoucher" className="w-10 h-10 mx-auto mb-2 rounded-lg" />
          <p className="text-gray-400 text-xs">eVoucher © 2025 | 3P's Social Business Model</p>
          <p className="text-gray-400 text-xs">Prepared for Stakeholder Review</p>
        </div>
      </div>
    </div>
  );
}