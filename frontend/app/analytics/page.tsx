"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, getSession, CAT_LABEL, STATUS_LABEL } from "@/lib/api";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

type Summary = {
  total: number;
  open: number;
  needs_review: number;
  avg_resolution_hours: number | null;
  ai_agreement_pct: number | null;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_day: Record<string, number>;
};

type Spot = { lat: number; lng: number; count: number; categories: Record<string, number> };

function MetricMeter({ data, labels }: { data: Record<string, number>; labels?: Record<string, string> }) {
  const total = Object.values(data).reduce((acc, curr) => acc + curr, 0);
  const max = Math.max(1, ...Object.values(data));

  return (
    <div style={{ marginTop: 8 }}>
      {Object.entries(data).map(([k, v]) => {
        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
        const widthPct = Math.round((v / max) * 100);
        return (
          <div className="bar" key={k} style={{ marginBottom: 12 }}>
            <span className="l" style={{ fontSize: 13, minWidth: 110 }}>
              {labels?.[k] || k.replace("_", " ")}
            </span>
            <div style={{ flex: 1, background: "var(--line)", height: 10, borderRadius: 5, overflow: "hidden" }}>
              <i style={{ width: `${widthPct}%`, height: "100%", display: "block" }} />
            </div>
            <em style={{ fontSize: 12.5, minWidth: 48, textAlign: "right", color: "var(--ink-secondary)" }}>
              {v} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({pct}%)</span>
            </em>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [s, setS] = useState<Summary | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    const u = getSession();
    if (!u || u.role === "citizen") {
      window.location.href = "/login";
      return;
    }
    api<Summary>("/analytics/summary").then(setS);
    api<Spot[]>("/analytics/hotspots").then(setSpots);
  }, []);

  if (!s)
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px" }}>
        <p className="muted">Loading municipal intelligence metrics…</p>
      </div>
    );

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 4px 0" }}>Civic Intelligence &amp; Urban Analytics</h1>
        <p className="muted" style={{ margin: 0 }}>
          Centralized municipal metrics tracking automated triage velocity, AI model alignment, and spatial defect hotspots.
        </p>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid" style={{ marginBottom: 20 }}>
        <div className="card stat" style={{ borderTop: "3px solid var(--brand)" }}>
          <b>{s.total}</b>
          <span className="muted" style={{ fontWeight: 600 }}>Total Complaints</span>
        </div>
        <div className="card stat" style={{ borderTop: "3px solid var(--amber)" }}>
          <b style={{ color: "var(--amber)" }}>{s.open}</b>
          <span className="muted" style={{ fontWeight: 600 }}>Active In-Queue</span>
        </div>
        <div className="card stat" style={{ borderTop: "3px solid var(--purple)" }}>
          <b style={{ color: "var(--purple)" }}>{s.needs_review}</b>
          <span className="muted" style={{ fontWeight: 600 }}>Human Review Queue</span>
        </div>
        <div className="card stat" style={{ borderTop: "3px solid var(--green)" }}>
          <b style={{ color: "var(--green)" }}>{s.avg_resolution_hours ?? "–"}</b>
          <span className="muted" style={{ fontWeight: 600 }}>Avg Resolution (hrs)</span>
        </div>
        <div className="card stat" style={{ borderTop: "3px solid #0284c7" }}>
          <b style={{ color: "#0284c7" }}>{s.ai_agreement_pct ?? "–"}%</b>
          <span className="muted" style={{ fontWeight: 600 }}>AI-Human Alignment</span>
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="row" style={{ marginBottom: 20 }}>
        <div className="card">
          <h2>By category</h2>
          <MetricMeter data={s.by_category} labels={CAT_LABEL} />
        </div>
        <div className="card">
          <h2>By status</h2>
          <MetricMeter data={s.by_status} labels={STATUS_LABEL} />
        </div>
        <div className="card">
          <h2>By priority</h2>
          <MetricMeter data={s.by_priority} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Complaints per day</h2>
        <MetricMeter data={s.by_day} />
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0 }}>Hotspot map</h2>
          <span className="badge" style={{ fontSize: 12 }}>
            📍 {spots.length} spatial cluster(s) detected
          </span>
        </div>
        {spots.length > 0 && <LeafletMap center={[spots[0].lat, spots[0].lng]} spots={spots} height={380} />}
        <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
          Spatial defect clustering: Each red circle indicates a ~100m geospatial grid cell where civic issues repeat. Circle radius correlates directly with defect frequency.
        </p>
      </div>
    </>
  );
}
