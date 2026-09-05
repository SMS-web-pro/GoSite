"use client";

import React from "react";

type Tone = "slate" | "blue" | "green" | "orange" | "violet" | "emerald" | "amber" | "lime";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: string;
  tone?: Tone;
  subtitle?: string;
  breakdown?: { label: string; value: string | number }[];
}

const toneStyles: Record<Tone, { color: string; iconBg: string }> = {
  slate:  { color: "#67766a", iconBg: "rgba(103,118,106,.15)" },
  blue:   { color: "#4ade80", iconBg: "rgba(74,222,128,.12)" },
  green:  { color: "#4ade80", iconBg: "rgba(74,222,128,.12)" },
  orange: { color: "#d9ff4d", iconBg: "rgba(217,255,77,.12)" },
  violet: { color: "#a78bfa", iconBg: "rgba(167,139,250,.12)" },
  emerald:{ color: "#4ade80", iconBg: "rgba(74,222,128,.12)" },
  amber:  { color: "#fbbf24", iconBg: "rgba(251,191,36,.12)" },
  lime:   { color: "#d9ff4d", iconBg: "rgba(217,255,77,.12)" },
};

export function KPICard({ label, value, icon, tone = "slate", subtitle, breakdown }: KPICardProps) {
  const t = toneStyles[tone];
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-5 transition-all duration-300"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: t.color }} />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#67766a]">{label}</p>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[14px] text-lg"
          style={{ background: t.iconBg }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[32px] font-extrabold text-[#e8efe8] leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      {subtitle && <p className="mt-1.5 text-xs text-[#67766a]">{subtitle}</p>}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {breakdown.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-2 py-0.5 text-[11px] font-semibold" style={{ color: t.color }}>
              <span className="text-[#67766a]">{b.label}</span>
              <span>{b.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
