import io
import os
import tempfile

os.environ.setdefault("DATABASE_URL", f"sqlite:///{tempfile.mkdtemp()}/test.db")
os.environ["MODEL_PATH"] = "/nonexistent"  # tests use the deterministic stub classifier
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp()

from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from app.main import app  # noqa: E402


def img(color):
    b = io.BytesIO()
    Image.new("RGB", (64, 64), color).save(b, "PNG")
    return b.getvalue()


def login(c, email, pw):
    r = c.post("/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_end_to_end():
    with TestClient(app) as c:
        assert c.get("/health").json()["ok"]
        cit = login(c, "citizen@demo.com", "citizen123")
        off = login(c, "officer@demo.com", "officer123")

        r = c.post("/complaints", headers=cit, data={"title": "Leak", "description": "burst pipe near school",
                   "lat": "28.61", "lng": "77.2"}, files={"image": ("a.png", img((60, 100, 200)), "image/png")})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["category"] == "water_leak" and j["priority"] == "high" and j["ref"].startswith("CL-")

        # image is stored in the DB and served back with a valid token
        tok = cit["Authorization"].split()[1]
        r = c.get(f"/complaints/{j['id']}/image", params={"token": tok})
        assert r.status_code == 200 and r.headers["content-type"] == "image/jpeg" and r.content[:2] == b"\xff\xd8"
        assert c.get(f"/complaints/{j['id']}/image", params={"token": "bad"}).status_code == 401

        # bad file rejected
        r = c.post("/complaints", headers=cit, data={"title": "x"}, files={"image": ("a.txt", b"hi", "text/plain")})
        assert r.status_code == 400

        # citizen can't use staff routes
        assert c.get("/complaints", headers=cit).status_code == 403
        assert c.get("/analytics/summary", headers=cit).status_code == 403

        # officer triage
        q = c.get("/complaints", headers=off).json()
        assert len(q) >= 25
        depts = c.get("/departments", headers=off).json()
        r = c.patch(f"/complaints/{j['id']}", headers=off, json={"department_id": depts[2]["id"], "comment": "on it"})
        assert r.json()["status"] == "assigned" and r.json()["department"] == "Water Supply"

        # citizen sees update, history recorded
        t = c.get(f"/complaints/{j['ref']}", headers=cit).json()
        assert t["status"] == "assigned" and len(t["history"]) == 2

        s = c.get("/analytics/summary", headers=off).json()
        assert s["total"] >= 25 and "water_leak" in s["by_category"]
        assert len(c.get("/analytics/hotspots", headers=off).json()) > 0


def test_admin():
    with TestClient(app) as c:
        adm = login(c, "admin@demo.com", "admin123")
        off = login(c, "officer@demo.com", "officer123")
        assert c.get("/admin/users", headers=off).status_code == 403
        users = c.get("/admin/users", headers=adm).json()
        assert len(users) >= 3
        r = c.post("/admin/departments", headers=adm, json={"name": "Parks", "categories": "other"})
        assert r.status_code == 200
        assert c.post("/admin/departments", headers=adm, json={"name": "Parks"}).status_code == 409
        assert c.delete(f"/admin/departments/{r.json()['id']}", headers=adm).status_code == 200
        me = next(u for u in users if u["email"] == "admin@demo.com")
        assert c.patch(f"/admin/users/{me['id']}", headers=adm, json={"role": "citizen"}).status_code == 400


def test_duplicates_notifications_otp():
    with TestClient(app) as c:
        cit = login(c, "citizen@demo.com", "citizen123")
        off = login(c, "officer@demo.com", "officer123")
        data = {"title": "Leak", "description": "", "lat": "10.5000", "lng": "20.5000"}
        a = c.post("/complaints", headers=cit, data=data, files={"image": ("a.png", img((60, 100, 200)), "image/png")}).json()
        assert a["duplicate_of"] is None
        b = c.post("/complaints", headers=cit, data=data, files={"image": ("a.png", img((60, 100, 200)), "image/png")}).json()
        assert b["duplicate_of"] == a["ref"] and "duplicate" in b["priority_reasons"].lower()
        far = {**data, "lat": "11.9", "lng": "21.9"}
        d = c.post("/complaints", headers=cit, data=far, files={"image": ("a.png", img((60, 100, 200)), "image/png")}).json()
        assert d["duplicate_of"] is None

        c.patch(f"/complaints/{a['id']}", headers=off, json={"status": "in_progress", "comment": "fixing"})
        notes = c.get("/notifications", headers=cit).json()
        assert any("in progress" in n["message"] for n in notes) and any("received" in n["message"] for n in notes)
        c.post("/notifications/read", headers=cit)
        assert all(n["read"] for n in c.get("/notifications", headers=cit).json())

        assert c.get("/me", headers=cit).json()["verified"] is False
        code = c.post("/auth/otp/request", headers=cit).json()["demo_code"]
        assert c.post("/auth/otp/verify", headers=cit, json={"code": "000000" if code != "000000" else "111111"}).status_code == 400
        assert c.post("/auth/otp/verify", headers=cit, json={"code": code}).status_code == 200
        assert c.get("/me", headers=cit).json()["verified"] is True
