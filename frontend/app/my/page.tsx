"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Complaint, getSession } from "@/lib/api";
import { Cat, Priority, Status } from "@/components/Badges";
import { useT } from "@/lib/i18n";
import Verify from "@/components/Verify";

export default function My() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [err, setErr] = useState("");
  const { t } = useT();
  useEffect(() => {
    if (!getSession()) { window.location.href = "/login"; return; }
    api<Complaint[]>("/complaints/mine").then(setRows).catch(e => setErr(e.message));
  }, []);
  return (
    <div className="card">
      <Verify />
      <h1>{t("mine")}</h1>
      {err && <div className="err">{err}</div>}
      <table>
        <thead><tr><th>{t("ref")}</th><th>{t("title")}</th><th>{t("category")}</th><th>{t("status")}</th><th>{t("priority")}</th></tr></thead>
        <tbody>{rows.map(c => (
          <tr key={c.id}><td><Link href={`/track?ref=${c.ref}`}>{c.ref}</Link></td><td>{c.title}</td>
            <td><Cat c={c.category} /></td><td><Status s={c.status} /></td><td><Priority p={c.priority} /></td></tr>
        ))}</tbody>
      </table>
      {!rows.length && <p className="muted">{t("noneYet")} <Link href="/report">{t("reportBtn")}</Link></p>}
    </div>
  );
}
