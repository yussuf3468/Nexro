/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow large file uploads through API routes (self-hosted)
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "worker-src 'self' blob:",
              "font-src 'self' https://fonts.gstatic.com data:",
            ].join("; "),
          },
        ],
      },
      // Service worker
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
