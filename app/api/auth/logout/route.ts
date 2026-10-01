import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../../../../db";
import { sessions } from "../../../../db/schema";
import { hashSessionToken } from "../../../../lib/passwords";
import { clearSessionCookie, SESSION_COOKIE } from "../../../../lib/session-auth";

async function logout() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    try { await getDb().delete(sessions).where(eq(sessions.sessionHash, await hashSessionToken(token))); }
    catch (error) { console.error("local_logout_failed", error); }
  }
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
}

export async function POST() { return logout(); }

export async function GET(request: Request) {
  const response = await logout();
  const redirect = Response.redirect(new URL("/login", request.url), 303);
  const cookie = response.headers.get("set-cookie");
  if (cookie) redirect.headers.set("set-cookie", cookie);
  return redirect;
}
