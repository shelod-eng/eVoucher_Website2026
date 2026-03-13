import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { 
  ArrowLeft, FileText, DollarSign, Building2, BarChart3, 
  Users, Code, Layers, TrendingUp, Briefcase, GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

const reports = [
  {
    title: 'Tech Spec',
    description: 'Technical specifications & documentation',
    icon: FileText,
    page: 'TechSpec',
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'Stakeholder Report',
    description: 'Executive summary for stakeholders',
    icon: Briefcase,
    page: 'StakeholderReport',
    color: 'from-purple-500 to-purple-600'
  },
  {
    title: 'System Architecture',
    description: 'Technical architecture overview',
    icon: Layers,
    page: 'SystemArchitecture',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    title: 'Admin Reports',
    description: 'Platform analytics & metrics',
    icon: BarChart3,
    page: 'AdminReports',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    title: 'Billing Engine',
    description: 'Invoicing & payment processing',
    icon: DollarSign,
    page: 'BillingEngine',
    color: 'from-green-500 to-green-600'
  },
  {
    title: 'Financial Report',
    description: 'Revenue model & projections',
    icon: TrendingUp,
    page: 'StakeholderFinancialReport',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    title: 'Investor Pitch Deck',
    description: 'Investment opportunity overview',
    icon: Building2,
    page: 'InvestorPitchDeck',
    color: 'from-pink-500 to-rose-600'
  },
  {
    title: 'Merchant Prospectus',
    description: 'Merchant onboarding materials',
    icon: Users,
    page: 'MerchantProspectus',
    color: 'from-teal-500 to-cyan-600'
  },
  {
    title: 'Technical Portfolio',
    description: 'University project showcase',
    icon: GraduationCap,
    page: 'TechnicalPortfolio',
    color: 'from-violet-500 to-purple-600'
  }
];

export default function Reports() {
  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#00A89D] via-[#00C4B8] to-[#00A89D] pt-6 pb-16 px-4 rounded-b-[40px] relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/20 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <Link to={createPageUrl('Landing')}>
              <motion.button 
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            </Link>
            
            <h1 className="text-3xl font-bold text-white mb-2">Reports & Documents</h1>
            <p className="text-white/90">Access all platform reports and documentation</p>
          </div>
        </motion.div>

        {/* Reports Grid */}
        <div className="px-4 -mt-6 pb-8">
          <div className="space-y-3">
            {reports.map((report, idx) => (
              <motion.div
                key={report.page}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={createPageUrl(report.page)}>
                  <div className={`bg-gradient-to-r ${report.color} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                        <report.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{report.title}</h3>
                        <p className="text-white/80 text-sm">{report.description}</p>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-white rotate-180" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}