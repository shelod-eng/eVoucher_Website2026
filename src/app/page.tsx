'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';
import CustomerRegistrationModal from './components/CustomerRegistrationModal';
import MerchantOnboardingModal from './components/MerchantOnboardingModal';

export default function Home() {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  const handleCustomerClick = () => {
    setShowCustomerModal(true);
  };

  const handleMerchantClick = () => {
    setShowMerchantModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Main Heading */}
              <h1 className="font-headline font-bold text-5xl lg:text-7xl text-foreground leading-tight">
                Dignified Savings for Every South African
              </h1>

              {/* Subcopy */}
              <p className="font-body text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Save up to 30% on essentials — groceries, airtime, transport — with or without a smartphone.
              </p>

              {/* Two Clear CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <button
                  onClick={handleCustomerClick}
                  className="inline-flex items-center justify-center space-x-3 px-10 py-5 bg-action text-action-foreground rounded-xl font-headline font-bold text-lg hover:bg-action/90 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <Icon name="UserIcon" size={24} variant="solid" />
                  <span>Join as Customer</span>
                </button>
                <button
                  onClick={handleMerchantClick}
                  className="inline-flex items-center justify-center space-x-3 px-10 py-5 bg-secondary text-secondary-foreground rounded-xl font-headline font-bold text-lg hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <Icon name="BuildingStorefrontIcon" size={24} variant="solid" />
                  <span>Onboard as Merchant</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Stats Band - Premium Fintech Cards */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Savings Card */}
              <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon name="CurrencyDollarIcon" size={24} variant="solid" className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Savings</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-headline text-5xl font-extrabold text-slate-900 tracking-tight">R 2.4M</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-100 rounded-full">
                      <Icon name="ArrowUpIcon" size={12} variant="solid" className="text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-700">+18%</span>
                    </div>
                    <span className="text-xs text-emerald-700 font-medium">this month</span>
                  </div>
                </div>
              </div>

              {/* Active Users Card */}
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon name="UserGroupIcon" size={24} variant="solid" className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Active Users</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-headline text-5xl font-extrabold text-slate-900 tracking-tight">12,847</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-full">
                      <Icon name="ArrowUpIcon" size={12} variant="solid" className="text-blue-700" />
                      <span className="text-xs font-bold text-blue-700">+24%</span>
                    </div>
                    <span className="text-xs text-blue-700 font-medium">this month</span>
                  </div>
                </div>
              </div>

              {/* Partner Merchants Card */}
              <div className="group bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon name="BuildingStorefrontIcon" size={24} variant="solid" className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Partner Merchants</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-headline text-5xl font-extrabold text-slate-900 tracking-tight">487</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 rounded-full">
                      <Icon name="ArrowUpIcon" size={12} variant="solid" className="text-orange-700" />
                      <span className="text-xs font-bold text-orange-700">+31%</span>
                    </div>
                    <span className="text-xs text-orange-700 font-medium">this month</span>
                  </div>
                </div>
              </div>

              {/* Transactions Card */}
              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon name="ChartBarIcon" size={24} variant="solid" className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Transactions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-headline text-5xl font-extrabold text-slate-900 tracking-tight">34.2K</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 rounded-full">
                      <Icon name="ArrowUpIcon" size={12} variant="solid" className="text-purple-700" />
                      <span className="text-xs font-bold text-purple-700">+42%</span>
                    </div>
                    <span className="text-xs text-purple-700 font-medium">this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Step Flow */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="text-center mb-16">
              <h2 className="font-headline font-bold text-4xl lg:text-5xl text-foreground mb-4">
                How It Works
              </h2>
              <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
                Four simple steps to start saving with dignity
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Icon name="MagnifyingGlassIcon" size={40} variant="solid" className="text-primary" />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground">Browse Deals</h3>
                <p className="font-body text-muted-foreground text-sm">
                  Explore discounts on groceries, airtime, and essentials
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                  <Icon name="ShoppingCartIcon" size={40} variant="solid" className="text-secondary" />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground">Buy Vouchers</h3>
                <p className="font-body text-muted-foreground text-sm">
                  Purchase vouchers via app or USSD on any phone
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <Icon name="BuildingStorefrontIcon" size={40} variant="solid" className="text-success" />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground">Redeem In-Store</h3>
                <p className="font-body text-muted-foreground text-sm">
                  Show your voucher code at any partner merchant
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Icon name="ChartPieIcon" size={40} variant="solid" className="text-accent" />
                </div>
                <h3 className="font-headline font-bold text-xl text-foreground">Track Savings</h3>
                <p className="font-body text-muted-foreground text-sm">
                  Monitor your savings and transaction history
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Discount Split Visual */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-5xl mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <h2 className="font-headline font-bold text-4xl lg:text-5xl text-foreground mb-4">
                Transparent Discount Distribution
              </h2>
              <p className="font-body text-xl text-muted-foreground">
                Every discount is split fairly and transparently
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-8 shadow-xl border-2 border-success">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                    <Icon name="UserIcon" size={32} variant="solid" className="text-success" />
                  </div>
                  <p className="font-headline text-6xl font-bold text-success">70%</p>
                </div>
                <h3 className="font-headline font-bold text-2xl text-foreground mb-3">
                  Goes to Consumers
                </h3>
                <p className="font-body text-muted-foreground">
                  The majority of every discount goes directly to you — real savings on essential goods that make a difference in your daily life.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-xl border-2 border-primary">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="CogIcon" size={32} variant="solid" className="text-primary" />
                  </div>
                  <p className="font-headline text-6xl font-bold text-primary">30%</p>
                </div>
                <h3 className="font-headline font-bold text-2xl text-foreground mb-3">
                  Platform Operations
                </h3>
                <p className="font-body text-muted-foreground">
                  Supports platform maintenance, merchant settlements, social initiatives, and ensuring the system remains sustainable and dignified.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Grid */}
        <section className="py-20 bg-card">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <h2 className="font-headline font-bold text-4xl lg:text-5xl text-foreground mb-4">
                Trusted Partners
              </h2>
              <p className="font-body text-xl text-muted-foreground">
                Working with merchants, NGOs, and government stakeholders
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Merchant Partners */}
              <div className="bg-background rounded-xl p-6 border-2 border-border text-center hover:shadow-lg transition-all duration-300">
                <Icon name="BuildingStorefrontIcon" size={48} variant="solid" className="text-secondary mx-auto mb-3" />
                <p className="font-headline font-semibold text-foreground">Shoprite</p>
                <p className="font-body text-xs text-muted-foreground">Retail Partner</p>
              </div>

              <div className="bg-background rounded-xl p-6 border-2 border-border text-center hover:shadow-lg transition-all duration-300">
                <Icon name="BuildingStorefrontIcon" size={48} variant="solid" className="text-secondary mx-auto mb-3" />
                <p className="font-headline font-semibold text-foreground">Pick n Pay</p>
                <p className="font-body text-xs text-muted-foreground">Retail Partner</p>
              </div>

              {/* NGO Partners */}
              <div className="bg-background rounded-xl p-6 border-2 border-border text-center hover:shadow-lg transition-all duration-300">
                <Icon name="HeartIcon" size={48} variant="solid" className="text-accent mx-auto mb-3" />
                <p className="font-headline font-semibold text-foreground">Gift of the Givers</p>
                <p className="font-body text-xs text-muted-foreground">NGO Partner</p>
              </div>

              {/* Government Partners */}
              <div className="bg-background rounded-xl p-6 border-2 border-border text-center hover:shadow-lg transition-all duration-300">
                <Icon name="BuildingLibraryIcon" size={48} variant="solid" className="text-primary mx-auto mb-3" />
                <p className="font-headline font-semibold text-foreground">SASSA</p>
                <p className="font-body text-xs text-muted-foreground">Government Partner</p>
              </div>
            </div>
          </div>
        </section>

        {/* Persistent CTA Banner */}
        <section className="py-16 bg-gradient-to-r from-primary to-secondary">
          <div className="max-w-5xl mx-auto px-4 lg:px-6 text-center">
            <h2 className="font-headline font-bold text-3xl lg:text-4xl text-white mb-4">
              Get Involved
            </h2>
            <p className="font-body text-lg text-white/90 mb-8">
              Join as Consumer • Onboard as Merchant • Partner with Government
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCustomerClick}
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-white text-primary rounded-xl font-headline font-bold text-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <Icon name="UserIcon" size={24} variant="solid" />
                <span>Join as Customer</span>
              </button>
              <button
                onClick={handleMerchantClick}
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-white text-secondary rounded-xl font-headline font-bold text-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <Icon name="BuildingStorefrontIcon" size={24} variant="solid" />
                <span>Onboard as Merchant</span>
              </button>
            </div>
          </div>
        </section>

        {/* Compliance Badges Footer */}
        <section className="py-12 bg-background border-t-2 border-border">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="text-center mb-8">
              <p className="font-body text-sm text-muted-foreground mb-6">
                Fully compliant with South African regulations
              </p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8">
              <div className="flex items-center space-x-3 bg-card px-6 py-3 rounded-lg border border-border">
                <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-success" />
                <span className="font-headline font-semibold text-foreground">POPIA</span>
              </div>
              <div className="flex items-center space-x-3 bg-card px-6 py-3 rounded-lg border border-border">
                <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-success" />
                <span className="font-headline font-semibold text-foreground">PASA</span>
              </div>
              <div className="flex items-center space-x-3 bg-card px-6 py-3 rounded-lg border border-border">
                <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-success" />
                <span className="font-headline font-semibold text-foreground">SARB</span>
              </div>
              <div className="flex items-center space-x-3 bg-card px-6 py-3 rounded-lg border border-border">
                <Icon name="ShieldCheckIcon" size={24} variant="solid" className="text-success" />
                <span className="font-headline font-semibold text-foreground">FIC</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <CustomerRegistrationModal 
        isOpen={showCustomerModal} 
        onClose={() => setShowCustomerModal(false)} 
      />
      <MerchantOnboardingModal 
        isOpen={showMerchantModal} 
        onClose={() => setShowMerchantModal(false)} 
      />
    </div>
  );
}
