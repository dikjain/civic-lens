"""Evaluate model.keras on data/test: accuracy, precision, recall, F1, confusion matrix."""
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

from train import CLASSES, IMG

test = tf.keras.utils.image_dataset_from_directory("data/test", class_names=CLASSES, image_size=IMG,
                                                   batch_size=32, shuffle=False)
model = tf.keras.models.load_model("model.keras")
y_true = np.concatenate([y.numpy() for _, y in test])
y_pred = model.predict(test).argmax(axis=1)
print(classification_report(y_true, y_pred, target_names=CLASSES, digits=3))
print(confusion_matrix(y_true, y_pred))
