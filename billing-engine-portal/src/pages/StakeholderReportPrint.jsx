import React, { useEffect } from 'react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/67132f111_evoucher_logo.png";

export default function StakeholderReportPrint() {
  useEffect(() => {
    // Auto-trigger print dialog after a short delay
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white min-h-screen p-8 max-w-4xl mx-auto print:p-4">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-4 border-b-2 border-[#00A89D] pb-4 mb-6">
        <img src={LOGO_URL} alt="eVoucher" className="w-16 h-16 rounded-lg" />
        <div>
          <h1 className="text-2xl font-bold text-[#1a5653]">eVoucher Platform</h1>
          <p className="text-[#00A89D] font-semibold">Government Stakeholder Summary Report</p>
          <p className="text-gray-500 text-sm">Date: 2 December 2025 | Status: For Stakeholder Review</p>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">Executive Summary</h2>
        <p className="text-gray-700 text-sm mb-3">
          eVoucher is a secure, inclusive national-ready digital voucher platform designed to support South African 
          households, merchants, and government priorities through innovative digital commerce for social impact.
        </p>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xl font-bold text-[#00A89D]">26M</p>
            <p className="text-xs text-gray-500">Potential Users</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xl font-bold text-[#00A89D]">4%</p>
            <p className="text-xs text-gray-500">Consumer Savings</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xl font-bold text-[#00A89D]">8+</p>
            <p className="text-xs text-gray-500">Target Retailers</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xl font-bold text-[#00A89D]">100%</p>
            <p className="text-xs text-gray-500">POPIA Aligned</p>
          </div>
        </div>
      </section>

      {/* Target Beneficiaries */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">Target Beneficiaries</h2>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>Social grant recipients (SASSA households: pensioners, disability, child grants)</li>
          <li>Low-income households and unemployed youth</li>
          <li>Township communities and rural families</li>
          <li>Non-smartphone users (via USSD *120*384# and SMS)</li>
        </ul>
      </section>

      {/* Section 1 */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">1. Cyber Security & Risk Mitigation</h2>
        <p className="text-sm text-gray-600 italic mb-2">Ministerial Concern: Robust cyber security, POPIA compliance, and data protection.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Security Infrastructure:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>AES-256 encryption for personal & voucher data</li>
              <li>TLS 1.3 for secure communication</li>
              <li>Multi-Factor Authentication for merchants</li>
              <li>Role-based access control</li>
              <li>Full audit logging & fraud detection</li>
              <li>Zero-cash system prevents leakage</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Compliance Framework:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>POPIA (Protection of Personal Information Act)</li>
              <li>PASA (Payment Association of South Africa)</li>
              <li>SARB (South African Reserve Bank)</li>
              <li>FIC alignment</li>
              <li>Regular cybersecurity audits</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">2. Impact on the Poorest of the Poor</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Platform Benefits:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>Merchant-funded discounts reduce cost of living</li>
              <li>No data/Wi-Fi required (offline mode)</li>
              <li>Secure encrypted voucher distribution</li>
              <li>Township merchant upliftment</li>
              <li>Real cash savings on everyday essentials</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Projected Impact:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>26 million potential beneficiaries</li>
              <li>R779 average monthly spend per household</li>
              <li>Significant reduction in cost of living burden</li>
              <li>Support for township economy</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">3. Government Partnership & Merchant Onboarding</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">What We Need from DTI:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>National endorsement for retailer engagement</li>
              <li>Access to Pick-It-Up / CWP database</li>
              <li>Support in POPIA compliance & consumer protection</li>
              <li>Seat in Digital Transformation Committees</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Target Merchant Partners:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>Shoprite / uSave</li>
              <li>Pick n Pay / Boxer</li>
              <li>Pep / Ackermans / Mr Price</li>
              <li>Clicks</li>
              <li>Township merchants via CWP network</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">4. Discount Logic & Benefit Distribution</h2>
        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <p className="text-sm font-semibold text-gray-800 mb-1">Discount Model (Total 5%):</p>
          <p className="text-xs text-gray-700">• 2.5% → Consumer savings (direct benefit)</p>
          <p className="text-xs text-gray-700">• 2.5% → Platform sustainability (operations, marketing, upliftment)</p>
        </div>
        <p className="text-xs text-gray-600">
          <strong>Example:</strong> R1,000 voucher → Pay R975 → Save R25 | R500 voucher → Pay R487.50 → Save R12.50
        </p>
      </section>

      {/* Section 5 */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">5. Infrastructure, Scalability & Community Rollout</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Architecture:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>High-availability database</li>
              <li>Millions of transactions</li>
              <li>Real-time fraud-resistant ledger</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">App Resilience:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>Works offline</li>
              <li>USSD & SMS fallback</li>
              <li>Low data consumption</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Rollout Plan:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>Phase 1: Township pilot</li>
              <li>Phase 2: Retailer integration</li>
              <li>Phase 3: National rollout</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Page Break for Organogram */}
      <div className="page-break"></div>

      {/* Organogram */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-4">Proposed Organisational Structure</h2>
        
        {/* CEO Level */}
        <div className="flex justify-center mb-4">
          <div className="bg-[#1a5653] text-white px-6 py-2 rounded-lg text-center">
            <p className="font-bold text-sm">Chief Executive Officer</p>
            <p className="text-xs text-white/70">Strategic Leadership</p>
          </div>
        </div>
        
        {/* Line */}
        <div className="flex justify-center mb-2">
          <div className="w-0.5 h-6 bg-gray-300"></div>
        </div>
        
        {/* C-Suite */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="bg-[#00A89D] text-white px-3 py-2 rounded-lg text-center">
            <p className="font-semibold text-xs">Chief Operations Officer</p>
            <p className="text-xs text-white/70">Operations & Rollout</p>
          </div>
          <div className="bg-[#00A89D] text-white px-3 py-2 rounded-lg text-center">
            <p className="font-semibold text-xs">Chief Technology Officer</p>
            <p className="text-xs text-white/70">Platform & Security</p>
          </div>
          <div className="bg-[#00A89D] text-white px-3 py-2 rounded-lg text-center">
            <p className="font-semibold text-xs">Chief Financial Officer</p>
            <p className="text-xs text-white/70">Finance & Compliance</p>
          </div>
        </div>
        
        {/* Departments */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-center text-gray-600 mb-1">Operations</p>
            {['Marketing & Communications', 'Merchant Relations', 'CWP Coordination', 'Customer Support'].map((dept) => (
              <div key={dept} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-center text-xs">{dept}</div>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-center text-gray-600 mb-1">Technology</p>
            {['Platform Development', 'Cyber Security', 'Infrastructure & DevOps', 'Data Analytics'].map((dept) => (
              <div key={dept} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center text-xs">{dept}</div>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-center text-gray-600 mb-1">Finance</p>
            {['Financial Control', 'POPIA & Legal Compliance', 'Merchant Settlements', 'Audit & Risk'].map((dept) => (
              <div key={dept} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-center text-xs">{dept}</div>
            ))}
          </div>
        </div>
        
        {/* External Stakeholders */}
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500 text-center mb-2">EXTERNAL STAKEHOLDERS & PARTNERS</p>
          <div className="flex flex-wrap justify-center gap-1">
            {['DTI', 'SASSA', 'SARB', 'PASA', 'CWP/Pick-It-Up', 'National Retailers', 'Township Merchants'].map((partner) => (
              <span key={partner} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{partner}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-[#1a5653] border-b border-gray-200 pb-2 mb-3">Next Steps & Timeline</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Immediate Priorities:</h4>
            <ol className="text-xs text-gray-700 list-decimal list-inside space-y-0.5">
              <li>DTI endorsement for national retailer engagement</li>
              <li>Access to CWP/Pick-It-Up database</li>
              <li>POPIA compliance support and guidance</li>
              <li>Integration with SASSA promotional campaigns</li>
              <li>Seat in Digital Transformation Committees</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-1">Timeline:</h4>
            <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
              <li>Month 1-2: DTI partnership formalization</li>
              <li>Month 3-4: Major retailer onboarding</li>
              <li>Month 5-6: Township pilot launch</li>
              <li>Month 7-12: National rollout</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t-2 border-[#00A89D] pt-4 mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="eVoucher" className="w-8 h-8 rounded" />
          <div>
            <p className="text-xs font-semibold text-[#1a5653]">eVoucher © 2025</p>
            <p className="text-xs text-gray-500">3P's Social Business Model</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">Prepared for Department of Trade and Industry</p>
      </div>

      {/* Print Button (hidden when printing) */}
      <div className="no-print fixed bottom-4 right-4 flex gap-2">
        <button 
          onClick={() => window.print()}
          className="bg-[#00A89D] text-white px-4 py-2 rounded-lg shadow-lg hover:bg-[#008F86] text-sm font-medium"
        >
          🖨️ Print / Save as PDF
        </button>
        <button 
          onClick={() => window.history.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-600 text-sm font-medium"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}