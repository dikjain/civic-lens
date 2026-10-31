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

  useEffect(() => {
    const s = getSession();
    if (!s || s.role === "citizen") { window.location.href = "/login"; return; }
    const p = new URLSearchParams();
    if (f.status) p.set("status", f.status);
    if (f.category) p.set("category", f.category);
    if (f.priority) p.set("priority", f.priority);
    if (f.review) p.set("needs_review", "true");
    if (f.q) p.set("q", f.q);
    api<Complaint[]>(`/complaints?${p}`).then(setRows).catch(e => setErr(e.message));
  }, [f]);

  const opts = (m: Record<string, string>) => Object.entries(m).map(([k, v]) => <option key={k} value={k}>{v}</option>);
  return (
    <div className="card">
      <h1>Complaint queue</h1>
      <div className="row">
        <input placeholder="Search ref or title" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
        <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="">All statuses</option>{opts(STATUS_LABEL)}</select>
        <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}><option value="">All categories</option>{opts(CAT_LABEL)}</select>
        <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}><option value="">All priorities</option><option>high</option><option>medium</option><option>low</option></select>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input style={{ width: "auto" }} type="checkbox" checked={f.review} onChange={e => setF({ ...f, review: e.target.checked })} />Needs review</label>
      </div>
      {err && <div className="err">{err}</div>}
      <table style={{ marginTop: 12 }}>
        <thead><tr><th>Ref</th><th>Title</th><th>AI category</th><th>Priority</th><th>Status</th><th>SLA / Escalation</th><th>Confidence</th></tr></thead>
        <tbody>{rows.map(c => (
          <tr key={c.id} className="click" onClick={() => router.push(`/dashboard/${c.ref}`)}>
            <td>{c.ref}</td><td>{c.title}</td><td><Cat c={c.category} /></td><td><Priority p={c.priority} /></td>
            <td><Status s={c.status} /></td><td><SlaBadge status={c.sla_status} text={c.sla_text} /></td><td>{Math.round(c.confidence * 100)}% {c.needs_review && <span className="badge review">review</span>}</td>
          </tr>
        ))}</tbody>
      </table>
      {!rows.length && <p className="muted">No complaints match.</p>}
    </div>
  );
}
