/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@monara-sentinel/domain', '@monara-sentinel/config'],
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  typedRoutes: true,
};

module.exports = nextConfig;
