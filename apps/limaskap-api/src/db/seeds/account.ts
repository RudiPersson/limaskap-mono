import { auth } from "../../lib/auth";
import { db, schema } from "../index";
import accounts from "./data/account.json" with { type: "json" };

async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context;
  return await ctx.password.hash(password);
}

export default async function seed() {
  const accountsWithHashedPasswords = await Promise.all(
    accounts.map(async (account) => ({
      id: account.id,
      accountId: account.accountId,
      providerId: account.providerId,
      userId: account.userId,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      idToken: account.idToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt
        ? new Date(account.accessTokenExpiresAt)
        : null,
      refreshTokenExpiresAt: account.refreshTokenExpiresAt
        ? new Date(account.refreshTokenExpiresAt)
        : null,
      scope: account.scope,
      password: account.password ? await hashPassword(account.password) : null,
      createdAt: new Date(account.createdAt),
      updatedAt: new Date(account.updatedAt),
    }))
  );

  await db.insert(schema.account).values(accountsWithHashedPasswords);
}
