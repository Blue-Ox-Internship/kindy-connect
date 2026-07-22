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
    {
      name: "mock-vercel-turborepo-summary",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes("/files/turborepo-summary")) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ tasks: [] }));
            return;
          }
          next();
        });
      },
    },
  ],
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
    proxy: {
      "/api/v6": {
        target: "https://vercel.com",
        changeOrigin: true,
      },
      "/api/v7": {
        target: "https://vercel.com",
        changeOrigin: true,
      },
    },
  },
});
