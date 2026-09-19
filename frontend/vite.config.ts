import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define:
    mode === "local-api"
      ? {
          "import.meta.env.VITE_API_BASE_URL":
            JSON.stringify("http://127.0.0.1:4174"),
        }
      : undefined,
}));
