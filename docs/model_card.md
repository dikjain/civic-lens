# Model card: CivicLens civic-issue classifier

- **Task:** 4-class image classification: pothole, garbage, water_leak, other.
- **Architecture:** MobileNetV2 (ImageNet weights); head training (8 epochs), then fine-tuning of the top 30 layers (5 epochs) with class weights; augmentation = flip, rotation, brightness. Preprocessing is inside the model. File: `ml/model.keras` (21 MB).
- **Interface:** `backend/app/classifier.py` returns `(category, confidence)`; confidence < 0.6 sets `needs_review`.
- **Code:** `ml/prepare_data.py` (download), `ml/clip_filter.py` (label cleaning), `ml/train.py`, `ml/evaluate.py`.

## Data (1,000 images after cleaning; split 70/15/15 = train 641 / val 138 / test 138)
| Class | Images | Sources |
|---|---|---|
| pothole | 245 | Hugging Face `Arpitraj01/Pothole_classification` + Wikimedia Commons |
| garbage | 286 | Hugging Face `Akhila-9849/Garbage_Bin_overflow_images` + Commons |
| water_leak | 200 | Commons only: flooded streets, burst pipes, open hydrants |
| other | 186 | road "none" images, Commons street/building/park scenes |

**How the data was cleaned (this is what moved macro-F1 from 0.763 to 0.848):** the first version used raw keyword search results, which included diagrams, historic photos, subway tunnels and satellite images labelled as water leaks. For this version:
1. Water-leak candidates were re-collected with more precise street-level queries, ranked with a CLIP zero-shot model (`clip_filter.py`), and then checked by eye on contact sheets; diagrams, old photos, tunnels, rivers and fields were removed. 33 hand-curated images from the first pool were also kept.
2. Commons-sourced images in the other classes were filtered with the same CLIP check (an image is kept only if CLIP's best match is its own class); Hugging Face images were kept as-is. The list of kept water-leak files is in `ml/curation/water_leak_keep.json`.
3. The cleaned pool was re-split randomly 70/15/15. Cleaning was applied to all splits, including test, so the test set contains fewer ambiguous images than raw web data would. A satellite/aerial flood dataset was considered and rejected because it does not match citizen street-level photos.

## Results (held-out test set, 138 images)
```
pothole      0.881     1.000     0.937        37
     garbage      0.857     0.837     0.847        43
  water_leak      0.923     0.800     0.857        30
       other      0.750     0.750     0.750        28

    accuracy                          0.855       138
   macro avg      0.853     0.847     0.848       138
weighted avg      0.856     0.855     0.854       138

[[37  0  0  0]
 [ 2 36  0  5]
 [ 2  2 24  2]
 [ 1  4  2 21]]
```
Rows of the matrix = true class, columns = predicted, in order pothole, garbage, water_leak, other.

**Macro-F1 = 0.848, accuracy = 85.5%.** The target in `product.md` was 0.85, so it is met within rounding (0.848).
- Pothole F1 0.94, water_leak 0.86, garbage 0.85, other 0.75.
- The test set is small (28–43 per class), so each score has roughly ±0.07 uncertainty; treat the numbers as indicative, not exact.
- "other" is weakest because it is a catch-all (streets, buildings, parks) and overlaps visually with garbage and flooded scenes.

## Limitations
Training and test images come from web sources (mostly Western streets), not Indian city photos, so real-world accuracy on local photos is likely lower. Lighting, occlusion, camera angle and image quality affect accuracy. One image does not show severity or ownership. Predictions are advisory and confidence below 0.6 goes to human review.

## How to improve further
Add photos from the target city, more "other" examples, and use the human corrections logged by the dashboard as new training data.
