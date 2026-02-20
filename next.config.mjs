/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
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
        source: '/',
        destination: '/homepage',
        permanent: false,
      },
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
  }
};

export default nextConfig;
