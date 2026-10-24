import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uninstall Feedback | FlowMacro IDE",
  description:
    "Help us improve FlowMacro. Share honest feedback or bug reports on web automation replay, selectors, or missing export formats directly with the developer.",
  alternates: {
    canonical: "https://flowmacro.vercel.app/uninstall-feedback",
  },
};

export default function UninstallFeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
