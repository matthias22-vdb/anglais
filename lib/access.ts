import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../db/schema";

export type UserRole = "student" | "teacher" | "admin";
type AuthenticatedUser = { userId: string; email: string; fullName?: string | null; displayName?: string };
const INITIAL_ADMIN_EMAIL = "isabel4171@icloud.com";

export async function ensureUserRole(user: AuthenticatedUser): Promise<UserRole> {
  const db = getDb();
  const now = new Date().toISOString();
  const displayName = user.fullName ?? user.displayName ?? user.email.split("@")[0];
  await db.insert(users).values({ userId: user.userId, email: user.email, displayName, updatedAt: now })
    .onConflictDoUpdate({ target: users.userId, set: { email: user.email, displayName, updatedAt: now } });
  let [record] = await db.select({ role: users.role }).from(users).where(eq(users.userId, user.userId)).limit(1);
  if (user.email.trim().toLocaleLowerCase("fr") === INITIAL_ADMIN_EMAIL && record?.role !== "admin") {
    await db.update(users).set({ role: "admin", updatedAt: now }).where(eq(users.userId, user.userId));
    record = { role: "admin" };
  }
  return record?.role ?? "student";
}

export const hasTeacherAccess = (role: UserRole) => role === "teacher" || role === "admin";
export const hasAdminAccess = (role: UserRole) => role === "admin";

export function isLegacyStorageOwner(email: string) {
  return email.trim().toLocaleLowerCase("fr") === INITIAL_ADMIN_EMAIL;
}
