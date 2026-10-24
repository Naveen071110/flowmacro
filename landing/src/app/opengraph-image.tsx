import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FlowMacro — Zero-Trust Browser Automation & Selenium IDE";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0b0f17",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.12) 0%, transparent 50%)",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#f8fafc",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: "900",
                color: "#0b0f17",
              }}
            >
              FM
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", color: "#ffffff" }}>
                FlowMacro IDE
              </span>
              <span style={{ fontSize: "14px", color: "#10b981", fontWeight: "600", letterSpacing: "1.5px" }}>
                MANIFEST V3 BROWSER AUTOMATION
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "14px",
              color: "#34d399",
              fontWeight: "600",
            }}
          >
            <span>Chrome Web Store • 100% Client-Side</span>
          </div>
        </div>

        {/* Center Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1000px" }}>
          <h1
            style={{
              fontSize: "58px",
              fontWeight: "900",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              margin: 0,
              color: "#ffffff",
            }}
          >
            Record Web Actions.{" "}
            <span style={{ color: "#34d399" }}>Mask Passwords.</span> Replay in Seconds.
          </h1>
          <p
            style={{
              fontSize: "24px",
              lineHeight: 1.4,
              color: "#94a3b8",
              margin: 0,
              maxWidth: "920px",
            }}
          >
            The developer-first Manifest V3 alternative to Selenium IDE. Dedicated controller window,
            local AES-256 password vault, and zero-telemetry Playwright / Python exports.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "20px", borderTop: "1px solid #1e293b" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#1e293b",
                fontSize: "15px",
                color: "#e2e8f0",
                fontWeight: "600",
              }}
            >
              5-Tier Locator Waterfall
            </div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#1e293b",
                fontSize: "15px",
                color: "#e2e8f0",
                fontWeight: "600",
              }}
            >
              AES-256-GCM Vault
            </div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#1e293b",
                fontSize: "15px",
                color: "#e2e8f0",
                fontWeight: "600",
              }}
            >
              Playwright &amp; Puppeteer Export
            </div>
          </div>
          <div style={{ fontSize: "16px", color: "#64748b", fontWeight: "600" }}>
            flowmacro.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
