import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You for Choosing FlowMacro | Getting Started Guide",
  description:
    "Welcome to FlowMacro! Quick 3-step setup guide to pin the extension, launch the standalone controller IDE, and record your first automated workflow.",
  alternates: {
    canonical: "https://flowmacro.vercel.app/thank-you",
  },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
