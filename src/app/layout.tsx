import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import WebsiteChatbotWidget from '@/components/common/WebsiteChatbotWidget';
import PwaRegistrar from '@/components/common/PwaRegistrar';
import '../styles/index.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f766e',
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
    startupImage: '/assets/images/branding/evoucher-logo-app.png',
  },
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0f766e',
    'msapplication-config': '/browserconfig.xml',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/assets/images/branding/evoucher-logo-app.png', type: 'image/png', sizes: '192x192' },
      { url: '/assets/images/branding/evoucher-logo-app.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/assets/images/branding/evoucher-logo-app.png', sizes: '180x180', type: 'image/png' },
      { url: '/assets/images/branding/evoucher-logo-app.png', sizes: '152x152', type: 'image/png' },
      { url: '/assets/images/branding/evoucher-logo-app.png', sizes: '120x120', type: 'image/png' },
      { url: '/assets/images/branding/evoucher-logo-app.png', sizes: '76x76', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-startup-image',
        url: '/assets/images/branding/evoucher-logo-app.png',
      },
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
      <head>
        <meta name="application-name" content="eVoucher" />
        <meta name="msapplication-TileColor" content="#0f766e" />
        <meta name="msapplication-TileImage" content="/icons/icon-512x512.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-tooltip" content="eVoucher Platform" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-navbutton-color" content="#0f766e" />
      </head>
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
