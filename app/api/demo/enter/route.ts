import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { isLegacyStorageOwner } from "../../../../lib/access";
import { generateSessionToken, hashSessionToken } from "../../../../lib/passwords";
import { clearSessionCookie, getCurrentUser, SESSION_LIFETIME_SECONDS, sessionCookie } from "../../../../lib/session-auth";

// A test identity belongs to this browser only. Never grant admin access here.
const DEMO_COOKIES = { student: "english_pocket_test_student", teacher: "english_pocket_test_teacher" } as const;

export async function POST(request: Request) {
  const form = await request.formData();
  const role = form.get("role");
  if (role !== "student" && role !== "teacher") return new Response("Espace invalide", { status: 400 });

  try {
    // The original progress belongs to this already authenticated owner, not to a new guest.
    const originalOwner = await getChatGPTUser();
    if (role === "student" && originalOwner && isLegacyStorageOwner(originalOwner.email)) {
      return new Response(null, { status: 303, headers: {
        Location: new URL("/student/index.html", request.url).href,
        "Set-Cookie": clearSessionCookie(),
      } });
    }
    const existing = await getCurrentUser();
    if (existing && !existing.mustChangePassword && !existing.email.endsWith("@test.english-pocket.invalid") &&
      (role === "student" && existing.role === "student" || role === "teacher" && (existing.role === "teacher" || existing.role === "admin"))) {
      return Response.redirect(new URL(role === "student" ? "/student/index.html" : "/teacher", request.url), 303);
    }
    const db = getDb();
    let token = (await cookies()).get(DEMO_COOKIES[role])?.value;
    let valid = false;
    if (token && /^[0-9a-f]{64}$/.test(token)) {
      const [session] = await db.select({ email: users.email }).from(sessions)
        .innerJoin(users, and(eq(users.userId, sessions.userId), eq(users.role, role)))
        .where(and(eq(sessions.sessionHash, await hashSessionToken(token)), gt(sessions.expiresAt, new Date().toISOString()))).limit(1);
      valid = session?.email.endsWith("@test.english-pocket.invalid") === true;
    }

    if (!valid) {
      const userId = crypto.randomUUID();
      token = generateSessionToken();
      const now = new Date().toISOString();
      await db.insert(users).values({
        userId, email: `${userId}@test.english-pocket.invalid`,
        displayName: role === "student" ? "Élève en test" : "Professeur en test", role,
        createdAt: now, updatedAt: now,
      });
      await db.insert(sessions).values({
        sessionHash: await hashSessionToken(token), userId,
        expiresAt: new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000).toISOString(),
      });
    }

    const destination = role === "student" ? "/student/index.html" : "/teacher";
    // Response.redirect() has immutable headers in Workers, so use a writable response.
    const response = new Response(null, { status: 303, headers: { Location: new URL(destination, request.url).href } });
    response.headers.append("set-cookie", sessionCookie(token!));
    response.headers.append("set-cookie", `${DEMO_COOKIES[role]}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_LIFETIME_SECONDS}`);
    return response;
  } catch (error) {
    console.error("demo_access_failed", error instanceof Error ? error.message : "unknown error");
    return new Response("Accès de test temporairement indisponible.", { status: 503 });
  }
}
