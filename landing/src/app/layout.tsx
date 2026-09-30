import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "FlowMacro — Web Automation & Selenium IDE Engine",
  description:
    "Record web workflows, mask passwords with local AES-256 encryption, replay in isolated tabs, and export clean Playwright, Puppeteer, or Python Selenium scripts in seconds.",
  keywords: [
    "FlowMacro",
    "Chrome Extension",
    "Selenium IDE alternative",
    "Playwright code generator",
    "Puppeteer macro recorder",
    "Zero-trust credential recorder",
    "Browser automation",
    "Warp terminal aesthetic",
  ],
  authors: [{ name: "Naveen Guru" }],
  openGraph: {
    title: "FlowMacro — Record Web Actions. Mask Passwords. Replay in Seconds.",
    description:
      "Developer-first browser automation with dedicated controller window, zero password leakage, and instant multi-framework code generation.",
    siteName: "FlowMacro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowMacro — Zero-Trust Browser Automation & Selenium IDE",
    description:
      "Record web actions, mask passwords with local AES-256 encryption, replay in isolated tabs, and export clean Playwright & Selenium scripts.",
  },
  icons: {
    icon: "/flowmacro_store_icon_128x128.png",
    shortcut: "/favicon.ico",
    apple: "/flowmacro_store_icon_128x128.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#0b0f17] text-slate-200 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
