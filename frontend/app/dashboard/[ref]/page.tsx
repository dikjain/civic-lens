"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, Complaint, getSession, STATUS_LABEL, CAT_LABEL } from "@/lib/api";
import Detail from "@/components/Detail";

type Dept = { id: number; name: string };

export default function Review() {
  const { ref } = useParams<{ ref: string }>();
  const [c, setC] = useState<Complaint | null>(null);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [f, setF] = useState({ status: "", category: "", priority: "", department_id: "", comment: "" });
  const [msg, setMsg] = useState("");

  async function load() {
    const x = await api<Complaint>(`/complaints/${ref}`);
    setC(x); setF({ status: x.status, category: x.category, priority: x.priority, department_id: "", comment: "" });
  }
  useEffect(() => {
    const s = getSession();
    if (!s || s.role === "citizen") { window.location.href = "/login"; return; }
    load().catch(e => setMsg(e.message));
    api<Dept[]>("/departments").then(setDepts);
  }, []);

  async function save() {
    try {
      const body: any = { status: f.status, category: f.category, priority: f.priority, comment: f.comment };
      if (f.department_id) body.department_id = +f.department_id;
      await api(`/complaints/${c!.id}`, { method: "PATCH", json: body });
      setMsg("Saved"); await load();
    } catch (e: any) { setMsg(e.message); }
  }
  if (!c) return <p>{msg || "Loading…"}</p>;
  const sel = (k: keyof typeof f, m: Record<string, string>) => (
    <select value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}>{Object.entries(m).map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select>
  );
  return (
    <>
      <Detail c={c} onUpdated={setC} />
      <div className="card">
        <h2>Review &amp; act</h2>
        {c.needs_review && <p className="muted">The AI was not confident. Please confirm or correct the category.</p>}
        <div className="row">
          <div><label>Category</label>{sel("category", CAT_LABEL)}</div>
          <div><label>Priority</label>{sel("priority", { high: "High", medium: "Medium", low: "Low" })}</div>
          <div><label>Status</label>{sel("status", STATUS_LABEL)}</div>
          <div><label>Assign department</label>
            <select value={f.department_id} onChange={e => setF({ ...f, department_id: e.target.value })}>
              <option value="">(no change)</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
        </div>
        <label>Comment (visible in timeline)</label><input value={f.comment} onChange={e => setF({ ...f, comment: e.target.value })} />
        <p><button onClick={save}>Save changes</button> <span className="muted">{msg}</span></p>
      </div>
    </>
  );
}
