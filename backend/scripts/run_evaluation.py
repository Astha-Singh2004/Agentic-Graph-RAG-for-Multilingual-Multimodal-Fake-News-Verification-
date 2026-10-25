#!/usr/bin/env python3
"""
TruthLens — Benchmark Evaluation Runner
========================================
Runs a sampled evaluation of the full verification pipeline against ground-truth
labels from the dataset to compute F1, Precision, Recall, and Accuracy metrics.

Usage:
    python scripts/run_evaluation.py --samples 200 --output reports/eval_results.json

Requirements: backend must be running (uvicorn app.main:app)
"""

import argparse
import json
import random
import time
from pathlib import Path
from datetime import datetime
from collections import defaultdict

import requests
import pandas as pd
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    accuracy_score,
)

# ─── Config ────────────────────────────────────────────────────────────────────
API_BASE = "http://localhost:8000/api"
DATA_DIR = Path(__file__).parent.parent / "data"
REPORT_DIR = Path(__file__).parent.parent / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

LABEL_MAP = {
    "REAL": "SUPPORTED",
    "FAKE": "CONTRADICTED",
    "real": "SUPPORTED",
    "fake": "CONTRADICTED",
    "TRUE": "SUPPORTED",
    "FALSE": "CONTRADICTED",
    "UNVERIFIED": "UNVERIFIED",
    "UNKNOWN": "UNVERIFIED",
}

VERDICT_LABELS = ["SUPPORTED", "CONTRADICTED", "UNVERIFIED"]


# ─── Helpers ───────────────────────────────────────────────────────────────────

def load_ground_truth(sample_size: int) -> list[dict]:
    """Load labelled articles from the benchmark dataset CSV."""
    csv_path = DATA_DIR / "01_news_articles.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found at {csv_path}. Run data ingestion first.")

    df = pd.read_csv(csv_path, usecols=lambda c: c in [
        "id", "title", "content", "label", "language"
    ])
    df = df.dropna(subset=["content", "label"])

    # Sample uniformly across labels for balanced evaluation
    grouped = df.groupby("label")
    per_label = max(1, sample_size // grouped.ngroups)
    samples = []
    for _, group in grouped:
        samples.extend(group.sample(min(per_label, len(group)), random_state=42).to_dict("records"))

    random.shuffle(samples)
    return samples[:sample_size]


def verify_claim(claim_text: str, language: str = "auto") -> dict:
    """Call the verification API for a single claim."""
    try:
        response = requests.post(
            f"{API_BASE}/verify",
            json={"claim_text": claim_text, "language": language},
            timeout=60,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e), "final_verdict": "UNVERIFIED"}


def normalize_label(raw_label: str) -> str:
    """Map dataset labels to our verdict schema."""
    return LABEL_MAP.get(str(raw_label).strip().upper(), "UNVERIFIED")


# ─── Evaluation Runner ─────────────────────────────────────────────────────────

