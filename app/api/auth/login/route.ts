import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import { generateSessionToken, hashSessionToken, normalizeUsername, verifyPassword } from "../../../../lib/passwords";
import { SESSION_LIFETIME_SECONDS, sessionCookie } from "../../../../lib/session-auth";

export async function POST(request: Request) {
  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > 4096) return Response.json({ error: "Requête trop volumineuse." }, { status: 413 });
    const payload = await request.json() as { username?: string; password?: string };
    const username = normalizeUsername(payload.username ?? "");
    const password = payload.password ?? "";
    if (!username || username.length > 40 || !password || password.length > 128) return invalidCredentials();
    const db = getDb();
    const [account] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!account?.passwordHash || !account.passwordSalt) return invalidCredentials();
    const now = Date.now();
    if (account.lockedUntil && new Date(account.lockedUntil).getTime() > now) {
      return Response.json({ error: "Trop de tentatives. Réessaie dans quelques minutes." }, { status: 429 });
    }
    const valid = await verifyPassword(password, account.passwordHash, account.passwordSalt, account.passwordIterations);
    if (!valid) {
      const failures = account.failedLoginCount + 1;
      const lockedUntil = failures >= 5 ? new Date(now + 15 * 60 * 1000).toISOString() : null;
      await db.update(users).set({ failedLoginCount: failures >= 5 ? 0 : failures, lockedUntil, updatedAt: new Date(now).toISOString() }).where(eq(users.userId, account.userId));
      return invalidCredentials();
    }
    await db.update(users).set({ failedLoginCount: 0, lockedUntil: null, updatedAt: new Date(now).toISOString() }).where(eq(users.userId, account.userId));
    const token = generateSessionToken();
    const sessionHash = await hashSessionToken(token);
    await db.insert(sessions).values({
      sessionHash,
      userId: account.userId,
      expiresAt: new Date(now + SESSION_LIFETIME_SECONDS * 1000).toISOString(),
    });
    return Response.json({
      ok: true,
      userId: account.userId,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
    }, { headers: { "set-cookie": sessionCookie(token) } });
  } catch (error) {
    console.error("local_login_failed", error);
    return Response.json({ error: "Connexion temporairement indisponible." }, { status: 503 });
  }
}

function invalidCredentials() {
  return Response.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
}
