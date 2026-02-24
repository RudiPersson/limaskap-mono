import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:9999/doc", // sign up at app.heyapi.dev
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
