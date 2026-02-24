import { db, schema } from "../index";
import users from "./data/user.json" with { type: "json" };

export default async function seed() {
  await db.insert(schema.user).values(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }))
  );
}
