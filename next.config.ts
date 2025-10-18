import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SECURITY: Comprehensive HTTP security headers for production
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            // SECURITY: Prevent clickjacking attacks
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // SECURITY: Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // SECURITY: Enable XSS protection
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // SECURITY: Control referrer information
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // SECURITY: Restrict permissions for browser features
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // SECURITY: Content Security Policy
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          {
            // SECURITY: Strict Transport Security (HTTPS enforcement)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  // SECURITY: Disable X-Powered-By header
  poweredByHeader: false,

  // PERFORMANCE: Enable compression
  compress: true,

  // SECURITY: Configure redirects for security
  async redirects() {
    return [
      // Redirect HTTP to HTTPS in production
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/:path*',
              has: [
                {
                  type: 'header',
                  key: 'x-forwarded-proto',
                  value: 'http',
                },
              ],
              destination: 'https://localhost/:path*',
              permanent: true,
            },
          ]
        : []),
    ];
  },

  // SECURITY: Configure environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // PERFORMANCE: Optimize images
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },

  // DEVELOPMENT: Enhanced error handling in development
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),
};

export default nextConfig;
