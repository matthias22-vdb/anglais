"use client";

import { useState } from "react";

function returnPath() {
  const value = new URLSearchParams(window.location.search).get("return_to");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setError("Les deux mots de passe ne sont pas identiques."); return; }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ newPassword: password }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Modification impossible.");
      window.location.replace(returnPath());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Modification impossible.");
      setPending(false);
    }
  }
  return <form onSubmit={submit} className="mt-6 space-y-4">
    <div><label htmlFor="new-password" className="mb-1.5 block font-semibold">Nouveau mot de passe</label><input id="new-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#c9d5e4] px-4 text-base" required /><p className="mt-1 text-sm text-slate-500">Au moins 10 caractères. Choisis quelque chose que tu peux retenir.</p></div>
    <div><label htmlFor="confirm-password" className="mb-1.5 block font-semibold">Confirme le mot de passe</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#c9d5e4] px-4 text-base" required /></div>
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800" role="alert">{error}</p>}
    <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-[#155ad7] px-5 font-bold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer mon mot de passe"}</button>
  </form>;
}
