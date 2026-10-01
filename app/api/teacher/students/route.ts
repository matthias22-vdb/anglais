import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { classes, classMemberships, sessions, users } from "../../../../db/schema";
import { createLocalAccount } from "../../../../lib/accounts";
import { hasTeacherAccess } from "../../../../lib/access";
import { generateTemporaryPassword, hashPassword } from "../../../../lib/passwords";
import { getCurrentUser } from "../../../../lib/session-auth";

async function teacher() {
  const user = await getCurrentUser();
  return user && hasTeacherAccess(user.role) && !user.mustChangePassword ? user : null;
}

export async function POST(request: Request) {
  const current = await teacher();
  if (!current) return Response.json({ error: "Accès professeur requis." }, { status: 403 });
  try {
    const payload = await request.json() as { displayName?: string; username?: string; classId?: string };
    const db = getDb();
    const [targetClass] = await db.select({ classId: classes.classId, name: classes.name }).from(classes)
      .where(and(eq(classes.classId, payload.classId ?? ""), eq(classes.teacherUserId, current.userId))).limit(1);
    if (!targetClass) return Response.json({ error: "Classe introuvable." }, { status: 404 });
    let account: Awaited<ReturnType<typeof createLocalAccount>> | null = null;
    try {
      account = await createLocalAccount({ username: payload.username ?? "", displayName: payload.displayName ?? "", role: "student" });
      await db.insert(classMemberships).values({ userId: account.userId, classId: targetClass.classId });
    } catch (error) {
      if (account) await db.delete(users).where(eq(users.userId, account.userId));
      if (error instanceof Error && error.message === "USERNAME_TAKEN") return Response.json({ error: "Cet identifiant est déjà utilisé." }, { status: 409 });
      if (error instanceof Error && error.message === "IDENTIFIER_INVALID") return Response.json({ error: "Utilise 3 à 40 lettres minuscules, chiffres, points, tirets ou underscores." }, { status: 400 });
      if (error instanceof Error && error.message === "DISPLAY_NAME_INVALID") return Response.json({ error: "Le nom doit contenir entre 2 et 80 caractères." }, { status: 400 });
      throw error;
    }
    return Response.json({ student: { userId: account.userId, displayName: account.displayName, username: account.username, className: targetClass.name }, temporaryPassword: account.temporaryPassword }, { status: 201 });
  } catch (error) {
    console.error("student_account_create_failed", error);
    return Response.json({ error: "Création temporairement indisponible." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const current = await teacher();
  if (!current) return Response.json({ error: "Accès professeur requis." }, { status: 403 });
  try {
    const payload = await request.json() as { userId?: string };
    const db = getDb();
    const [student] = await db.select({ userId: users.userId, username: users.username }).from(classMemberships)
      .innerJoin(classes, and(eq(classes.classId, classMemberships.classId), eq(classes.teacherUserId, current.userId)))
      .innerJoin(users, and(eq(users.userId, classMemberships.userId), eq(users.role, "student")))
      .where(eq(users.userId, payload.userId ?? "")).limit(1);
    if (!student?.username) return Response.json({ error: "Compte élève introuvable." }, { status: 404 });
    const temporaryPassword = generateTemporaryPassword();
    const password = await hashPassword(temporaryPassword);
    await db.update(users).set({ passwordHash: password.hash, passwordSalt: password.salt, passwordIterations: password.iterations, mustChangePassword: true, failedLoginCount: 0, lockedUntil: null, updatedAt: new Date().toISOString() }).where(eq(users.userId, student.userId));
    await db.delete(sessions).where(eq(sessions.userId, student.userId));
    return Response.json({ ok: true, temporaryPassword });
  } catch (error) {
    console.error("student_password_reset_failed", error);
    return Response.json({ error: "Réinitialisation temporairement indisponible." }, { status: 503 });
  }
}
