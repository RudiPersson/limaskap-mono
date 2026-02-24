import { db, schema } from "../index";
import organizationMembers from "./data/organization-member.json" with { type: "json" };

export default async function seed() {
  await db.insert(schema.organizationMembers).values(
    organizationMembers.map((member) => ({
      userId: member.userId,
      organizationId: member.organizationId,
      role: member.role as "ADMIN" | "EDITOR" | "VIEWER" | "COACH",
      createdAt: new Date(member.createdAt),
    }))
  );
}
