import { db, schema } from "../index";
import organizations from "./data/organization.json" with { type: "json" };

export default async function seed() {
  await db.insert(schema.organizationTable).values(
    organizations.map((org) => ({
      name: org.name,
      slug: org.slug,
      subdomain: org.subdomain,
      email: org.email,
      phone: org.phone,
      address: org.address,
      city: org.city,
      zip: org.zip,
      isPublished: org.isPublished,
      description: org.description,
    }))
  );
}
