import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import GoldButton from './GoldButton';

// Merchant logos mapping
const MERCHANT_LOGOS = {
  'Shoprite': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/290650325_shoprite.png',
  'USave': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/d9a8cc580_usave.png',
  'Checkers': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/cf9e94b57_checkers.png',
  'Boxer': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/f74bf546e_boxer.png',
  'Mr Price': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/077e938f6_MrPrice.png',
  'Edgars': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/7d87eb85d_Edgars.png',
  'Game': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/0d4e37fc3_game.png',
  'Engen': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/9cd5308fa_engen.png',
  'Cell C': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/af84a330d_CellC.png',
  'Telkom': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/09d12ab0e_Telkom.jpg',
  'Prasa': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/6807b4701_PrasaBeMoved.png',
  'Rea Vaya': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/048bb7396_reyavaya.png',
  'Areyeng': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928c7c5ca78f1ba1eef33ff/9a9cdae0e_areyeng.png',
};

export default function VoucherCard({ product, onBuy, compact = false, isPersonalized = false, isExclusive = false }) {
  const savings = product.faceValue - product.consumerPrice;
  const discountPercent = Math.round((savings / product.faceValue) * 100);
  
  // Get merchant logo from mapping or from product
  const merchantLogo = MERCHANT_LOGOS[product.merchantName] || product.merchantLogo;

  if (compact) {
    return (
      <Link to={createPageUrl('Checkout') + `?productId=${product.id}`}>
        <Card className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow relative">
          {isExclusive && (
            <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              EXCLUSIVE
            </div>
          )}
          {isPersonalized && !isExclusive && (
            <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-[#00A89D] to-[#00C4B8] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              FOR YOU
            </div>
          )}
          <div className="bg-gradient-to-r from-[#00A89D] to-[#00A89D]/80 p-3">
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-2 overflow-hidden p-1">
              {merchantLogo ? (
                <img src={merchantLogo} alt={product.merchantName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-[#00A89D] font-bold text-lg">{product.merchantName?.charAt(0)}</span>
              )}
            </div>
            <p className="text-white text-xs truncate font-medium">{product.merchantName}</p>
          </div>
          <div className="p-3">
            <p className="text-gray-900 font-bold text-lg">R{product.faceValue}</p>
            <p className="text-[#00A89D] text-sm font-medium">Pay R{product.consumerPrice}</p>
            <div className="mt-2 inline-flex items-center bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
              Save R{savings}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="bg-gradient-to-r from-[#00A89D] to-[#00A89D]/80 p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1">
            {merchantLogo ? (
              <img src={merchantLogo} alt={product.merchantName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-[#00A89D]">{product.merchantName?.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{product.merchantName}</h3>
            <p className="text-white/80 text-sm">{product.description}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-gray-500 text-sm">Voucher Value</p>
            <p className="text-gray-900 font-bold text-2xl">R{product.faceValue}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">You Pay</p>
            <p className="text-[#00A89D] font-bold text-2xl">R{product.consumerPrice}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-green-50 rounded-xl p-3 mb-4">
          <span className="text-green-700 font-medium">Your Savings</span>
          <span className="text-green-700 font-bold">R{savings} ({discountPercent}% off)</span>
        </div>

        <Link to={createPageUrl('Checkout') + `?productId=${product.id}`}>
          <GoldButton className="w-full h-12">Buy Now</GoldButton>
        </Link>
      </div>
    </Card>
  );
}