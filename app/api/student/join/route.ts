import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/session-auth";
import { getDb } from "../../../../db";
import { classes, classMemberships, users } from "../../../../db/schema";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Connexion requise" }, { status: 401 });
  if (user.mustChangePassword) return Response.json({ error: "Choisis d’abord ton nouveau mot de passe." }, { status: 428 });
  try {
    const payload = (await request.json()) as { code?: string };
    const code = payload.code?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
    if (code.length !== 6) return Response.json({ error: "Le code de classe doit contenir 6 caractères." }, { status: 400 });
    const db = getDb();
    const [targetClass] = await db.select().from(classes).where(eq(classes.joinCode, code)).limit(1);
    if (!targetClass) return Response.json({ error: "Ce code de classe est incorrect." }, { status: 404 });
    const [existing] = await db.select().from(classMemberships).where(eq(classMemberships.userId, user.userId)).limit(1);
    if (existing && existing.classId !== targetClass.classId) {
      return Response.json({ error: "Votre compte est déjà rattaché à une autre classe. Demandez au professeur de vous aider." }, { status: 409 });
    }
    const displayName = user.displayName;
    const now = new Date().toISOString();
    await db.insert(users).values({ userId: user.userId, email: user.email, displayName, updatedAt: now })
      .onConflictDoUpdate({ target: users.userId, set: { email: user.email, displayName, updatedAt: now } });
    await db.insert(classMemberships).values({ userId: user.userId, classId: targetClass.classId })
      .onConflictDoNothing({ target: classMemberships.userId });
    return Response.json({ ok: true, class: { classId: targetClass.classId, className: targetClass.name } });
  } catch (error) {
    console.error("class_join_failed", error);
    return Response.json({ error: "Impossible de rejoindre la classe pour le moment." }, { status: 503 });
  }
}
