"use client";
import { useEffect, useState } from "react";
import { api, Complaint, getSession } from "@/lib/api";
import Detail from "@/components/Detail";
import { useT } from "@/lib/i18n";

export default function Track() {
  const { t } = useT();
  const [ref, setRef] = useState("");
  const [c, setC] = useState<Complaint | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function find(r: string) {
    if (!r.trim()) return;
    setErr("");
    setC(null);
    if (!getSession()) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    try {
      const res = await api<Complaint>(`/complaints/${encodeURIComponent(r.trim())}`);
      setC(res);
    } catch (e: any) {
      setErr(e.message || "Complaint reference not found");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) {
      setRef(r);
      find(r);
    }
  }, []);

  return (
    <>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          find(ref);
        }}
        style={{ maxWidth: 640, margin: "0 auto 24px" }}
      >
        <h1 style={{ margin: "0 0 6px 0" }}>{t("trackTitle")}</h1>
        <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 13 }}>
          Enter the tracking reference number provided when you submitted your complaint.
        </p>
        <div className="row" style={{ alignItems: "stretch" }}>
          <input
            placeholder="CL-2026-000001"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            style={{ flex: 3, fontSize: 15, fontWeight: 500 }}
          />
          <button type="submit" disabled={loading || !ref.trim()} style={{ minWidth: 100 }}>
            {loading ? "Searching…" : t("track")}
          </button>
        </div>
        {err && <div className="err">{err}</div>}
      </form>
      {c && <Detail c={c} onUpdated={setC} />}
    </>
  );
}
