"use client";

import Link from "next/link";

export default function HomeClient() {
  return (
    <section className="mt-10 grid gap-4 sm:grid-cols-4">
      <Step n={1} icon="🔍" title="Cherchez" desc="Secteur + localisation" />
      <Step n={2} icon="🎯" title="Filtrez" desc="Ciblez les business sans site" />
      <Step n={3} icon="🤖" title="Vibecodez" desc="Prompt + démo personnalisée" />
      <Step n={4} icon="💰" title="Vendez" desc="Workflow WhatsApp complet" />
    </section>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="mt-2 text-xs font-semibold text-slate-500">Étape {n}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}
