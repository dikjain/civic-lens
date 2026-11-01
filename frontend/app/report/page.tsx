"use client";
import { useEffect, useState } from "react";
import { api, Complaint, getSession } from "@/lib/api";
import dynamic from "next/dynamic";
import { Cat, Priority, SlaBadge } from "@/components/Badges";
import { useT } from "@/lib/i18n";
import Link from "next/link";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

export default function Report() {
  const { t } = useT();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [lat, setLat] = useState("28.6139");
  const [lng, setLng] = useState("77.2090");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [res, setRes] = useState<Complaint | null>(null);

  useEffect(() => {
    if (!getSession()) window.location.href = "/login";
  }, []);

  function locate() {
    setLocating(true);
    setErr("");
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(5));
        setLng(p.coords.longitude.toFixed(5));
        setLocating(false);
      },
      () => {
        setErr("Could not retrieve GPS location automatically; please pin it on the map.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", desc);
      fd.append("lat", lat);
      fd.append("lng", lng);
      fd.append("image", file!);
      const result = await api<Complaint>("/complaints", { method: "POST", form: fd });
      setRes(result);
    } catch (e: any) {
      setErr(e.message || "Failed to submit report");
    } finally {
      setBusy(false);
    }
  }

  if (res)
    return (
      <div className="card" style={{ maxWidth: 680, margin: "0 auto", borderTop: "4px solid var(--brand)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--green-tint)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            ✓
          </div>
          <h1 style={{ margin: 0, fontSize: 22 }}>{t("submitted")}</h1>
        </div>

        <div style={{ padding: "14px 18px", background: "var(--surface-subtle)", borderRadius: "var(--radius-sm)", margin: "14px 0", border: "1px solid var(--line)" }}>
          <span className="muted" style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
            {t("yourRef")}
          </span>
          <b style={{ fontSize: 26, color: "var(--brand)", letterSpacing: "-0.5px" }}>{res.ref}</b>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", margin: "14px 0" }}>
          <span>{t("aiDetected")}: <b><Cat c={res.category} /></b> ({Math.round(res.confidence * 100)}% {t("confidence")})</span>
          <span>·</span>
          <span>{t("priority")}: <Priority p={res.priority} /></span>
          <SlaBadge status={res.sla_status} text={res.sla_text} />
          {res.needs_review && <span className="badge review">{t("review")}</span>}
        </div>

        {res.duplicate_of && (
          <div className="banner" style={{ margin: "14px 0" }}>
            ⚠️ {t("dup")} <b>{res.duplicate_of}</b> (Linked for unified municipal resolution)
          </div>
        )}

        <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, color: "var(--ink-secondary)", margin: "12px 0" }}>
          <b>Triage Justification:</b> {res.priority_reasons ? res.priority_reasons.split(" | ").join(" • ") : "Automated baseline"}
        </div>

        <p style={{ marginTop: 20 }}>
          <a className="btn" href={`/track?ref=${res.ref}`} style={{ padding: "10px 20px" }}>
            🔍 {t("trackThis")}
          </a>
        </p>
      </div>
    );

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 14, marginBottom: 18 }}>
        <h1 style={{ margin: "0 0 4px 0" }}>{t("reportTitle")}</h1>
        <p className="muted" style={{ margin: 0 }}>
          Upload a clear photograph of the defect. AI will classify the category and compute an explainable priority.
        </p>
      </div>

      {/* Photo Upload Zone */}
      <label>{t("photo")} *</label>
      <div
        style={{
          border: file ? "1px solid var(--line)" : "2px dashed var(--line-strong)",
          borderRadius: "var(--radius-md)",
          padding: file ? 12 : 24,
          textAlign: "center",
          background: file ? "#ffffff" : "var(--surface-subtle)",
          transition: "var(--transition)",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{
            position: file ? "static" : "absolute",
            inset: 0,
            opacity: file ? 1 : 0,
            width: file ? "100%" : "100%",
            height: file ? "auto" : "100%",
            cursor: "pointer",
            margin: 0,
          }}
        />
        {!file && (
          <div>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
            <b style={{ color: "var(--ink)", display: "block" }}>Click or drop photo here</b>
            <span className="muted" style={{ fontSize: 12 }}>Supports JPEG, PNG, WebP (Max 8 MB) · EXIF automatically removed</span>
          </div>
        )}
      </div>

      {file && (
        <div style={{ marginTop: 12 }}>
          <img className="photo" src={URL.createObjectURL(file)} alt="preview" style={{ maxHeight: 240 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
            <button
              type="button"
              className="secondary"
              style={{ fontSize: 12, padding: "3px 10px" }}
              onClick={() => setFile(null)}
            >
              Change Photo
            </button>
          </div>
        </div>
      )}

      {/* Complaint Title */}
      <label>{t("title")} *</label>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Deep pothole near market"
      />

      {/* Description */}
      <label>{t("desc")}</label>
      <textarea
        rows={3}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Anything that helps (is it near a school? dangerous?)"
      />

      {/* Geolocation Section */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-secondary)" }}>
            📍 INCIDENT GEOLOCATION
          </span>
          <button
            type="button"
            className="secondary"
            onClick={locate}
            disabled={locating}
            style={{ fontSize: 12, padding: "4px 12px" }}
          >
            {locating ? "Locating…" : `🎯 ${t("useLoc")}`}
          </button>
        </div>

        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            <label style={{ margin: "4px 0 2px" }}>{t("lat")}</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>
          <div>
            <label style={{ margin: "4px 0 2px" }}>{t("lng")}</label>
            <input value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
        </div>

        <LeafletMap
          center={[+lat || 28.6139, +lng || 77.209]}
          pin={[+lat || 28.6139, +lng || 77.209]}
          onPick={(a, b) => {
            setLat(String(a));
            setLng(String(b));
          }}
        />
        <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          {t("mapHint")}
        </p>
      </div>

      {err && <div className="err">{err}</div>}

      <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <button
          disabled={busy || !file}
          style={{ width: "100%", padding: "12px", fontSize: 15 }}
        >
          {busy ? (
            <span>⚡ {t("analysing")}</span>
          ) : (
            <span>🚀 {t("submit")}</span>
          )}
        </button>
      </div>
    </form>
  );
}
