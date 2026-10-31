"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, getSession, CAT_LABEL, STATUS_LABEL } from "@/lib/api";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });
type Summary = {
  total: number; open: number; needs_review: number; avg_resolution_hours: number | null; ai_agreement_pct: number | null;
  by_category: Record<string, number>; by_status: Record<string, number>; by_priority: Record<string, number>; by_day: Record<string, number>;
};
type Spot = { lat: number; lng: number; count: number; categories: Record<string, number> };

function Bars({ data, labels }: { data: Record<string, number>; labels?: Record<string, string> }) {
  const max = Math.max(1, ...Object.values(data));
  return <>{Object.entries(data).map(([k, v]) => (
    <div className="bar" key={k}><span className="l">{labels?.[k] || k}</span><i style={{ width: `${(v / max) * 60}%` }} /><em>{v}</em></div>
  ))}</>;
}

export default function Analytics() {
  const [s, setS] = useState<Summary | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  useEffect(() => {
    const u = getSession();
    if (!u || u.role === "citizen") { window.location.href = "/login"; return; }
    api<Summary>("/analytics/summary").then(setS);
    api<Spot[]>("/analytics/hotspots").then(setSpots);
  }, []);
  if (!s) return <p>Loading…</p>;
  return (
    <>
      <h1>Analytics</h1>
      <div className="grid">
        <div className="card stat"><b>{s.total}</b>Total complaints</div>
        <div className="card stat"><b>{s.open}</b>Open</div>
        <div className="card stat"><b>{s.needs_review}</b>Need review</div>
        <div className="card stat"><b>{s.avg_resolution_hours ?? "–"}</b>Avg resolution (hrs)</div>
        <div className="card stat"><b>{s.ai_agreement_pct ?? "–"}%</b>AI agreed by humans</div>
      </div>
      <div className="row">
        <div className="card"><h2>By category</h2><Bars data={s.by_category} labels={CAT_LABEL} /></div>
        <div className="card"><h2>By status</h2><Bars data={s.by_status} labels={STATUS_LABEL} /></div>
        <div className="card"><h2>By priority</h2><Bars data={s.by_priority} /></div>
      </div>
      <div className="card"><h2>Complaints per day</h2><Bars data={s.by_day} /></div>
      <div className="card">
        <h2>Hotspot map</h2>
        {spots.length > 0 && <LeafletMap center={[spots[0].lat, spots[0].lng]} spots={spots} height={380} />}
        <p className="muted">Each circle is a ~100 m grid cell; size = number of reports.</p>
      </div>
    </>
  );
}
