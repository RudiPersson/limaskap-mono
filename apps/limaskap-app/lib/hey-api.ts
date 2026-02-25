import type { CreateClientConfig } from "./sdk/client.gen";

export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_REST_API || "http://localhost:3000",
  credentials: "include",
});
