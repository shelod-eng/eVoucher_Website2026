import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import '../styles/index.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'eVoucher Platform - Dignified Digital Commerce for All South Africans',
  description: 'Government-aligned digital voucher platform delivering real savings to vulnerable communities. Register as a customer or join as a merchant partner.',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
</body>
    </html>
  );
}
