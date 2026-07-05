import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@ams/shared-types',
    '@ams/web-auth',
    '@ams/avatar-viewer',
    '@ams/sdk-web',
    '@ams/sdk-three',
  ],
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
