import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode } from 'lucide-react';
import GoldButton from './GoldButton';

export default function WalletVoucherCard({ 
  merchantName, 
  faceValue, 
  remainingBalance,
  voucherCode,
  status,
  onRedeem
}) {
  const isFullyRedeemed = status === 'fully_redeemed';
  const usedAmount = faceValue - remainingBalance;
  const percentRemaining = (remainingBalance / faceValue) * 100;
  
  return (
    <Card className={`bg-[#111827] border-[#1F2937] overflow-hidden ${isFullyRedeemed ? 'opacity-60' : ''}`}>
      <div className="h-2 bg-[#1F2937]">
        <div 
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#2DD4BF]"
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-white">{merchantName}</h3>
            <p className="text-[#9CA3AF] text-xs font-mono">{voucherCode}</p>
          </div>
          <Badge className={`${
            isFullyRedeemed 
              ? 'bg-gray-500/20 text-gray-400' 
              : status === 'partially_redeemed'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-[#2DD4BF]/20 text-[#2DD4BF]'
          } border-0`}>
            {isFullyRedeemed ? 'Used' : status === 'partially_redeemed' ? 'Partial' : 'Active'}
          </Badge>
        </div>
        
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[#9CA3AF] text-xs">Remaining</p>
            <p className="text-2xl font-bold text-[#D4AF37]">R{remainingBalance?.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[#9CA3AF] text-xs">Original Value</p>
            <p className="text-lg text-[#9CA3AF]">R{faceValue?.toLocaleString()}</p>
          </div>
        </div>
        
        {!isFullyRedeemed && (
          <div className="flex gap-2">
            <GoldButton className="flex-1" onClick={onRedeem}>
              Redeem
            </GoldButton>
            <GoldButton variant="outline" className="px-3">
              <QrCode className="w-5 h-5" />
            </GoldButton>
          </div>
        )}
      </div>
    </Card>
  );
}