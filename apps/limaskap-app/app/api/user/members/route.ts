import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { createUserMemberRecordSchema, memberRecordTable } from "@/lib/server/db/schema/member-record";
import { unauthorized, zodErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return unauthorized();
  }

  const memberRecords = await db.query.memberRecordTable.findMany({
    where(fields, operators) {
      return operators.eq(fields.userId, session.user.id);
    },
  });

  return Response.json(memberRecords);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserMemberRecordSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const [created] = await db
    .insert(memberRecordTable)
    .values({
      ...parsed.data,
      userId: session.user.id,
    })
    .returning();

  return Response.json(created, { status: 201 });
}
