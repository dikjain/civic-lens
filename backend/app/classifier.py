"""Pluggable image classifier.

Order of preference:
  1. TFLite model (backend/model/model.tflite) run with ai-edge-litert: small and fast, used in deployment.
  2. Keras model (.keras) if MODEL_PATH points to one and TensorFlow is installed (local development).
  3. A colour-heuristic stub (demo/tests only; NOT accurate).
"""
import io
import os
import threading

import numpy as np
from PIL import Image

from .config import CATEGORIES, MODEL_PATH

IMG_SIZE = 224
_backend = None  # ("tflite", interpreter) | ("keras", model) | ("stub", None)
_lock = threading.Lock()
_name = "heuristic-stub"


def _load():
    global _backend, _name
    if _backend is not None:
        return _backend
    with _lock:
        if _backend is not None:
            return _backend
        _backend = ("stub", None)
        if os.path.exists(MODEL_PATH):
            try:
                if MODEL_PATH.endswith(".tflite"):
                    try:
                        from ai_edge_litert.interpreter import Interpreter
                    except ImportError:  # fall back to TensorFlow's bundled interpreter
                        import tensorflow as tf
                        Interpreter = tf.lite.Interpreter
                    it = Interpreter(model_path=MODEL_PATH)
                    it.allocate_tensors()
                    _backend, _name = ("tflite", it), "tflite-v1"
                else:
                    import tensorflow as tf
                    _backend, _name = ("keras", tf.keras.models.load_model(MODEL_PATH)), "keras-v1"
            except Exception as exc:
                print(f"[classifier] could not load model: {exc}")
        return _backend


def model_version() -> str:
    _load()
    return _name


def classify(data: bytes) -> tuple[str, float]:
    img = Image.open(io.BytesIO(data)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    kind, model = _load()
    if kind == "stub":
        return _heuristic(img)
    arr = np.expand_dims(np.asarray(img, dtype="float32"), 0)  # preprocessing is inside the model
    if kind == "tflite":
        with _lock:  # the interpreter is not thread-safe
            inp, out = model.get_input_details()[0], model.get_output_details()[0]
            model.set_tensor(inp["index"], arr)
            model.invoke()
            probs = model.get_tensor(out["index"])[0]
    else:
        probs = model.predict(arr, verbose=0)[0]
    i = int(np.argmax(probs))
    return CATEGORIES[i], float(probs[i])


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
