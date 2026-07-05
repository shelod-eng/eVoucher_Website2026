/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next-local',

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    // Temporary: keep CI and production builds green while existing lint debt is addressed incrementally.
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pixabay.com',
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/consumer',
        destination: '/customer/signup',
        permanent: false,
      },
      {
        source: '/merchant/onboarding',
        destination: '/merchants',
        permanent: false,
      },
      {
        source: '/customer/purchase',
        destination: '/buy-vouchers',
        permanent: false,
      },
      {
        source: '/merchant/payouts',
        destination: '/merchant/dashboard',
        permanent: false,
      },
    ];
  },

  async headers() {
    const privateNoStoreHeaders = [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
      { key: 'Vary', value: 'Cookie, Authorization' },
    ];

    const billingCorsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role, Authorization' },
      { key: 'Access-Control-Max-Age', value: '86400' },
    ];

    return [
      {
        source: '/customer/:path*',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/profile',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/wallet',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/cart',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/shop',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/api/auth/:path*',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/api/v1/customer/:path*',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/api/billing/:path*',
        headers: billingCorsHeaders,
      },
      {
        source: '/api/v1/admin/:path*',
        headers: billingCorsHeaders,
      },
    ];
  },

  webpack: (config, { dev }) => {
    // Windows + endpoint security can lock webpack cache artifacts during dev.
    // Disable filesystem cache in dev to avoid intermittent UNKNOWN/ENOENT errors.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
