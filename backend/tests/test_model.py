import glob
import os

import pytest

MODEL = os.path.join(os.path.dirname(__file__), "../model/model.tflite")
DATA = os.path.join(os.path.dirname(__file__), "../../ml/data/test")


@pytest.mark.skipif(not (os.path.exists(MODEL) and os.path.isdir(DATA)), reason="trained model/test data not present")
def test_real_model_beats_chance():
    from app import classifier
    classifier.MODEL_PATH = MODEL  # override whatever other tests configured
    classifier._backend = None
    assert classifier.model_version() == "tflite-v1"
    ok = n = 0
    for cls in ["pothole", "garbage", "water_leak", "other"]:
        for f in glob.glob(f"{DATA}/{cls}/*.jpg")[:10]:
            n += 1
            ok += classifier.classify(open(f, "rb").read())[0] == cls
    assert ok / n > 0.6  # chance is 25%
