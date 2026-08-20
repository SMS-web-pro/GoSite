"use client";

import React from "react";

type Tone = "slate" | "blue" | "green" | "orange" | "violet" | "emerald" | "amber";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: string;
  tone?: Tone;
  subtitle?: string;
  breakdown?: { label: string; value: string | number }[];
}

const toneStyles: Record<Tone, { color: string; bg: string; iconBg: string }> = {
  slate:  { color: "#64748B", bg: "#F8FAFC", iconBg: "#F1F5F9" },
  blue:   { color: "#2563EB", bg: "#F8FAFC", iconBg: "rgba(37,99,235,.1)" },
  green:  { color: "#10B981", bg: "#F8FAFC", iconBg: "rgba(16,185,129,.1)" },
  orange: { color: "#E8622A", bg: "#F8FAFC", iconBg: "rgba(232,98,42,.1)" },
  violet: { color: "#7C3AED", bg: "#F8FAFC", iconBg: "rgba(124,58,237,.1)" },
  emerald:{ color: "#10B981", bg: "#F8FAFC", iconBg: "rgba(16,185,129,.1)" },
  amber:  { color: "#F59E0B", bg: "#F8FAFC", iconBg: "rgba(245,158,11,.1)" },
};

export function KPICard({ label, value, icon, tone = "slate", subtitle, breakdown }: KPICardProps) {
  const t = toneStyles[tone];
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-all duration-300"
      style={{ boxShadow: "0 2px 7px rgba(0,0,0,.04)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: t.color }} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[14px] text-lg"
          style={{ background: t.iconBg }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[32px] font-extrabold text-[#0F172A] leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      {subtitle && <p className="mt-1.5 text-xs text-[#64748B]">{subtitle}</p>}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {breakdown.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-semibold" style={{ color: t.color }}>
              <span className="text-[#94A3B8]">{b.label}</span>
              <span>{b.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
