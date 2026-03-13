import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import GoldButton from '@/components/ui/GoldButton';
import { 
  ArrowLeft, Download, TrendingUp, DollarSign, 
  Users, Store, Target, PieChart, BarChart3, 
  LineChart, Building2, Sparkles, Car, Globe
} from 'lucide-react';

export default function MiniCooperReport() {
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
            <div className="flex items-center justify-center gap-6 mb-6">
              <img 
                src="https://www.carlogos.org/logo/Mini-logo-2001-640x263.jpg"
                alt="Mini Cooper"
                className="h-24 object-contain"
              />
              <img 
                src="https://www.carlogos.org/logo/BMW-logo-2000-640x639.jpg"
                alt="BMW"
                className="h-24 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Mini Cooper Partnership</h1>
            <h2 className="text-2xl text-blue-600 font-semibold mb-4">Financial Model & Market Analysis</h2>
            <p className="text-gray-600">Premium Automotive Voucher Program</p>
            <p className="text-sm text-gray-500 mt-4">Generated: December 2025</p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-12" />

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              Executive Summary
            </h2>
            <Card className="bg-gradient-to-br from-blue-50 to-slate-100 border-blue-200 p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong className="text-blue-600">Mini Cooper x BMW Partnership</strong> creates a premium automotive voucher 
                program that offers exclusive savings on vehicle purchases, services, and accessories. This strategic partnership 
                combines Mini Cooper's iconic brand appeal with BMW's luxury automotive excellence.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4 text-center border-2 border-blue-200">
                  <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">Premium</p>
                  <p className="text-sm text-gray-600">Automotive Brands</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border-2 border-slate-200">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">R50M+</p>
                  <p className="text-sm text-gray-600">Target Revenue (Year 1)</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-200">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">10K+</p>
                  <p className="text-sm text-gray-600">Target Customers</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 1: Financial Model */}
          <section className="mb-12 print:break-before-page">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-blue-600" />
              1. Financial Model & Revenue Streams
            </h2>

            {/* Revenue Architecture */}
            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Architecture</h3>
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl p-6 mb-6">
                <p className="text-center text-lg font-semibold text-gray-900 mb-4">Per R100,000 Vehicle Voucher</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Customer Pays</p>
                      <p className="text-sm text-gray-500">3% instant savings</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">R97,000</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Voucher Face Value</p>
                      <p className="text-sm text-gray-500">Redeemable at dealership</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">R100,000</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div>
                      <p className="font-semibold text-green-900">Platform Revenue</p>
                      <p className="text-sm text-green-600">3% margin retained</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">R3,000</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Dealership Settlement</p>
                      <p className="text-sm text-gray-500">97% of face value</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">R97,000</p>
                  </div>
                </div>
              </div>

              {/* Cost Structure */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Cost Structure & Profit Margins</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-red-50 border-red-200 p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Operating Costs (per R3,000 revenue)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Payment Gateway (1.5%)</span>
                      <span className="font-semibold">R45</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bank Processing</span>
                      <span className="font-semibold">R30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Technology & Platform</span>
                      <span className="font-semibold">R75</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Customer Support</span>
                      <span className="font-semibold">R50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Marketing & Sales</span>
                      <span className="font-semibold">R150</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-red-300 font-bold text-gray-900">
                      <span>Total Operating Costs</span>
                      <span className="text-red-600">R350</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-green-50 border-green-200 p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Net Profit Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Gross Revenue (3%)</span>
                      <span className="font-semibold">R3,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Operating Costs</span>
                      <span className="font-semibold text-red-600">-R350</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-green-300 font-bold text-lg text-green-700">
                      <span>Net Profit per R100K</span>
                      <span>R2,650</span>
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-center font-bold text-green-800">
                        88.3% Net Margin
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>

            {/* Revenue Projections */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LineChart className="w-6 h-6 text-blue-600" />
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
                      <td className="py-3 px-2 text-gray-900 font-medium">Active Customers</td>
                      <td className="text-right py-3 px-2">2,500</td>
                      <td className="text-right py-3 px-2">7,500</td>
                      <td className="text-right py-3 px-2">15,000</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Avg. Voucher Value</td>
                      <td className="text-right py-3 px-2">R80,000</td>
                      <td className="text-right py-3 px-2">R100,000</td>
                      <td className="text-right py-3 px-2">R120,000</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-900 font-medium">Annual GMV</td>
                      <td className="text-right py-3 px-2 font-bold">R200M</td>
                      <td className="text-right py-3 px-2 font-bold">R750M</td>
                      <td className="text-right py-3 px-2 font-bold">R1.8B</td>
                    </tr>
                    <tr className="bg-green-50 border-b-2 border-green-300">
                      <td className="py-3 px-2 text-gray-900 font-bold">Platform Revenue (3%)</td>
                      <td className="text-right py-3 px-2 font-bold text-green-700">R6M</td>
                      <td className="text-right py-3 px-2 font-bold text-green-700">R22.5M</td>
                      <td className="text-right py-3 px-2 font-bold text-green-700">R54M</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="py-3 px-2 text-gray-900 font-bold">Net Profit (88.3%)</td>
                      <td className="text-right py-3 px-2 font-bold text-blue-700">R5.3M</td>
                      <td className="text-right py-3 px-2 font-bold text-blue-700">R19.9M</td>
                      <td className="text-right py-3 px-2 font-bold text-blue-700">R47.7M</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Section 2: Market Analysis */}
          <section className="mb-12 print:break-before-page">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              2. Market Analysis & Opportunity
            </h2>

            <Card className="p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">South African Premium Automotive Market</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <Globe className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-3xl font-bold mb-1">R120B</p>
                  <p className="text-blue-100 text-sm">Annual Auto Sales Market</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <Car className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-3xl font-bold mb-1">R18B</p>
                  <p className="text-purple-100 text-sm">Premium Segment (BMW/Mini)</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <Target className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-3xl font-bold mb-1">R1.8B</p>
                  <p className="text-green-100 text-sm">Target (10% penetration)</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3">Market Opportunity</h4>
                <p className="text-gray-700">
                  South Africa's premium automotive market is valued at <strong className="text-blue-600">R18B annually</strong>, 
                  with BMW and Mini Cooper commanding significant market share. By offering 3% instant savings on vehicle purchases, 
                  we target affluent consumers seeking value without compromising on luxury.
                </p>
              </div>
            </Card>

            {/* Partner Network */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Premium Automotive Partners</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <img 
                    src="https://www.carlogos.org/logo/BMW-logo-2000-640x639.jpg"
                    alt="BMW"
                    className="h-16 object-contain mx-auto mb-4"
                  />
                  <h4 className="font-bold text-gray-900 text-center mb-3">BMW South Africa</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✓ Complete vehicle range</li>
                    <li>✓ Service & maintenance packages</li>
                    <li>✓ Genuine parts & accessories</li>
                    <li>✓ BMW Motorrad motorcycles</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-300">
                  <img 
                    src="https://www.carlogos.org/logo/Mini-logo-2001-640x263.jpg"
                    alt="Mini Cooper"
                    className="h-16 object-contain mx-auto mb-4"
                  />
                  <h4 className="font-bold text-gray-900 text-center mb-3">Mini Cooper South Africa</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✓ All Mini models & variants</li>
                    <li>✓ Customization packages</li>
                    <li>✓ Service plans & warranties</li>
                    <li>✓ John Cooper Works performance</li>
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          {/* Value Proposition */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Stakeholder Value Proposition</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
                <Users className="w-10 h-10 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">For Customers</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ 3% instant savings on purchases</li>
                  <li>✓ Exclusive dealership access</li>
                  <li>✓ Flexible payment options</li>
                  <li>✓ Premium ownership experience</li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
                <Store className="w-10 h-10 text-green-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">For Dealerships</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Guaranteed pre-paid sales</li>
                  <li>✓ Increased footfall & conversions</li>
                  <li>✓ Reduced financing risk</li>
                  <li>✓ New customer acquisition</li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
                <Building2 className="w-10 h-10 text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">For BMW Group</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Enhanced brand accessibility</li>
                  <li>✓ Volume growth opportunity</li>
                  <li>✓ Market expansion</li>
                  <li>✓ Customer loyalty programs</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t-2 border-gray-200 pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Premium Partnership Opportunity</h3>
              <p className="text-gray-600 mb-6">
                Join us in revolutionizing premium automotive purchases in South Africa.
              </p>
              <div className="inline-flex flex-col gap-2 text-sm text-gray-700">
                <p><strong>Platform:</strong> Mini Cooper x BMW Partnership Program</p>
                <p><strong>Contact:</strong> partnerships@minicooper.evoucher.co.za</p>
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