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
  const [loading, setLoading] = useState(false);

  async function load() {
    const [u, d, c] = await Promise.all([
      api<U[]>("/admin/users"),
      api<D[]>("/departments"),
      api<any>("/admin/config"),
    ]);
    setUsers(u);
    setDepts(d);
    setCfg(c);
  }

  useEffect(() => {
    if (getSession()?.role !== "admin") {
      window.location.href = "/login";
      return;
    }
    load().catch((e) => setMsg(e.message));
  }, []);

  const run = async (fn: () => Promise<any>) => {
    try {
      setMsg("");
      setLoading(true);
      await fn();
      await load();
    } catch (e: any) {
      setMsg(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 4px 0" }}>System Administration &amp; Access Control</h1>
        <p className="muted" style={{ margin: 0 }}>
          Manage Role-Based Access Control (RBAC), departmental dispatch mappings, and ML model thresholds.
        </p>
      </div>

      {msg && <div className="err" style={{ marginBottom: 16 }}>{msg}</div>}

      {cfg && (
        <div className="card" style={{ borderLeft: "4px solid var(--brand)", background: "var(--brand-tint)" }}>
          <h2 style={{ margin: "0 0 8px 0", color: "var(--brand-hover)" }}>Active Model &amp; System Configuration</h2>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13.5 }}>
            <div>Active Engine: <b>{cfg.model}</b></div>
            <div>•</div>
            <div>Human Review Threshold: <b>{cfg.confidence_threshold} (60%)</b></div>
            <div>•</div>
            <div>Supported Classes: <b>{cfg.categories.join(", ")}</b></div>
          </div>
        </div>
      )}

      {/* Users RBAC */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Users &amp; Role Assignments</h2>
          <span className="badge">{users.length} active users</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role (RBAC)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "var(--ink-secondary)" }}>{u.email}</td>
                  <td style={{ width: 180 }}>
                    <select
                      value={u.role}
                      disabled={loading}
                      onChange={(e) =>
                        run(() => api(`/admin/users/${u.id}`, { method: "PATCH", json: { role: e.target.value } }))
                      }
                      style={{ padding: "6px 10px", fontSize: 13 }}
                    >
                      <option value="citizen">citizen</option>
                      <option value="authority">authority</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Departments */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Departments</h2>
          <span className="badge">{depts.length} registered departments</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Assigned Category Handles</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {depts.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>
                    {d.categories.split(",").map((c) => (
                      <span key={c} className="badge" style={{ marginRight: 6 }}>
                        {CAT_LABEL[c] || c}
                      </span>
                    ))}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="secondary"
                      disabled={loading}
                      style={{ fontSize: 12, padding: "4px 10px", color: "var(--red)" }}
                      onClick={() => run(() => api(`/admin/departments/${d.id}`, { method: "DELETE" }))}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <b style={{ display: "block", marginBottom: 8, fontSize: 13.5 }}>Add New Municipal Department</b>
          <div className="row" style={{ alignItems: "center" }}>
            <input
              placeholder="New department name (e.g., Electrical &amp; Lighting)"
              value={nd.name}
              onChange={(e) => setNd({ ...nd, name: e.target.value })}
              style={{ flex: 2 }}
            />
            <select
              value={nd.categories}
              onChange={(e) => setNd({ ...nd, categories: e.target.value })}
              style={{ flex: 1 }}
            >
              {Object.entries(CAT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading || !nd.name.trim()}
              onClick={() => run(() => api("/admin/departments", { method: "POST", json: nd }))}
              style={{ minWidth: 90 }}
            >
              Add Dept
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
