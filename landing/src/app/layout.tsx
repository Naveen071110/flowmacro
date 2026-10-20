import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { Analytics } from "@vercel/analytics/react";

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://flowmacro.vercel.app"),
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
  alternates: {
    canonical: "https://flowmacro.vercel.app",
  },
  verification: {
    google: "google47e1a93ad265b624",
  },
  openGraph: {
    title: "FlowMacro — Record Web Actions. Mask Passwords. Replay in Seconds.",
    description:
      "Developer-first browser automation with dedicated controller window, zero password leakage, and instant multi-framework code generation.",
    url: "https://flowmacro.vercel.app",
    siteName: "FlowMacro",
    type: "website",
    images: [
      {
        url: "/flowmacro_store_icon_128x128.png",
        width: 128,
        height: 128,
        alt: "FlowMacro Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowMacro — Zero-Trust Browser Automation & Selenium IDE",
    description:
      "Record web actions, mask passwords with local AES-256 encryption, replay in isolated tabs, and export clean Playwright & Selenium scripts.",
    images: ["/flowmacro_store_icon_128x128.png"],
  },
  icons: {
    icon: "/flowmacro_store_icon_128x128.png",
    shortcut: "/favicon.ico",
    apple: "/flowmacro_store_icon_128x128.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://flowmacro.vercel.app/#software",
      name: "FlowMacro",
      url: "https://flowmacro.vercel.app",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Google Chrome, Chromium, Brave, Microsoft Edge",
      description:
        "Zero-trust browser automation and Selenium IDE alternative. Record multi-page workflows, securely mask credentials with local AES-256-GCM encryption, and export clean Playwright, Puppeteer & Selenium code.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: "Naveen Guru",
        url: "https://github.com/Naveen071110",
      },
      sameAs: [
        "https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc",
        "https://github.com/Naveen071110/flowmacro",
        "https://www.producthunt.com/products/flowmacro",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://flowmacro.vercel.app/#website",
      url: "https://flowmacro.vercel.app",
      name: "FlowMacro",
      description: "Official website and documentation for FlowMacro Web Automation",
      publisher: {
        "@type": "Person",
        name: "Naveen Guru",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0b0f17] text-slate-200 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <PostHogProvider>{children}</PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
