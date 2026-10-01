"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeacherClass } from "./class-manager";

type StudentAccount = { userId: string; displayName: string; username: string | null; className: string };

export function StudentAccountManager({ classes, initialStudents }: { classes: TeacherClass[]; initialStudents: StudentAccount[] }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [classId, setClassId] = useState(classes[0]?.classId ?? "");
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setMessage(""); setCredentials(null);
    try {
      const response = await fetch("/api/teacher/students", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, username, classId }) });
      const result = await response.json() as { error?: string; temporaryPassword?: string; student?: { username: string } };
      if (!response.ok || !result.student || !result.temporaryPassword) throw new Error(result.error ?? "Création impossible.");
      setCredentials({ username: result.student.username, password: result.temporaryPassword });
      setDisplayName(""); setUsername("");
      router.refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Création impossible."); }
    finally { setPending(false); }
  }

  async function reset(userId: string, accountUsername: string) {
    setPending(true); setMessage(""); setCredentials(null);
    try {
      const response = await fetch("/api/teacher/students", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId }) });
      const result = await response.json() as { error?: string; temporaryPassword?: string };
      if (!response.ok || !result.temporaryPassword) throw new Error(result.error ?? "Réinitialisation impossible.");
      setCredentials({ username: accountUsername, password: result.temporaryPassword });
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Réinitialisation impossible."); }
    finally { setPending(false); }
  }

  async function copyCredentials() {
    if (!credentials) return;
    await navigator.clipboard.writeText(`Identifiant : ${credentials.username}\nMot de passe temporaire : ${credentials.password}`);
    setMessage("Identifiant et mot de passe copiés.");
  }

  return <section className="mt-7 rounded-2xl border border-[#dce5f0] bg-white p-5 shadow-sm">
    <h2 className="text-xl font-bold">Comptes des élèves</h2>
    <p className="mt-1 text-sm text-slate-500">Créez un identifiant. Le mot de passe temporaire est affiché une seule fois.</p>
    {classes.length ? <form onSubmit={create} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <label className="sr-only" htmlFor="student-name">Nom de l’élève</label><input id="student-name" value={displayName} onChange={event => setDisplayName(event.target.value)} className="min-h-11 rounded-xl border px-3" placeholder="Nom de l’élève" maxLength={80} required />
      <label className="sr-only" htmlFor="student-username">Identifiant</label><input id="student-username" value={username} onChange={event => setUsername(event.target.value.toLocaleLowerCase("fr").replace(/\s+/g, "."))} className="min-h-11 rounded-xl border px-3" placeholder="ex. lina.ba3" maxLength={40} required />
      <label className="sr-only" htmlFor="student-class">Classe</label><select id="student-class" value={classId} onChange={event => setClassId(event.target.value)} className="min-h-11 rounded-xl border px-3">{classes.map(item => <option key={item.classId} value={item.classId}>{item.name}</option>)}</select>
      <button disabled={pending} className="min-h-11 rounded-xl bg-[#155ad7] px-5 font-semibold text-white disabled:opacity-60">Créer le compte</button>
    </form> : <p className="mt-4 rounded-xl bg-amber-50 p-3 text-amber-900">Créez d’abord une classe.</p>}
    {credentials && <div className="mt-4 rounded-xl border-2 border-[#155ad7] bg-[#edf4ff] p-4" role="status"><p className="font-bold">À transmettre maintenant à l’élève</p><p className="mt-2">Identifiant : <code className="font-bold">{credentials.username}</code></p><p>Mot de passe temporaire : <code className="font-bold">{credentials.password}</code></p><button type="button" onClick={() => void copyCredentials()} className="mt-3 rounded-lg border border-[#155ad7] bg-white px-3 py-2 text-sm font-semibold text-[#155ad7]">Copier les deux</button></div>}
    {message && <p className="mt-3 text-sm font-semibold text-[#155ad7]" role="status">{message}</p>}
    {initialStudents.length > 0 && <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Élève</th><th className="p-3">Identifiant</th><th className="p-3">Classe</th><th className="p-3">Mot de passe</th></tr></thead><tbody>{initialStudents.map(student => <tr className="border-t" key={student.userId}><td className="p-3 font-semibold">{student.displayName}</td><td className="p-3"><code>{student.username ?? "Compte ChatGPT actuel"}</code></td><td className="p-3">{student.className}</td><td className="p-3">{student.username ? <button type="button" disabled={pending} onClick={() => void reset(student.userId, student.username!)} className="rounded-lg border px-3 py-2 font-semibold disabled:opacity-50">Réinitialiser</button> : "—"}</td></tr>)}</tbody></table></div>}
  </section>;
}
