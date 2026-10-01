import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../../lib/session-auth";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { hasAdminAccess, type UserRole } from "../../../../lib/access";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !hasAdminAccess(user.role) || user.mustChangePassword) return null;
  return user;
}

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: "Accès administrateur requis" }, { status: 403 });
  const rows = await getDb().select({ userId: users.userId, displayName: users.displayName, email: users.email, role: users.role, updatedAt: users.updatedAt }).from(users);
  return Response.json({ users: rows });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Accès administrateur requis" }, { status: 403 });
  try {
    const payload = await request.json() as { userId?: string; role?: UserRole };
    if (!payload.userId || !["student", "teacher", "admin"].includes(payload.role ?? "")) {
      return Response.json({ error: "Rôle invalide" }, { status: 400 });
    }
    if (payload.userId === admin.userId && payload.role !== "admin") {
      return Response.json({ error: "Tu ne peux pas retirer ton propre accès administrateur." }, { status: 400 });
    }
    const db = getDb();
    const [target] = await db.select({ userId: users.userId }).from(users).where(eq(users.userId, payload.userId)).limit(1);
    if (!target) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    await db.update(users).set({ role: payload.role, updatedAt: new Date().toISOString() }).where(eq(users.userId, payload.userId));
    return Response.json({ ok: true, role: payload.role });
  } catch {
    return Response.json({ error: "Modification impossible" }, { status: 400 });
  }
}
