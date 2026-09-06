"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";

const PUBLIC_PATHS = ["/", "/portfolio"];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isLanding) {
      document.body.setAttribute("data-public", "");
    } else {
      document.body.removeAttribute("data-public");
    }
    return () => document.body.removeAttribute("data-public");
  }, [isLanding]);

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Dot grid background — matches RADAR */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(74,222,128,.045) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Noise texture — matches RADAR */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          pointerEvents: "none",
          opacity: 0.045,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative flex min-h-screen">
        <SidebarWrapper />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  );
}
