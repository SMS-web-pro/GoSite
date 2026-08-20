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
    <div className="flex min-h-screen">
      <SidebarWrapper />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