def run_evaluation(sample_size: int, output_path: Path, verbose: bool = True):
    print(f"\n{'='*60}")
    print(f"  TruthLens Benchmark Evaluation")
    print(f"  Samples: {sample_size} | API: {API_BASE}")
    print(f"{'='*60}\n")

    # 1. Load ground truth
    print("📂 Loading benchmark dataset...")
    try:
        samples = load_ground_truth(sample_size)
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        return

    print(f"✅ Loaded {len(samples)} labelled samples.\n")

    # 2. Check API health
    try:
        health = requests.get(f"http://localhost:8000/health", timeout=5).json()
        print(f"✅ Backend healthy — {health.get('loaded_evidence_count', '?')} evidence loaded.\n")
    except Exception:
        print("⚠️  Backend unreachable. Make sure uvicorn is running on port 8000.\n")
        return

    # 3. Run predictions
    y_true, y_pred = [], []
    errors = []
    total_latency = 0.0
    per_label_counts = defaultdict(lambda: {"correct": 0, "total": 0})

    for i, sample in enumerate(samples, 1):
        claim_text = str(sample.get("title", "") or sample.get("content", ""))[:500]
        true_label = normalize_label(sample.get("label", "UNVERIFIED"))
        lang = sample.get("language", "auto")

        t0 = time.time()
        result = verify_claim(claim_text, lang)
        latency = (time.time() - t0) * 1000  # ms

        if "error" in result:
            errors.append({"idx": i, "error": result["error"], "claim": claim_text[:80]})
            predicted = "UNVERIFIED"
        else:
            predicted = result.get("final_verdict", "UNVERIFIED")

        y_true.append(true_label)
        y_pred.append(predicted)
        total_latency += latency

        per_label_counts[true_label]["total"] += 1
        if predicted == true_label:
            per_label_counts[true_label]["correct"] += 1

        if verbose:
            icon = "✅" if predicted == true_label else "❌"
            print(f"[{i:03d}/{len(samples)}] {icon} True={true_label:14s} Pred={predicted:14s} "
                  f"({latency:5.0f}ms) | {claim_text[:60]}...")

    # 4. Compute metrics
    print(f"\n{'─'*60}")
    print("📊 EVALUATION RESULTS")
    print(f"{'─'*60}\n")

    acc = accuracy_score(y_true, y_pred)
    f1_macro = f1_score(y_true, y_pred, labels=VERDICT_LABELS, average="macro", zero_division=0)
    f1_weighted = f1_score(y_true, y_pred, labels=VERDICT_LABELS, average="weighted", zero_division=0)
    prec = precision_score(y_true, y_pred, labels=VERDICT_LABELS, average="macro", zero_division=0)
    rec = recall_score(y_true, y_pred, labels=VERDICT_LABELS, average="macro", zero_division=0)
    avg_latency = total_latency / max(len(samples), 1)

    print(f"  Accuracy:          {acc:.4f}  ({acc*100:.2f}%)")
    print(f"  Macro F1:          {f1_macro:.4f}")
    print(f"  Weighted F1:       {f1_weighted:.4f}")
    print(f"  Macro Precision:   {prec:.4f}")
    print(f"  Macro Recall:      {rec:.4f}")
    print(f"  Avg Latency:       {avg_latency:.0f} ms/claim")
    print(f"  API Errors:        {len(errors)}/{len(samples)}")
    print()

    print("Per-Class Report:")
    print(classification_report(y_true, y_pred, labels=VERDICT_LABELS, zero_division=0))

    print("Confusion Matrix (rows=True, cols=Pred):")
    cm = confusion_matrix(y_true, y_pred, labels=VERDICT_LABELS)
    print(f"  {'':12s}", "  ".join(f"{l:12s}" for l in VERDICT_LABELS))
    for i, row in enumerate(cm):
        print(f"  {VERDICT_LABELS[i]:12s}", "  ".join(f"{v:12d}" for v in row))

    # 5. Save report
    report = {
        "timestamp": datetime.now().isoformat(),
        "sample_size": len(samples),
        "api_base": API_BASE,
        "metrics": {
            "accuracy": round(acc, 4),
            "macro_f1": round(f1_macro, 4),
            "weighted_f1": round(f1_weighted, 4),
            "macro_precision": round(prec, 4),
            "macro_recall": round(rec, 4),
            "avg_latency_ms": round(avg_latency, 1),
        },
        "per_label": {
            label: {
                "correct": counts["correct"],
                "total": counts["total"],
                "accuracy": round(counts["correct"] / max(counts["total"], 1), 4),
            }
            for label, counts in per_label_counts.items()
        },
        "confusion_matrix": {
            "labels": VERDICT_LABELS,
            "matrix": cm.tolist(),
        },
        "errors": errors[:10],  # cap at 10
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2))
    print(f"\n✅ Report saved → {output_path}")


# ─── CLI Entry Point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TruthLens Benchmark Evaluation Runner")
    parser.add_argument("--samples", type=int, default=100, help="Number of articles to evaluate (default: 100)")
    parser.add_argument("--output", type=str, default="reports/eval_results.json", help="Output path for JSON report")
    parser.add_argument("--quiet", action="store_true", help="Suppress per-sample output")
    args = parser.parse_args()

    run_evaluation(
        sample_size=args.samples,
        output_path=Path(args.output),
        verbose=not args.quiet,
    )
