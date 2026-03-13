import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Shield, Lock, Eye, Fingerprint, Smartphone, FileText, ChevronRight } from 'lucide-react';

export default function PrivacySecurityPage() {
  const [settings, setSettings] = useState({
    twoFactor: true,
    biometric: true,
    loginAlerts: true,
    shareData: false
  });

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Profile')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Privacy & Security</h1>
          </div>
        </div>

        <div className="px-4 pt-6">
          {/* Security Status */}
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 p-4 mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Your account is secure</h3>
                <p className="text-green-700 text-sm">All security features enabled</p>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <div className="mb-6">
            <h2 className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-medium">Security</h2>
            <Card className="bg-white border-gray-200 divide-y divide-gray-100 rounded-xl">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#00A89D]" />
                  <div>
                    <span className="text-gray-900 block">Two-Factor Authentication</span>
                    <span className="text-gray-500 text-xs">Extra layer of security</span>
                  </div>
                </div>
                <Switch checked={settings.twoFactor} onCheckedChange={(v) => setSettings({...settings, twoFactor: v})} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-purple-500" />
                  <div>
                    <span className="text-gray-900 block">Biometric Login</span>
                    <span className="text-gray-500 text-xs">Fingerprint or Face ID</span>
                  </div>
                </div>
                <Switch checked={settings.biometric} onCheckedChange={(v) => setSettings({...settings, biometric: v})} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-gray-900 block">Login Alerts</span>
                    <span className="text-gray-500 text-xs">Get notified of new logins</span>
                  </div>
                </div>
                <Switch checked={settings.loginAlerts} onCheckedChange={(v) => setSettings({...settings, loginAlerts: v})} />
              </div>
            </Card>
          </div>

          {/* Privacy Settings */}
          <div className="mb-6">
            <h2 className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-medium">Privacy</h2>
            <Card className="bg-white border-gray-200 divide-y divide-gray-100 rounded-xl">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-pink-500" />
                  <div>
                    <span className="text-gray-900 block">Share Usage Data</span>
                    <span className="text-gray-500 text-xs">Help improve our services</span>
                  </div>
                </div>
                <Switch checked={settings.shareData} onCheckedChange={(v) => setSettings({...settings, shareData: v})} />
              </div>
            </Card>
          </div>

          {/* Legal Documents */}
          <div className="mb-6">
            <h2 className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-medium">Legal</h2>
            <Card className="bg-white border-gray-200 divide-y divide-gray-100 rounded-xl">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((doc) => (
                <div key={doc} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{doc}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <GoldButton variant="outline" className="w-full">Change Password</GoldButton>
            <button className="w-full py-3 text-red-500 text-sm font-medium">Delete My Account</button>
          </div>
        </div>
      </div>
      <BottomNav activePage="Profile" />
    </MobileContainer>
  );
}