/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // Allow importing from shared package
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': require('path').resolve(__dirname, '../shared'),
    };
    return config;
  },
};

module.exports = nextConfig;
