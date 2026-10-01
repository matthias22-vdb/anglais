import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createLocalAccount } from "../../../../lib/accounts";
import { hasAdminAccess, type UserRole } from "../../../../lib/access";
import { generateTemporaryPassword, hashPassword, isValidUsername, normalizeUsername } from "../../../../lib/passwords";
import { getCurrentUser } from "../../../../lib/session-auth";

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || !hasAdminAccess(admin.role) || admin.mustChangePassword) return Response.json({ error: "Accès administrateur requis." }, { status: 403 });
  try {
    const payload = await request.json() as { displayName?: string; username?: string; role?: UserRole };
    if (!payload.role || !["teacher", "admin"].includes(payload.role)) return Response.json({ error: "Rôle invalide." }, { status: 400 });
    const account = await createLocalAccount({ username: payload.username ?? "", displayName: payload.displayName ?? "", role: payload.role });
    return Response.json({ user: { userId: account.userId, displayName: account.displayName, username: account.username, email: `${account.username}@accounts.english-pocket.invalid`, role: account.role, updatedAt: new Date().toISOString() }, temporaryPassword: account.temporaryPassword }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") return Response.json({ error: "Cet identifiant est déjà utilisé." }, { status: 409 });
    if (error instanceof Error && error.message === "IDENTIFIER_INVALID") return Response.json({ error: "Utilise 3 à 40 lettres minuscules, chiffres, points, tirets ou underscores." }, { status: 400 });
    if (error instanceof Error && error.message === "DISPLAY_NAME_INVALID") return Response.json({ error: "Le nom doit contenir entre 2 et 80 caractères." }, { status: 400 });
    console.error("staff_account_create_failed", error);
    return Response.json({ error: "Création temporairement indisponible." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || !hasAdminAccess(admin.role) || admin.mustChangePassword) return Response.json({ error: "Accès administrateur requis." }, { status: 403 });
  try {
    const payload = await request.json() as { userId?: string; username?: string };
    const username = normalizeUsername(typeof payload.username === "string" ? payload.username : "");
    if (!isValidUsername(username)) return Response.json({ error: "Utilise 3 à 40 lettres minuscules, chiffres, points, tirets ou underscores." }, { status: 400 });
    if (typeof payload.userId !== "string" || !payload.userId) return Response.json({ error: "Compte élève introuvable." }, { status: 404 });
    const db = getDb();
    const [student] = await db.select({ userId: users.userId }).from(users)
      .where(and(eq(users.userId, payload.userId), eq(users.role, "student"), isNull(users.username))).limit(1);
    if (!student) return Response.json({ error: "Ce compte n’est pas un élève sans identifiant." }, { status: 409 });
    const [taken] = await db.select({ userId: users.userId }).from(users).where(eq(users.username, username)).limit(1);
    if (taken) return Response.json({ error: "Cet identifiant est déjà utilisé." }, { status: 409 });
    const temporaryPassword = generateTemporaryPassword();
    const password = await hashPassword(temporaryPassword);
    const updated = await db.update(users).set({
      username,
      passwordHash: password.hash,
      passwordSalt: password.salt,
      passwordIterations: password.iterations,
      mustChangePassword: true,
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    }).where(and(eq(users.userId, student.userId), eq(users.role, "student"), isNull(users.username)))
      .returning({ userId: users.userId });
    if (!updated.length) return Response.json({ error: "Ce compte a déjà été activé. Actualise la page." }, { status: 409 });
    return Response.json({ ok: true, username, temporaryPassword });
  } catch (error) {
    if (String(error).toLocaleLowerCase("fr").includes("unique")) return Response.json({ error: "Cet identifiant est déjà utilisé." }, { status: 409 });
    console.error("student_local_access_failed", error);
    return Response.json({ error: "Activation temporairement indisponible." }, { status: 503 });
  }
}
