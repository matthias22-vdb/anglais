import { chatGPTSignInPath, getChatGPTUser } from "../../../chatgpt-auth";
import { isLegacyStorageOwner } from "../../../../lib/access";
import { clearSessionCookie } from "../../../../lib/session-auth";

export async function GET(request: Request) {
  const owner = await getChatGPTUser();
  if (!owner) {
    return Response.redirect(new URL(chatGPTSignInPath("/api/demo/restore-owner"), request.url), 303);
  }
  if (!isLegacyStorageOwner(owner.email)) {
    return new Response("Cette progression appartient à un autre compte. Ouvre le compte ChatGPT utilisé avant le mode test.", {
      status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(null, { status: 303, headers: {
    Location: new URL("/student/index.html", request.url).href,
    "Set-Cookie": clearSessionCookie(),
  } });
}
