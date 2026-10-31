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

  async function find(r: string) {
    setErr(""); setC(null);
    if (!getSession()) { window.location.href = "/login"; return; }
    try { setC(await api(`/complaints/${encodeURIComponent(r.trim())}`)); } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) { setRef(r); find(r); }
  }, []);
  return (
    <>
      <form className="card" onSubmit={e => { e.preventDefault(); find(ref); }}>
        <h1>{t("trackTitle")}</h1>
        <div className="row"><input placeholder="CL-2026-000001" value={ref} onChange={e => setRef(e.target.value)} style={{ flex: 3 }} /><button>{t("track")}</button></div>
        {err && <div className="err">{err}</div>}
      </form>
      {c && <Detail c={c} />}
    </>
  );
}
