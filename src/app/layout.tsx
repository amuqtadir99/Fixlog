import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { SetupRequired } from "@/components/layout/setup-required";
import { getAuthMode, missingConfig } from "@/lib/auth-mode";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "FixLog — When did I last fix this?", template: "%s · FixLog" },
  description:
    "FixLog keeps the service history of your home, car and belongings and tells you what needs maintenance next.",
  applicationName: "FixLog",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Render per request: the CSP nonce (set in proxy.ts) must be fresh each time.
  await connection();
  const missing = missingConfig();
  const page = (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {missing.length ? <SetupRequired missing={missing} /> : children}
      </body>
    </html>
  );
  if (getAuthMode() !== "clerk") return page;
  return (
    <ClerkProvider dynamic afterSignOutUrl="/">
      {page}
    </ClerkProvider>
  );
}
