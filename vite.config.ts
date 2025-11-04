import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import process from "process";
import version from "vite-plugin-package-version";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /** Env */
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      /** Plugins */
      version(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.*"],
          globIgnores: ["**/screenshot-*.jpg", "**/social-preview.png"],
          maximumFileSizeToCacheInBytes: 5 * 1024 ** 2,
        },
        manifest: {
          name: "Parcel",
          short_name: "Parcel",
          description:
            "Split tokens to multiple addresses or Merge tokens from multiple sources on any blockchain.",
          theme_color: "#000",
          background_color: "#000",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          screenshots: [
            {
              src: "screenshot-mobile-1.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-mobile-2.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-mobile-3.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-mobile-4.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-desktop-wide.jpg",
              sizes: "1920x1080",
              type: "image/jpg",
              form_factor: "wide",
            },
          ],
        },
      }),
      ViteEjsPlugin(env),
      tailwindcss(),
      react(),
    ],
  };
});
