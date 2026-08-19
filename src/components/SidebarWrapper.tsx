"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function SidebarWrapper() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed, mounted]);

  const width = collapsed ? 64 : 240;

  return (
    <>
      <div
        className="shrink-0 transition-all duration-200 hidden lg:block"
        style={{ width }}
      />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
    </>
  );
}
