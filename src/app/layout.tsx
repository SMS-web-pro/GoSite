import type { Metadata } from "next";
import { Inter, Space_Grotesk, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const notoSansArabic = Noto_Sans_Arabic({ variable: "--font-noto-arabic", subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "GoSite Digital Agency — Web Development, Ads & AI Solutions",
  description:
    "GoSite is a performance-driven digital agency offering web development, paid advertising, SEO and AI chatbot solutions that generate real ROI.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${inter.className} ${spaceGrotesk.variable} ${notoSansArabic.variable}`} style={{ background: "#fff", color: "#0F172A", lineHeight: 1.6, overflowX: "hidden" }}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
