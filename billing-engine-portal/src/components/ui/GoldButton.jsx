import React from 'react';
import { Button } from '@/components/ui/button';

export default function GoldButton({ children, className = '', variant = 'default', ...props }) {
  const baseClasses = variant === 'outline' 
    ? 'border-2 border-[#00A89D] text-[#00A89D] bg-transparent hover:bg-[#00A89D]/10'
    : 'bg-[#00A89D] text-white font-semibold hover:bg-[#008F86] shadow-lg';
  
  return (
    <Button 
      className={`${baseClasses} rounded-xl transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}