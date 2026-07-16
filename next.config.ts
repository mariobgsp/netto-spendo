import type { NextConfig } from 'next';
// @ts-expect-error - next-pwa does not have types
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
