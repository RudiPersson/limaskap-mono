import { db, schema } from "../index";
import programs from "./data/program.json" with { type: "json" };

export default async function seed() {
  await db.insert(schema.programsTable).values(
    programs.map((program) => ({
      organizationId: program.organizationId,
      name: program.name,
      description: program.description,
      image: program.image,
      price: program.price,
      maxParticipants: program.maxParticipants,
      startDate: new Date(program.startDate),
      endDate: new Date(program.endDate),
      isPublished: program.isPublished,
      archivedAt: program.archivedAt ? new Date(program.archivedAt) : null,
      tags: program.tags,
      metadata: program.metadata,
    }))
  );
}
