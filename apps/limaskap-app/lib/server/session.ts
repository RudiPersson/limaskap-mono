import { headers } from "next/headers";

import { auth } from "@/lib/server/auth";
import { UnauthorizedDomainError } from "@/lib/server/errors";

type ServerSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type ViewerContext = {
  userId: string;
  email: string;
  name: string;
};

function toViewerContext(session: NonNullable<ServerSession>): ViewerContext {
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireServerSession() {
  const session = await getServerSession();
  if (!session) {
    return null;
  }
  return session;
}

export async function getServerViewer(): Promise<ViewerContext | null> {
  const session = await getServerSession();
  if (!session) {
    return null;
  }
  return toViewerContext(session);
}

export async function getViewerFromHeaders(
  requestHeaders: Headers,
): Promise<ViewerContext | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }
  return toViewerContext(session);
}

export function assertViewer(
  viewer: ViewerContext | null | undefined,
  message = "Unauthorized",
): asserts viewer is ViewerContext {
  if (!viewer) {
    throw new UnauthorizedDomainError(message);
  }
}
