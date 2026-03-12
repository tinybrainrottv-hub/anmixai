import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  assetPrefix: '/anmixai',

  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/globe.svg", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  turbopack: {
    resolveAlias: {
      react: './node_modules/react',
      'react-dom': './node_modules/react-dom',
    },
  },
} as NextConfig;

export default nextConfig;
