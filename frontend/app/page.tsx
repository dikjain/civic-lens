"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function Home() {
  const { t } = useT();
  const steps = [
    { title: t("step1"), body: t("step1d") },
    { title: t("step2"), body: t("step2d") },
    { title: t("step3"), body: t("step3d") },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-kicker">
          <span className="pulse" aria-hidden="true" />
          Smart civic infrastructure · SDG 11
        </div>

        <h1>{t("heroTitle")}</h1>
        <p className="muted">{t("heroSub")}</p>

        <div className="hero-actions">
          <Link className="btn" href="/report">
            {t("reportBtn")}
          </Link>
          <Link className="btn secondary" href="/track">
            {t("trackBtn")}
          </Link>
        </div>

        {/* Product preview: what an officer sees after a report is classified */}
        <div className="mock" aria-hidden="true">
          <div className="mock-bar">
            <i />
            <i />
            <i />
            <span>CivicLens · New report</span>
          </div>
          <div className="mock-body">
            <div className="mock-photo" />
            <div className="mock-info">
              <div>
                <div className="label">Category</div>
                <div className="value">Pothole · 94% confidence</div>
              </div>
              <div>
                <div className="label">Priority</div>
                <div className="value">
                  <span className="badge high">High</span>
                </div>
              </div>
              <div>
                <div className="label">Location</div>
                <div className="value">Near Main Road · 12 nearby reports</div>
              </div>
              <div>
                <div className="label">SLA</div>
                <div className="mock-meter">
                  <i />
                </div>
                <div className="muted" style={{ marginTop: 6 }}>Resolve within 24 hours</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="eyebrow">How it works</div>
          <h2>From photo to fixed, in three steps</h2>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{String(i + 1).padStart(2, "0")}</div>
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>See a problem in your street?</h2>
        <p>Report it in under a minute. You can track it at every step.</p>
        <Link className="btn" href="/report">
          {t("reportBtn")}
        </Link>
      </section>

      <div className="card demo-bar">
        <div>
          <b>Demo accounts</b>
          <span>citizen@demo.com / citizen123 · officer@demo.com / officer123 · admin@demo.com / admin123</span>
        </div>
        <Link href="/login" className="btn secondary" style={{ fontSize: 13, padding: "8px 16px" }}>
          Go to login
        </Link>
      </div>
    </>
  );
}
