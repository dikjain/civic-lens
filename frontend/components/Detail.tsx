"use client";
import { useState } from "react";
import { api, Complaint, getSession, imageSrc } from "@/lib/api";
import { Cat, Priority, Status, SlaBadge } from "@/components/Badges";
import { useT } from "@/lib/i18n";

function FeedbackForm({ c, onUpdated }: { c: Complaint; onUpdated?: (updated: Complaint) => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleAction(reopen: boolean) {
    setLoading(true);
    setErr("");
    try {
      const updated = await api<Complaint>(`/complaints/${encodeURIComponent(c.ref)}/feedback`, {
        method: "POST",
        json: { rating, comment, reopen },
      });
      if (onUpdated) onUpdated(updated);
    } catch (e: any) {
      setErr(e.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 6px 0", fontSize: "0.98rem", color: "#1e293b" }}>Rate Issue Resolution</h3>
      <p className="muted" style={{ fontSize: "0.85rem", margin: "0 0 10px 0" }}>
        Has this civic issue been physically resolved to your satisfaction?
      </p>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            style={{
              background: "none",
              border: "none",
              padding: "0 4px",
              cursor: "pointer",
              fontSize: "1.6rem",
              color: s <= rating ? "#f59e0b" : "#cbd5e1",
              lineHeight: 1,
            }}
            title={`${s} star${s > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
        <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: 6 }}>({rating}/5 stars)</span>
      </div>
      <input
        placeholder="Add feedback comment (e.g., Well repaired / Still bumpy)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      {err && <div className="err" style={{ marginBottom: 8 }}>{err}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" disabled={loading} onClick={() => handleAction(false)}>
          {loading ? "Submitting…" : "Submit Feedback"}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={loading}
          onClick={() => handleAction(true)}
          style={{ color: "#b91c1c", borderColor: "#fca5a5", background: "#fef2f2" }}
        >
          Not Resolved? Reopen Issue
        </button>
      </div>
    </div>
  );
}

export default function Detail({ c, onUpdated }: { c: Complaint; onUpdated?: (updated: Complaint) => void }) {
  const { t } = useT();

  return (
    <div className="card">
      <h1>
        {c.title} <span className="muted">{c.ref}</span>
      </h1>
      <div className="row">
        <div>{imageSrc(c) && <img className="photo" src={imageSrc(c)} alt="issue" />}</div>
        <div style={{ flex: 2 }}>
          <p style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <Status s={c.status} />
            <Priority p={c.priority} />
            <SlaBadge status={c.sla_status} text={c.sla_text} />
            {c.needs_review && <span className="badge review">needs review</span>}
            {c.duplicate_of && <span className="badge">duplicate of {c.duplicate_of}</span>}
          </p>

          <p style={{ margin: "8px 0 4px 0" }}>
            {t("aiDetected")}: <b><Cat c={c.category} /></b> ({Math.round(c.confidence * 100)}%)
          </p>

          {/* Softmax Multi-Class Probability Bar */}
          {c.probabilities && (
            <div style={{ margin: "8px 0 12px 0", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                AI Softmax Multi-Class Distribution:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: "0.8rem" }}>
                {Object.entries(c.probabilities).map(([cat, prob]) => {
                  const pct = Math.round(prob * 100);
                  const isTop = cat === c.category;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontWeight: isTop ? 700 : 400, color: isTop ? "#0f766e" : "#64748b" }}>
                          <Cat c={cat} />
                        </span>
                        <span style={{ fontWeight: 600, color: isTop ? "#0f766e" : "#475569" }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, width: "100%", background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: isTop ? "#0f766e" : "#94a3b8", borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SLA Governance Details */}
          <div style={{ margin: "8px 0", padding: "8px 10px", background: "#f1f5f9", borderRadius: 6, fontSize: "0.83rem", color: "#334155" }}>
            <b>Municipal SLA Target:</b> {c.priority === "high" ? "24h (Urgent Arterial)" : c.priority === "medium" ? "48h (Standard Sector)" : "72h (Minor)"} • <b>Status:</b> {c.sla_text || "On track"}
            {c.sla_status === "overdue" && (
              <span style={{ color: "#b91c1c", fontWeight: 600, display: "block", marginTop: 2 }}>
                ⚠️ SLA Breached: Escalated to Executive Engineer &amp; Zonal Supervisor
              </span>
            )}
          </div>

          {c.department && (
            <p>
              Department: <b>{c.department}</b>
            </p>
          )}
          <p className="muted">{c.description || "No description"}</p>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            <b>Why this priority:</b> {c.priority_reasons ? c.priority_reasons.split(" | ").join(" • ") : "Standard triage"}
          </p>
          {c.lat != null && (
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              Location: {c.lat?.toFixed(5)}, {c.lng?.toFixed(5)}
            </p>
          )}
        </div>
      </div>

      {/* Citizen Feedback Widget */}
      {c.rating != null ? (
        <div style={{ marginTop: 16, padding: "12px 14px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 4px 0", color: "#065f46", fontSize: "0.95rem" }}>Citizen Resolution Feedback</h3>
          <div style={{ color: "#f59e0b", fontSize: "1.3rem", letterSpacing: 2 }}>
            {"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)} <span style={{ color: "#065f46", fontSize: "0.85rem", fontWeight: 600 }}>({c.rating}/5)</span>
          </div>
          {c.feedback && <p style={{ margin: "4px 0 0 0", color: "#047857", fontStyle: "italic", fontSize: "0.88rem" }}>"{c.feedback}"</p>}
        </div>
      ) : c.status === "resolved" ? (
        <FeedbackForm c={c} onUpdated={onUpdated} />
      ) : null}

      <h2 style={{ marginTop: 18 }}>{t("timeline")}</h2>
      <div className="timeline">
        {c.history.map((h, i) => (
          <div key={i}>
            <b>{h.status.replace("_", " ")}</b> <span className="muted">{new Date(h.updated_at).toLocaleString()}</span>
            <br />
            {h.comment}
          </div>
        ))}
      </div>
    </div>
  );
}
