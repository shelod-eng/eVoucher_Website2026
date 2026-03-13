import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Sparkles, Shield, Zap, TrendingUp, Users, Phone, Layers, BarChart3, Code, Briefcase } from 'lucide-react';

export default function Landing() {
  return (
    <MobileContainer>
      <div className="min-h-screen flex flex-col">
        {/* Header with Teal Background */}
        <div className="bg-[#00A89D] pt-12 pb-16 px-6 rounded-b-[40px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white mb-4 shadow-lg">
              <span className="text-3xl font-black text-[#00A89D]">eV</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              eVoucher
            </h1>
            <p className="text-white/90 text-lg">Smart Savings for Everyone</p>
          </div>
        </div>
        
        {/* Value Props */}
        <div className="flex-1 px-6 -mt-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-[#00A89D]/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#00A89D]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Save 4% Instantly</h3>
                <p className="text-sm text-gray-500">Pay R960 for R1,000 vouchers</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Community Stores</h3>
                <p className="text-sm text-gray-500">Shoprite, Spaza, Pep & more</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gamified Challenges</h3>
                <p className="text-sm text-gray-500">Weekly goals & community leaderboards</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">USSD & SMS Access</h3>
                <p className="text-sm text-gray-500">No smartphone needed</p>
              </div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="space-y-3 mt-6 pb-6">
            <Link to={createPageUrl('ConsumerHome')} className="block">
              <GoldButton className="w-full h-14 text-lg">
                <Zap className="w-5 h-5 mr-2" />
                Get Started
              </GoldButton>
            </Link>
            
            <div className="flex gap-3">
              <Link to={createPageUrl('MerchantOnboardingFlow')} className="flex-1">
                <GoldButton variant="outline" className="w-full text-sm">
                  Become Merchant
                </GoldButton>
              </Link>
              <Link to={createPageUrl('AdminDashboard')} className="flex-1">
                <GoldButton variant="outline" className="w-full text-sm">
                  Admin
                </GoldButton>
              </Link>
            </div>
            
            <Link to={createPageUrl('InvestecPresentation')} className="block mt-3">
              <GoldButton className="w-full text-lg h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl animate-pulse">
                <Briefcase className="w-5 h-5 mr-2" />
                🚀 Investec Presentation
              </GoldButton>
            </Link>

            <Link to={createPageUrl('StakeholderHub')} className="block mt-3">
              <GoldButton className="w-full text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <Users className="w-4 h-4 mr-2" />
                Stakeholder Hub (Download PDF)
              </GoldButton>
            </Link>

            <Link to={createPageUrl('Reports')} className="block mt-3">
              <GoldButton className="w-full text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports & Documents
              </GoldButton>
            </Link>

            <Link to={createPageUrl('MobileAppPOC')} className="block mt-3">
              <GoldButton className="w-full text-sm bg-gradient-to-r from-green-500 to-teal-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Mobile App Features (POC)
              </GoldButton>
            </Link>

            <Link to={createPageUrl('TechSpec')} className="block mt-3">
              <GoldButton className="w-full text-sm bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <Code className="w-4 h-4 mr-2" />
                Technical Specifications
              </GoldButton>
            </Link>

            <Link to={createPageUrl('Website')} className="block mt-3">
              <GoldButton className="w-full text-lg h-16 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-2xl">
                <Sparkles className="w-5 h-5 mr-2" />
                🌐 eVoucher Website
              </GoldButton>
            </Link>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link to={createPageUrl('USSDSimulator')}>
                <GoldButton variant="outline" className="w-full text-sm bg-green-50 border-green-200 text-green-700">
                  <Phone className="w-4 h-4 mr-2" />
                  USSD Demo
                </GoldButton>
              </Link>
              <Link to={createPageUrl('SMSSimulator')}>
                <GoldButton variant="outline" className="w-full text-sm bg-blue-50 border-blue-200 text-blue-700">
                  <Phone className="w-4 h-4 mr-2" />
                  SMS Demo
                </GoldButton>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 text-center bg-gray-50 border-t border-gray-200">
          <p className="text-gray-500 text-xs">
            Empowering communities through social business
          </p>
          <p className="text-[#00A89D] text-xs mt-1 font-medium">
            eVoucher © 2025 | 3P's Social Business Model
          </p>
        </div>
      </div>
    </MobileContainer>
  );
}