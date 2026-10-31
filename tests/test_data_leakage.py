"""
Test Gate 2: Zero Cross-Split Data Leakage
==========================================
Verifies that connected-component clustering and hashing yield strictly
zero overlap across train, val, and test splits.
"""

import os
import csv
import pytest
from src.data.leakage_prevention import LeakagePreventionSplitter


def test_zero_cross_split_data_leakage():
    manifest_path = "data/manifests/dataset_manifest.csv"
    assert os.path.exists(manifest_path), "Dataset manifest not generated"

    train_hashes = set()
    val_hashes = set()
    test_hashes = set()

    with open(manifest_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            split = row["split"]
            h = row["prompt_sha256"]
            if split == "train":
                train_hashes.add(h)
            elif split == "val":
                val_hashes.add(h)
            else:
                test_hashes.add(h)

    # Assert strictly zero overlap
    train_val_leak = train_hashes.intersection(val_hashes)
    train_test_leak = train_hashes.intersection(test_hashes)
    val_test_leak = val_hashes.intersection(test_hashes)

    assert len(train_val_leak) == 0, f"Found {len(train_val_leak)} leaked prompts between train and val"
    assert len(train_test_leak) == 0, f"Found {len(train_test_leak)} leaked prompts between train and test"
    assert len(val_test_leak) == 0, f"Found {len(val_test_leak)} leaked prompts between val and test"
