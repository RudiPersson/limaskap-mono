import { getSession, User } from "@/lib/auth-client";
import { cookies, headers } from "next/headers";

async function getSessionCookie() {
  const cookieStore = await cookies();
  const name = `better-auth.session_token`;
  const secureCookieName = `__Secure-${name}`;

  const cookie = cookieStore.get(name) || cookieStore.get(secureCookieName);

  if (!cookie) {
    return null;
  }

  return cookie;
}

export async function getUserDto(): Promise<User | null> {
  const cookieSession = await getSessionCookie();
  if (!cookieSession) {
    return null;
  }

  const data = await getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (data.error) {
    return null;
  }

  if (!data.data) {
    return null;
  }

  return data.data.user;
}
