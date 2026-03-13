import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCodeDisplay from './QRCodeDisplay';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function VoucherQRModal({ open, onClose, voucher }) {
  const [copied, setCopied] = useState(false);
  
  if (!voucher) return null;

  const qrData = JSON.stringify({
    code: voucher.voucherCode,
    merchantId: voucher.merchantId,
    balance: voucher.remainingBalance,
    id: voucher.id
  });

  const copyCode = () => {
    navigator.clipboard.writeText(voucher.voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 text-center">Scan to Redeem</DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-4">
          <div className="bg-gray-50 rounded-2xl p-6 mb-4">
            <QRCodeDisplay data={qrData} size={180} />
          </div>
          
          <div className="mb-4">
            <p className="text-gray-500 text-sm mb-1">{voucher.merchantName}</p>
            <p className="text-2xl font-bold text-[#00A89D]">R{voucher.remainingBalance}</p>
            <p className="text-gray-400 text-xs">Available Balance</p>
          </div>

          <div className="bg-gray-100 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Voucher Code</p>
              <p className="font-mono font-bold text-gray-900">{voucher.voucherCode}</p>
            </div>
            <button 
              onClick={copyCode}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
            </button>
          </div>

          <p className="text-gray-400 text-xs mt-4">
            Show this QR code to the cashier to redeem
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}