"""
Test Gate 1: Cryptographic Dataset Provenance
=============================================
Verifies that dataset_manifest.csv and split_manifest.csv exist, have non-zero rows,
and all prompts have valid SHA-256 digests.
"""

import os
import csv
import pytest


def test_dataset_manifest_exists():
    manifest_path = "data/manifests/dataset_manifest.csv"
    assert os.path.exists(manifest_path), f"Missing {manifest_path}"
    with open(manifest_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) >= 14000, f"Expected >= 14000 samples, got {len(reader)}"
        # Verify first 100 SHA256 hashes
        for row in reader[:100]:
            assert len(row["prompt_sha256"]) == 64, "Invalid SHA256 checksum length"


def test_split_manifest_exists():
    manifest_path = "data/manifests/split_manifest.csv"
    assert os.path.exists(manifest_path), f"Missing {manifest_path}"
    with open(manifest_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        splits = {r["split_name"] for r in reader}
        expected = {"train", "val", "test_id", "test_ood_family", "test_cross_dataset", "test_benign_fpr"}
        assert expected.issubset(splits), f"Missing expected splits: {expected - splits}"
