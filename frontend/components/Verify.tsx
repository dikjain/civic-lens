"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function Verify() {
  const { t } = useT();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [demo, setDemo] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api("/me")
      .then((m) => setVerified(m.verified))
      .catch(() => {});
  }, []);

  if (verified === null) return null;
  if (verified)
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: "var(--green-tint)",
          border: "1px solid var(--green-border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--green)",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        ✅ {t("verified")}
      </div>
    );

  return (
    <div
      className="card banner"
      style={{
        marginBottom: 20,
        background: "#fffbeb",
        border: "1px solid #fde68a",
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <b style={{ color: "#92400e", fontSize: 14 }}>{t("verifyEmail")}</b>
      </div>
      <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 13, color: "#78350f" }}>
        Verify your email to receive real-time municipal SMS/Email alerts whenever field officers take action.
      </p>

      <div className="row" style={{ alignItems: "center", gap: 10 }}>
        <button
          type="button"
          className="secondary"
          onClick={async () => {
            setLoading(true);
            try {
              const r = await api("/auth/otp/request", { method: "POST" });
              setDemo(r.demo_code);
            } catch (e: any) {
              setMsg(e.message);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          style={{ whiteSpace: "nowrap" }}
        >
          {loading ? "Sending…" : t("sendCode")}
        </button>

        <input
          placeholder={t("enterCode")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ maxWidth: 200 }}
        />

        <button
          type="button"
          onClick={async () => {
            setMsg("");
            try {
              await api("/auth/otp/verify", { method: "POST", json: { code } });
              setVerified(true);
            } catch (e: any) {
              setMsg(e.message || "Invalid verification code");
            }
          }}
          disabled={!code.trim()}
        >
          {t("verify")}
        </button>
      </div>

      {demo && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef3c7", borderRadius: 6, fontSize: 12.5, color: "#92400e" }}>
          Demo mode: your code is <b data-testid="demo-otp" style={{ fontSize: 14, letterSpacing: 1, color: "#b45309" }}>{demo}</b> (simulated email delivery)
        </div>
      )}
      {msg && <div className="err" style={{ marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
