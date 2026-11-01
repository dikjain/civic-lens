"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Complaint, getSession } from "@/lib/api";
import { Cat, Priority, Status, SlaBadge } from "@/components/Badges";
import { useT } from "@/lib/i18n";
import Verify from "@/components/Verify";

export default function My() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useT();

  useEffect(() => {
    if (!getSession()) {
      window.location.href = "/login";
      return;
    }
    api<Complaint[]>("/complaints/mine")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <Verify />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0" }}>{t("mine")}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Track resolution progress and audit history for all civic defects you have reported.
          </p>
        </div>
        <Link href="/report" className="btn" style={{ fontSize: 13, padding: "8px 16px" }}>
          + {t("reportBtn")}
        </Link>
      </div>

      {err && <div className="err" style={{ marginBottom: 14 }}>{err}</div>}

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>{t("ref")}</th>
              <th>{t("title")}</th>
              <th>{t("category")}</th>
              <th>{t("status")}</th>
              <th>SLA Target</th>
              <th>{t("priority")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>
                  <Link href={`/track?ref=${c.ref}`} style={{ color: "var(--brand)" }}>
                    {c.ref}
                  </Link>
                </td>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.title}
                </td>
                <td>
                  <Cat c={c.category} />
                </td>
                <td>
                  <Status s={c.status} />
                </td>
                <td>
                  <SlaBadge status={c.sla_status} text={c.sla_text} />
                </td>
                <td>
                  <Priority p={c.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length && !loading && (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <p className="muted" style={{ fontSize: 14, margin: "0 0 12px 0" }}>
            {t("noneYet")}
          </p>
          <Link href="/report" className="btn">
            {t("reportBtn")}
          </Link>
        </div>
      )}
    </div>
  );
}
