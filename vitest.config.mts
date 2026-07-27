import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// No React plugin: Vitest's esbuild transform already honours the `react-jsx`
// setting in tsconfig.json, and pulling in @vitejs/plugin-react drags a second
// copy of Vite into the type graph.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
