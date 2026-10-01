import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import { hashPassword, hashSessionToken, validatePassword, verifyPassword } from "../../../../lib/passwords";
import { getCurrentUser, SESSION_COOKIE } from "../../../../lib/session-auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.authType !== "local") return Response.json({ error: "Connexion requise." }, { status: 401 });
  try {
    const payload = await request.json() as { newPassword?: string };
    const newPassword = payload.newPassword ?? "";
    const invalid = validatePassword(newPassword);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });
    const db = getDb();
    const [account] = await db.select().from(users).where(eq(users.userId, user.userId)).limit(1);
    if (!account?.passwordHash || !account.passwordSalt) return Response.json({ error: "Compte local introuvable." }, { status: 404 });
    if (await verifyPassword(newPassword, account.passwordHash, account.passwordSalt, account.passwordIterations)) {
      return Response.json({ error: "Choisis un mot de passe différent du mot de passe temporaire." }, { status: 400 });
    }
    const password = await hashPassword(newPassword);
    await db.update(users).set({
      passwordHash: password.hash,
      passwordSalt: password.salt,
      passwordIterations: password.iterations,
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(users.userId, user.userId));
    const currentToken = (await cookies()).get(SESSION_COOKIE)?.value;
    if (currentToken) {
      const currentHash = await hashSessionToken(currentToken);
      await db.delete(sessions).where(and(eq(sessions.userId, user.userId), ne(sessions.sessionHash, currentHash)));
    }
    return Response.json({ ok: true, role: user.role });
  } catch (error) {
    console.error("password_change_failed", error);
    return Response.json({ error: "Modification temporairement indisponible." }, { status: 503 });
  }
}
