"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getSession, setSession, Session } from "@/lib/api";
import { setLang, useT } from "@/lib/i18n";

type N = { id: number; message: string; link: string | null; read: boolean };

export default function Nav() {
  const [s, setS] = useState<Session | null>(null);
  const [notes, setNotes] = useState<N[]>([]);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, lang } = useT();

  useEffect(() => {
    const u = getSession();
    setS(u);
    if (u) api<N[]>("/notifications").then(setNotes).catch(() => {});
  }, []);

  const staff = s && (s.role === "authority" || s.role === "admin");
  const unread = notes.filter((n) => !n.read).length;

  return (
    <nav>
      <Link href="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v6" />
          <path d="M12 15v6" />
          <path d="M3 12h6" />
          <path d="M15 12h6" />
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.4" />
        </svg>
        <span>CivicLens AI</span>
      </Link>

      <button
        type="button"
        className="nav-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation"
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      <div className={`nav-links ${mobileMenuOpen ? "open" : ""}`} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        {s && !staff && (
          <>
            <Link href="/report" onClick={() => setMobileMenuOpen(false)}>
              {t("report")}
            </Link>
            <Link href="/my" onClick={() => setMobileMenuOpen(false)}>
              {t("mine")}
            </Link>
          </>
        )}
        {staff && (
          <>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              {t("dashboard")}
            </Link>
            <Link href="/analytics" onClick={() => setMobileMenuOpen(false)}>
              {t("analytics")}
            </Link>
          </>
        )}
        {s?.role === "admin" && (
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
            Admin
          </Link>
        )}
        <Link href="/track" onClick={() => setMobileMenuOpen(false)}>
          {t("track")}
        </Link>

        <button
          type="button"
          className="secondary"
          style={{ padding: "4px 11px" }}
          aria-label="language"
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
        >
          {lang === "en" ? "हिन्दी" : "English"}
        </button>

        {s && (
          <span style={{ position: "relative" }}>
            <a
              href="#"
              aria-label="notifications"
              onClick={(e) => {
                e.preventDefault();
                setOpen(!open);
              }}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              🔔{unread > 0 && <b className="dot">{unread}</b>}
            </a>
            {open && (
              <div className="pop card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
                  <b style={{ fontSize: 14 }}>{t("notifications")}</b>
                  {unread > 0 && <span className="badge review" style={{ fontSize: 11 }}>{unread} new</span>}
                </div>
                {notes.length === 0 && <p className="muted" style={{ margin: "16px 0", textAlign: "center" }}>— No notifications yet —</p>}
                {notes.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    style={{
                      fontWeight: n.read ? 400 : 600,
                      margin: "8px 0",
                      padding: "8px 10px",
                      background: n.read ? "transparent" : "var(--brand-tint)",
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    {n.link ? (
                      <a href={n.link} onClick={() => setOpen(false)}>
                        {n.message}
                      </a>
                    ) : (
                      n.message
                    )}
                  </div>
                ))}
                <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                  <button
                    type="button"
                    className="secondary"
                    style={{ width: "100%", fontSize: 12.5 }}
                    onClick={async () => {
                      await api("/notifications/read", { method: "POST" });
                      setNotes(notes.map((n) => ({ ...n, read: true })));
                    }}
                  >
                    {t("markRead")}
                  </button>
                </div>
              </div>
            )}
          </span>
        )}

        {s ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
            <span
              className="badge"
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                fontSize: 11,
                padding: "2px 8px",
              }}
            >
              {s.role}
            </span>
            <a href="/" onClick={() => setSession(null)} style={{ opacity: 0.9 }}>
              {t("logout")} ({s.name})
            </a>
          </div>
        ) : (
          <Link href="/login">{t("login")}</Link>
        )}
      </div>
    </nav>
  );
}
