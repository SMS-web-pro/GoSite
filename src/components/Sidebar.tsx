"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <ChartIcon /> },
  { href: "/radar", label: "Radar", icon: <RadarIcon /> },
  { href: "/prospects", label: "Prospects", icon: <TargetIcon /> },
  { href: "/campaigns", label: "Campagnes", icon: <ClipboardIcon /> },
  { href: "/analytics", label: "Analytics", icon: <SearchIcon /> },
  { href: "/settings", label: "Paramètres", icon: <GearIcon /> },
];

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState<string | null>(null);
  const [waProfileName, setWaProfileName] = useState<string | null>(null);
  const [stats, setStats] = useState<{ prospects: number; campaigns: number } | null>(null);

  useEffect(() => {
    const fetchWhatsApp = () => {
      fetch("/api/whatsapp/session")
        .then((r) => r.json())
        .then((d) => {
          setWaConnected(d.connected === true || d.status === "connected");
          setWaPhone(d.phoneNumber || d.phone || null);
          setWaProfileName(d.profileName || null);
        })
        .catch(() => {
          setWaConnected(false);
          setWaPhone(null);
          setWaProfileName(null);
        });
    };

    const fetchStats = () => {
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d) => {
          setStats({
            prospects: d.prospects || 0,
            campaigns: d.campaigns || 0,
          });
        })
        .catch(() => setStats({ prospects: 0, campaigns: 0 }));
    };

    fetchWhatsApp();
    fetchStats();
    const waInterval = setInterval(fetchWhatsApp, 10000);
    const statsInterval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(waInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const width = collapsed ? "w-16" : "w-60";
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const sidebarContent = (
    <div className={`flex h-full flex-col ${width} transition-all duration-200`}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-[rgba(255,255,255,.08)] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8622A] text-white text-sm font-bold">
          ⚡
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-white whitespace-nowrap" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>GoSite</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMobileOpen(false)}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
              ${isActive(l.href)
                ? "bg-[rgba(232,98,42,.15)] text-[#E8622A]"
                : "text-[rgba(255,255,255,.7)] hover:bg-[rgba(255,255,255,.07)] hover:text-white"
              }`}
          >
            {isActive(l.href) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[#E8622A]" />
            )}
            <span className="shrink-0">{l.icon}</span>
            {!collapsed && <span>{l.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Stats */}
      {!collapsed && stats && (
        <div className="border-t border-[rgba(255,255,255,.08)] px-4 py-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,.4)]">Stats rapides</p>
          <div className="flex items-center justify-between text-xs text-[rgba(255,255,255,.7)]">
            <span>Prospects</span>
            <span className="font-semibold text-white">{stats.prospects}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[rgba(255,255,255,.7)]">
            <span>Campagnes</span>
            <span className="font-semibold text-white">{stats.campaigns}</span>
          </div>
        </div>
      )}

      {/* WhatsApp status */}
      <div className="border-t border-[rgba(255,255,255,.08)] px-4 py-3">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <span className={`h-2 w-2 rounded-full ${waConnected ? "bg-[#10B981]" : "bg-red-400"}`} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs text-[rgba(255,255,255,.6)]">
                WhatsApp {waConnected ? "connecté" : "déconnecté"}
              </span>
              {waConnected && waPhone && (
                <span className="text-[11px] text-[rgba(255,255,255,.4)]">+{waPhone}</span>
              )}
              {waConnected && waProfileName && (
                <span className="text-[11px] text-[rgba(255,255,255,.4)]">{waProfileName}</span>
              )}
              {!waConnected && (
                <Link href="/settings" className="text-[11px] text-[#E8622A] hover:underline mt-0.5">
                  → Reconnecter
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center border-t border-[rgba(255,255,255,.08)] py-3 text-[rgba(255,255,255,.4)] hover:text-white transition"
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A1628] shadow-md border border-[rgba(255,255,255,.1)] lg:hidden"
      >
        <HamburgerIcon />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-[#0A1628] shadow-2xl border-r border-[rgba(255,255,255,.08)]">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col bg-[#0A1628] border-r border-[rgba(255,255,255,.08)] ${width} transition-all duration-200`}>
        {sidebarContent}
      </aside>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}
function RadarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /><line x1="12" x2="12" y1="2" y2="4" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
