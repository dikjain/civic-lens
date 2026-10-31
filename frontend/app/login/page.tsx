"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, setSession } from "@/lib/api";

export default function Login() {
  const r = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try {
      const s = await api(mode === "login" ? "/auth/login" : "/auth/register", { method: "POST", json: f });
      setSession(s);
      window.location.href = s.role === "citizen" ? "/report" : "/dashboard";
    } catch (e: any) { setErr(e.message); }
  }
  return (
    <form className="card" style={{ maxWidth: 420, margin: "0 auto" }} onSubmit={submit}>
      <h1>{mode === "login" ? "Login" : "Create account"}</h1>
      {mode === "register" && <><label>Name</label><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></>}
      <label>Email</label><input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
      <label>Password</label><input type="password" required minLength={6} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
      {err && <div className="err">{err}</div>}
      <p><button>{mode === "login" ? "Login" : "Register"}</button></p>
      <a href="#" onClick={e => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); }}>
        {mode === "login" ? "New here? Create an account" : "Have an account? Login"}
      </a>
    </form>
  );
}
