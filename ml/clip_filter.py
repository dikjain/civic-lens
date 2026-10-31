"""Label cleaning with CLIP zero-shot (run in an env with torch + open_clip_torch; only used at dataset-build time).

For each image, CLIP picks the best-matching description among all class descriptions plus "junk" descriptions
(diagrams, old photos, tunnels, aerial images ...). An image is KEPT only if its best match belongs to its own class.

  python clip_filter.py score <class> <dir> <out.json>   # write per-image verdicts
"""
import glob, json, os, sys
import torch
import open_clip
from PIL import Image

PROMPTS = {
    "pothole": ["a photo of a pothole in a road", "a road surface with a hole or crack damage", "a damaged asphalt road"],
    "garbage": ["a photo of a pile of garbage on the street", "an overflowing garbage bin", "litter and trash dumped on the roadside"],
    "water_leak": ["a photo of water leaking from a pipe", "a photo of a flooded street", "a burst water pipe spraying water",
                   "a waterlogged road covered with water", "water flowing on a road from a broken water main"],
    "other": ["a photo of a clean street", "a photo of a building", "a photo of a park with trees", "a photo of a busy market",
              "a photo of a vehicle on a road", "a photo of a person or people", "a photo of a shop"],
    "junk": ["a technical diagram or engineering drawing", "an old black and white historical photograph", "a subway tunnel with train tracks",
             "a photo of the inside of a room", "a page of text", "a painting or illustration", "an aerial or satellite image",
             "a close-up of an insect or animal", "a map", "a crowd of workers in a tunnel"],
}
FLAT = [(c, p) for c, ps in PROMPTS.items() for p in ps]

_model = _preprocess = _tok = _text = None


def _load():
    global _model, _preprocess, _tok, _text
    if _model is None:
        _model, _, _preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
        _model.eval(); _tok = open_clip.get_tokenizer("ViT-B-32")
        with torch.no_grad():
            _text = _model.encode_text(_tok([p for _, p in FLAT])); _text /= _text.norm(dim=-1, keepdim=True)


def verdicts(files, target):
    _load(); out = {}
    for i in range(0, len(files), 32):
        batch = files[i:i + 32]; ims = []
        for f in batch:
            try: ims.append(_preprocess(Image.open(f).convert("RGB")))
            except Exception: ims.append(torch.zeros(3, 224, 224))
        with torch.no_grad():
            feat = _model.encode_image(torch.stack(ims)); feat /= feat.norm(dim=-1, keepdim=True)
            probs = (100 * feat @ _text.T).softmax(dim=-1)
        for f, pr in zip(batch, probs):
            cls_p = {}
            for (c, _), v in zip(FLAT, pr.tolist()): cls_p[c] = cls_p.get(c, 0) + v
            best = max(cls_p, key=cls_p.get)
            out[f] = {"best": best, "p": round(cls_p[best], 3), "target_p": round(cls_p[target], 3), "keep": best == target}
    return out


if __name__ == "__main__":
    _, cls, d, out = sys.argv
    files = sorted(glob.glob(os.path.join(d, "*.jpg")))
    v = verdicts(files, cls)
    json.dump(v, open(out, "w"), indent=0)
    print(cls, "kept", sum(x["keep"] for x in v.values()), "of", len(v))
