import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import GoldButton from '@/components/ui/GoldButton';
import { 
  Download, ArrowRight, TrendingUp, Users, Zap, Heart, 
  Shield, Globe, Smartphone, FileText, BarChart3, Target,
  Award, Sparkles, ChevronRight, Phone, Mail, Linkedin
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function StakeholderHub() {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    const element = document.getElementById('pdf-content');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('eVoucher-Stakeholder-Brief.pdf');
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#00A89D] via-teal-600 to-[#00C4B8] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white mb-6 shadow-2xl">
              <span className="text-3xl font-black text-[#00A89D]">eV</span>
            </div>
            <h1 className="text-5xl font-bold mb-4">eVoucher</h1>
            <p className="text-2xl font-light mb-2">Empowering 10 Million People</p>
            <p className="text-xl text-white/90 mb-8">Social Business Model for Financial Inclusion</p>
            
            <div className="flex gap-4 justify-center">
              <GoldButton 
                onClick={generatePDF}
                className="bg-white text-[#00A89D] hover:bg-gray-100 text-lg px-8 py-6"
                disabled={generating}
              >
                <Download className="w-5 h-5 mr-2" />
                {generating ? 'Generating...' : 'Download Full Brief'}
              </GoldButton>
              <a href="#impact" className="inline-block">
                <GoldButton 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  View Impact <ArrowRight className="w-5 h-5 ml-2" />
                </GoldButton>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* PDF Content */}
      <div id="pdf-content" className="max-w-6xl mx-auto px-6 py-12">
        {/* Executive Summary */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Target className="w-8 h-8 text-[#00A89D]" />
            Executive Summary
          </h2>
          <Card className="p-8 bg-white shadow-lg">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              eVoucher is a revolutionary social business platform leveraging the <strong>3P's Model (People, Planet, Profit)</strong> to deliver financial inclusion at scale. We provide <strong>instant 4% savings</strong> on everyday purchases for low-income communities while creating sustainable revenue streams for merchants and financial partners.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-white rounded-xl">
                <p className="text-4xl font-bold text-[#00A89D] mb-2">R96M</p>
                <p className="text-gray-600 font-medium">Target Annual Volume</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl">
                <p className="text-4xl font-bold text-blue-600 mb-2">10M</p>
                <p className="text-gray-600 font-medium">People Reached</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl">
                <p className="text-4xl font-bold text-purple-600 mb-2">R3.84M</p>
                <p className="text-gray-600 font-medium">Annual Consumer Savings</p>
              </div>
            </div>
            <p className="text-gray-700">
              <strong>Investment Opportunity:</strong> Seeking <span className="text-[#00A89D] font-bold text-xl">R10 Million</span> to scale operations, onboard 500+ merchants, and reach 10 million users across South Africa.
            </p>
          </Card>
        </motion.section>

        {/* The Problem */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            The Problem We Solve
          </h2>
          <Card className="p-8 bg-gradient-to-br from-red-50 to-white shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Exclusion Crisis</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span><strong>30.4 million</strong> South Africans living below poverty line</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Smartphone className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span><strong>40%</strong> lack access to smartphones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span>No savings mechanisms for everyday purchases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <span>Limited access to formal financial services</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Our Solution</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-[#00A89D] mt-1 flex-shrink-0" />
                    <span><strong>4% instant savings</strong> on all voucher purchases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="w-5 h-5 text-[#00A89D] mt-1 flex-shrink-0" />
                    <span><strong>USSD & SMS</strong> access for feature phones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Globe className="w-5 h-5 text-[#00A89D] mt-1 flex-shrink-0" />
                    <span>Pan-African scalability potential</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-[#00A89D] mt-1 flex-shrink-0" />
                    <span>Gamification & rewards for engagement</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Business Model */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#00A89D]" />
            Revenue Model
          </h2>
          <Card className="p-8 bg-white shadow-lg">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3P's Social Business Model</h3>
              <p className="text-gray-700 mb-6">eVoucher operates on a transparent, sustainable revenue model that benefits all stakeholders:</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-gradient-to-br from-teal-50 to-white rounded-xl border-2 border-teal-200">
                <div className="w-12 h-12 rounded-xl bg-[#00A89D] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">People</h4>
                <p className="text-gray-700 mb-2"><strong>Consumers save 4%</strong></p>
                <p className="text-sm text-gray-600">Pay R960 for R1,000 vouchers</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-200">
                <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Planet</h4>
                <p className="text-gray-700 mb-2"><strong>Digital-first platform</strong></p>
                <p className="text-sm text-gray-600">Reducing paper waste & carbon footprint</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-200">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Profit</h4>
                <p className="text-gray-700 mb-2"><strong>Platform earns 4%</strong></p>
                <p className="text-sm text-gray-600">Sustainable revenue for operations</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-4 text-center text-xl">Revenue Breakdown per R1,000 Voucher</h4>
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-[#00A89D]">R960</p>
                  <p className="text-sm text-gray-600">Consumer Pays</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">R920</p>
                  <p className="text-sm text-gray-600">Merchant Receives</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">R40</p>
                  <p className="text-sm text-gray-600">Platform Revenue</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-teal-600">R40</p>
                  <p className="text-sm text-gray-600">Consumer Saves</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Market Opportunity */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16" id="impact"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            Market Opportunity
          </h2>
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-white shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">South Africa TAM</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <span className="text-gray-700">Total Population</span>
                    <span className="text-2xl font-bold text-gray-900">60M</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <span className="text-gray-700">Below Poverty Line</span>
                    <span className="text-2xl font-bold text-orange-600">30.4M</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                    <span className="text-gray-700">Target Market</span>
                    <span className="text-2xl font-bold text-[#00A89D]">10M</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#00A89D] to-teal-600 rounded-lg text-white">
                    <span className="font-medium">Market Penetration</span>
                    <span className="text-2xl font-bold">33%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Projections</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Annual Transaction Volume</p>
                    <p className="text-3xl font-bold text-gray-900">R96M</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Platform Revenue (4%)</p>
                    <p className="text-3xl font-bold text-[#00A89D]">R3.84M</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Consumer Savings (4%)</p>
                    <p className="text-3xl font-bold text-teal-600">R3.84M</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white">
                    <p className="text-white/90 text-sm mb-1">ROI Timeline</p>
                    <p className="text-3xl font-bold">18-24 months</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Technology Stack */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            Technology & Innovation
          </h2>
          <Card className="p-8 bg-white shadow-lg">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-200">
                <Smartphone className="w-10 h-10 text-yellow-600 mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">Multi-Channel Access</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Web & Mobile App</li>
                  <li>• USSD (*120*384#)</li>
                  <li>• SMS Integration</li>
                  <li>• QR Code Scanning</li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200">
                <Sparkles className="w-10 h-10 text-purple-600 mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Features</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Personalized recommendations</li>
                  <li>• Spending insights</li>
                  <li>• Fraud detection</li>
                  <li>• Predictive analytics</li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200">
                <Shield className="w-10 h-10 text-[#00A89D] mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">Security & Compliance</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Bank-grade encryption</li>
                  <li>• POPIA compliant</li>
                  <li>• Secure payments (PCI DSS)</li>
                  <li>• Real-time fraud monitoring</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Social Impact */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            Social Impact Goals
          </h2>
          <Card className="p-8 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">UN SDG Alignment</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">1</div>
                    <span className="text-gray-700 font-medium">No Poverty</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">8</div>
                    <span className="text-gray-700 font-medium">Decent Work & Economic Growth</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center text-white font-bold">10</div>
                    <span className="text-gray-700 font-medium">Reduced Inequalities</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Impact Metrics (Year 1)</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">People Reached</p>
                    <p className="text-3xl font-bold text-[#00A89D]">10,000,000</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Total Savings Generated</p>
                    <p className="text-3xl font-bold text-teal-600">R3.84M</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Merchants Onboarded</p>
                    <p className="text-3xl font-bold text-purple-600">500+</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Investment Ask */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Target className="w-8 h-8 text-green-600" />
            Investment Opportunity
          </h2>
          <Card className="p-8 bg-gradient-to-r from-[#00A89D] to-teal-600 text-white shadow-2xl">
            <div className="text-center mb-8">
              <p className="text-xl mb-2">Seeking Investment</p>
              <p className="text-6xl font-bold mb-4">R10 Million</p>
              <p className="text-xl text-white/90">To scale to 10 million users across South Africa</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                <p className="text-white/80 text-sm mb-2">Use of Funds</p>
                <p className="text-2xl font-bold mb-1">40%</p>
                <p className="text-sm text-white/90">Technology & Platform</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                <p className="text-white/80 text-sm mb-2">Use of Funds</p>
                <p className="text-2xl font-bold mb-1">35%</p>
                <p className="text-sm text-white/90">Marketing & User Acquisition</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                <p className="text-white/80 text-sm mb-2">Use of Funds</p>
                <p className="text-2xl font-bold mb-1">25%</p>
                <p className="text-sm text-white/90">Operations & Team</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
              <h4 className="text-xl font-bold mb-4">Expected Returns</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-3xl font-bold">3.5x</p>
                  <p className="text-sm text-white/90">3-Year ROI</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">18-24m</p>
                  <p className="text-sm text-white/90">Breakeven Timeline</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">10M</p>
                  <p className="text-sm text-white/90">Users Reached</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Key Documents */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#00A89D]" />
            Key Documents & Resources
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link to={createPageUrl('InvestorPitchDeck')}>
              <Card className="p-6 hover:shadow-xl transition-all bg-white cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#00A89D] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Investor Pitch Deck</h3>
                <p className="text-gray-600">Comprehensive investment presentation with financials and projections</p>
              </Card>
            </Link>

            <Link to={createPageUrl('ImpactDashboard')}>
              <Card className="p-6 hover:shadow-xl transition-all bg-white cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#00A89D] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Impact Dashboard</h3>
                <p className="text-gray-600">Real-time social impact metrics and success stories</p>
              </Card>
            </Link>

            <Link to={createPageUrl('TechnicalPortfolio')}>
              <Card className="p-6 hover:shadow-xl transition-all bg-white cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#00A89D] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Technical Portfolio</h3>
                <p className="text-gray-600">Platform architecture and technology stack overview</p>
              </Card>
            </Link>

            <Link to={createPageUrl('MerchantProspectus')}>
              <Card className="p-6 hover:shadow-xl transition-all bg-white cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-[#00A89D] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Merchant Prospectus</h3>
                <p className="text-gray-600">Partnership opportunities and merchant benefits</p>
              </Card>
            </Link>
          </div>
        </motion.section>

        {/* Contact & Next Steps */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Let's Build the Future Together</h2>
            <p className="text-xl text-center text-white/90 mb-8">
              Join us in empowering 10 million people across South Africa
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#00A89D]" />
                </div>
                <p className="text-white/90 text-sm mb-2">Email</p>
                <p className="font-bold">hello@evoucher.co.za</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#00A89D]" />
                </div>
                <p className="text-white/90 text-sm mb-2">Phone</p>
                <p className="font-bold">+27 11 123 4567</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Linkedin className="w-8 h-8 text-[#00A89D]" />
                </div>
                <p className="text-white/90 text-sm mb-2">LinkedIn</p>
                <p className="font-bold">eVoucher SA</p>
              </div>
            </div>

            <div className="text-center">
              <GoldButton 
                onClick={generatePDF}
                className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-10 py-6"
                disabled={generating}
              >
                <Download className="w-5 h-5 mr-2" />
                {generating ? 'Generating PDF...' : 'Download Complete Brief'}
              </GoldButton>
            </div>
          </Card>
        </motion.section>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white/70">© 2025 eVoucher. A 3P's Social Business Initiative.</p>
          <p className="text-white/50 text-sm mt-2">Empowering communities through technology and financial inclusion</p>
        </div>
      </div>
    </div>
  );
}