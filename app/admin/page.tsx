import { requireCurrentUser } from "../../lib/session-auth";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { hasAdminAccess } from "../../lib/access";
import { RoleManager } from "./role-manager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireCurrentUser("/admin");
  if (!hasAdminAccess(user.role)) return <main className="grid min-h-screen place-items-center p-6"><h1 className="text-2xl font-bold">Accès administrateur requis</h1></main>;
  const rows = await getDb().select({ userId: users.userId, displayName: users.displayName, email: users.email, username: users.username, role: users.role, updatedAt: users.updatedAt }).from(users);
  return <main className="min-h-screen bg-[#f4f7fb] px-5 py-8 text-[#132c4a]"><div className="mx-auto max-w-5xl"><a href="/teacher" className="font-semibold text-[#155ad7]">← Mes classes</a><h1 className="mt-5 text-3xl font-bold">Rôles et accès</h1><p className="mb-7 mt-2 text-slate-600">Les étudiants voient leurs exercices. Les professeurs voient uniquement leurs classes. Les administrateurs peuvent attribuer les rôles.</p><RoleManager initialUsers={rows} currentUserId={user.userId}/></div></main>;
}
