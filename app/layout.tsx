import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "One Day — Make someday a date",
  description: "Plan financial independence around the life and place you want.",
  applicationName: "One Day",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "One Day", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#f4f1e8", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}

