import { eq } from 'drizzle-orm';
import { getChatGPTUser } from '../../chatgpt-auth';
import { getDb } from '../../../db';
import { studentProgress } from '../../../db/schema';
export async function GET() {
  const user = await getChatGPTUser();
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!user) return Response.json({ error: 'Ouvre une fois le compte ChatGPT utilisé pour tes anciennes réponses.' }, { status: 401, headers });
  try {
    const [row] = await getDb().select({ stateJson: studentProgress.stateJson }).from(studentProgress).where(eq(studentProgress.userId, user.userId)).limit(1);
    const saved = row ? JSON.parse(row.stateJson) : null;
    // Return only this authenticated user's learning data, never scores or another account.
    return Response.json({ state: saved ? { answers: saved.answers, cursor: saved.cursor } : null }, { headers });
  } catch { return Response.json({ error: 'Récupération temporairement indisponible.' }, { status: 503, headers }); }
}
