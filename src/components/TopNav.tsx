"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Recherche", icon: "🔍" },
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
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sm text-white">
            ⚡
          </span>
          <span className="hidden sm:inline">Vibecoder Prospect</span>
        </Link>
        <div className="flex items-center gap-2 overflow-x-auto">
          {waStatus && (
            <Link
              href="/settings"
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                waStatus === "connected"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : waStatus === "pending"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
              title={waStatus === "connected" ? "WhatsApp connecté — envoyez vos messages" : waStatus === "pending" ? "En attente du scan QR" : "WhatsApp non connecté"}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  waStatus === "connected" ? "animate-ping bg-emerald-400" : waStatus === "pending" ? "animate-ping bg-amber-400" : "bg-slate-300"
                }`}></span>
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  waStatus === "connected" ? "bg-emerald-500" : waStatus === "pending" ? "bg-amber-500" : "bg-slate-400"
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
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
