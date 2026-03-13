import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import GoldButton from '@/components/ui/GoldButton';
import { 
  ArrowLeft, Download, Printer, TrendingUp, DollarSign, 
  Users, Store, Zap, Shield, Globe, Target, PieChart,
  BarChart3, LineChart, Building2, Sparkles
} from 'lucide-react';

const MERCHANT_LOGOS = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/33ba96e67_shoprite.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/3f6a4b73e_usave.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/73ebd7454_checkers.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/fd5666c0b_boxer.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/e9754ea03_MrPrice.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/4ffc0227d_Edgars.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/8b14cd72a_game.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/06173ab1f_engen.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/1ae001432_CellC.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/abebac055_Telkom.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/1c7853abe_PrasaBeMoved.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/f9726bdec_reyavaya.png',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/ee3f49531_areyeng.png',
];

export default function StakeholderFinancialReport() {
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
            <div className="flex gap-2">
              <GoldButton variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </GoldButton>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white p-8 md:p-12 print:p-8">
          {/* Cover Page */}
          <div className="text-center mb-12 print:mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/825e75b85_evoucher_logo.png"
              alt="eVoucher"
              className="w-48 h-48 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Stakeholder Report</h1>
            <h2 className="text-2xl text-[#00A89D] font-semibold mb-4">Financial Model & Market Analysis</h2>
            <p className="text-gray-600">Smart Savings Platform for South Africa</p>
            <p className="text-sm text-gray-500 mt-4">Generated: December 2025</p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-12" />

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[#00A89D]" />
              Executive Summary
            </h2>
            <Card className="bg-gradient-to-br from-[#00A89D]/5 to-teal-50 border-[#00A89D]/20 p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong className="text-[#00A89D]">eVoucher</strong> is a revolutionary fintech platform that creates a triple-win ecosystem: 
                consumers save 4% on everyday purchases, merchants increase foot traffic and sales, and the platform generates sustainable revenue 
                through volume-based margins.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">4%</p>
                  <p className="text-sm text-gray-600">Platform Margin</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <Store className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">13+</p>
                  <p className="text-sm text-gray-600">Partner Merchants</p>
                </div>
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">5M+</p>
                  <p className="text-sm text-gray-600">Target Users (Year 3)</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 1: Financial Model */}
          <section className="mb-12 print:break-before-page">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-[#00A89D]" />
              1. Financial Model & Revenue Streams
            </h2>

            {/* Revenue Breakdown */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Architecture</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <p className="text-center text-lg font-semibold text-gray-900 mb-4">Per R1,000 Voucher Transaction</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Consumer Pays</p>
                      <p className="text-sm text-gray-500">4% instant savings</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">R960</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Voucher Face Value</p>
                      <p className="text-sm text-gray-500">Redeemable at merchant</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">R1,000</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div>
                      <p className="font-semibold text-green-900">Platform Revenue</p>
                      <p className="text-sm text-green-600">4% margin retained</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">R40</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Merchant Payout</p>
                      <p className="text-sm text-gray-500">92% of face value</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">R920</p>
                  </div>
                </div>
              </div>

              {/* Cost Structure */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Cost Structure & Profit Margins</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-red-50 border-red-200 p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Operating Costs (per R40 revenue)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Payment Gateway (2.5%)</span>
                      <span className="font-semibold">R1.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bank Processing Fees</span>
                      <span className="font-semibold">R0.75</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Technology & Infrastructure</span>
                      <span className="font-semibold">R1.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Customer Support</span>
                      <span className="font-semibold">R0.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Marketing & Acquisition</span>
                      <span className="font-semibold">R2.00</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-red-300 font-bold text-gray-900">
                      <span>Total Operating Costs</span>
                      <span className="text-red-600">R5.75</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-green-50 border-green-200 p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Net Profit Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Gross Revenue (4%)</span>
                      <span className="font-semibold">R40.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Operating Costs</span>
                      <span className="font-semibold text-red-600">-R5.75</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-green-300 font-bold text-lg text-green-700">
                      <span>Net Profit per R1,000</span>
                      <span>R34.25</span>
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-center font-bold text-green-800">
                        85.6% Net Margin
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>

            {/* Revenue Projections */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LineChart className="w-6 h-6 text-[#00A89D]" />
                3-Year Revenue Projections
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 text-gray-700">Metric</th>
                      <th className="text-right py-3 px-2 text-gray-700">Year 1</th>
                      <th className="text-right py-3 px-2 text-gray-700">Year 2</th>
                      <th className="text-right py-3 px-2 text-gray-700">Year 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Active Users</td>
                      <td className="text-right py-3 px-2">250,000</td>
                      <td className="text-right py-3 px-2">1,500,000</td>
                      <td className="text-right py-3 px-2">5,000,000</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Avg. Monthly Spend/User</td>
                      <td className="text-right py-3 px-2">R800</td>
                      <td className="text-right py-3 px-2">R1,200</td>
                      <td className="text-right py-3 px-2">R1,500</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Monthly GMV</td>
                      <td className="text-right py-3 px-2">R200M</td>
                      <td className="text-right py-3 px-2">R1.8B</td>
                      <td className="text-right py-3 px-2">R7.5B</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Annual GMV</td>
                      <td className="text-right py-3 px-2 font-bold">R2.4B</td>
                      <td className="text-right py-3 px-2 font-bold">R21.6B</td>
                      <td className="text-right py-3 px-2 font-bold">R90B</td>
                    </tr>
                    <tr className="bg-green-50 border-b-2 border-green-300">
                      <td className="py-3 px-2 text-gray-900 font-bold">Platform Revenue (4%)</td>
                      <td className="text-right py-3 px-2 font-bold text-green-700">R96M</td>
                      <td className="text-right py-3 px-2 font-bold text-green-700">R864M</td>
                      <td className="text-right py-3 px-2 font-bold text-green-700">R3.6B</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="py-3 px-2 text-gray-900 font-bold">Net Profit (85.6%)</td>
                      <td className="text-right py-3 px-2 font-bold text-blue-700">R82.2M</td>
                      <td className="text-right py-3 px-2 font-bold text-blue-700">R739.6M</td>
                      <td className="text-right py-3 px-2 font-bold text-blue-700">R3.08B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Projections based on conservative market penetration of 5% of South Africa's 
                  banked population (100M+ total population, 70%+ with bank accounts). User acquisition assumes 
                  viral referral growth and merchant partnerships.
                </p>
              </div>
            </Card>

            {/* Bank Sponsorship Revenue */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#00A89D]" />
                Bank Sponsorship & Partnership Revenue
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">FNB</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">First National Bank</h4>
                      <p className="text-sm text-gray-600">Primary Sponsor</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monthly Sponsorship</span>
                      <span className="font-semibold">R500,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Transaction Fee</span>
                      <span className="font-semibold">0.5% per txn</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="font-bold">Annual Revenue</span>
                      <span className="font-bold text-blue-700">R6M+</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-red-600">ABSA</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">ABSA Bank</h4>
                      <p className="text-sm text-gray-600">Co-Sponsor</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monthly Sponsorship</span>
                      <span className="font-semibold">R500,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Transaction Fee</span>
                      <span className="font-semibold">0.5% per txn</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-red-300">
                      <span className="font-bold">Annual Revenue</span>
                      <span className="font-bold text-red-700">R6M+</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-center font-bold text-green-800 text-lg">
                  Total Bank Partnership Revenue: R12M+ Annually (Plus transaction fees)
                </p>
              </div>
            </Card>
          </section>

          {/* Section 2: Market Analysis */}
          <section className="mb-12 print:break-before-page">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#00A89D]" />
              2. Market Analysis & Opportunity
            </h2>

            {/* Market Size */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">South African Market Opportunity</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <Globe className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-3xl font-bold mb-1">60M</p>
                  <p className="text-blue-100 text-sm">Population</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <Users className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-3xl font-bold mb-1">42M</p>
                  <p className="text-purple-100 text-sm">Banked Adults (70%)</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <Target className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-3xl font-bold mb-1">25M</p>
                  <p className="text-green-100 text-sm">Target Market (LSM 4-8)</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-orange-200">
                <h4 className="font-semibold text-gray-900 mb-3">Total Addressable Market (TAM)</h4>
                <p className="text-gray-700 mb-4">
                  South African household consumption expenditure in retail, groceries, and services exceeds 
                  <strong className="text-orange-600"> R1.5 Trillion annually</strong>. Our target segment (LSM 4-8) represents 
                  <strong className="text-orange-600"> ~R750 Billion</strong> of this market.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Serviceable Addressable Market (SAM)</p>
                    <p className="text-2xl font-bold text-gray-900">R150B</p>
                    <p className="text-xs text-gray-500">20% of TAM through partner merchants</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Serviceable Obtainable Market (SOM)</p>
                    <p className="text-2xl font-bold text-[#00A89D]">R30B</p>
                    <p className="text-xs text-gray-500">Year 3 target (20% of SAM)</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Competitive Advantage */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitive Advantages</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <Zap className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-2">Instant 4% Savings</h4>
                  <p className="text-sm text-gray-700">
                    Unlike loyalty programs that require points accumulation, eVoucher provides immediate 
                    tangible savings on every purchase - a powerful value proposition for price-sensitive consumers.
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <Shield className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-2">USSD/SMS Access</h4>
                  <p className="text-sm text-gray-700">
                    Reaching non-smartphone users via USSD (*120*384#) and SMS unlocks markets competitors 
                    can't reach - 30%+ of SA population without smartphones but with feature phones.
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <Store className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-2">Premium Merchant Network</h4>
                  <p className="text-sm text-gray-700">
                    Partnerships with Shoprite, Checkers, Mr Price, Game, and major fuel/telco brands 
                    provide unmatched coverage and category diversity.
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-2">Win-Win-Win Model</h4>
                  <p className="text-sm text-gray-700">
                    Creates sustainable value for all stakeholders: consumers save money, merchants gain 
                    pre-paid guaranteed sales, platform generates high-margin revenue.
                  </p>
                </div>
              </div>
            </Card>

            {/* Partner Merchant Network */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Partner Merchant Network</h3>
              <p className="text-gray-700 mb-6">
                Our platform has secured partnerships with 13+ leading South African retailers across 
                multiple categories, providing comprehensive coverage for consumer spending needs.
              </p>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {MERCHANT_LOGOS.map((logo, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-center">
                    <img src={logo} alt={`Merchant ${idx + 1}`} className="w-full h-12 object-contain" />
                  </div>
                ))}
              </div>
              <div className="mt-6 grid md:grid-cols-4 gap-3 text-sm">
                <div className="bg-blue-50 rounded p-3 text-center">
                  <p className="font-semibold text-gray-900">Grocery</p>
                  <p className="text-blue-600">Shoprite, Checkers, USave, Boxer</p>
                </div>
                <div className="bg-purple-50 rounded p-3 text-center">
                  <p className="font-semibold text-gray-900">Fashion</p>
                  <p className="text-purple-600">Mr Price, Edgars</p>
                </div>
                <div className="bg-green-50 rounded p-3 text-center">
                  <p className="font-semibold text-gray-900">Electronics</p>
                  <p className="text-green-600">Game</p>
                </div>
                <div className="bg-orange-50 rounded p-3 text-center">
                  <p className="font-semibold text-gray-900">Services</p>
                  <p className="text-orange-600">Engen, Cell C, Telkom, Transport</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Stakeholder Value Proposition */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Stakeholder Value Proposition</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
                <Users className="w-10 h-10 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">For Investors</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ High-margin revenue (85.6% net)</li>
                  <li>✓ Scalable fintech model</li>
                  <li>✓ Defensible market position</li>
                  <li>✓ Clear path to profitability</li>
                  <li>✓ R3B+ revenue potential (Year 3)</li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
                <Building2 className="w-10 h-10 text-green-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">For Bank Partners</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Increased customer engagement</li>
                  <li>✓ Transaction volume growth</li>
                  <li>✓ Social impact alignment</li>
                  <li>✓ Brand visibility in communities</li>
                  <li>✓ Fee-based revenue stream</li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
                <Store className="w-10 h-10 text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">For Merchants</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Guaranteed pre-paid revenue</li>
                  <li>✓ Increased foot traffic</li>
                  <li>✓ Reduced payment risk</li>
                  <li>✓ Marketing to new customers</li>
                  <li>✓ Cash flow optimization</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Contact & Next Steps */}
          <section className="border-t-2 border-gray-200 pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Let's Build the Future Together</h3>
              <p className="text-gray-600 mb-6">
                Join us in creating a platform that empowers millions of South Africans to save money 
                and build financial wellness.
              </p>
              <div className="inline-flex flex-col gap-2 text-sm text-gray-700">
                <p><strong>Platform:</strong> eVoucher</p>
                <p><strong>Website:</strong> www.evoucher.co.za</p>
                <p><strong>Contact:</strong> partnerships@evoucher.co.za</p>
              </div>
            </div>
          </section>
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