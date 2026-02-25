import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:3000/doc",
  output: "lib/sdk",
  plugins: [
    {
      name: "@hey-api/client-next",
      runtimeConfigPath: "./lib/hey-api.ts",
    },
    {
      name: "@tanstack/react-query",
      mutationOptions: true,
    },
  ],
});
