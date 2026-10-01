import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/session-auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ espace?: string }> }) {
  const user = await getCurrentUser();
  if (user?.mustChangePassword) redirect("/change-password");
  if (user) redirect("/");
  const space = (await searchParams).espace === "professeur" ? "professeur" : "élève";
  return <main className="grid min-h-screen place-items-center bg-[#f3f6fb] px-5 py-10 text-[#132c4a]">
    <section className="w-full max-w-md rounded-3xl border border-[#dce5f0] bg-white p-7 shadow-sm">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#132c4a] text-2xl font-bold text-white">E</div>
      <p className="mt-5 text-sm font-bold uppercase tracking-wider text-[#155ad7]">English Pocket Exam</p>
      <h1 className="mt-1 text-3xl font-bold">Connexion {space}</h1>
      <p className="mt-2 text-slate-600">{space === "professeur" ? "Utilisez les identifiants de votre compte professeur." : "Utilise l’identifiant et le mot de passe remis par ton professeur."}</p>
      <LoginForm />
      <a href="/" className="mt-5 inline-block text-sm font-semibold text-[#155ad7] underline underline-offset-4">← Accueil</a>
      <div className="mt-6 border-t pt-5 text-center"><a href="/signin-with-chatgpt?return_to=%2F" target="_top" className="text-sm font-semibold text-slate-500 underline underline-offset-4">Accès administrateur actuel</a></div>
    </section>
  </main>;
}
