"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, Complaint, getSession, STATUS_LABEL, CAT_LABEL } from "@/lib/api";
import Detail from "@/components/Detail";
import Link from "next/link";

type Dept = { id: number; name: string };

export default function Review() {
  const { ref } = useParams<{ ref: string }>();
  const router = useRouter();
  const [c, setC] = useState<Complaint | null>(null);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [f, setF] = useState({ status: "", category: "", priority: "", department_id: "", comment: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const x = await api<Complaint>(`/complaints/${ref}`);
    setC(x);
    setF({ status: x.status, category: x.category, priority: x.priority, department_id: "", comment: "" });
  }

  useEffect(() => {
    const s = getSession();
    if (!s || s.role === "citizen") {
      window.location.href = "/login";
      return;
    }
    load().catch((e) => setMsg(e.message));
    api<Dept[]>("/departments").then(setDepts);
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const body: any = { status: f.status, category: f.category, priority: f.priority, comment: f.comment };
      if (f.department_id) body.department_id = +f.department_id;
      await api(`/complaints/${c!.id}`, { method: "PATCH", json: body });
      setMsg("Saved");
      await load();
    } catch (e: any) {
      setMsg(e.message || "Failed to update complaint");
    } finally {
      setSaving(false);
    }
  }

  if (!c)
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
        <p className="muted">{msg || "Loading complaint details…"}</p>
      </div>
    );

  const sel = (k: keyof typeof f, m: Record<string, string>) => (
    <select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
      {Object.entries(m).map(([a, b]) => (
        <option key={a} value={a}>
          {b}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href="/dashboard" className="btn secondary" style={{ fontSize: 13, padding: "6px 14px" }}>
          ← Back to Triage Queue
        </Link>
      </div>

      <Detail c={c} onUpdated={setC} />

      {/* Officer Action Console */}
      <div className="card" style={{ borderLeft: "4px solid var(--brand)", background: "#ffffff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Review &amp; act</h2>
          <button
            type="button"
            className="secondary"
            onClick={() => window.print()}
            style={{ fontSize: 12.5, padding: "5px 12px" }}
          >
            🖨️ Print Field Inspection Slip
          </button>
        </div>

        {c.needs_review && (
          <div className="banner" style={{ marginBottom: 14 }}>
            ⚠️ <b>Human Review Required:</b> The AI model confidence fell below the 0.60 operational threshold. Please confirm or correct the category before assigning.
          </div>
        )}

        <div className="row">
          <div>
            <label>Category</label>
            {sel("category", CAT_LABEL)}
          </div>
          <div>
            <label>Priority</label>
            {sel("priority", { high: "High", medium: "Medium", low: "Low" })}
          </div>
          <div>
            <label>Status</label>
            {sel("status", STATUS_LABEL)}
          </div>
          <div>
            <label>Assign department</label>
            <select value={f.department_id} onChange={(e) => setF({ ...f, department_id: e.target.value })}>
              <option value="">(no change)</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label>Comment</label>
        <input
          value={f.comment}
          onChange={(e) => setF({ ...f, comment: e.target.value })}
          placeholder="Add operational notes or dispatch instructions (visible in citizen timeline)"
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
          <button onClick={save} disabled={saving} style={{ padding: "10px 22px" }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {msg && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: msg.toLowerCase().includes("saved") ? "var(--green)" : "var(--red)",
              }}
            >
              {msg.toLowerCase().includes("saved") ? `✓ ${msg}` : msg}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
