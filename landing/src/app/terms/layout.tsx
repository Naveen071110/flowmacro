import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions of Service | FlowMacro IDE",
  description:
    "Terms of service, usage guidelines, and client-side execution warranties for FlowMacro Web Automation & Selenium IDE Chrome Extension.",
  alternates: {
    canonical: "https://flowmacro.vercel.app/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
