"""Train the CivicLens classifier (transfer learning, MobileNetV2).

Expected data layout:  data/{train,val,test}/{pothole,garbage,water_leak,other}/*.jpg
Run (needs Python 3.11/3.12 + `pip install tensorflow`):  python train.py
Outputs model.keras (the backend loads it automatically when present).
"""
import tensorflow as tf

CLASSES = ["pothole", "garbage", "water_leak", "other"]  # must match backend CATEGORIES order
IMG = (224, 224)


def ds(split):
    return tf.keras.utils.image_dataset_from_directory(
        f"data/{split}", class_names=CLASSES, image_size=IMG, batch_size=32, shuffle=(split == "train"))


def build():
    base = tf.keras.applications.MobileNetV2(input_shape=IMG + (3,), include_top=False, weights="imagenet")
    base.trainable = False
    aug = tf.keras.Sequential([tf.keras.layers.RandomFlip("horizontal"), tf.keras.layers.RandomRotation(0.1),
                               tf.keras.layers.RandomBrightness(0.2)])
    inp = tf.keras.Input(IMG + (3,))
    x = aug(inp)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)  # preprocessing lives inside the model
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(len(CLASSES), activation="softmax")(x)
    return tf.keras.Model(inp, out), base


def class_weights():
    import os
    n = [len(os.listdir(f"data/train/{c}")) for c in CLASSES]
    return {i: sum(n) / (len(n) * k) for i, k in enumerate(n)}  # offset class imbalance


if __name__ == "__main__":
    train, val = ds("train"), ds("val")
    cw = class_weights()
    model, base = build()
    model.compile("adam", "sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(train, validation_data=val, epochs=8, class_weight=cw)
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    model.compile(tf.keras.optimizers.Adam(1e-5), "sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(train, validation_data=val, epochs=5, class_weight=cw)
    model.save("model.keras")
    print("saved model.keras")
