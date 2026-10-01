import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/session-auth";
import { getDb } from "../../../../db";
import { classes } from "../../../../db/schema";
import { hasTeacherAccess } from "../../../../lib/access";
import { generateJoinCode } from "../../../../lib/class-codes";

async function authorizedTeacher() {
  const user = await getCurrentUser();
  if (!user) return null;
  return hasTeacherAccess(user.role) && !user.mustChangePassword ? user : null;
}

export async function GET() {
  const teacher = await authorizedTeacher();
  if (!teacher) return Response.json({ error: "Accès professeur requis" }, { status: 403 });
  const db = getDb();
  const rows = await db.select().from(classes).where(eq(classes.teacherUserId, teacher.userId));
  return Response.json({ classes: rows });
}

export async function POST(request: Request) {
  const teacher = await authorizedTeacher();
  if (!teacher) return Response.json({ error: "Accès professeur requis" }, { status: 403 });
  try {
    const payload = (await request.json()) as { name?: string };
    const name = payload.name?.trim().replace(/\s+/g, " ") ?? "";
    if (name.length < 2 || name.length > 60) {
      return Response.json({ error: "Le nom de la classe doit contenir entre 2 et 60 caractères." }, { status: 400 });
    }
    const db = getDb();
    let joinCode = "";
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = generateJoinCode();
      const existing = await db.select({ classId: classes.classId }).from(classes).where(eq(classes.joinCode, candidate)).limit(1);
      if (!existing.length) { joinCode = candidate; break; }
    }
    if (!joinCode) return Response.json({ error: "Impossible de générer un code pour le moment." }, { status: 503 });
    const row = {
      classId: crypto.randomUUID(),
      teacherUserId: teacher.userId,
      name,
      joinCode,
    };
    await db.insert(classes).values(row);
    const [created] = await db.select().from(classes).where(and(eq(classes.classId, row.classId), eq(classes.teacherUserId, teacher.userId))).limit(1);
    return Response.json({ class: created }, { status: 201 });
  } catch (error) {
    console.error("class_create_failed", error);
    return Response.json({ error: "Création temporairement indisponible." }, { status: 503 });
  }
}
