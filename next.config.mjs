/** @type {import('next').NextConfig} */
import { frameAncestorHeaders } from './shared/frameAncestors.mjs';

const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-1953a6673e864f3488c645252f75de98.r2.dev',
      },
    ],
  },
  async headers() {
    return frameAncestorHeaders();
  },
};

export default nextConfig;
