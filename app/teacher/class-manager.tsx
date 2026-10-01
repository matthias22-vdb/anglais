"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, School } from "lucide-react";

export type TeacherClass = { classId: string; name: string; joinCode: string };

export function ClassManager({ initialClasses }: { initialClasses: TeacherClass[] }) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState("");

  async function createClass(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json() as { class?: TeacherClass; error?: string };
      if (!response.ok || !result.class) throw new Error(result.error ?? "Création impossible");
      setClasses((current) => [...current, result.class!]);
      setName("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible");
    } finally {
      setPending(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/student/index.html?classe=${encodeURIComponent(code)}`);
    } catch { setError("Copie automatique indisponible. Utilisez le code affiché dans le champ « Code de ma classe » après connexion à l’application élève."); return; }
    setCopied(code);
    window.setTimeout(() => setCopied(""), 1800);
  }

  return (
    <section className="mt-7 rounded-2xl border border-[#dce5f0] bg-white p-5 shadow-sm" aria-labelledby="classes-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 id="classes-title" className="text-xl font-bold">Mes classes</h2><p className="mt-1 text-sm text-slate-500">Créez une classe, puis partagez son lien d’accès aux élèves. Ils se connectent avec leur compte personnel puis confirment leur classe.</p></div>
        <form onSubmit={createClass} className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="class-name">Nom de la classe</label>
          <input id="class-name" value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-[#c9d5e4] px-4 text-base" placeholder="Exemple : BA3 Marketing" maxLength={60} required />
          <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#155ad7] px-5 font-semibold text-white disabled:opacity-60"><Plus className="h-4 w-4" aria-hidden="true"/>{pending ? "Création…" : "Créer la classe"}</button>
        </form>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      {classes.length === 0 ? <div className="mt-5 rounded-xl bg-[#f7f9fc] px-5 py-7 text-center"><School className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-2 font-semibold">Créez votre première classe</p></div> : <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{classes.map((item) => <article key={item.classId} className="rounded-xl border border-[#dce5f0] p-4"><p className="font-bold">{item.name}</p><p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Code de secours · après connexion élève</p><div className="mt-1 flex items-center justify-between gap-3"><code className="text-2xl font-bold tracking-[0.16em] text-[#155ad7]">{item.joinCode}</code><button type="button" onClick={() => copyCode(item.joinCode)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"><Copy className="h-4 w-4"/>{copied === item.joinCode ? "Copié" : "Copier le lien d’accès"}</button></div></article>)}</div>}
    </section>
  );
}
