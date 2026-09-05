"use client";

export default function HomeClient() {
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-[2px] w-6 rounded bg-[#4ade80]" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#4ade80]">Comment ça marche</span>
      </div>
      <h3 className="mb-6 text-xl font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -0.5 }}>
        3 étapes pour démarrer
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Step n={1} icon="📥" title="Importez" desc="CSV, contact, copier-coller" color="#4ade80" />
        <Step n={2} icon="🤖" title="Vibecodez" desc="Prompt + démo personnalisée" color="#a78bfa" />
        <Step n={3} icon="💰" title="Vendez" desc="Workflow WhatsApp complet" color="#d9ff4d" />
      </div>
    </section>
  );
}

function Step({ n, icon, title, desc, color }: { n: number; icon: string; title: string; desc: string; color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-5 transition-all duration-300 hover:-translate-y-1">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${color}1a` }}
      >
        {icon}
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold text-[#0a0d0b]"
          style={{ background: color, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {n}
        </span>
        <p className="text-sm font-bold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-[#67766a]">{desc}</p>
    </div>
  );
}
