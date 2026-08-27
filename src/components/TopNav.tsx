"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "⚡" },
  { href: "/prospects", label: "Prospects", icon: "🎯" },
  { href: "/campaigns", label: "Campagnes", icon: "📋" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/settings", label: "Paramètres", icon: "⚙️" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [waStatus, setWaStatus] = useState<"disconnected" | "pending" | "connected" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/whatsapp/session");
        const data = await res.json();
        if (!cancelled) setWaStatus(data.status);
      } catch {}
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-[#0F172A]">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-sm text-white" style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}>
            ⚡
          </span>
          <span className="hidden sm:inline" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>GoSite</span>
        </Link>
        <div className="flex items-center gap-2 overflow-x-auto">
          {waStatus && (
            <Link
              href="/settings"
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                waStatus === "connected"
                  ? "border-[rgba(16,185,129,.3)] bg-[rgba(16,185,129,.1)] text-[#10B981]"
                  : waStatus === "pending"
                    ? "border-[rgba(245,158,11,.3)] bg-[rgba(245,158,11,.1)] text-[#F59E0B]"
                    : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
              }`}
              title={waStatus === "connected" ? "WhatsApp connecté — envoyez vos messages" : waStatus === "pending" ? "En attente du scan QR" : "WhatsApp non connecté"}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  waStatus === "connected" ? "animate-ping bg-[#10B981]" : waStatus === "pending" ? "animate-ping bg-[#F59E0B]" : "bg-[#94A3B8]"
                }`}></span>
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  waStatus === "connected" ? "bg-[#10B981]" : waStatus === "pending" ? "bg-[#F59E0B]" : "bg-[#94A3B8]"
                }`}></span>
              </span>
              <span>📱 {waStatus === "connected" ? "Connecté" : waStatus === "pending" ? "En attente" : "Déconnecté"}</span>
            </Link>
          )}
          {links.map((l) => {
            const isActive = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? "bg-[rgba(232,98,42,.1)] text-[#E8622A]" : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
              >
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
