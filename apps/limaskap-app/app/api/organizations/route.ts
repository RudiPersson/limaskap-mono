import {
  createOrganization,
  getOrganizations,
} from "@/features/organizations/server/service";
import { json, toRouteErrorResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET() {
  const organizations = await getOrganizations();
  return json(organizations, 200);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const inserted = await createOrganization(body);
    return json(inserted, 201);
  } catch (error) {
    return toRouteErrorResponse(error);
  }
}
