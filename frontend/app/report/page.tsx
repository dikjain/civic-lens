"use client";
import { useEffect, useState } from "react";
import { api, Complaint, getSession } from "@/lib/api";
import dynamic from "next/dynamic";
import { Cat, Priority } from "@/components/Badges";
import { useT } from "@/lib/i18n";
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
  const [res, setRes] = useState<Complaint | null>(null);

  useEffect(() => { if (!getSession()) window.location.href = "/login"; }, []);

  function locate() {
    navigator.geolocation?.getCurrentPosition(p => { setLat(p.coords.latitude.toFixed(5)); setLng(p.coords.longitude.toFixed(5)); },
      () => setErr("Could not get your location; enter it manually."));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title); fd.append("description", desc); fd.append("lat", lat); fd.append("lng", lng);
      fd.append("image", file!);
      setRes(await api("/complaints", { method: "POST", form: fd }));
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  if (res) return (
    <div className="card">
      <h1>{t("submitted")}</h1>
      <p>{t("yourRef")}: <b style={{ fontSize: 22 }}>{res.ref}</b></p>
      <p>{t("aiDetected")}: <b><Cat c={res.category} /></b> ({Math.round(res.confidence * 100)}% {t("confidence")}) · {t("priority")}: <Priority p={res.priority} />
        {res.needs_review && <> <span className="badge review">{t("review")}</span></>}</p>
      {res.duplicate_of && <p className="banner card">{t("dup")} <b>{res.duplicate_of}</b></p>}
      <p className="muted">{res.priority_reasons.split(" | ").join(" • ")}</p>
      <a className="btn" href={`/track?ref=${res.ref}`}>{t("trackThis")}</a>
    </div>
  );
  return (
    <form className="card" onSubmit={submit}>
      <h1>{t("reportTitle")}</h1>
      <label>{t("photo")}</label>
      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required onChange={e => setFile(e.target.files?.[0] || null)} />
      {file && <p><img className="photo" src={URL.createObjectURL(file)} alt="preview" /></p>}
      <label>{t("title")}</label><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Deep pothole near market" />
      <label>{t("desc")}</label><textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Anything that helps (is it near a school? dangerous?)" />
      <div className="row">
        <div><label>{t("lat")}</label><input value={lat} onChange={e => setLat(e.target.value)} /></div>
        <div><label>{t("lng")}</label><input value={lng} onChange={e => setLng(e.target.value)} /></div>
      </div>
      <p><button type="button" className="secondary" onClick={locate}>{t("useLoc")}</button></p>
      <LeafletMap center={[+lat || 28.6139, +lng || 77.209]} pin={[+lat || 28.6139, +lng || 77.209]} onPick={(a, b) => { setLat(String(a)); setLng(String(b)); }} />
      <p className="muted">{t("mapHint")}</p>
      {err && <div className="err">{err}</div>}
      <p><button disabled={busy || !file}>{busy ? t("analysing") : t("submit")}</button></p>
    </form>
  );
}
