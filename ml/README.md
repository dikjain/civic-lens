# ML module
- `prepare_data.py` downloads public images (Hugging Face + Wikimedia Commons) into `data/{train,val,test}/<class>/`.
- `train.py` fine-tunes MobileNetV2 and writes `model.keras`; `evaluate.py` prints precision/recall/F1 and the confusion matrix.
- The backend loads `model.keras` automatically (`MODEL_PATH`, default `../ml/model.keras`) and needs TensorFlow (`backend/requirements-ml.txt`, Python 3.12).
- Results and caveats: `../docs/model_card.md`.
- `clip_filter.py` cleans labels with CLIP zero-shot (needs `torch` + `open_clip_torch`, used only when building the dataset). `curation/water_leak_keep.json` lists the kept water-leak files.
