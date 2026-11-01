"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function Home() {
  const { t } = useT();
  return (
    <>
      <div className="hero">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            background: "var(--brand-tint)",
            border: "1px solid var(--brand-border)",
            borderRadius: "var(--radius-full)",
            color: "var(--brand)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            marginBottom: 16,
            boxShadow: "var(--shadow-xs)",
          }}
        >
          🏛️ SMART CIVIC INFRASTRUCTURE • SDG 11 ALIGNED
        </div>

        <h1>{t("heroTitle")}</h1>
        <p className="muted">{t("heroSub")}</p>

        <p style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
          <Link className="btn" href="/report" style={{ padding: "12px 24px", fontSize: 15 }}>
            📸 {t("reportBtn")}
          </Link>
          <Link
            className="btn secondary"
            style={{ padding: "12px 24px", fontSize: 15 }}
            href="/track"
          >
            🔍 {t("trackBtn")}
          </Link>
        </p>

        {/* System Capability Metrics Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid var(--line)",
            textAlign: "left",
          }}
        >
          <div style={{ padding: "8px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>⚡ &lt; 100ms</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>AI Vision Triage (MobileNetV2)</div>
          </div>
          <div style={{ padding: "8px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>⏱️ 24h / 48h</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Deterministic SLA Escalation</div>
          </div>
          <div style={{ padding: "8px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>🔒 EXIF-Scrubbed</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Citizen Privacy Protection</div>
          </div>
          <div style={{ padding: "8px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>📍 ~100m Grid</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Spatial Hotspot Clustering</div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>📸</div>
          <h2 style={{ margin: "4px 0" }}>{t("step1")}</h2>
          <p className="muted" style={{ margin: 0 }}>{t("step1d")}</p>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>🧠</div>
          <h2 style={{ margin: "4px 0" }}>{t("step2")}</h2>
          <p className="muted" style={{ margin: 0 }}>{t("step2d")}</p>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>🛠️</div>
          <h2 style={{ margin: "4px 0" }}>{t("step3")}</h2>
          <p className="muted" style={{ margin: 0 }}>{t("step3d")}</p>
        </div>
      </div>

      {/* Demo Credentials Bar for Viva / Presentation */}
      <div
        className="card muted"
        style={{
          background: "#ffffff",
          border: "1px dashed var(--line-strong)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <b style={{ color: "var(--ink)", display: "block", marginBottom: 2 }}>🔑 Demo Evaluation Accounts:</b>
          <span>Demo logins: citizen@demo.com / citizen123 · officer@demo.com / officer123 · admin@demo.com / admin123</span>
        </div>
        <Link href="/login" className="btn secondary" style={{ fontSize: 12.5, padding: "6px 14px" }}>
          Go to Login →
        </Link>
      </div>
    </>
  );
}
