import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Code, Database, Zap, Smartphone, Shield, Users, TrendingUp, Globe, Layers, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowWeBuilt() {
  const techStack = [
    { name: 'React', icon: Code, desc: 'Modern UI framework' },
    { name: 'Base44', icon: Database, desc: 'Backend platform' },
    { name: 'Tailwind CSS', icon: Zap, desc: 'Utility-first styling' },
    { name: 'Framer Motion', icon: Smartphone, desc: 'Smooth animations' },
  ];

  const features = [
    { title: 'Voucher Marketplace', icon: Globe, desc: 'Browse & purchase vouchers from trusted merchants' },
    { title: 'Digital Wallet', icon: Shield, desc: 'Secure money management with instant transactions' },
    { title: 'Rewards System', icon: TrendingUp, desc: 'Gamified challenges & loyalty tiers' },
    { title: 'USSD/SMS Access', icon: Smartphone, desc: 'Feature phone support for financial inclusion' },
    { title: 'Referral Program', icon: Users, desc: 'Community-driven growth mechanism' },
    { title: 'Admin Dashboard', icon: Layers, desc: 'Merchant management & reconciliation tools' },
  ];

  const timeline = [
    { phase: 'Discovery', duration: '1 week', tasks: ['Market research', 'User interviews', 'Competitive analysis'] },
    { phase: 'Design', duration: '2 weeks', tasks: ['UI/UX mockups', 'Design system', 'Prototyping'] },
    { phase: 'Development', duration: '4 weeks', tasks: ['Core features', 'API integration', 'Testing'] },
    { phase: 'Launch', duration: '1 week', tasks: ['Beta testing', 'Bug fixes', 'Deployment'] },
  ];

  return (
    <MobileContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 pt-6 pb-16 px-4">
          <div className="flex items-center gap-3 mb-6">
            <Link to={createPageUrl('Landing')}>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-white">How We Built eVoucher</h1>
          </div>
          <p className="text-white/90 text-sm">A technical case study of building a social business platform</p>
        </div>

        {/* Hero Stats */}
        <div className="px-4 -mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">8</p>
                  <p className="text-xs text-gray-600">Weeks</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-3xl font-bold text-blue-600">50+</p>
                  <p className="text-xs text-gray-600">Features</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">100%</p>
                  <p className="text-xs text-gray-600">Mobile-First</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* The Challenge */}
        <div className="px-4 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">The Challenge</h2>
          <Card className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              Create a fintech platform that makes savings accessible to all South Africans, including those with feature phones.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Support both smartphone and feature phone users</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Build trust with transparent pricing (4% savings)</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Enable merchant payouts and reconciliation</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Gamify savings to drive engagement</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="px-4 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-3">
            {techStack.map((tech, idx) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3">
                    <tech.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{tech.name}</h3>
                  <p className="text-xs text-gray-600">{tech.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="px-4 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Features Built</h2>
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Development Timeline */}
        <div className="px-4 mt-8 pb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Development Timeline</h2>
          <div className="space-y-4">
            {timeline.map((phase, idx) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <h3 className="font-bold text-gray-900">{phase.phase}</h3>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {phase.duration}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {phase.tasks.map((task) => (
                      <li key={task} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Architecture Highlight */}
        <div className="px-4 pb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Architecture Decisions</h2>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-2xl border-0 text-white">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2 text-white">Mobile-First Design</h3>
                <p className="text-white/80 text-sm">Built with responsive design from the ground up, ensuring seamless experience across all devices.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-white">Base44 Backend</h3>
                <p className="text-white/80 text-sm">Leveraged Base44's BaaS for rapid development with built-in auth, database, and API management.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-white">Accessibility First</h3>
                <p className="text-white/80 text-sm">USSD and SMS support ensures financial inclusion for feature phone users across South Africa.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="px-4 pb-8">
          <Link to={createPageUrl('ConsumerHome')}>
            <GoldButton className="w-full h-14 text-lg">
              Explore the App
            </GoldButton>
          </Link>
        </div>
      </div>
    </MobileContainer>
  );
}