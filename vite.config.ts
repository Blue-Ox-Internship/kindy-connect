import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      server: { entry: "server" },
    }),
    tailwindcss(),
    react(),
    nitro(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split large vendor libraries into separate chunks
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // TanStack libraries
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-tanstack';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          // PDF generation libraries (lazy loaded)
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase to avoid warnings for split chunks
  },
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: {
    host: "::",
    port: 8080,
  },
});
