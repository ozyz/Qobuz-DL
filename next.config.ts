import type { NextConfig } from "next";
import fs from 'fs';
import path from "path";

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'localhost-cert.pem')),
};

const nextConfig: NextConfig = {
  devServer: {
      https: httpsOptions,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.qobuz.com',
        port: '',
        pathname: '**',
        search: '',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
