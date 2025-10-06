import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("md-"),
          },
        },
        customElement: isLib,
      }),
      tailwindcss(),
    ],
    build: isLib
      ? {
          cssCodeSplit: false,
          lib: {
            entry: "src/custom-elements/md-online-booking/index.js",
            name: "MdOnlineBooking",
            formats: ["iife"],
            fileName: () => "md-online-booking.js",
          },
          outDir: "wix-components",
          emptyOutDir: true,
          rollupOptions: {
            external: [],
          },
        }
      : {
          outDir: "dist/app",
        },
    define: isLib
      ? {
          "process.env.NODE_ENV": JSON.stringify("production"),
        }
      : {},
  };
});
