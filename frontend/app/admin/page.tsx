"use client";
import { useEffect, useState } from "react";
import { api, getSession, CAT_LABEL } from "@/lib/api";

type U = { id: number; name: string; email: string; role: string };
type D = { id: number; name: string; categories: string };

export default function Admin() {
  const [users, setUsers] = useState<U[]>([]);
  const [depts, setDepts] = useState<D[]>([]);
  const [cfg, setCfg] = useState<any>(null);
  const [nd, setNd] = useState({ name: "", categories: "pothole" });
  const [msg, setMsg] = useState("");

  async function load() {
    setUsers(await api("/admin/users")); setDepts(await api("/departments")); setCfg(await api("/admin/config"));
  }
  useEffect(() => {
    if (getSession()?.role !== "admin") { window.location.href = "/login"; return; }
    load().catch(e => setMsg(e.message));
  }, []);
  const run = async (fn: () => Promise<any>) => { try { setMsg(""); await fn(); await load(); } catch (e: any) { setMsg(e.message); } };

  return (
    <>
      <h1>Admin</h1>
      {msg && <div className="err">{msg}</div>}
      {cfg && <div className="card"><h2>System</h2><p className="muted">Model: <b>{cfg.model}</b> · Review threshold: <b>{cfg.confidence_threshold}</b> · Categories: {cfg.categories.join(", ")}</p></div>}
      <div className="card">
        <h2>Users</h2>
        <table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>
              <select value={u.role} onChange={e => run(() => api(`/admin/users/${u.id}`, { method: "PATCH", json: { role: e.target.value } }))}>
                <option>citizen</option><option>authority</option><option>admin</option></select></td></tr>
          ))}</tbody></table>
      </div>
      <div className="card">
        <h2>Departments</h2>
        <table><thead><tr><th>Name</th><th>Handles</th><th></th></tr></thead>
          <tbody>{depts.map(d => (
            <tr key={d.id}><td>{d.name}</td><td>{d.categories}</td>
              <td><button className="secondary" onClick={() => run(() => api(`/admin/departments/${d.id}`, { method: "DELETE" }))}>Delete</button></td></tr>
          ))}</tbody></table>
        <div className="row" style={{ marginTop: 12 }}>
          <input placeholder="New department name" value={nd.name} onChange={e => setNd({ ...nd, name: e.target.value })} />
          <select value={nd.categories} onChange={e => setNd({ ...nd, categories: e.target.value })}>
            {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <button onClick={() => run(() => api("/admin/departments", { method: "POST", json: nd }))}>Add</button>
        </div>
      </div>
    </>
  );
}
