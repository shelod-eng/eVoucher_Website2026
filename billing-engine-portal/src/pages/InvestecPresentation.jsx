import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Globe, Zap, Shield, Target, DollarSign, Award, ArrowRight, BarChart3, Rocket, Heart, Download, Mail, Phone, Linkedin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import GoldButton from '@/components/ui/GoldButton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const StatCard = ({ value, label, icon: Icon, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
  >
    <Card className={`relative overflow-hidden border-0 shadow-2xl ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="relative p-6">
        <Icon className="w-8 h-8 text-white mb-3" />
        <h3 className="text-4xl font-bold text-white mb-1">{value}</h3>
        <p className="text-white/80 text-sm">{label}</p>
      </div>
    </Card>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 hover:shadow-xl transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A89D] to-[#00C4B8] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </Card>
  </motion.div>
);

export default function InvestecPresentation() {
  const [showContact, setShowContact] = useState(false);

  const handleDownloadDeck = () => {
    window.open(createPageUrl('InvestorPitchDeck'), '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#00A89D]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-16"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl">
                <span className="text-3xl font-black text-[#00A89D]">eV</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">eVoucher</h1>
                <p className="text-gray-400 text-sm">Social Business for Impact</p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowContact(!showContact)}
              className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Us
            </motion.button>
          </motion.div>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#00A89D] to-[#00C4B8] rounded-full text-sm font-semibold mb-6">
                🚀 Series A Investment Opportunity
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Banking the<br />
                <span className="bg-gradient-to-r from-[#00A89D] via-[#00C4B8] to-purple-500 bg-clip-text text-transparent">
                  Unbanked
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                A fintech platform empowering 18M South Africans through instant 4% savings on everyday purchases. 
                Backed by FNB & ABSA. Zero-trust architecture. Social impact at scale.
              </p>
              <div className="flex gap-4">
                <GoldButton 
                  className="px-8 py-4 text-lg shadow-2xl"
                  onClick={handleDownloadDeck}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Pitch Deck
                </GoldButton>
                <button
                  onClick={() => document.getElementById('opportunity')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all font-semibold"
                >
                  Learn More
                </button>
              </div>
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              <StatCard
                value="18M"
                label="Target Market"
                icon={Users}
                gradient="bg-gradient-to-br from-[#00A89D] to-[#00C4B8]"
                delay={0.5}
              />
              <StatCard
                value="R156B"
                label="Annual Market Size"
                icon={DollarSign}
                gradient="bg-gradient-to-br from-purple-500 to-purple-700"
                delay={0.6}
              />
              <StatCard
                value="4%"
                label="Instant Savings"
                icon={TrendingUp}
                gradient="bg-gradient-to-br from-orange-500 to-red-600"
                delay={0.7}
              />
              <StatCard
                value="2 Banks"
                label="Strategic Partners"
                icon={Shield}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                delay={0.8}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* The Problem Section */}
      <div className="bg-white text-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">The R8.8 Trillion Problem</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              18 million South Africans live on less than R3,500/month. Every rand counts.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Target}
              title="Low Income Households"
              description="18M people earning under poverty line. Need immediate savings solutions that work with or without smartphones."
              delay={0.2}
            />
            <FeatureCard
              icon={Globe}
              title="Digital Divide"
              description="40% have feature phones only. Our USSD/SMS solution ensures financial inclusion for all."
              delay={0.3}
            />
            <FeatureCard
              icon={Heart}
              title="Social Impact"
              description="Every transaction creates measurable social value. 4% savings = R624/year extra for a family."
              delay={0.4}
            />
          </div>
        </div>
      </div>

      {/* The Solution Section */}
      <div id="opportunity" className="bg-gradient-to-br from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">The 3P's Business Model</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              People. Planet. Profit. A win-win-win for consumers, merchants, and investors.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 bg-gradient-to-br from-[#00A89D] to-[#00C4B8] border-0 text-white">
              <Rocket className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Consumers Save</h3>
              <p className="text-white/90 mb-4">Pay R960 for R1,000 vouchers. Instant 4% savings on groceries, transport, airtime.</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Works with feature phones (USSD/SMS)</li>
                <li>✓ Gamified savings challenges</li>
                <li>✓ Referral rewards (R20 per friend)</li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-purple-600 to-purple-800 border-0 text-white">
              <BarChart3 className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Merchants Win</h3>
              <p className="text-white/90 mb-4">Get cash upfront, increase foot traffic, build loyal customer base.</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Receive 92% upfront</li>
                <li>✓ Zero-cost customer acquisition</li>
                <li>✓ Real-time analytics dashboard</li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-orange-500 to-red-600 border-0 text-white">
              <DollarSign className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Platform Profits</h3>
              <p className="text-white/90 mb-4">4% margin per transaction. Scalable, recurring revenue model.</p>
              <ul className="space-y-2 text-sm">
                <li>✓ R156B annual market size</li>
                <li>✓ 80% gross margins</li>
                <li>✓ Bank partnerships secured</li>
              </ul>
            </Card>
          </div>

          {/* Revenue Model */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-10 bg-white/5 backdrop-blur-xl border border-white/10">
              <h3 className="text-3xl font-bold mb-8 text-center">Revenue Model Breakdown</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#00A89D] mb-2">R1,000</div>
                  <p className="text-gray-300 text-sm">Voucher Face Value</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">R960</div>
                  <p className="text-gray-300 text-sm">Consumer Pays (4% off)</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-400 mb-2">R920</div>
                  <p className="text-gray-300 text-sm">Merchant Receives (92%)</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">R40</div>
                  <p className="text-gray-300 text-sm">Platform Margin (4%)</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-white text-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Enterprise-Grade Technology</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on React, deployed on AWS, with bank-grade security and 99.9% uptime SLA.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Shield}
              title="Bank-Grade Security"
              description="End-to-end encryption, PCI DSS compliant, zero-trust architecture."
              delay={0.1}
            />
            <FeatureCard
              icon={Zap}
              title="Real-Time Processing"
              description="Instant voucher generation, QR codes, and redemption tracking."
              delay={0.2}
            />
            <FeatureCard
              icon={Users}
              title="Multi-Channel Access"
              description="Web app, USSD (*120*384#), SMS for feature phones."
              delay={0.3}
            />
            <FeatureCard
              icon={BarChart3}
              title="AI-Powered Insights"
              description="Predictive analytics, personalized offers, fraud detection."
              delay={0.4}
            />
          </div>
        </div>
      </div>

      {/* Traction Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Strategic Partnerships</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Backed by South Africa's leading financial institutions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">FNB Partnership</h3>
                  <p className="text-gray-400">Payment Gateway & Banking</p>
                </div>
              </div>
              <p className="text-gray-300">Integrated payment processing, settlement infrastructure, and API access to FNB's 12M customers.</p>
            </Card>

            <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">ABSA Partnership</h3>
                  <p className="text-gray-400">Transaction Sponsorship</p>
                </div>
              </div>
              <p className="text-gray-300">Co-sponsorship of transaction fees and joint marketing initiatives to reach underbanked consumers.</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Investment Ask */}
      <div className="bg-gradient-to-br from-[#00A89D] via-[#00C4B8] to-purple-600 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold mb-6">Join the Impact Revolution</h2>
            <p className="text-2xl mb-4 text-white/90">
              Seeking R50M Series A to scale to 1M users
            </p>
            <p className="text-xl mb-10 text-white/80 max-w-3xl mx-auto">
              Use of funds: Technology (30%), Marketing (40%), Merchant Acquisition (20%), Operations (10%)
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20 text-white">
                <h3 className="text-3xl font-bold mb-2">3.5x</h3>
                <p className="text-white/80">Projected ROI Year 3</p>
              </Card>
              <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20 text-white">
                <h3 className="text-3xl font-bold mb-2">R280M</h3>
                <p className="text-white/80">Revenue Projection Year 3</p>
              </Card>
              <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20 text-white">
                <h3 className="text-3xl font-bold mb-2">1M+</h3>
                <p className="text-white/80">Target Users Year 2</p>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GoldButton 
                className="px-10 py-5 text-lg shadow-2xl bg-white text-[#00A89D] hover:bg-gray-100"
                onClick={handleDownloadDeck}
              >
                <Download className="w-5 h-5 mr-2" />
                Download Full Pitch Deck
              </GoldButton>
              <button
                onClick={() => setShowContact(true)}
                className="px-10 py-5 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all font-semibold text-lg"
              >
                Schedule Meeting
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      {showContact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowContact(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-10 max-w-2xl w-full"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Let's Connect</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00A89D]/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#00A89D]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-semibold text-gray-900">invest@evoucher.co.za</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00A89D]/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#00A89D]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">+27 82 456 7890</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00A89D]/10 flex items-center justify-center">
                  <Linkedin className="w-6 h-6 text-[#00A89D]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">LinkedIn</p>
                  <p className="text-lg font-semibold text-gray-900">linkedin.com/company/evoucher</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowContact(false)}
              className="mt-8 w-full py-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-semibold text-gray-900"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="bg-gray-900 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                <span className="text-xl font-black text-[#00A89D]">eV</span>
              </div>
              <div>
                <p className="text-white font-bold">eVoucher</p>
                <p className="text-gray-400 text-sm">Empowering Communities</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to={createPageUrl('Landing')}>
                <button className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm">
                  Consumer App
                </button>
              </Link>
              <Link to={createPageUrl('StakeholderHub')}>
                <button className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm">
                  Stakeholder Hub
                </button>
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
            <p>© 2025 eVoucher. All rights reserved. | Regulated by SARB | PCI DSS Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}