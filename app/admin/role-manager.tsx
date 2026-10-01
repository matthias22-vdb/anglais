"use client";
import { useState } from "react";
import type { UserRole } from "../../lib/access";

type Row = { userId: string; displayName: string; email: string; username: string | null; role: UserRole; updatedAt: string };

export function RoleManager({ initialUsers, currentUserId }: { initialUsers: Row[]; currentUserId: string }) {
  const [rows, setRows] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [newRole, setNewRole] = useState<"teacher" | "admin">("teacher");
  const [studentUserId, setStudentUserId] = useState("");
  const [studentUsername, setStudentUsername] = useState("");
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const legacyStudents = rows.filter(row => row.role === "student" && !row.username);
  async function changeRole(userId: string, role: UserRole) {
    setMessage("Enregistrement…");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, role }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setMessage(result.error ?? "Modification impossible"); return; }
    setRows(current => current.map(row => row.userId === userId ? { ...row, role } : row));
    setMessage("Rôle enregistré.");
  }
  async function createStaff(event: React.FormEvent) {
    event.preventDefault(); setMessage("Création…"); setCredentials(null);
    const response = await fetch("/api/admin/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, username, role: newRole }) });
    const result = await response.json() as { error?: string; temporaryPassword?: string; user?: Row };
    if (!response.ok || !result.user || !result.temporaryPassword) { setMessage(result.error ?? "Création impossible"); return; }
    setRows(current => [...current, result.user!]);
    setCredentials({ username: result.user.username!, password: result.temporaryPassword });
    setDisplayName(""); setUsername(""); setMessage("Compte créé.");
  }
  async function activateStudent(event: React.FormEvent) {
    event.preventDefault(); setMessage("Activation…"); setCredentials(null);
    try {
      const response = await fetch("/api/admin/accounts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: studentUserId, username: studentUsername }) });
      const result = await response.json() as { error?: string; username?: string; temporaryPassword?: string };
      if (!response.ok || !result.username || !result.temporaryPassword) throw new Error(result.error ?? "Activation impossible.");
      setRows(current => current.map(row => row.userId === studentUserId ? { ...row, username: result.username! } : row));
      setCredentials({ username: result.username, password: result.temporaryPassword });
      setStudentUserId(""); setStudentUsername(""); setMessage("Accès élève activé. La progression du compte est conservée.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Activation impossible."); }
  }
  return <>
    {legacyStudents.length > 0 && <form onSubmit={activateStudent} className="mb-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-[1fr_1fr_auto]">
      <div className="md:col-span-3"><h2 className="text-lg font-bold">Activer l’accès d’un élève existant</h2><p className="text-sm text-slate-600">Garde ses réponses et sa progression. Un mot de passe temporaire sera affiché une seule fois.</p></div>
      <label className="sr-only" htmlFor="existing-student">Compte élève</label><select id="existing-student" value={studentUserId} onChange={event => setStudentUserId(event.target.value)} className="min-h-11 rounded-xl border px-3" required><option value="">Choisir l’élève</option>{legacyStudents.map(row => <option key={row.userId} value={row.userId}>{row.displayName} · {row.email}</option>)}</select>
      <label className="sr-only" htmlFor="existing-username">Nouvel identifiant</label><input id="existing-username" value={studentUsername} onChange={event => setStudentUsername(event.target.value.toLocaleLowerCase("fr").replace(/\s+/g, "."))} className="min-h-11 rounded-xl border px-3" placeholder="Identifiant, ex. matthias" maxLength={40} required />
      <button className="rounded-xl bg-[#155ad7] px-4 py-2 font-semibold text-white">Activer</button>
    </form>}
    <form onSubmit={createStaff} className="mb-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-[1fr_1fr_auto_auto]"><div className="md:col-span-4"><h2 className="text-lg font-bold">Créer un compte professeur</h2></div><input value={displayName} onChange={event => setDisplayName(event.target.value)} className="min-h-11 rounded-xl border px-3" placeholder="Nom du professeur" aria-label="Nom du professeur" required/><input value={username} onChange={event => setUsername(event.target.value.toLocaleLowerCase("fr").replace(/\s+/g, "."))} className="min-h-11 rounded-xl border px-3" placeholder="Identifiant" aria-label="Identifiant du professeur" required/><select value={newRole} onChange={event => setNewRole(event.target.value as "teacher" | "admin")} className="min-h-11 rounded-xl border px-3" aria-label="Rôle"><option value="teacher">Professeur</option><option value="admin">Administrateur</option></select><button className="rounded-xl bg-[#155ad7] px-4 font-semibold text-white">Créer</button></form>
    {credentials && <div className="mb-5 rounded-xl border-2 border-[#155ad7] bg-[#edf4ff] p-4" role="status"><p className="font-bold">À transmettre maintenant</p><p>Identifiant : <code className="font-bold">{credentials.username}</code></p><p>Mot de passe temporaire : <code className="font-bold">{credentials.password}</code></p></div>}
    <p className="mb-4 min-h-6 text-sm font-semibold text-[#155ad7]" aria-live="polite">{message}</p>
    <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-sm text-slate-600"><tr><th className="p-4">Utilisateur</th><th className="p-4">Identifiant</th><th className="p-4">Rôle</th></tr></thead><tbody>{rows.map(row => <tr key={row.userId} className="border-t"><td className="p-4 font-semibold">{row.displayName}{row.userId === currentUserId ? " · toi" : ""}</td><td className="p-4 text-slate-600">{row.username ?? row.email}</td><td className="p-4"><select className="rounded-xl border px-3 py-2" value={row.role} disabled={row.userId === currentUserId} onChange={event => void changeRole(row.userId, event.target.value as UserRole)} aria-label={`Rôle de ${row.displayName}`}><option value="student">Étudiant</option><option value="teacher">Professeur</option><option value="admin">Administrateur</option></select></td></tr>)}</tbody></table></div>
  </>;
}
