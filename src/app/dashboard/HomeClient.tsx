"use client";

export default function HomeClient() {
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-[2px] w-6 rounded bg-[#2563EB]" />
        <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#2563EB]">Comment ça marche</span>
      </div>
      <h3 className="mb-6 text-xl font-extrabold text-[#0F172A]" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -0.5 }}>
        4 étapes pour démarrer
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Step n={1} icon="🔍" title="Cherchez" desc="Secteur + localisation" color="#2563EB" />
        <Step n={2} icon="🎯" title="Filtrez" desc="Ciblez les business sans site" color="#10B981" />
        <Step n={3} icon="🤖" title="Vibecodez" desc="Prompt + démo personnalisée" color="#7C3AED" />
        <Step n={4} icon="💰" title="Vendez" desc="Workflow WhatsApp complet" color="#E8622A" />
      </div>
    </section>
  );
}

function Step({ n, icon, title, desc, color }: { n: number; icon: string; title: string; desc: string; color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: "0 2px 7px rgba(0,0,0,.04)" }}>
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${color}1a` }}
      >
        {icon}
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
          style={{ background: color, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {n}
        </span>
        <p className="text-sm font-bold text-[#0F172A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-[#64748B]">{desc}</p>
    </div>
  );
}
