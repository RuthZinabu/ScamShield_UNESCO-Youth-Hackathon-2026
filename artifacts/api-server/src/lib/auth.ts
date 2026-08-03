import type { Request } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "scamshield-dev-secret";
const JWT_EXPIRES_IN = "7d";

export type AuthenticatedUser = {
  id: number;
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
};

export function signJwt(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

export function getAuthenticatedUserId(req: Request): number | null {
  const authorization = req.headers.authorization;
  const token = Array.isArray(authorization) ? authorization[0] : authorization;
  const bearerToken = token?.startsWith("Bearer ") ? token.slice(7) : null;

  if (!bearerToken) {
    return null;
  }

  const payload = verifyJwt(bearerToken);
  if (!payload?.sub) {
    return null;
  }

  const userId = Number(payload.sub);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export async function upsertGoogleUser(input: {
  googleId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.googleId, input.googleId)).limit(1);

  if (existing[0]) {
    const updated = await db
      .update(usersTable)
      .set({
        email: input.email,
        name: input.name ?? existing[0].name,
        avatarUrl: input.avatarUrl ?? existing[0].avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.googleId, input.googleId))
      .returning();

    return updated[0];
  }

  const created = await db
    .insert(usersTable)
    .values({
      googleId: input.googleId,
      email: input.email,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      role: "user",
    })
    .returning();

  return created[0];
}
