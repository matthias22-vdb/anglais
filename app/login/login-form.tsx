"use client";

import { useState } from "react";

function returnPath() {
  const value = new URLSearchParams(window.location.search).get("return_to");
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json() as { error?: string; mustChangePassword?: boolean; role?: string };
      if (!response.ok) throw new Error(result.error ?? "Connexion impossible.");
      const destination = returnPath() ?? (result.role === "admin" ? "/admin" : result.role === "teacher" ? "/teacher" : "/student/index.html");
      window.location.replace(result.mustChangePassword
        ? `/change-password?return_to=${encodeURIComponent(destination)}`
        : destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="mt-6 space-y-4">
    <div><label htmlFor="username" className="mb-1.5 block font-semibold">Identifiant</label><input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={event => setUsername(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#c9d5e4] px-4 text-base" required /></div>
    <div><label htmlFor="password" className="mb-1.5 block font-semibold">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#c9d5e4] px-4 text-base" required /></div>
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800" role="alert">{error}</p>}
    <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-[#155ad7] px-5 font-bold text-white disabled:opacity-60">{pending ? "Connexion…" : "Se connecter"}</button>
  </form>;
}
