import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "robots.txt"],
      manifest: {
        name: "Bateu A Meta",
        short_name: "Bateu A Meta",
        description: "Dashboard para Motoristas de Apps. Transforme corridas em lucro líquido real.",
        theme_color: "#121212",
        background_color: "#121212",
        display: "standalone",
        orientation: "portrait",
        start_url: "/dashboard",
        scope: "/",
        icons: [
          {
            src: "/pwa-icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icon.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
