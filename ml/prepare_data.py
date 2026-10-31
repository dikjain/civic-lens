"""Build ml/data/{train,val,test}/<class>/ from public sources (no accounts needed).

Sources: Hugging Face datasets (Arpitraj01/Pothole_classification, Akhila-9849/Garbage_Bin_overflow_images)
and Wikimedia Commons image search (CC-licensed; used for water leaks, litter, potholes and "other" scenes).
Images are resized to max 400px. Run: python prepare_data.py
"""
import hashlib
import io
import json
import os
import random
import shutil
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

UA = {"User-Agent": "CivicLensStudentProject/1.0 (college project; contact: student)"}
RAW = "data_raw"
random.seed(42)


def get(url, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read()


def save(cls, name, blob):
    try:
        im = Image.open(io.BytesIO(blob)).convert("RGB")
        if min(im.size) < 120:
            return False
        im.thumbnail((400, 400))
        os.makedirs(f"{RAW}/{cls}", exist_ok=True)
        im.save(f"{RAW}/{cls}/{name}.jpg", quality=88)
        return True
    except Exception:
        return False


def commons(cls, queries, limit):
    urls = {}
    for q in queries:
        for off in range(0, 300, 50):
            api = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6"
                   f"&gsrlimit=50&gsroffset={off}&gsrsearch={urllib.parse.quote(q + ' filetype:bitmap')}"
                   "&prop=imageinfo&iiprop=url|mime&iiurlwidth=400")
            try:
                pages = json.loads(get(api)).get("query", {}).get("pages", {})
            except Exception:
                break
            if not pages:
                break
            for p in pages.values():
                ii = (p.get("imageinfo") or [{}])[0]
                if ii.get("mime") in ("image/jpeg", "image/png") and ii.get("thumburl"):
                    urls[ii["thumburl"]] = 1
            if len(urls) >= limit * 2:
                break

    def dl(u):
        try:
            return save(cls, "c_" + hashlib.md5(u.encode()).hexdigest()[:10], get(u))
        except Exception:
            return False
    with ThreadPoolExecutor(6) as ex:
        n = sum(ex.map(dl, list(urls)[: limit * 2]))
    print(f"commons {cls}: {n}")


def hf(cls, repo, paths, limit):
    def dl(p):
        try:
            blob = get(f"https://huggingface.co/datasets/{repo}/resolve/main/{urllib.parse.quote(p)}", 90)
            return save(cls, "h_" + hashlib.md5(p.encode()).hexdigest()[:10], blob)
        except Exception:
            return False
    paths = random.sample(paths, min(limit, len(paths)))
    with ThreadPoolExecutor(6) as ex:
        n = sum(ex.map(dl, paths))
    print(f"hf {repo} -> {cls}: {n}")


def tree(repo):
    t = json.loads(get(f"https://huggingface.co/api/datasets/{repo}/tree/main?recursive=true"))
    return [f["path"] for f in t if f["type"] == "file" and f["path"].lower().endswith((".jpg", ".jpeg", ".png"))]


if __name__ == "__main__":
    shutil.rmtree(RAW, ignore_errors=True)
    pot = tree("Arpitraj01/Pothole_classification")
    hf("pothole", "Arpitraj01/Pothole_classification", [p for p in pot if "/none/" not in p], 130)
    hf("other", "Arpitraj01/Pothole_classification", [p for p in pot if "/none/" in p], 60)
    hf("garbage", "Akhila-9849/Garbage_Bin_overflow_images", tree("Akhila-9849/Garbage_Bin_overflow_images"), 200)
    commons("pothole", ["pothole road", "pothole street damage", "potholes in road"], 80)
    commons("garbage", ["litter street", "garbage pile street", "rubbish dumped roadside", "overflowing trash"], 80)
    commons("water_leak", ["burst water pipe", "leaking water pipe", "water main break", "leaking fire hydrant",
                           "water leak street", "pipe leak", "broken water pipe street flooding", "water spraying from pipe",
                           "burst pipe flooding road", "leaking tap", "sewage overflow street", "waterlogging street", "water gushing pipe repair"], 300)
    commons("other", ["clean street city", "park bench", "building facade", "shop street", "tree lined road",
                      "bus stop", "street lamp", "market street people", "bridge", "garden", "sidewalk", "playground", "railway station", "school building", "temple", "bicycle street"], 200)
    # split 70/15/15
    shutil.rmtree("data", ignore_errors=True)
    for cls in os.listdir(RAW):
        files = sorted(os.listdir(f"{RAW}/{cls}"))
        random.shuffle(files)
        n = len(files)
        cuts = {"train": files[: int(n * .7)], "val": files[int(n * .7): int(n * .85)], "test": files[int(n * .85):]}
        for split, fs in cuts.items():
            os.makedirs(f"data/{split}/{cls}", exist_ok=True)
            for f in fs:
                shutil.copy(f"{RAW}/{cls}/{f}", f"data/{split}/{cls}/{f}")
        print(cls, {k: len(v) for k, v in cuts.items()})
