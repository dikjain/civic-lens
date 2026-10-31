import { createRequire } from "module";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
const require = createRequire(path.join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = require("playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.join(HERE, "leak.png");
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on("pageerror", e => errs.push("pageerror: " + e.message));
p.on("console", m => m.type() === "error" && !m.text().includes("openstreetmap") && errs.push("console: " + m.text()));
const step = async (n, f) => { try { await f(); console.log("OK  ", n); } catch (e) { console.log("FAIL", n, "-", e.message.split("\n")[0]); } };
const login = async (email, pw) => {
  await p.goto("http://localhost:3000/login");
  await p.fill('input[type=email]', email); await p.fill('input[type=password]', pw);
  await p.click("form button"); await p.waitForTimeout(1500);
};
let ref;
await step("citizen login -> /report", async () => { await login("citizen@demo.com", "citizen123"); if (!p.url().includes("/report")) throw new Error(p.url()); });
await step("submit complaint", async () => {
  await p.setInputFiles("input[type=file]", IMG);
  await p.fill('input[placeholder^="e.g."]', "Leaking pipe near school");
  await p.fill("textarea", "burst pipe near school");
  await p.click('button:has-text("Submit")');
  await p.waitForSelector("text=Complaint submitted", { timeout: 10000 });
  ref = (await p.locator("b").filter({ hasText: /^CL-/ }).first().textContent()).trim();
  console.log("     ref", ref);
});
await step("track page shows complaint + image", async () => {
  await p.goto(`http://localhost:3000/track?ref=${ref}`); await p.waitForSelector(`text=Timeline`, { timeout: 8000 });
  await p.waitForFunction(() => { const i = document.querySelector("img.photo"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 });
});
await step("my complaints lists it", async () => { await p.goto("http://localhost:3000/my"); await p.waitForSelector(`text=${ref}`); });
await step("officer queue", async () => { await p.evaluate(() => localStorage.clear()); await login("officer@demo.com", "officer123"); await p.waitForSelector("tr.click", { timeout: 20000 }); });
await step("officer review + assign", async () => {
  await p.fill('input[placeholder="Search ref or title"]', ref); await p.waitForFunction((r) => document.querySelectorAll("tr.click").length === 1 && document.querySelector("tr.click").textContent.includes(r), ref, { timeout: 20000 });
  await p.click("tr.click"); await p.waitForSelector("text=Review & act");
  await p.selectOption("select >> nth=3", { label: "Water Supply" });
  await p.fill('label:has-text("Comment") + input', "Crew dispatched");
  await p.click('button:has-text("Save changes")'); await p.waitForSelector("text=Saved"); await p.waitForSelector("text=Crew dispatched");
});
await step("analytics renders", async () => { await p.goto("http://localhost:3000/analytics"); await p.waitForSelector("text=Hotspot map"); await p.waitForSelector(".leaflet-interactive", { timeout: 10000 }); });
await step("citizen sees update", async () => {
  await p.evaluate(() => localStorage.clear()); await login("citizen@demo.com", "citizen123");
  await p.goto(`http://localhost:3000/track?ref=${ref}`); await p.waitForSelector("text=Crew dispatched");
});
await step("citizen blocked from dashboard", async () => { await p.goto("http://localhost:3000/dashboard"); await p.waitForTimeout(1500); if (!p.url().includes("/login")) throw new Error(p.url()); });
await step("admin page", async () => {
  await p.evaluate(() => localStorage.clear()); await login("admin@demo.com", "admin123");
  await p.goto("http://localhost:3000/admin"); await p.waitForSelector("text=Departments");
  await p.screenshot({ path: path.join(HERE, "../../docs/screenshot-admin.png") });
});
await step("register new user", async () => {
  await p.evaluate(() => localStorage.clear()); await p.goto("http://localhost:3000/login");
  await p.click("text=Create an account"); await p.fill("input >> nth=0", "New User");
  await p.fill("input[type=email]", `u${Date.now()}@x.com`); await p.fill("input[type=password]", "secret1"); await p.click("form button");
  await p.waitForTimeout(1500); if (!p.url().includes("/report")) throw new Error(p.url());
});
await step("UI rejects non-image upload", async () => {
  await p.evaluate(() => localStorage.clear()); await login("citizen@demo.com", "citizen123");
  await p.setInputFiles("input[type=file]", { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await p.fill('input[placeholder^="e.g."]', "bad file"); await p.click('button:has-text("Submit")');
  await p.waitForSelector(".err", { timeout: 8000 });
});
await step("unknown reference shows error", async () => {
  await p.goto("http://localhost:3000/track?ref=CL-0000-000000"); await p.waitForSelector(".err", { timeout: 8000 });
});
await step("wrong password rejected", async () => {
  await p.evaluate(() => localStorage.clear()); await p.goto("http://localhost:3000/login");
  await p.fill("input[type=email]", "citizen@demo.com"); await p.fill("input[type=password]", "wrongpass"); await p.click("form button");
  await p.waitForSelector(".err", { timeout: 8000 });
});
await step("officer filters: high priority only", async () => {
  await p.evaluate(() => localStorage.clear()); await login("officer@demo.com", "officer123");
  await p.waitForSelector("tr.click"); await p.selectOption("select >> nth=2", "high");
  await p.waitForFunction(() => { const r = document.querySelectorAll("tr.click"); return r.length > 0 && [...r].every(x => x.querySelector(".badge.high")); }, null, { timeout: 20000 });
  const badges = await p.locator("tr.click .badge.high").count(); const rows = await p.locator("tr.click").count();
  if (!rows || badges !== rows) throw new Error(`rows=${rows} high=${badges}`);
});
await step("needs-review filter", async () => {
  await p.check('input[type=checkbox]');
  await p.waitForFunction(() => { const r = document.querySelectorAll("tr.click"); return r.length > 0 && [...r].every(x => x.querySelector(".badge.review")); }, null, { timeout: 20000 });
  const n = await p.locator("tr.click .badge.review").count(); const rows = await p.locator("tr.click").count();
  if (!rows || n !== rows) throw new Error(`rows=${rows} review=${n}`);
});
await step("real model classifies a real pothole photo", async () => {
  await p.evaluate(() => localStorage.clear()); await login("citizen@demo.com", "citizen123");
  await p.setInputFiles("input[type=file]", path.join(HERE, "pothole.jpg"));
  await p.fill('input[placeholder^="e.g."]', "Pothole on main road");
  await p.click('button:has-text("Submit")'); await p.waitForSelector("text=Complaint submitted", { timeout: 20000 });
  const txt = await p.locator("p", { hasText: "AI detected" }).first().textContent();
  console.log("     ", txt.trim());
  if (!/Pothole/i.test(txt)) throw new Error("expected Pothole, got: " + txt);
});
await step("duplicate detection flags same photo + same spot", async () => {
  for (let i = 0; i < 2; i++) {
    await p.goto("http://localhost:3000/report");
    await p.setInputFiles("input[type=file]", path.join(HERE, "garbage.jpg"));
    await p.fill('input[placeholder^="e.g."]', "Garbage dup test");
    await p.fill('label:has-text("Latitude") + input', "19.07600"); await p.fill('label:has-text("Longitude") + input', "72.87700");
    await p.click('button:has-text("Submit")'); await p.waitForSelector("text=Complaint submitted", { timeout: 20000 });
  }
  await p.waitForSelector("text=Possible duplicate of", { timeout: 5000 });
});
await step("leaflet map renders on report page", async () => {
  await p.goto("http://localhost:3000/report"); await p.waitForSelector(".leaflet-container", { timeout: 8000 });
  await p.click(".leaflet-container", { position: { x: 60, y: 60 } }); await p.waitForTimeout(500);
  const lat = await p.inputValue('label:has-text("Latitude") + input'); if (lat === "28.6139") throw new Error("pin did not move");
});
await step("notification bell shows updates", async () => {
  await p.goto("http://localhost:3000/my"); await p.waitForSelector("[aria-label=notifications] .dot", { timeout: 8000 });
  await p.click("[aria-label=notifications]"); await p.waitForSelector("text=received");
});
await step("email OTP verification (simulated)", async () => {
  await p.evaluate(() => localStorage.clear()); await p.goto("http://localhost:3000/login");
  await p.click("text=Create an account"); await p.fill("input >> nth=0", "Otp User");
  await p.fill("input[type=email]", `otp${Date.now()}@x.com`); await p.fill("input[type=password]", "secret1"); await p.click("form button");
  await p.waitForURL("**/report"); await p.goto("http://localhost:3000/my"); await p.waitForSelector("text=Verify your email");
  await p.click('button:has-text("Send code")'); const code = await p.locator("[data-testid=demo-otp]").textContent();
  await p.fill('input[placeholder="Enter 6-digit code"]', "000000"); await p.click('button:has-text("Verify")'); await p.waitForSelector(".err");
  await p.fill('input[placeholder="Enter 6-digit code"]', code); await p.click('button:has-text("Verify")'); await p.waitForSelector("text=Email verified");
});
await step("Hindi toggle translates UI and persists", async () => {
  await p.goto("http://localhost:3000/"); await p.click("[aria-label=language]");
  await p.waitForSelector("text=नागरिकों की आवाज़ से स्वच्छ शहर तक"); await p.reload();
  await p.waitForSelector("text=नागरिकों की आवाज़ से स्वच्छ शहर तक"); await p.click("[aria-label=language]");
  await p.waitForSelector("text=From citizen voices to cleaner cities");
});
await step("officer hotspot leaflet map", async () => {
  await p.evaluate(() => localStorage.clear()); await login("officer@demo.com", "officer123");
  await p.goto("http://localhost:3000/analytics"); await p.waitForSelector(".leaflet-container"); await p.waitForSelector(".leaflet-interactive");
});
await step("logout clears session", async () => {
  await p.click("text=/Logout/"); await p.waitForTimeout(1000);
  if (await p.evaluate(() => localStorage.getItem("cl_session"))) throw new Error("session still set");
});
console.log(errs.length ? "JS errors:\n" + errs.join("\n") : "no JS errors");
await b.close();
