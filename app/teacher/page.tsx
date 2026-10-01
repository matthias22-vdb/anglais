import { and, desc, eq } from "drizzle-orm";
import { BookOpenCheck, Clock3, GraduationCap, TrendingUp, Users } from "lucide-react";
import { requireCurrentUser } from "../../lib/session-auth";
import { getDb } from "../../db";
import { classes, classMemberships, studentProgress, users } from "../../db/schema";
import { hasTeacherAccess } from "../../lib/access";
import { ClassManager, type TeacherClass } from "./class-manager";
import { StudentAccountManager } from "./student-account-manager";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Pas encore d’activité";
  return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function TeacherPage() {
  const user = await requireCurrentUser("/teacher");
  if (!hasTeacherAccess(user.role)) {
    return <main className="grid min-h-screen place-items-center px-5"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#132c4a] text-xl font-bold text-white">E</div><h1 className="text-2xl font-bold">Espace réservé aux professeurs</h1><p className="mt-3 text-slate-600">Seuls les professeurs autorisés peuvent consulter les classes.</p></section></main>;
  }

  let teacherClasses: TeacherClass[] = [];
  let students: Array<{ userId: string; displayName: string; username: string | null; className: string; questionsAnswered: number; correctAnswers: number; wrongAnswers: number; grade: number; xp: number; lastActiveAt: string | null }> = [];
  let unavailable = false;
  try {
    const db = getDb();
    teacherClasses = await db.select({ classId: classes.classId, name: classes.name, joinCode: classes.joinCode }).from(classes).where(eq(classes.teacherUserId, user.userId));
    const rows = await db.select({
      userId: users.userId,
      displayName: users.displayName,
      username: users.username,
      className: classes.name,
      questionsAnswered: studentProgress.questionsAnswered,
      correctAnswers: studentProgress.correctAnswers,
      wrongAnswers: studentProgress.wrongAnswers,
      grade: studentProgress.grade,
      xp: studentProgress.xp,
      lastActiveAt: studentProgress.lastActiveAt,
    }).from(classMemberships)
      .innerJoin(classes, and(eq(classes.classId, classMemberships.classId), eq(classes.teacherUserId, user.userId)))
      .innerJoin(users, eq(users.userId, classMemberships.userId))
      .leftJoin(studentProgress, eq(studentProgress.userId, classMemberships.userId))
      .orderBy(desc(studentProgress.lastActiveAt));
    students = rows.map((row) => ({ ...row, questionsAnswered: row.questionsAnswered ?? 0, correctAnswers: row.correctAnswers ?? 0, wrongAnswers: row.wrongAnswers ?? 0, grade: row.grade ?? 0, xp: row.xp ?? 0 }));
  } catch (error) {
    console.error("teacher_dashboard_failed", error);
    unavailable = true;
  }

  const totalQuestions = students.reduce((sum, student) => sum + student.questionsAnswered, 0);
  const averageGrade = students.length ? students.reduce((sum, student) => sum + student.grade, 0) / students.length : 0;
  const activeLimit = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeStudents = students.filter((student) => student.lastActiveAt && new Date(student.lastActiveAt).getTime() >= activeLimit).length;
  const summary = [
    { icon: Users, label: "Mes élèves", value: students.length.toString() },
    { icon: Clock3, label: "Actifs sur 7 jours", value: activeStudents.toString() },
    { icon: BookOpenCheck, label: "Questions travaillées", value: totalQuestions.toLocaleString("fr-BE") },
    { icon: GraduationCap, label: "Moyenne d’entraînement", value: students.length ? `${averageGrade.toFixed(1).replace(".", ",")} / 20` : "— / 20" },
  ];

  return <main className="min-h-screen bg-[#f4f7fb] text-[#132c4a]">
    <header className="border-b border-[#dce5f0] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8"><a href="/" className="flex items-center gap-3 font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#132c4a] text-white">E</span><span>ENGLISH POCKET EXAM<small className="block font-normal text-slate-500">Statistiques</small></span></a>{user.role === "admin" && <a href="/admin" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#155ad7]">Gérer les comptes</a>}<a className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600" href={user.email.endsWith("@test.english-pocket.invalid") ? "/" : user.authType === "local" ? "/api/auth/logout" : "/signout-with-chatgpt?return_to=%2Flogin"}>{user.email.endsWith("@test.english-pocket.invalid") ? "Accueil" : "Déconnexion"}</a></div></header>
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="mb-7"><p className="text-sm font-bold uppercase tracking-wider text-[#155ad7]">Suivi pédagogique</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Progression de mes élèves</h1><p className="mt-2 text-slate-600">Chaque professeur voit uniquement les élèves rattachés à ses propres classes.</p></div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Résumé de mes classes">{summary.map(({ icon: Icon, label, value }) => <article key={label} className="rounded-2xl border border-[#dce5f0] bg-white p-5 shadow-sm"><Icon className="mb-5 h-6 w-6 text-[#155ad7]" aria-hidden="true"/><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></article>)}</section>
      <ClassManager initialClasses={teacherClasses}/>
      <StudentAccountManager classes={teacherClasses} initialStudents={students.map(({ userId, displayName, username, className }) => ({ userId, displayName, username, className }))}/>
      <section className="mt-7 overflow-hidden rounded-2xl border border-[#dce5f0] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#dce5f0] px-5 py-5"><TrendingUp className="h-6 w-6 text-[#155ad7]"/><div><h2 className="text-xl font-bold">Détail par élève</h2><p className="text-sm text-slate-500">La note affichée est une note d’entraînement, pas une note scolaire officielle.</p></div></div>
        {unavailable ? <p className="m-5 rounded-xl bg-amber-50 p-4 text-amber-900">Les données sont temporairement indisponibles.</p> : students.length === 0 ? <div className="px-5 py-14 text-center"><Users className="mx-auto h-10 w-10 text-slate-300"/><h3 className="mt-4 text-lg font-bold">Aucun élève dans vos classes</h3><p className="mx-auto mt-2 max-w-xl text-slate-500">Créez une classe et partagez son lien d’accès aux élèves. Ils apparaîtront ici après l’avoir rejoint.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-[#f7f9fc] text-sm text-slate-600"><tr><th className="px-5 py-3">Élève</th><th className="px-4 py-3">Classe</th><th className="px-4 py-3">Questions</th><th className="px-4 py-3">Justes</th><th className="px-4 py-3">Erreurs</th><th className="px-4 py-3">Note</th><th className="px-4 py-3">Dernière activité</th></tr></thead><tbody>{students.map((student) => <tr key={student.userId} className="border-t border-[#edf1f6]"><td className="px-5 py-4 font-semibold">{student.displayName}</td><td className="px-4 py-4">{student.className}</td><td className="px-4 py-4">{student.questionsAnswered} / 500</td><td className="px-4 py-4 text-[#18794e]">{student.correctAnswers}</td><td className="px-4 py-4 text-[#b42318]">{student.wrongAnswers}</td><td className="px-4 py-4 font-bold">{student.questionsAnswered ? `${student.grade.toFixed(1).replace(".", ",")} / 20` : "—"}</td><td className="px-4 py-4 text-sm text-slate-500">{formatDate(student.lastActiveAt)}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </main>;
}
