"use client";

import React from "react";

type Tone = "slate" | "blue" | "violet" | "emerald" | "amber";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: string;
  tone?: Tone;
  subtitle?: string;
  breakdown?: { label: string; value: string | number }[];
}

const toneStyles: Record<Tone, { bg: string; icon: string; border: string }> = {
  slate: { bg: "from-slate-50 to-white", icon: "bg-slate-100 text-slate-600", border: "border-slate-200" },
  blue: { bg: "from-blue-50 to-white", icon: "bg-blue-100 text-blue-600", border: "border-blue-200" },
  violet: { bg: "from-violet-50 to-white", icon: "bg-violet-100 text-violet-600", border: "border-violet-200" },
  emerald: { bg: "from-emerald-50 to-white", icon: "bg-emerald-100 text-emerald-600", border: "border-emerald-200" },
  amber: { bg: "from-amber-50 to-white", icon: "bg-amber-100 text-amber-600", border: "border-amber-200" },
};

export function KPICard({ label, value, icon, tone = "slate", subtitle, breakdown }: KPICardProps) {
  const t = toneStyles[tone];
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${t.bg} ${t.border} p-5 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.icon} text-lg`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {breakdown.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-white/80 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              <span className="text-slate-400">{b.label}</span>
              <span className="text-slate-900">{b.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
