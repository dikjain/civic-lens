"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function Home() {
  const { t } = useT();
  return (
    <>
      <div className="hero">
        <h1>{t("heroTitle")}</h1>
        <p className="muted">{t("heroSub")}</p>
        <p><Link className="btn" href="/report">{t("reportBtn")}</Link> <Link className="btn" style={{ background: "#fff", color: "#0f766e", border: "1px solid #0f766e" }} href="/track">{t("trackBtn")}</Link></p>
      </div>
      <div className="grid">
        <div className="card"><h2>{t("step1")}</h2><p className="muted">{t("step1d")}</p></div>
        <div className="card"><h2>{t("step2")}</h2><p className="muted">{t("step2d")}</p></div>
        <div className="card"><h2>{t("step3")}</h2><p className="muted">{t("step3d")}</p></div>
      </div>
      <div className="card muted">Demo logins: citizen@demo.com / citizen123 · officer@demo.com / officer123 · admin@demo.com / admin123</div>
    </>
  );
}
