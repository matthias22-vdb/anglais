import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../../lib/session-auth";
import { getDb } from "../../../db";
import { studentProgress, users } from "../../../db/schema";
import questions from "../../../questions-reviewed.json";

type ProgressPayload = {
  expectedUserId?: string;
  state?: unknown;
  replace?: boolean;
};

type Question = { id: string; answer: number };
const questionBank = questions as Question[];
const questionById = new Map(questionBank.map((question) => [question.id, question]));

function bounded(value: unknown, minimum: number, maximum: number) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : minimum;
  return Math.min(maximum, Math.max(minimum, number));
}

function cleanState(value: unknown) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const answers: Record<string, { choice: number; assisted: boolean; pending: boolean; rejected: number[]; needsReview: boolean; changedAt: number }> = {};
  const rawAnswers = input.answers && typeof input.answers === "object" && !Array.isArray(input.answers)
    ? input.answers as Record<string, unknown> : {};
  for (const [id, raw] of Object.entries(rawAnswers)) {
    const question = questionById.get(id);
    if (!question || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const answer = raw as Record<string, unknown>;
    if (!Number.isInteger(answer.choice) || (answer.choice as number) < 0 || (answer.choice as number) > 3) continue;
    const choice = answer.choice as number;
    const rejected = Array.isArray(answer.rejected)
      ? [...new Set(answer.rejected.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < 4 && item !== question.answer))]
      : [];
    answers[id] = {
      choice,
      assisted: answer.assisted === true,
      pending: answer.pending === true && choice !== question.answer,
      rejected,
      needsReview: answer.needsReview === true || answer.assisted === true || choice !== question.answer,
      changedAt: Math.round(bounded(answer.changedAt, 0, Date.now() + 300000)),
    };
  }

  const monthly: Record<string, { total: number; errors: number }> = {};
  const rawMonthly = input.monthly && typeof input.monthly === "object" && !Array.isArray(input.monthly)
    ? input.monthly as Record<string, unknown> : {};
  for (const [month, raw] of Object.entries(rawMonthly).slice(-120)) {
    if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month) || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const count = raw as Record<string, unknown>;
    const total = Math.round(bounded(count.total, 0, 100000));
    const errors = Math.round(bounded(count.errors, 0, total));
    if (total > 0) monthly[month] = { total, errors };
  }

  const rawGame = input.game && typeof input.game === "object" && !Array.isArray(input.game)
    ? input.game as Record<string, unknown> : {};
  const dailyIds = Array.isArray(rawGame.dailyIds)
    ? [...new Set(rawGame.dailyIds.filter((id): id is string => typeof id === "string" && questionById.has(id)))].slice(0, 500)
    : [];
  const hints: Record<string, { used: true; eliminated: number[] }> = {};
  const rawHints = input.hints && typeof input.hints === "object" && !Array.isArray(input.hints)
    ? input.hints as Record<string, unknown> : {};
  for (const [id, raw] of Object.entries(rawHints)) {
    const question = questionById.get(id);
    if (!question || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const hint = raw as Record<string, unknown>;
    if (hint.used !== true) continue;
    hints[id] = { used: true, eliminated: Array.isArray(hint.eliminated)
      ? [...new Set(hint.eliminated.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < 4 && item !== question.answer))]
      : [] };
  }
  return {
    cursor: Math.round(bounded(input.cursor, 0, questionBank.length)),
    answers,
    hints,
    monthly,
    game: {
      date: typeof rawGame.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawGame.date) ? rawGame.date : "",
      dailyIds,
      streak: Math.round(bounded(rawGame.streak, 0, 500)),
      best: Math.round(bounded(rawGame.best, 0, 500)),
    },
  };
}

