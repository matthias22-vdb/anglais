import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/session-auth";
import { getDb } from "../../../../db";
import { classes, classMemberships } from "../../../../db/schema";
import { hasTeacherAccess, isLegacyStorageOwner } from "../../../../lib/access";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ authenticated: false }, { status: 401 });
  try {
    const db = getDb();
    const [membership] = await db.select({ classId: classes.classId, className: classes.name })
      .from(classMemberships)
      .innerJoin(classes, eq(classes.classId, classMemberships.classId))
      .where(eq(classMemberships.userId, user.userId))
      .limit(1);
    return Response.json({
      authenticated: true,
      userId: user.userId,
      displayName: user.displayName,
      isTeacher: hasTeacherAccess(user.role),
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      authType: user.authType,
      legacyStorageOwner: isLegacyStorageOwner(user.email),
      testMode: user.email.endsWith("@test.english-pocket.invalid"),
      class: membership ?? null,
    });
  } catch (error) {
    console.error("student_identity_failed", error);
    return Response.json({ error: "Connexion temporairement indisponible" }, { status: 503 });
  }
}
