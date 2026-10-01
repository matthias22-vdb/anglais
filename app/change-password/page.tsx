import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/session-auth";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.authType !== "local") redirect("/");
  return <main className="grid min-h-screen place-items-center bg-[#f3f6fb] px-5 py-10 text-[#132c4a]"><section className="w-full max-w-md rounded-3xl border border-[#dce5f0] bg-white p-7 shadow-sm"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#132c4a] text-2xl font-bold text-white">E</div><p className="mt-5 text-sm font-bold uppercase tracking-wider text-[#155ad7]">Première connexion</p><h1 className="mt-1 text-3xl font-bold">Choisis ton mot de passe</h1><p className="mt-2 text-slate-600">Le mot de passe temporaire ne sera plus utilisable après cette étape.</p><ChangePasswordForm /></section></main>;
}
