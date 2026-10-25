/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better dev-time warnings
  reactStrictMode: true,

  // Allow images from external domains for news thumbnails / media verification
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Proxy API calls to FastAPI backend during development
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const backendBase = apiUrl.replace('/api', '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendBase}/health`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Compress output
  compress: true,

  // Environment variables exposed to browser
  env: {
    APP_NAME: 'TruthLens',
    APP_VERSION: '1.0.0',
  },
};

module.exports = nextConfig;
