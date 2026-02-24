import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_REST_API,
});

export const {
  getSession,
  useSession,
  signIn,
  signUp,
  signOut,
  resetPassword,
} = authClient;
// export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
