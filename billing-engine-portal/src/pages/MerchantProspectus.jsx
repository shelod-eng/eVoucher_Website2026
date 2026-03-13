import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Download, Store, DollarSign, TrendingUp, Users, Shield, Zap, CheckCircle2, BarChart3, Wallet } from 'lucide-react';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';

export default function MerchantProspectus() {
  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header - No Print */}
        <div className="bg-white border-b border-gray-200 p-4 print:hidden sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Landing')}>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            </Link>
            <GoldButton variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </GoldButton>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white p-8 md:p-12 print:p-8">
          {/* Cover Page */}
          <div className="text-center mb-12 print:mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/825e75b85_evoucher_logo.png"
              alt="eVoucher"
              className="w-48 h-48 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Merchant Partnership Proposal</h1>
            <h2 className="text-2xl text-[#00A89D] font-semibold mb-4">Join the eVoucher Network</h2>
            <p className="text-gray-600 text-lg">Powered by Smart Banking & Community Commerce</p>
            <p className="text-sm text-gray-500 mt-4">Prepared for: Pharmacy Partner | December 2025</p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-12" />

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Store className="w-8 h-8 text-[#00A89D]" />
              Why Join eVoucher?
            </h2>
            <Card className="bg-gradient-to-br from-[#00A89D]/5 to-teal-50 border-[#00A89D]/20 p-6">
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                <strong className="text-[#00A89D]">eVoucher</strong> is a revolutionary fintech platform backed by 
                <strong className="text-blue-600"> Investec</strong> and <strong className="text-purple-600">Discovery</strong>, 
                connecting South African consumers with trusted merchants through guaranteed pre-paid vouchers.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <Wallet className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-sm text-gray-600">Pre-Paid Revenue</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">5M+</p>
                  <p className="text-sm text-gray-600">Target Customers</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">Zero</p>
                  <p className="text-sm text-gray-600">Payment Risk</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Value Proposition for Merchants */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#00A89D]" />
              Merchant Benefits
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <DollarSign className="w-10 h-10 text-green-600 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Guaranteed Revenue</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Receive 92% of voucher face value upfront</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Zero payment collection risk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Improved cash flow predictability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Weekly automated settlements</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
                <Users className="w-10 h-10 text-blue-600 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Acquisition</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Access to 5M+ platform users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Featured in app marketplace</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Targeted marketing campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>USSD/SMS reach for non-smartphone users</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <Shield className="w-10 h-10 text-purple-600 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-Grade Security</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Backed by Investec & Discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>PCI-DSS compliant payment processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Fraud detection & prevention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Real-time transaction monitoring</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                <Zap className="w-10 h-10 text-orange-600 mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Operational Efficiency</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>Simple QR code redemption at POS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>Real-time dashboard & reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>Automated invoicing & reconciliation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>24/7 merchant support</span>
                  </li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Financial Model for Pharmacy */}
          <section className="mb-12 print:break-before-page">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#00A89D]" />
              Pharmacy Revenue Example
            </h2>

            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Transaction Flow</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <p className="text-center text-lg font-semibold text-gray-900 mb-4">Customer Purchases R1,000 Pharmacy Voucher</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Customer Pays</p>
                      <p className="text-sm text-gray-500">96% of face value (4% savings)</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">R960</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div>
                      <p className="font-semibold text-green-900">You Receive (Upfront)</p>
                      <p className="text-sm text-green-600">92% of face value - Weekly payout</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">R920</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Customer Redeems</p>
                      <p className="text-sm text-gray-500">Full value at your pharmacy</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">R1,000</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-purple-900">Your Effective Discount</p>
                      <p className="text-sm text-purple-600">8% marketing investment for guaranteed sale</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">R80</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Revenue Projections</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 text-gray-700">Scenario</th>
                      <th className="text-right py-3 px-2 text-gray-700">Vouchers Sold</th>
                      <th className="text-right py-3 px-2 text-gray-700">Face Value</th>
                      <th className="text-right py-3 px-2 text-gray-700">Your Revenue (92%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Conservative</td>
                      <td className="text-right py-3 px-2">100</td>
                      <td className="text-right py-3 px-2">R100,000</td>
                      <td className="text-right py-3 px-2 font-bold text-green-600">R92,000</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Moderate</td>
                      <td className="text-right py-3 px-2">250</td>
                      <td className="text-right py-3 px-2">R250,000</td>
                      <td className="text-right py-3 px-2 font-bold text-green-600">R230,000</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="py-3 px-2 text-gray-900 font-bold">Aggressive</td>
                      <td className="text-right py-3 px-2 font-bold">500</td>
                      <td className="text-right py-3 px-2 font-bold">R500,000</td>
                      <td className="text-right py-3 px-2 font-bold text-green-700 text-lg">R460,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> The 8% discount is offset by: (1) Guaranteed upfront payment, (2) Zero collection risk, 
                  (3) New customer acquisition, (4) Increased foot traffic leading to additional purchases.
                </p>
              </div>
            </Card>
          </section>

          {/* Onboarding Process */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Simple 3-Step Onboarding</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#00A89D]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-[#00A89D]">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Sign Agreement</h3>
                <p className="text-sm text-gray-600">Review and sign merchant partnership agreement with eVoucher</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#00A89D]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-[#00A89D]">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Platform Setup</h3>
                <p className="text-sm text-gray-600">Our team creates your merchant profile, uploads logo, and configures voucher products</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#00A89D]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-[#00A89D]">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Go Live</h3>
                <p className="text-sm text-gray-600">Train staff on QR code redemption, launch marketing, and start receiving sales</p>
              </Card>
            </div>
            <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <p className="text-center text-gray-700 text-lg">
                <strong className="text-green-700">Timeline:</strong> Complete onboarding in 
                <strong className="text-green-700"> 3-5 business days</strong>
              </p>
            </div>
          </section>

          {/* Banking Partners */}
          <section className="mb-12 print:break-before-page">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Backed by Leading Financial Institutions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow">
                    <span className="text-2xl font-bold text-blue-600">I</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Investec</h3>
                    <p className="text-sm text-gray-600">Primary Banking Partner</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Investec provides payment processing, settlement infrastructure, and financial backing for the eVoucher platform.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Bank-grade security & compliance</li>
                  <li>✓ Fast payment settlements</li>
                  <li>✓ Transaction monitoring</li>
                </ul>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow">
                    <span className="text-2xl font-bold text-purple-600">D</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Discovery</h3>
                    <p className="text-sm text-gray-600">Strategic Partner</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Discovery brings customer engagement expertise, health & wellness synergies, and co-marketing opportunities.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Vitality member integration potential</li>
                  <li>✓ Health-focused partnerships</li>
                  <li>✓ Nationwide reach</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Call to Action */}
          <section className="mb-8">
            <Card className="p-8 bg-gradient-to-br from-[#00A89D] to-teal-600 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
              <p className="text-xl mb-6 text-white/90">
                Become part of South Africa's fastest-growing savings platform
              </p>
              <div className="space-y-3 text-white/90">
                <p className="text-lg"><strong>Next Steps:</strong></p>
                <p>1. Review this proposal with your team</p>
                <p>2. Schedule a call with our partnerships team</p>
                <p>3. Sign merchant agreement and go live</p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm">
                  <strong>Contact:</strong> partnerships@evoucher.co.za<br />
                  <strong>Phone:</strong> 0800 EVOUCHER<br />
                  <strong>Website:</strong> www.evoucher.co.za
                </p>
              </div>
            </Card>
          </section>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
            <p>eVoucher © 2025 | Merchant Partnership Proposal</p>
            <p className="mt-1">Backed by Investec & Discovery | Serving South Africa</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:p-8 { padding: 2rem; }
          .print\\:mb-8 { margin-bottom: 2rem; }
        }
      `}</style>
    </div>
  );
}