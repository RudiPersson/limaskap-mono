import { db, schema } from "../index";
import memberRecords from "./data/member-record.json" with { type: "json" };

export default async function seed() {
  await db.insert(schema.memberRecordTable).values(
    memberRecords.map((record) => ({
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      birthDate: new Date(record.birthDate),
      gender: record.gender as "male" | "female",
      addressLine1: record.address,
      city: record.city,
      postalCode: record.postalCode,
      country: record.country,
      relationshipToUser: record.relationshipToUser as "CHILD" | "PARTNER" | "GUARDIAN" | "OTHER",
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    }))
  );
}
