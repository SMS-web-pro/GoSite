import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baileys has dynamic requires that don't fit Next.js's static analysis.
  // Mark it as a server-only external so it's loaded from node_modules at runtime.
  serverExternalPackages: ["@whiskeysockets/baileys", "qrcode", "node-cron"],
  // Turso/WebSocket libs also need this in some versions
  experimental: {
    // allowBaileys dynamic modules
  },
  async rewrites() {
    return [
      {
        source: "/portfolio",
        destination: "/portfolio.html",
      },
    ];
  },
};

export default nextConfig;
