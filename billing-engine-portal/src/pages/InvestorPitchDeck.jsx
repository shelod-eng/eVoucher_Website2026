import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GoldButton from '@/components/ui/GoldButton';
import { 
  ArrowLeft, Download, TrendingUp, DollarSign, Users, Store, 
  Zap, Shield, Globe, Target, Smartphone, Code, Database,
  GitBranch, CheckCircle2, AlertCircle, Trophy, Rocket,
  BarChart3, PieChart, LineChart, Building2, Phone, Sparkles
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
];

export default function InvestorPitchDeck() {
  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - No Print */}
      <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 p-4 print:hidden sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={createPageUrl('Landing')}>
            <button className="flex items-center gap-2 text-white hover:text-white/80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
          </Link>
          <GoldButton onClick={handleDownload} className="bg-white text-[#00A89D] hover:bg-gray-100">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </GoldButton>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Slide 1: Cover */}
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00A89D] to-teal-700 p-12 print:break-after-page">
          <div className="text-center text-white">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/825e75b85_evoucher_logo.png"
              alt="eVoucher"
              className="w-64 h-64 mx-auto mb-8 drop-shadow-2xl"
            />
            <h1 className="text-6xl font-bold mb-4">eVoucher</h1>
            <p className="text-3xl mb-8 text-teal-100">Smart Savings Platform for South Africa</p>
            <div className="h-1 w-32 bg-white mx-auto mb-8"></div>
            <p className="text-xl mb-2">Investor Presentation</p>
            <p className="text-sm text-teal-200 mt-8">December 2025</p>
          </div>
        </div>

        {/* Slide 2: Problem Statement */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">The Problem</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-r-xl">
              <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">For Consumers</h3>
              <ul className="space-y-3 text-gray-700 text-lg">
                <li>• 55% of South Africans live below poverty line</li>
                <li>• High cost of living erodes purchasing power</li>
                <li>• Limited access to savings/discounts</li>
                <li>• No smartphones = excluded from digital deals</li>
              </ul>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-8 rounded-r-xl">
              <AlertCircle className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">For Merchants</h3>
              <ul className="space-y-3 text-gray-700 text-lg">
                <li>• Cash flow challenges in retail</li>
                <li>• Payment processing risks</li>
                <li>• High customer acquisition costs</li>
                <li>• Limited loyalty program adoption</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 p-6 bg-gray-900 text-white rounded-xl text-center">
            <p className="text-2xl font-bold">Market Gap: No inclusive, instant savings platform in SA</p>
          </div>
        </div>

        {/* Slide 3: Solution */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gradient-to-br from-teal-50 to-blue-50">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">Our Solution</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-[#00A89D]">
              <div className="w-16 h-16 bg-[#00A89D] rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Instant 4% Savings</h3>
              <p className="text-gray-700 text-lg">Pay R960, get R1,000 voucher. Immediate value, no waiting.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-purple-500">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-4">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">USSD/SMS Access</h3>
              <p className="text-gray-700 text-lg">Dial *120*384# - works on any phone. 100% inclusive.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-500">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-4">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Premium Network</h3>
              <p className="text-gray-700 text-lg">13+ top retailers: Shoprite, Checkers, Mr Price, Game.</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#00A89D] to-teal-600 text-white rounded-2xl p-8 text-center">
            <p className="text-3xl font-bold mb-2">Win-Win-Win Model</p>
            <p className="text-xl text-teal-100">Consumers save • Merchants gain • Platform profits</p>
          </div>
        </div>

        {/* Slide 4: Business Model */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">Business Model</h2>
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-10 shadow-2xl">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">Revenue Per R1,000 Transaction</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-lg">
                <div>
                  <p className="text-xl font-bold text-gray-900">Consumer Pays</p>
                  <p className="text-gray-600">Gets R1,000 voucher</p>
                </div>
                <p className="text-4xl font-bold text-blue-600">R960</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-3xl">↓</div>
                  <p className="text-sm">Platform receives</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-green-50 rounded-xl p-6 shadow-lg border-2 border-green-400">
                <div>
                  <p className="text-xl font-bold text-green-900">Platform Revenue (4%)</p>
                  <p className="text-green-700">Gross margin retained</p>
                </div>
                <p className="text-4xl font-bold text-green-600">R40</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-3xl">↓</div>
                  <p className="text-sm">After costs (R5.75)</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 shadow-lg border-2 border-orange-400">
                <div>
                  <p className="text-xl font-bold text-gray-900">Net Profit</p>
                  <p className="text-orange-700">85.6% net margin</p>
                </div>
                <p className="text-4xl font-bold text-orange-600">R34.25</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-3xl">↓</div>
                  <p className="text-sm">Merchant receives</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-lg">
                <div>
                  <p className="text-xl font-bold text-gray-900">Merchant Payout (92%)</p>
                  <p className="text-gray-600">Pre-paid guaranteed revenue</p>
                </div>
                <p className="text-4xl font-bold text-purple-600">R920</p>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 5: Market Opportunity */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gradient-to-br from-purple-50 to-pink-50">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">Market Opportunity</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
              <Globe className="w-16 h-16 mb-4 opacity-80" />
              <p className="text-5xl font-bold mb-2">60M</p>
              <p className="text-xl text-blue-100">SA Population</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
              <Users className="w-16 h-16 mb-4 opacity-80" />
              <p className="text-5xl font-bold mb-2">42M</p>
              <p className="text-xl text-purple-100">Banked Adults (70%)</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl">
              <Target className="w-16 h-16 mb-4 opacity-80" />
              <p className="text-5xl font-bold mb-2">25M</p>
              <p className="text-xl text-green-100">Target (LSM 4-8)</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Market Size</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <span className="text-lg text-gray-700">Total Addressable Market (TAM)</span>
                <span className="text-2xl font-bold text-gray-900">R750B</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <span className="text-lg text-gray-700">Serviceable Addressable Market (SAM)</span>
                <span className="text-2xl font-bold text-gray-900">R150B</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-400">
                <span className="text-lg font-bold text-gray-900">Year 3 Target (SOM - 20% of SAM)</span>
                <span className="text-3xl font-bold text-green-600">R30B</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 6: Financial Projections */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">3-Year Financial Projections</h2>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#00A89D] to-teal-600 text-white">
                  <tr>
                    <th className="text-left py-4 px-6 text-xl">Metric</th>
                    <th className="text-right py-4 px-6 text-xl">Year 1</th>
                    <th className="text-right py-4 px-6 text-xl">Year 2</th>
                    <th className="text-right py-4 px-6 text-xl">Year 3</th>
                  </tr>
                </thead>
                <tbody className="text-lg">
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-medium text-gray-900">Active Users</td>
                    <td className="text-right py-4 px-6">250,000</td>
                    <td className="text-right py-4 px-6">1,500,000</td>
                    <td className="text-right py-4 px-6 font-bold">5,000,000</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">Monthly GMV</td>
                    <td className="text-right py-4 px-6">R200M</td>
                    <td className="text-right py-4 px-6">R1.8B</td>
                    <td className="text-right py-4 px-6 font-bold">R7.5B</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-medium text-gray-900">Annual GMV</td>
                    <td className="text-right py-4 px-6 font-bold">R2.4B</td>
                    <td className="text-right py-4 px-6 font-bold">R21.6B</td>
                    <td className="text-right py-4 px-6 font-bold text-xl">R90B</td>
                  </tr>
                  <tr className="bg-green-50 border-b-2 border-green-400">
                    <td className="py-4 px-6 font-bold text-gray-900">Platform Revenue (4%)</td>
                    <td className="text-right py-4 px-6 font-bold text-green-700">R96M</td>
                    <td className="text-right py-4 px-6 font-bold text-green-700">R864M</td>
                    <td className="text-right py-4 px-6 font-bold text-green-700 text-2xl">R3.6B</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="py-4 px-6 font-bold text-gray-900 text-xl">Net Profit (85.6%)</td>
                    <td className="text-right py-4 px-6 font-bold text-blue-700 text-xl">R82M</td>
                    <td className="text-right py-4 px-6 font-bold text-blue-700 text-xl">R740M</td>
                    <td className="text-right py-4 px-6 font-bold text-blue-700 text-3xl">R3.08B</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-6 border-2 border-orange-300">
              <TrendingUp className="w-10 h-10 text-orange-600 mb-3" />
              <p className="text-xl font-bold text-gray-900">Growth Rate</p>
              <p className="text-4xl font-bold text-orange-600 my-2">500%+</p>
              <p className="text-gray-700">Year-over-year revenue growth</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300">
              <DollarSign className="w-10 h-10 text-green-600 mb-3" />
              <p className="text-xl font-bold text-gray-900">Net Margin</p>
              <p className="text-4xl font-bold text-green-600 my-2">85.6%</p>
              <p className="text-gray-700">Industry-leading profitability</p>
            </div>
          </div>
        </div>

        {/* Slide 7: Partner Network */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gray-50">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">Partner Merchant Network</h2>
          <div className="bg-white rounded-2xl p-10 shadow-xl mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">13+ Leading SA Retailers</h3>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {MERCHANT_LOGOS.map((logo, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 flex items-center justify-center hover:shadow-lg transition-shadow">
                  <img src={logo} alt={`Merchant ${idx + 1}`} className="w-full h-20 object-contain" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-100 rounded-xl p-6 text-center border-2 border-blue-300">
              <p className="text-xl font-bold text-gray-900 mb-2">Grocery</p>
              <p className="text-blue-700">Shoprite, Checkers, USave, Boxer</p>
            </div>
            <div className="bg-purple-100 rounded-xl p-6 text-center border-2 border-purple-300">
              <p className="text-xl font-bold text-gray-900 mb-2">Fashion</p>
              <p className="text-purple-700">Mr Price, Edgars</p>
            </div>
            <div className="bg-green-100 rounded-xl p-6 text-center border-2 border-green-300">
              <p className="text-xl font-bold text-gray-900 mb-2">Electronics</p>
              <p className="text-green-700">Game</p>
            </div>
            <div className="bg-orange-100 rounded-xl p-6 text-center border-2 border-orange-300">
              <p className="text-xl font-bold text-gray-900 mb-2">Services</p>
              <p className="text-orange-700">Engen, Cell C, Telkom</p>
            </div>
          </div>
        </div>

        {/* Slide 8: Technology & Agile */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">Technology & Development</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl">
              <Code className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tech Stack</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-lg"><strong>Frontend:</strong> React, Tailwind CSS</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-lg"><strong>Backend:</strong> Node.js, PostgreSQL</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-lg"><strong>Mobile:</strong> PWA + USSD/SMS Gateway</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-lg"><strong>Security:</strong> PCI-DSS, POPIA Compliant</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl">
              <GitBranch className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Agile Methodology</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <p className="text-lg">2-week sprint cycles</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <p className="text-lg">Daily standups & retrospectives</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <p className="text-lg">Continuous integration/deployment</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <p className="text-lg">User story driven development</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">System Architecture Highlights</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Database className="w-10 h-10 mb-2 opacity-90" />
                <p className="font-bold text-xl mb-1">Scalable</p>
                <p className="text-purple-100">Handles 10M+ transactions/day</p>
              </div>
              <div>
                <Shield className="w-10 h-10 mb-2 opacity-90" />
                <p className="font-bold text-xl mb-1">Secure</p>
                <p className="text-purple-100">Bank-grade encryption & compliance</p>
              </div>
              <div>
                <Smartphone className="w-10 h-10 mb-2 opacity-90" />
                <p className="font-bold text-xl mb-1">Accessible</p>
                <p className="text-purple-100">Web + USSD + SMS channels</p>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 9: Bank Partnerships */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gradient-to-br from-blue-50 to-indigo-50">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">Bank Sponsor Partnerships</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-blue-300">
              <div className="bg-blue-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-white">FNB</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">First National Bank</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-lg text-gray-700">Monthly Sponsorship</span>
                  <span className="text-2xl font-bold text-blue-600">R500,000</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-lg text-gray-700">Transaction Fee</span>
                  <span className="text-2xl font-bold text-blue-600">0.5%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-100 rounded-lg border-2 border-blue-400">
                  <span className="text-lg font-bold text-gray-900">Annual Revenue</span>
                  <span className="text-2xl font-bold text-blue-700">R6M+</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-red-300">
              <div className="bg-red-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-white">ABSA</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">ABSA Bank</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span className="text-lg text-gray-700">Monthly Sponsorship</span>
                  <span className="text-2xl font-bold text-red-600">R500,000</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span className="text-lg text-gray-700">Transaction Fee</span>
                  <span className="text-2xl font-bold text-red-600">0.5%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-100 rounded-lg border-2 border-red-400">
                  <span className="text-lg font-bold text-gray-900">Annual Revenue</span>
                  <span className="text-2xl font-bold text-red-700">R6M+</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-8 text-center shadow-2xl">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <p className="text-4xl font-bold mb-2">R12M+ Annual Partnership Revenue</p>
            <p className="text-2xl text-green-100">Plus transaction-based fees on R90B GMV (Year 3)</p>
          </div>
        </div>

        {/* Slide 10: Investment Ask */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">Investment Opportunity</h2>
          <div className="bg-white rounded-3xl p-10 shadow-2xl mb-8">
            <div className="text-center mb-8">
              <Rocket className="w-20 h-20 text-orange-500 mx-auto mb-4" />
              <p className="text-6xl font-bold text-gray-900 mb-3">R50M</p>
              <p className="text-2xl text-gray-600">Series A Funding Round</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 text-center border-2 border-blue-200">
                <p className="text-lg text-gray-700 mb-2">Use of Funds</p>
                <div className="space-y-2 text-left">
                  <p className="text-sm text-gray-600">• Marketing & User Acquisition (40%)</p>
                  <p className="text-sm text-gray-600">• Technology & Infrastructure (30%)</p>
                  <p className="text-sm text-gray-600">• Team Expansion (20%)</p>
                  <p className="text-sm text-gray-600">• Working Capital (10%)</p>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-6 text-center border-2 border-green-200">
                <p className="text-lg text-gray-700 mb-2">Equity Offered</p>
                <p className="text-4xl font-bold text-green-600 my-4">15%</p>
                <p className="text-sm text-gray-600">Post-money valuation: R333M</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 text-center border-2 border-purple-200">
                <p className="text-lg text-gray-700 mb-2">Projected ROI</p>
                <p className="text-4xl font-bold text-purple-600 my-4">12x</p>
                <p className="text-sm text-gray-600">Within 3 years at R4B valuation</p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6">
              <Trophy className="w-12 h-12 mb-3 opacity-90" />
              <p className="text-2xl font-bold mb-2">Exit Strategy</p>
              <p className="text-green-100 text-lg">Strategic acquisition by major bank, fintech, or retail group within 3-5 years</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6">
              <Sparkles className="w-12 h-12 mb-3 opacity-90" />
              <p className="text-2xl font-bold mb-2">Unique Positioning</p>
              <p className="text-blue-100 text-lg">Only platform combining instant savings + USSD access + premium merchant network</p>
            </div>
          </div>
        </div>

        {/* Slide 11: Team & Contact */}
        <div className="min-h-screen p-12 flex flex-col justify-center print:break-after-page">
          <h2 className="text-5xl font-bold text-gray-900 mb-8 text-center">Let's Build the Future Together</h2>
          <div className="max-w-3xl mx-auto">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/825e75b85_evoucher_logo.png"
              alt="eVoucher"
              className="w-48 h-48 mx-auto mb-8"
            />
            <div className="bg-gradient-to-br from-[#00A89D] to-teal-600 text-white rounded-3xl p-10 text-center shadow-2xl">
              <h3 className="text-3xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-4 text-xl">
                <p><strong>Platform:</strong> eVoucher</p>
                <p><strong>Website:</strong> www.evoucher.co.za</p>
                <p><strong>Email:</strong> invest@evoucher.co.za</p>
                <p><strong>Phone:</strong> +27 11 123 4567</p>
              </div>

            </div>
            <div className="mt-8 text-center text-gray-600">
              <p className="text-lg">Empowering millions of South Africans to save money and build financial wellness</p>
              <p className="text-sm mt-4">© 2025 eVoucher. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:break-after-page { page-break-after: always; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}