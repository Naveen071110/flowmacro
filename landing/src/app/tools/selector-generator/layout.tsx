import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5-Tier Selector Waterfall & Test Flakiness Analyzer | FlowMacro",
  description:
    "Analyze HTML elements and generate the 5 most resilient locator tiers (TestID, ARIA, ID, CSS, XPath) with Playwright snippets and flakiness risk scoring. Free & 100% client-side.",
  keywords: [
    "5-tier selector waterfall",
    "playwright locator generator",
    "css selector generator",
    "xpath flakiness analyzer",
    "test automation selectors",
    "data-testid generator",
    "FlowMacro tools"
  ],
  alternates: {
    canonical: "https://flowmacro.vercel.app/tools/selector-generator",
  },
  openGraph: {
    title: "5-Tier Selector Waterfall & Flakiness Analyzer | FlowMacro",
    description:
      "Generate resilient element locators and evaluate flakiness risk for Playwright, Cypress, and Selenium.",
    url: "https://flowmacro.vercel.app/tools/selector-generator",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
