import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import WebsiteChatbotWidget from '@/components/common/WebsiteChatbotWidget';
import PwaRegistrar from '@/components/common/PwaRegistrar';
import '../styles/index.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'eVoucher Platform - Dignified Digital Commerce for All South Africans',
  description:
    'Government-aligned digital voucher platform delivering real savings to vulnerable communities. Register as a customer or join as a merchant partner.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'eVoucher',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    apple: [{ url: '/assets/images/branding/evoucher-logo.png' }],
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
          <PwaRegistrar />
          {children}
          <WebsiteChatbotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
