import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import VoucherCard from '@/components/ui/VoucherCard';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const urlParams = new URLSearchParams(window.location.search);
  const merchantParam = urlParams.get('merchant');

  React.useEffect(() => {
    if (merchantParam) {
      setSelectedMerchant(merchantParam);
    }
  }, [merchantParam]);

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.filter({ status: 'active' }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.VoucherProduct.filter({ status: 'active' }),
  });

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'grocery', name: 'Grocery' },
    { id: 'pharmacy', name: 'Pharmacy' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'retail', name: 'Retail' },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMerchant = selectedMerchant === 'all' || product.merchantId === selectedMerchant;
    const merchant = merchants.find(m => m.id === product.merchantId);
    const matchesCategory = selectedCategory === 'all' || merchant?.category === selectedCategory;
    return matchesSearch && matchesMerchant && matchesCategory;
  });

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-3 mb-4">
              <Link to={createPageUrl('ConsumerHome')}>
                <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Shop Vouchers</h1>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search stores or vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-100 border-0 rounded-xl text-gray-900"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#00A89D] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Merchant Filter */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedMerchant('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border ${
                  selectedMerchant === 'all'
                    ? 'border-[#00A89D] bg-[#00A89D]/10 text-[#00A89D]'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                All Stores
              </button>
              {merchants.map((merchant) => (
                <button
                  key={merchant.id}
                  onClick={() => setSelectedMerchant(merchant.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border ${
                    selectedMerchant === merchant.id
                      ? 'border-[#00A89D] bg-[#00A89D]/10 text-[#00A89D]'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {merchant.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="px-4 py-4">
          <p className="text-gray-500 text-sm mb-4">{filteredProducts.length} vouchers available</p>
          
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <VoucherCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No vouchers found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav activePage="Shop" />
    </MobileContainer>
  );
}