function mergeStates(current: ReturnType<typeof cleanState>, incoming: ReturnType<typeof cleanState>) {
  const answers = { ...current.answers };
  for (const [id, answer] of Object.entries(incoming.answers)) {
    const previous = answers[id];
    if (!previous || answer.changedAt > previous.changedAt) answers[id] = answer;
  }
  const monthly = { ...current.monthly };
  for (const [month, count] of Object.entries(incoming.monthly)) {
    if (!monthly[month] || count.total >= monthly[month].total) monthly[month] = count;
  }
  const sameDay = current.game.date && current.game.date === incoming.game.date;
  return {
    ...incoming,
    answers,
    hints: { ...current.hints, ...incoming.hints },
    monthly,
    game: {
      ...incoming.game,
      dailyIds: sameDay ? [...new Set([...current.game.dailyIds, ...incoming.game.dailyIds])] : incoming.game.dailyIds,
      best: Math.max(current.game.best, incoming.game.best),
    },
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Connexion requise" }, { status: 401 });
  if (user.mustChangePassword) return Response.json({ error: "Changement de mot de passe requis" }, { status: 428 });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 750000) {
    return Response.json({ error: "Progression trop volumineuse" }, { status: 413 });
  }

  let payload: ProgressPayload;
  try {
    const body = await request.text();
    if (body.length > 750000) return Response.json({ error: "Progression trop volumineuse" }, { status: 413 });
    payload = JSON.parse(body) as ProgressPayload;
  } catch {
    return Response.json({ error: "Données de progression invalides" }, { status: 400 });
  }

  try {
    if (payload.expectedUserId !== user.userId) {
      return Response.json({ error: "Session utilisateur modifiée" }, { status: 409 });
    }
    let state = cleanState(payload.state);
    if (payload.replace !== true) {
      const db = getDb();
      const [existing] = await db.select({ stateJson: studentProgress.stateJson })
        .from(studentProgress).where(eq(studentProgress.userId, user.userId)).limit(1);
      if (existing?.stateJson) {
        try { state = mergeStates(cleanState(JSON.parse(existing.stateJson)), state); } catch {}
      }
    }
    const entries = Object.entries(state.answers);
    const questionsAnswered = entries.length;
    const correctAnswers = entries.filter(([id, answer]) => questionById.get(id)?.answer === answer.choice && !answer.assisted && !answer.needsReview).length;
    const wrongAnswers = questionsAnswered - correctAnswers;
    const mastery = questionsAnswered ? 14 * correctAnswers / questionsAnswered : 0;
    const effort = 6 * Math.min(questionsAnswered / 100, 1);
    const grade = Math.min(20, mastery + effort);
    const xp = correctAnswers * 10 + questionsAnswered * 2;
    const streak = state.game.streak;
    const errorRate = questionsAnswered ? wrongAnswers / questionsAnswered * 100 : 0;
    const monthlyJson = JSON.stringify(state.monthly);
    const stateJson = JSON.stringify(state);
    const now = new Date().toISOString();
    const displayName = user.displayName;
    const db = getDb();
    await db.insert(users).values({
      userId: user.userId,
      email: user.email,
      displayName,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: users.userId,
      set: { email: user.email, displayName, updatedAt: now },
    });

    await db.insert(studentProgress).values({
      userId: user.userId,
      questionsAnswered,
      correctAnswers,
      wrongAnswers,
      grade,
      xp,
      streak,
      errorRate,
      monthlyJson,
      stateJson,
      lastActiveAt: now,
    }).onConflictDoUpdate({
      target: studentProgress.userId,
      set: { questionsAnswered, correctAnswers, wrongAnswers, grade, xp, streak, errorRate, monthlyJson, stateJson, lastActiveAt: now },
    });

    return Response.json({ ok: true, syncedAt: now });
  } catch (error) {
    console.error("progress_sync_failed", error);
    return Response.json({ error: "Synchronisation temporairement indisponible" }, { status: 503 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Connexion requise" }, { status: 401 });
  if (user.mustChangePassword) return Response.json({ error: "Changement de mot de passe requis" }, { status: 428 });
  try {
    const db = getDb();
    const rows = await db.select().from(studentProgress).where(eq(studentProgress.userId, user.userId)).limit(1);
    const progress = rows[0] ?? null;
    let state = null;
    if (progress?.stateJson) {
      try { state = cleanState(JSON.parse(progress.stateJson)); } catch { state = null; }
    }
    const summary = progress ? {
      questionsAnswered: progress.questionsAnswered,
      correctAnswers: progress.correctAnswers,
      wrongAnswers: progress.wrongAnswers,
      grade: progress.grade,
      xp: progress.xp,
      streak: progress.streak,
      errorRate: progress.errorRate,
      lastActiveAt: progress.lastActiveAt,
    } : null;
    return Response.json({ progress: summary, state });
  } catch (error) {
    console.error("progress_read_failed", error);
    return Response.json({ error: "Lecture temporairement indisponible" }, { status: 503 });
  }
}
