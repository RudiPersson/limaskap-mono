import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_REST_API || "http://localhost:3000",
});

export const {
  getSession,
  useSession,
  signIn,
  signUp,
  signOut,
  resetPassword,
} = authClient;

export type User = typeof authClient.$Infer.Session.user;
