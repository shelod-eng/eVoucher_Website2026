import React from 'react';

export default function MobileContainer({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-gray-100 text-gray-900 ${className}`}>
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}