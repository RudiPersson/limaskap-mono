import { db } from "@/lib/server/db";
import { organizationTable, insertOrganizationSchema } from "@/lib/server/db/schema/organization";
import { json, zodErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET() {
  const organizations = await db.query.organizationTable.findMany();
  return json(organizations, 200);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = insertOrganizationSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const [inserted] = await db.insert(organizationTable).values(parsed.data).returning();
  return json(inserted, 201);
}
