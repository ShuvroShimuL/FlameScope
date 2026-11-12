import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const head = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-head" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

const TITLE = `${BRAND.name} · ${BRAND.team}`;

export const metadata: Metadata = {
  title: { default: TITLE, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.team }],
  openGraph: { type: "website", siteName: BRAND.name, title: TITLE, description: BRAND.description },
  twitter: { card: "summary", title: TITLE, description: BRAND.description },
};

export const viewport: Viewport = { themeColor: "#070b14", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${head.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
