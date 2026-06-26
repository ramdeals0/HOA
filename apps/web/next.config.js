/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hoa/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
