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
    <div className="noise relative flex min-h-screen overflow-hidden" style={{ background: "#0a0d0b" }}>
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(74,222,128,.04) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <SidebarWrapper />
      <main className="relative z-10 flex-1 min-w-0">{children}</main>
    </div>
  );
}
