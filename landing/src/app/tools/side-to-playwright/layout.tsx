import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Selenium IDE (.side) to Playwright & Python Converter | FlowMacro",
  description:
    "Convert legacy Selenium IDE .side project files into modern Playwright (TypeScript/Python), Python Selenium, and Puppeteer code instantly. 100% free and client-side.",
  keywords: [
    "Selenium IDE to Playwright",
    "convert side to playwright",
    "selenium ide converter",
    "open side file in chrome",
    "side to python selenium",
    "playwright code generator",
    "FlowMacro tools"
  ],
  alternates: {
    canonical: "https://flowmacro.vercel.app/tools/side-to-playwright",
  },
  openGraph: {
    title: "Free Selenium IDE (.side) to Playwright & Python Converter",
    description:
      "Instant in-browser converter for legacy Selenium IDE .side test suites. Zero data leaves your browser.",
    url: "https://flowmacro.vercel.app/tools/side-to-playwright",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
