import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowMacro Documentation — Classified Technical Guides & Troubleshooting",
  description:
    "Comprehensive, classified technical documentation for FlowMacro IDE. Explore guides on the 5-Tier Selector Waterfall, AES-256 Vault, multi-step auth troubleshooting, and Playwright/Selenium exporters.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
