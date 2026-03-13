import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Printer, Database, Server, Smartphone, Globe, Shield, CreditCard, MessageSquare, Users, Store, BarChart3, Lock, Cloud, Layers, GitBranch, ArrowRight, ArrowDown } from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/67132f111_evoucher_logo.png";

export default function SystemArchitecture() {
  useEffect(() => {
    // Auto-trigger print dialog after short delay when print param present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('print') === 'true') {
      setTimeout(() => window.print(), 500);
    }
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a5653] to-[#00A89D] text-white p-6 print:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="eVoucher" className="w-14 h-14 rounded-xl bg-white p-1" />
            <div>
              <h1 className="text-2xl font-bold">eVoucher Platform</h1>
              <p className="text-white/80">System Architecture & Technical Specification</p>
            </div>
          </div>
          <div className="text-right text-sm text-white/70">
            <p>Version 1.0</p>
            <p>December 2025</p>
          </div>
        </div>
      </div>

      {/* Navigation - hidden on print */}
      <div className="no-print bg-gray-50 border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to={createPageUrl('Landing')} className="flex items-center gap-2 text-gray-600 hover:text-[#00A89D]">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#00A89D] text-white px-4 py-2 rounded-lg hover:bg-[#008F86]"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 print:p-4 space-y-8">

        {/* Section 1: High-Level Architecture */}
        <section>
          <h2 className="text-xl font-bold text-[#1a5653] border-b-2 border-[#00A89D] pb-2 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" /> 1. High-Level System Architecture
          </h2>
          
          <div className="bg-gray-50 rounded-xl p-6 border">
            {/* Three-tier architecture */}
            <div className="grid grid-cols-1 gap-4">
              
              {/* Presentation Layer */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> PRESENTATION LAYER (Frontend)
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Smartphone className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-xs font-medium">Mobile PWA</p>
                    <p className="text-xs text-gray-500">React + Tailwind</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Globe className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-xs font-medium">Web Portal</p>
                    <p className="text-xs text-gray-500">React SPA</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <MessageSquare className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-xs font-medium">USSD Interface</p>
                    <p className="text-xs text-gray-500">*120*384#</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Store className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-xs font-medium">Merchant POS</p>
                    <p className="text-xs text-gray-500">QR Scanner</p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-gray-400" />
              </div>

              {/* Application Layer */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" /> APPLICATION LAYER (Backend Services)
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Users className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xs font-medium">Auth Service</p>
                    <p className="text-xs text-gray-500">JWT + MFA</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <CreditCard className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xs font-medium">Voucher Engine</p>
                    <p className="text-xs text-gray-500">Issue/Redeem</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <BarChart3 className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xs font-medium">Ledger Service</p>
                    <p className="text-xs text-gray-500">Double-entry</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Store className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xs font-medium">Merchant API</p>
                    <p className="text-xs text-gray-500">Settlements</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Shield className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xs font-medium">Fraud Detection</p>
                    <p className="text-xs text-gray-500">ML-based</p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-gray-400" />
              </div>

              {/* Data Layer */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" /> DATA LAYER (Storage & Integration)
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Database className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-xs font-medium">PostgreSQL</p>
                    <p className="text-xs text-gray-500">Primary DB</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Cloud className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-xs font-medium">Redis Cache</p>
                    <p className="text-xs text-gray-500">Session/Cache</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <Lock className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-xs font-medium">Vault</p>
                    <p className="text-xs text-gray-500">Secrets Mgmt</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border shadow-sm">
                    <BarChart3 className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-xs font-medium">Analytics DW</p>
                    <p className="text-xs text-gray-500">Reporting</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Tech Stack */}
        <section>
          <h2 className="text-xl font-bold text-[#1a5653] border-b-2 border-[#00A89D] pb-2 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5" /> 2. Technology Stack
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Frontend */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-3">Frontend</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">React 18</p>
                  <p className="text-xs text-gray-500">UI Framework</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">Tailwind CSS</p>
                  <p className="text-xs text-gray-500">Styling</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">React Query</p>
                  <p className="text-xs text-gray-500">Data Fetching</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">Framer Motion</p>
                  <p className="text-xs text-gray-500">Animations</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">PWA</p>
                  <p className="text-xs text-gray-500">Offline Support</p>
                </div>
              </div>
            </div>

            {/* Backend */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-bold text-green-800 mb-3">Backend</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">Node.js / Python</p>
                  <p className="text-xs text-gray-500">API Services</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">RESTful API</p>
                  <p className="text-xs text-gray-500">Communication</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">JWT + OAuth2</p>
                  <p className="text-xs text-gray-500">Authentication</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">Serverless Functions</p>
                  <p className="text-xs text-gray-500">Microservices</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">Queue System</p>
                  <p className="text-xs text-gray-500">Async Processing</p>
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="font-bold text-purple-800 mb-3">Infrastructure</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">AWS / Azure</p>
                  <p className="text-xs text-gray-500">Cloud Platform</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">PostgreSQL</p>
                  <p className="text-xs text-gray-500">Database</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">Redis</p>
                  <p className="text-xs text-gray-500">Caching Layer</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">CDN</p>
                  <p className="text-xs text-gray-500">Content Delivery</p>
                </div>
                <div className="bg-white rounded p-2 border">
                  <p className="font-medium">Docker + K8s</p>
                  <p className="text-xs text-gray-500">Containerization</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Page Break */}
        <div className="page-break"></div>

        {/* Section 3: Data Flow */}
        <section>
          <h2 className="text-xl font-bold text-[#1a5653] border-b-2 border-[#00A89D] pb-2 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5" /> 3. Transaction Data Flow
          </h2>

          <div className="bg-gray-50 rounded-xl p-6 border">
            {/* Voucher Purchase Flow */}
            <h3 className="font-semibold text-gray-800 mb-4">3.1 Voucher Purchase Flow</h3>
            <div className="flex items-center justify-between mb-6 overflow-x-auto">
              {[
                { step: '1', label: 'Consumer', sub: 'Selects Voucher', color: 'blue' },
                { step: '2', label: 'Payment', sub: 'Card/EFT/Wallet', color: 'green' },
                { step: '3', label: 'Validation', sub: 'Fraud Check', color: 'yellow' },
                { step: '4', label: 'Ledger', sub: 'Debit/Credit', color: 'purple' },
                { step: '5', label: 'Issue', sub: 'Generate Code', color: 'teal' },
                { step: '6', label: 'Notify', sub: 'SMS/Push', color: 'pink' },
              ].map((item, idx) => (
                <React.Fragment key={item.step}>
                  <div className={`bg-${item.color}-100 rounded-lg p-3 text-center min-w-[100px] border border-${item.color}-300`}>
                    <div className={`w-8 h-8 rounded-full bg-${item.color}-500 text-white flex items-center justify-center mx-auto mb-1 text-sm font-bold`}>
                      {item.step}
                    </div>
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                  {idx < 5 && <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            {/* Redemption Flow */}
            <h3 className="font-semibold text-gray-800 mb-4">3.2 Voucher Redemption Flow</h3>
            <div className="flex items-center justify-between overflow-x-auto">
              {[
                { step: '1', label: 'Consumer', sub: 'Shows QR/Code', color: 'blue' },
                { step: '2', label: 'Merchant POS', sub: 'Scans Code', color: 'orange' },
                { step: '3', label: 'Validate', sub: 'Check Balance', color: 'yellow' },
                { step: '4', label: 'Authorize', sub: 'Amount Check', color: 'green' },
                { step: '5', label: 'Ledger', sub: 'Update Balance', color: 'purple' },
                { step: '6', label: 'Confirm', sub: 'Receipt', color: 'teal' },
              ].map((item, idx) => (
                <React.Fragment key={item.step}>
                  <div className="bg-white rounded-lg p-3 text-center min-w-[100px] border shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-[#00A89D] text-white flex items-center justify-center mx-auto mb-1 text-sm font-bold">
                      {item.step}
                    </div>
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                  {idx < 5 && <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Entity Relationship Diagram */}
        <section>
          <h2 className="text-xl font-bold text-[#1a5653] border-b-2 border-[#00A89D] pb-2 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" /> 4. Entity Relationship Diagram
          </h2>

          <div className="bg-gray-50 rounded-xl p-6 border">
            <div className="grid grid-cols-4 gap-4">
              {/* User/Consumer */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="font-bold text-blue-800 text-sm mb-2">ConsumerProfile</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-blue-600">PK</span> id</p>
                  <p>userId, email, fullName</p>
                  <p>phone, walletBalance</p>
                  <p>rewardsTier, rewardsPoints</p>
                  <p>referralCode, referredBy</p>
                </div>
              </div>

              {/* Merchant */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <h4 className="font-bold text-green-800 text-sm mb-2">Merchant</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-green-600">PK</span> id</p>
                  <p>name, logo, category</p>
                  <p>email, status</p>
                  <p>bankName, accountNumber</p>
                  <p>totalRevenue, totalRedemptions</p>
                </div>
              </div>

              {/* VoucherProduct */}
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <h4 className="font-bold text-yellow-800 text-sm mb-2">VoucherProduct</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-yellow-600">PK</span> id</p>
                  <p><span className="text-yellow-600">FK</span> merchantId</p>
                  <p>faceValue, consumerPrice</p>
                  <p>merchantPayout</p>
                  <p>platformMargin, status</p>
                </div>
              </div>

              {/* VoucherInstance */}
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <h4 className="font-bold text-purple-800 text-sm mb-2">VoucherInstance</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-purple-600">PK</span> id</p>
                  <p><span className="text-purple-600">FK</span> voucherProductId</p>
                  <p><span className="text-purple-600">FK</span> consumerId</p>
                  <p>voucherCode, faceValue</p>
                  <p>remainingBalance, status</p>
                </div>
              </div>

              {/* Transaction */}
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <h4 className="font-bold text-red-800 text-sm mb-2">Transaction</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-red-600">PK</span> id</p>
                  <p>type, amount, status</p>
                  <p><span className="text-red-600">FK</span> userId, merchantId</p>
                  <p>paymentMethod, reference</p>
                  <p>description</p>
                </div>
              </div>

              {/* LedgerEntry */}
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <h4 className="font-bold text-indigo-800 text-sm mb-2">LedgerEntry</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-indigo-600">PK</span> id</p>
                  <p>entryType, amount</p>
                  <p><span className="text-indigo-600">FK</span> transactionId</p>
                  <p><span className="text-indigo-600">FK</span> merchantId</p>
                  <p>reference, description</p>
                </div>
              </div>

              {/* WalletTransaction */}
              <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                <h4 className="font-bold text-teal-800 text-sm mb-2">WalletTransaction</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-teal-600">PK</span> id</p>
                  <p><span className="text-teal-600">FK</span> userId</p>
                  <p>type, amount</p>
                  <p>balanceAfter, reference</p>
                  <p>recipientPhone, status</p>
                </div>
              </div>

              {/* Referral */}
              <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                <h4 className="font-bold text-pink-800 text-sm mb-2">Referral</h4>
                <div className="text-xs space-y-1">
                  <p><span className="text-pink-600">PK</span> id</p>
                  <p><span className="text-pink-600">FK</span> referrerUserId</p>
                  <p><span className="text-pink-600">FK</span> referredUserId</p>
                  <p>referralCode, bonusAmount</p>
                  <p>status, completedDate</p>
                </div>
              </div>
            </div>

            {/* Relationships */}
            <div className="mt-4 p-3 bg-white rounded-lg border text-xs">
              <p className="font-semibold mb-2">Relationships:</p>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <p>• Merchant (1) → (*) VoucherProduct</p>
                <p>• VoucherProduct (1) → (*) VoucherInstance</p>
                <p>• ConsumerProfile (1) → (*) VoucherInstance</p>
                <p>• ConsumerProfile (1) → (*) Transaction</p>
                <p>• Transaction (1) → (*) LedgerEntry</p>
                <p>• ConsumerProfile (1) → (*) WalletTransaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* Page Break */}
        <div className="page-break"></div>

        {/* Section 5: Security Architecture */}
        <section>
          <h2 className="text-xl font-bold text-[#1a5653] border-b-2 border-[#00A89D] pb-2 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> 5. Security Architecture
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Security Layers */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h3 className="font-bold text-red-800 mb-3">Security Layers</h3>
              <div className="space-y-2">
                <div className="bg-white rounded p-3 border flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">1</div>
                  <div>
                    <p className="font-medium text-sm">Network Security</p>
                    <p className="text-xs text-gray-500">TLS 1.3, WAF, DDoS Protection, VPN</p>
                  </div>
                </div>
                <div className="bg-white rounded p-3 border flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">2</div>
                  <div>
                    <p className="font-medium text-sm">Application Security</p>
                    <p className="text-xs text-gray-500">JWT Auth, RBAC, Input Validation, OWASP</p>
                  </div>
                </div>
                <div className="bg-white rounded p-3 border flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">3</div>
                  <div>
                    <p className="font-medium text-sm">Data Security</p>
                    <p className="text-xs text-gray-500">AES-256 Encryption, Key Rotation, Masking</p>
                  </div>
                </div>
                <div className="bg-white rounded p-3 border flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">4</div>
                  <div>
                    <p className="font-medium text-sm">Operational Security</p>
                    <p className="text-xs text-gray-500">Audit Logs, SIEM, Incident Response</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-bold text-green-800 mb-3">Compliance Framework</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded p-3 border text-center">
                  <p className="font-bold text-green-700">POPIA</p>
                  <p className="text-xs text-gray-500">Data Protection</p>
                </div>
                <div className="bg-white rounded p-3 border text-center">
                  <p className="font-bold text-green-700">PASA</p>
                  <p className="text-xs text-gray-500">Payment Standards</p>
                </div>
                <div className="bg-white rounded p-3 border text-center">
                  <p className="font-bold text-green-700">SARB</p>
                  <p className="text-xs text-gray-500">Reserve Bank</p>
                </div>
                <div className="bg-white rounded p-3 border text-center">
                  <p className="font-bold text-green-700">FIC</p>
                  <p className="text-xs text-gray-500">Financial Intel</p>
                </div>
                <div className="bg-white rounded p-3 border text-center">
                  <p className="font-bold text-green-700">PCI-DSS</p>
                  <p className="text-xs text-gray-500">Card Security</p>
                </div>
                <div className="bg-white rounded p-3 border text-center">
                  <p className="font-bold text-green-700">ISO 27001</p>
                  <p className="text-xs text-gray-500">Info Security</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Integration Points */}
        <section>
          <h2 className="text-xl font-bold text-[#1a5653] border-b-2 border-[#00A89D] pb-2 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" /> 6. External Integration Points
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {/* Payment */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">Payment Gateways</h3>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Peach Payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>PayFast</span>
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Ozow (EFT)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>SnapScan</span>
                </li>
              </ul>
            </div>

            {/* Communication */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-bold text-green-800 mb-2">Communication</h3>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span>USSD Gateway (*120*384#)</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span>SMS API (Clickatell)</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span>Push Notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span>Email (SendGrid)</span>
                </li>
              </ul>
            </div>

            {/* Third Party */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="font-bold text-purple-800 mb-2">Third Party</h3>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-600" />
                  <span>Retailer POS Systems</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>SASSA Database</span>
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Analytics (Google)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>KYC Provider</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-[#00A89D] pt-4 mt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="eVoucher" className="w-10 h-10 rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-[#1a5653]">eVoucher Platform © 2025</p>
              <p className="text-xs text-gray-500">3P's Social Business Model</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Confidential - For DTI Review Only</p>
        </div>
      </div>
    </div>
  );
}