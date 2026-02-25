import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/server/auth";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/server/constants";
import { db } from "@/lib/server/db";
import { memberRecordTable, patchUserMemberRecordSchema } from "@/lib/server/db/schema/member-record";
import { notFound, parseId, unauthorized, zodErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return unauthorized();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ message: "Invalid id" }, { status: 422 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchUserMemberRecordSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const updates = parsed.data;

  if (Object.keys(updates).length === 0) {
    return Response.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(memberRecordTable)
    .set(updates)
    .where(and(eq(memberRecordTable.id, id), eq(memberRecordTable.userId, session.user.id)))
    .returning();

  if (!updated) {
    return notFound();
  }

  return Response.json(updated);
}
