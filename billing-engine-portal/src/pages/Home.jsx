import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function Home() {
  useEffect(() => {
    window.location.href = createPageUrl('Landing');
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}