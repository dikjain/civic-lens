export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Session = { token: string; role: string; name: string };
export type Complaint = {
  id: number; ref: string; title: string; description: string; lat: number | null; lng: number | null;
  category: string; confidence: number; needs_review: boolean; priority: string; priority_reasons: string;
  status: string; duplicate_of: string | null; created_at: string; image_url: string | null; department: string | null;
  rating?: number | null; feedback?: string | null; probabilities?: Record<string, number> | null;
  sla_hours?: number; sla_status?: "on_track" | "overdue" | "met" | "breached"; sla_text?: string;
  history: { status: string; comment: string; updated_at: string }[];
};

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("cl_session");
  return s ? JSON.parse(s) : null;
}
export function setSession(s: Session | null) {
  if (s) localStorage.setItem("cl_session", JSON.stringify(s));
  else localStorage.removeItem("cl_session");
}
export function imageSrc(c: Complaint) {
  const s = getSession();
  return c.image_url && s ? `${API}${c.image_url}?token=${s.token}` : "";
}

export async function api<T = any>(path: string, opts: { method?: string; json?: any; form?: FormData } = {}): Promise<T> {
  const s = getSession();
  const headers: Record<string, string> = {};
  if (s) headers.Authorization = `Bearer ${s.token}`;
  let body: BodyInit | undefined;
  if (opts.json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.json); }
  if (opts.form) body = opts.form;
  const r = await fetch(API + path, { method: opts.method || "GET", headers, body });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || `Request failed (${r.status})`);
  }
  return r.json();
}

export const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted", under_review: "Under review", assigned: "Assigned",
  in_progress: "In progress", resolved: "Resolved", rejected: "Rejected",
};
export const CAT_LABEL: Record<string, string> = {
  pothole: "Pothole", garbage: "Garbage", water_leak: "Water leak", other: "Other",
};
