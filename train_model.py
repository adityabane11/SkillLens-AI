"""
Train the academic prototype's resume-screening model.

Dataset:
data/training_data.csv
Columns:
text,label

Labels in the supplied demo dataset:
RELEVANT / NOT_RELEVANT

Model:
TF-IDF (1-2 grams) + Logistic Regression.

The dataset is intentionally small and synthetic so the project is
reproducible for a college demonstration. For a serious study, replace it
with a larger, ethically sourced and labelled dataset and report the results.
"""
from pathlib import Path
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

DATA = Path("data/training_data.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)
MODEL_PATH = MODEL_DIR / "resume_screening_model.joblib"

df = pd.read_csv(DATA)
df["text"] = df["text"].fillna("")
df["label"] = df["label"].astype(str)

X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["label"], test_size=0.25, random_state=42, stratify=df["label"]
)

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)),
    ("clf", LogisticRegression(max_iter=2000, random_state=42))
])

pipeline.fit(X_train, y_train)
pred = pipeline.predict(X_test)

print("\n=== MODEL EVALUATION ===")
print("Test samples:", len(X_test))
print("Accuracy :", round(accuracy_score(y_test, pred), 3))
print("Precision:", round(precision_score(y_test, pred, pos_label="RELEVANT", zero_division=0), 3))
print("Recall   :", round(recall_score(y_test, pred, pos_label="RELEVANT", zero_division=0), 3))
print("F1-score :", round(f1_score(y_test, pred, pos_label="RELEVANT", zero_division=0), 3))
print("\nClassification report:")
print(classification_report(y_test, pred, zero_division=0))

joblib.dump(pipeline, MODEL_PATH)
print(f"Saved trained model to: {MODEL_PATH}")
