export default function Home() {
  return <main className="grid min-h-screen place-items-center bg-[#f3f6fb] px-5 py-8 text-[#132c4a]">
    <div className="w-full max-w-xl">
      <header className="flex items-center gap-3 text-lg font-extrabold tracking-wide"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#132c4a] text-xl text-white">E</span>ENGLISH POCKET EXAM</header>
      <section className="mt-8 rounded-3xl border border-[#dce5f0] bg-white p-6 shadow-sm sm:p-9">
        <h1 className="text-2xl font-bold sm:text-3xl">Que veux-tu faire ?</h1>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <form action="/api/demo/enter" method="post"><input type="hidden" name="role" value="student"/><button type="submit" className="h-full w-full rounded-2xl bg-[#155ad7] p-6 text-left text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><strong className="block text-xl">Entraînement</strong><span className="mt-2 block text-base text-blue-50">Faire mes exercices</span></button></form>
          <form action="/api/demo/enter" method="post"><input type="hidden" name="role" value="teacher"/><button type="submit" className="h-full w-full rounded-2xl border border-[#c9d5e4] bg-[#f8fbff] p-6 text-left text-[#132c4a] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><strong className="block text-xl">Statistiques</strong><span className="mt-2 block text-base text-slate-600">Voir les classes et les élèves</span></button></form>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">Mode test : chaque navigateur garde son propre espace. Sans compte, les données ne suivent pas automatiquement sur un autre appareil.</p>
      </section>
      <footer className="mt-6 text-sm leading-relaxed text-slate-600">Entraînement non officiel au test TOEIC®. TOEIC® est une marque déposée d’ETS. Cette application n’est ni approuvée ni agréée par ETS.</footer>
    </div>
  </main>;
}
