import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The checkout logic is pure (no DOM); run unit tests in Node.
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
