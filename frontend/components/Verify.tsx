"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

// Email OTP verification. Delivery is SIMULATED: the demo backend returns the code so no email service is needed.
export default function Verify() {
  const { t } = useT();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [demo, setDemo] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { api("/me").then(m => setVerified(m.verified)).catch(() => {}); }, []);
  if (verified === null) return null;
  if (verified) return <p className="muted">✅ {t("verified")}</p>;
  return (
    <div className="card banner">
      <b>{t("verifyEmail")}</b>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="secondary" onClick={async () => { const r = await api("/auth/otp/request", { method: "POST" }); setDemo(r.demo_code); }}>{t("sendCode")}</button>
        <input placeholder={t("enterCode")} value={code} onChange={e => setCode(e.target.value)} />
        <button onClick={async () => { try { await api("/auth/otp/verify", { method: "POST", json: { code } }); setVerified(true); } catch (e: any) { setMsg(e.message); } }}>{t("verify")}</button>
      </div>
      {demo && <p className="muted">Demo mode: your code is <b data-testid="demo-otp">{demo}</b> (a real deployment would email it)</p>}
      {msg && <div className="err">{msg}</div>}
    </div>
  );
}
