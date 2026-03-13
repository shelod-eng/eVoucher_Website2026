import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, CreditCard, Building2, Plus, Trash2 } from 'lucide-react';

export default function PaymentMethodsPage() {
  const [showAddCard, setShowAddCard] = useState(false);
  const [cards, setCards] = useState([
    { id: 1, type: 'visa', last4: '4532', expiry: '12/26', isDefault: true },
    { id: 2, type: 'mastercard', last4: '8901', expiry: '03/25', isDefault: false }
  ]);
  const [bankAccounts] = useState([
    { id: 1, bank: 'Standard Bank', last4: '6789', type: 'Savings' }
  ]);

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
            <h1 className="text-xl font-bold text-white">Payment Methods</h1>
          </div>
        </div>

        <div className="px-4 pt-6">
          {/* Cards Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-900">Cards</h2>
              <GoldButton size="sm" onClick={() => setShowAddCard(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </GoldButton>
            </div>
            <div className="space-y-3">
              {cards.map((card) => (
                <Card key={card.id} className="bg-white border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-[#00A89D] to-[#00A89D]/80 rounded flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium capitalize">{card.type} •••• {card.last4}</p>
                        <p className="text-gray-500 text-sm">Expires {card.expiry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {card.isDefault && (
                        <span className="text-xs bg-[#00A89D]/10 text-[#00A89D] px-2 py-1 rounded-full font-medium">Default</span>
                      )}
                      <button className="text-red-400 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Bank Accounts */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Bank Accounts</h2>
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <Card key={account.id} className="bg-white border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{account.bank}</p>
                      <p className="text-gray-500 text-sm">{account.type} •••• {account.last4}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="bg-white border-gray-200 max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add New Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Card Number" className="bg-gray-50 border-gray-200 text-gray-900 h-12" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="MM/YY" className="bg-gray-50 border-gray-200 text-gray-900 h-12" />
              <Input placeholder="CVV" className="bg-gray-50 border-gray-200 text-gray-900 h-12" />
            </div>
            <Input placeholder="Cardholder Name" className="bg-gray-50 border-gray-200 text-gray-900 h-12" />
            <GoldButton className="w-full h-12" onClick={() => setShowAddCard(false)}>
              Add Card
            </GoldButton>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav activePage="Profile" />
    </MobileContainer>
  );
}