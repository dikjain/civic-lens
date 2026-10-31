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
  const { t, lang } = useT();
  useEffect(() => {
    const u = getSession(); setS(u);
    if (u) api<N[]>("/notifications").then(setNotes).catch(() => {});
  }, []);
  const staff = s && (s.role === "authority" || s.role === "admin");
  const unread = notes.filter(n => !n.read).length;
  return (
    <nav>
      <Link href="/" className="brand">CivicLens AI</Link>
      {s && !staff && <><Link href="/report">{t("report")}</Link><Link href="/my">{t("mine")}</Link></>}
      {staff && <><Link href="/dashboard">{t("dashboard")}</Link><Link href="/analytics">{t("analytics")}</Link></>}
      {s?.role === "admin" && <Link href="/admin">Admin</Link>}
      <Link href="/track">{t("track")}</Link>
      <button className="secondary" style={{ padding: "4px 10px" }} aria-label="language" onClick={() => setLang(lang === "en" ? "hi" : "en")}>{lang === "en" ? "हिन्दी" : "English"}</button>
      {s && (
        <span style={{ position: "relative" }}>
          <a href="#" aria-label="notifications" onClick={e => { e.preventDefault(); setOpen(!open); }}>🔔{unread > 0 && <b className="dot">{unread}</b>}</a>
          {open && (
            <div className="pop card">
              <b>{t("notifications")}</b>
              {notes.length === 0 && <p className="muted">—</p>}
              {notes.slice(0, 8).map(n => (
                <p key={n.id} style={{ fontWeight: n.read ? 400 : 700, margin: "8px 0" }}>
                  {n.link ? <a href={n.link}>{n.message}</a> : n.message}
                </p>
              ))}
              <button className="secondary" onClick={async () => { await api("/notifications/read", { method: "POST" }); setNotes(notes.map(n => ({ ...n, read: true }))); }}>{t("markRead")}</button>
            </div>
          )}
        </span>
      )}
      {s ? <a href="/" onClick={() => setSession(null)}>{t("logout")} ({s.name})</a> : <Link href="/login">{t("login")}</Link>}
    </nav>
  );
}
