/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent native modules from being webpack-bundled
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  poweredByHeader: false,
  images: {
    unoptimized: false,
  },
};

module.exports = nextConfig;

