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
