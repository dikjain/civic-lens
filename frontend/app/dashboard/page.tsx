"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, Complaint, getSession, STATUS_LABEL, CAT_LABEL } from "@/lib/api";
import { Cat, Priority, Status, SlaBadge } from "@/components/Badges";

export default function Dashboard() {
  const router = useRouter();
  const [rows, setRows] = useState<Complaint[]>([]);
  const [f, setF] = useState({ status: "", category: "", priority: "", review: false, q: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role === "citizen") {
      window.location.href = "/login";
      return;
    }
    const p = new URLSearchParams();
    if (f.status) p.set("status", f.status);
    if (f.category) p.set("category", f.category);
    if (f.priority) p.set("priority", f.priority);
    if (f.review) p.set("needs_review", "true");
    if (f.q) p.set("q", f.q);

    setLoading(true);
    api<Complaint[]>(`/complaints?${p}`)
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [f]);

  const opts = (m: Record<string, string>) =>
    Object.entries(m).map(([k, v]) => (
      <option key={k} value={k}>
        {v}
      </option>
    ));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0" }}>Municipal Triage Queue</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Review AI predictions, assign departmental crews, and manage municipal resolution SLAs.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="badge" style={{ fontSize: 12.5, padding: "4px 10px" }}>
            <b>{rows.length}</b> complaints in view
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          padding: 14,
          background: "var(--surface-subtle)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--line)",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          placeholder="Search ref or title"
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.target.value })}
          style={{ flex: "2 1 180px", minWidth: 150 }}
        />
        <select
          value={f.status}
          onChange={(e) => setF({ ...f, status: e.target.value })}
          style={{ flex: "1 1 120px", minWidth: 110 }}
        >
          <option value="">All statuses</option>
          {opts(STATUS_LABEL)}
        </select>
        <select
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
          style={{ flex: "1 1 120px", minWidth: 110 }}
        >
          <option value="">All categories</option>
          {opts(CAT_LABEL)}
        </select>
        <select
          value={f.priority}
          onChange={(e) => setF({ ...f, priority: e.target.value })}
          style={{ flex: "1 1 110px", minWidth: 100 }}
        >
          <option value="">All priorities</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>

        <label
          style={{
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
            margin: 0,
            cursor: "pointer",
            userSelect: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <input
            style={{ width: "auto", cursor: "pointer", margin: 0 }}
            type="checkbox"
            checked={f.review}
            onChange={(e) => setF({ ...f, review: e.target.checked })}
          />
          Needs review
        </label>
      </div>

      {err && <div className="err">{err}</div>}

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Title</th>
              <th>AI category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA / Escalation</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="click" onClick={() => router.push(`/dashboard/${c.ref}`)}>
                <td style={{ fontWeight: 600, color: "var(--brand)" }}>{c.ref}</td>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.title}
                </td>
                <td>
                  <Cat c={c.category} />
                </td>
                <td>
                  <Priority p={c.priority} />
                </td>
                <td>
                  <Status s={c.status} />
                </td>
                <td>
                  <SlaBadge status={c.sla_status} text={c.sla_text} />
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{Math.round(c.confidence * 100)}%</span>{" "}
                  {c.needs_review && <span className="badge review">review</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length && !loading && (
        <div style={{ textAlign: "center", padding: "36px 16px" }}>
          <p className="muted" style={{ margin: "0 0 10px 0" }}>
            No complaints match the selected filter criteria.
          </p>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12.5 }}
            onClick={() => setF({ status: "", category: "", priority: "", review: false, q: "" })}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
