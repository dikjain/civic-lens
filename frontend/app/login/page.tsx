"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, setSession } from "@/lib/api";

export default function Login() {
  const r = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const s = await api(mode === "login" ? "/auth/login" : "/auth/register", { method: "POST", json: f });
      setSession(s);
      window.location.href = s.role === "citizen" ? "/report" : "/dashboard";
    } catch (e: any) {
      setErr(e.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(email: string, pw: string) {
    setMode("login");
    setF({ name: "", email, password: pw });
    setErr("");
  }

  return (
    <div style={{ maxWidth: 440, margin: "24px auto" }}>
      <form className="card" onSubmit={submit} style={{ padding: 28, boxShadow: "var(--shadow-md)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brand-tint)", color: "var(--brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 8 }}>
            🏛️
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 22 }}>
            {mode === "login" ? "Login to CivicLens AI" : "Create Citizen Account"}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {mode === "login"
              ? "Access citizen reporting, tracking, or municipal authority queues"
              : "Register to submit issues and receive verified resolution updates"}
          </p>
        </div>

        {mode === "register" && (
          <>
            <label>Full Name *</label>
            <input
              required
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="e.g. Aditya Bansal"
            />
          </>
        )}

        <label>Email Address *</label>
        <input
          type="email"
          required
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          placeholder="citizen@demo.com"
        />

        <label>Password *</label>
        <input
          type="password"
          required
          minLength={6}
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          placeholder="••••••••"
        />

        {err && <div className="err">{err}</div>}

        <p style={{ marginTop: 20 }}>
          <button style={{ width: "100%", padding: "11px", fontSize: 14 }} disabled={busy}>
            {busy ? "Authenticating…" : mode === "login" ? "Login" : "Register"}
          </button>
        </p>

        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 13 }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === "login" ? "register" : "login");
              setErr("");
            }}
            style={{ fontWeight: 600 }}
          >
            {mode === "login" ? "New here? Create an account" : "Have an account? Login"}
          </a>
        </div>
      </form>

      {/* Quick Evaluation Logins */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          background: "var(--surface-subtle)",
          border: "1px dashed var(--line-strong)",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", letterSpacing: 0.5, display: "block", marginBottom: 10 }}>
          1-Click Demo Evaluation Profiles:
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12, padding: "5px 12px", flex: 1 }}
            onClick={() => fillDemo("citizen@demo.com", "citizen123")}
          >
            👤 Citizen
          </button>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12, padding: "5px 12px", flex: 1 }}
            onClick={() => fillDemo("officer@demo.com", "officer123")}
          >
            👮 Officer
          </button>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12, padding: "5px 12px", flex: 1 }}
            onClick={() => fillDemo("admin@demo.com", "admin123")}
          >
            ⚙️ Admin
          </button>
        </div>
      </div>
    </div>
  );
}
