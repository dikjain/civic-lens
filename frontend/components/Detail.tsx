"use client";
import { Complaint, imageSrc } from "@/lib/api";
import { Cat, Priority, Status } from "@/components/Badges";
import { useT } from "@/lib/i18n";

export default function Detail({ c }: { c: Complaint }) {
  const { t } = useT();
  return (
    <div className="card">
      <h1>{c.title} <span className="muted">{c.ref}</span></h1>
      <div className="row">
        <div>{imageSrc(c) && <img className="photo" src={imageSrc(c)} alt="issue" />}</div>
        <div>
          <p><Status s={c.status} /> <Priority p={c.priority} /> {c.needs_review && <span className="badge review">needs review</span>} {c.duplicate_of && <span className="badge">duplicate of {c.duplicate_of}</span>}</p>
          <p>{t("aiDetected")}: <b><Cat c={c.category} /></b> ({Math.round(c.confidence * 100)}%)</p>
          {c.department && <p>Department: <b>{c.department}</b></p>}
          <p className="muted">{c.description || "No description"}</p>
          <p className="muted">Why this priority: {c.priority_reasons.split(" | ").join(" • ")}</p>
          {c.lat != null && <p className="muted">Location: {c.lat?.toFixed(5)}, {c.lng?.toFixed(5)}</p>}
        </div>
      </div>
      <h2 style={{ marginTop: 16 }}>{t("timeline")}</h2>
      <div className="timeline">
        {c.history.map((h, i) => (
          <div key={i}><b>{h.status.replace("_", " ")}</b> <span className="muted">{new Date(h.updated_at).toLocaleString()}</span><br />{h.comment}</div>
        ))}
      </div>
    </div>
  );
}
