// Nitro performance configuration
// Note: This file is optional - Nitro will use defaults if not present

export default {
  // Enable compression for faster response times
  compressPublicAssets: true,
  
  // Optimize static asset serving
  publicAssets: [
    {
      baseURL: "/",
      dir: "public",
      maxAge: 31536000, // 1 year cache for static assets
    },
  ],

  // Enable minification in production
  minify: true,

  // Add performance-related headers
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    },
    // Cache static assets
    "/assets/**": {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
    // Cache fonts
    "/**/*.woff2": {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
    "/**/*.woff": {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  },
};
