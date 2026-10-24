import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Zero-Trust Security Specs | FlowMacro",
  description:
    "FlowMacro's zero-backend privacy specifications, local AES-256-GCM encryption architecture, zero telemetry policy, and Chrome MV3 permission disclosures.",
  alternates: {
    canonical: "https://flowmacro.vercel.app/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
