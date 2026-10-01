import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "../db";
import { sessions, users } from "../db/schema";
import { getChatGPTUser } from "../app/chatgpt-auth";
import { ensureUserRole, isLegacyStorageOwner, type UserRole } from "./access";
import { hashSessionToken } from "./passwords";

export const SESSION_COOKIE = "english_pocket_session";
export const SESSION_LIFETIME_SECONDS = 14 * 24 * 60 * 60;

export type CurrentUser = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  username: string | null;
  mustChangePassword: boolean;
  authType: "local" | "chatgpt";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    const sessionHash = await hashSessionToken(token);
    const [record] = await getDb().select({
      userId: users.userId,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      username: users.username,
      mustChangePassword: users.mustChangePassword,
    }).from(sessions)
      .innerJoin(users, eq(users.userId, sessions.userId))
      .where(and(eq(sessions.sessionHash, sessionHash), gt(sessions.expiresAt, new Date().toISOString())))
      .limit(1);
    if (record) return { ...record, authType: "local" };
  }

  const chatGPTUser = await getChatGPTUser();
  if (!chatGPTUser || !isLegacyStorageOwner(chatGPTUser.email)) return null;
  const role = await ensureUserRole(chatGPTUser);
  return {
    userId: chatGPTUser.userId,
    email: chatGPTUser.email,
    displayName: chatGPTUser.fullName ?? chatGPTUser.displayName,
    role,
    username: null,
    mustChangePassword: false,
    authType: "chatgpt",
  };
}

export async function requireCurrentUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?return_to=${encodeURIComponent(safeReturnTo(returnTo))}`);
  if (user.mustChangePassword) redirect(`/change-password?return_to=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return user;
}

export function safeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    if (["/login", "/change-password", "/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"].includes(url.pathname)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function sessionCookie(token: string, maxAge = SESSION_LIFETIME_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
