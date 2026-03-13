import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Globe, Moon, Smartphone, Download, Share2, Star, Phone } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    darkMode: false,
    language: 'en',
    biometric: true,
    autoLock: true
  });

  const handleInstallApp = () => {
    alert('To install eVoucher on your device:\n\n📱 iPhone: Tap Share → Add to Home Screen\n\n🤖 Android: Tap Menu (⋮) → Install App\n\nThis will add eVoucher to your home screen for quick access!');
  };

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
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>
        </div>

        <div className="px-4 pt-6">
          {/* Install App Banner */}
          <Card className="bg-gradient-to-r from-[#00A89D]/10 to-[#00A89D]/5 border-[#00A89D]/30 p-4 mb-6 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Download className="w-6 h-6 text-[#00A89D]" />
              <div>
                <h3 className="font-semibold text-gray-900">Install eVoucher App</h3>
                <p className="text-gray-500 text-sm">Add to your home screen for quick access</p>
              </div>
            </div>
            <GoldButton className="w-full" onClick={handleInstallApp}>
              <Smartphone className="w-4 h-4 mr-2" /> Install Now
            </GoldButton>
          </Card>

          {/* USSD Info */}
          <Card className="bg-blue-50 border-blue-100 p-4 mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">No Data? No Problem!</h3>
                <p className="text-blue-700 text-sm">Dial *120*384# to access eVoucher via USSD</p>
              </div>
            </div>
          </Card>

          {/* Appearance */}
          <div className="mb-6">
            <h2 className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-medium">Appearance</h2>
            <Card className="bg-white border-gray-200 divide-y divide-gray-100 rounded-xl">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#00A89D]" />
                  <span className="text-gray-900">Language</span>
                </div>
                <Select value={settings.language} onValueChange={(v) => setSettings({...settings, language: v})}>
                  <SelectTrigger className="w-32 bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zu">isiZulu</SelectItem>
                    <SelectItem value="af">Afrikaans</SelectItem>
                    <SelectItem value="xh">isiXhosa</SelectItem>
                    <SelectItem value="st">Sesotho</SelectItem>
                    <SelectItem value="tn">Setswana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

          {/* Security */}
          <div className="mb-6">
            <h2 className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-medium">Security</h2>
            <Card className="bg-white border-gray-200 divide-y divide-gray-100 rounded-xl">
              <div className="flex items-center justify-between p-4">
                <div>
                  <span className="text-gray-900 block">Biometric Login</span>
                  <span className="text-gray-500 text-xs">Use fingerprint or face ID</span>
                </div>
                <Switch checked={settings.biometric} onCheckedChange={(v) => setSettings({...settings, biometric: v})} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <span className="text-gray-900 block">Auto-Lock</span>
                  <span className="text-gray-500 text-xs">Lock app after 5 minutes</span>
                </div>
                <Switch checked={settings.autoLock} onCheckedChange={(v) => setSettings({...settings, autoLock: v})} />
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <GoldButton variant="outline" className="w-full justify-start">
              <Share2 className="w-4 h-4 mr-3" /> Share eVoucher with Friends
            </GoldButton>
            <GoldButton variant="outline" className="w-full justify-start">
              <Star className="w-4 h-4 mr-3" /> Rate Us
            </GoldButton>
          </div>
        </div>
      </div>
      <BottomNav activePage="Profile" />
    </MobileContainer>
  );
}