"""Pluggable image classifier.

Uses a TensorFlow model at MODEL_PATH when available (see ml/train.py).
Otherwise falls back to a simple colour-heuristic stub so the whole app runs
without a trained model. The stub is NOT accurate: it is a simulation for demos/tests.
"""
import io
import os

from PIL import Image

from .config import CATEGORIES, MODEL_PATH

_model = None
_tried = False
IMG_SIZE = 224


def _load():
    global _model, _tried
    if _tried:
        return _model
    _tried = True
    if os.path.exists(MODEL_PATH):
        try:
            import tensorflow as tf  # optional heavy dependency
            _model = tf.keras.models.load_model(MODEL_PATH)
        except Exception as exc:
            print(f"[classifier] could not load model: {exc}")
    return _model


def model_version() -> str:
    return "keras-v1" if _load() is not None else "heuristic-stub"


def classify(data: bytes) -> tuple[str, float]:
    img = Image.open(io.BytesIO(data)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    model = _load()
    if model is not None:
        import numpy as np
        arr = np.expand_dims(np.asarray(img, dtype="float32"), 0)  # model has its own preprocessing layer
        probs = model.predict(arr, verbose=0)[0]
        i = int(probs.argmax())
        return CATEGORIES[i], float(probs[i])
    return _heuristic(img)


def _heuristic(img: Image.Image) -> tuple[str, float]:
    px = list(img.resize((32, 32)).getdata())
    n = len(px)
    r = sum(p[0] for p in px) / n
    g = sum(p[1] for p in px) / n
    b = sum(p[2] for p in px) / n
    brightness = (r + g + b) / 3
    if b > r and b > g:
        return "water_leak", 0.82
    if g > r and g > b:
        return "garbage", 0.78
    if brightness < 110:
        return "pothole", 0.85
    return "other", 0.45
