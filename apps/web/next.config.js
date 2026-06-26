/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hoa/shared'],
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
