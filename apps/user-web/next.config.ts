import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@ams/shared-types', '@ams/web-auth', '@ams/avatar-viewer'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
