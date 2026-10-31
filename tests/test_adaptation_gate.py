"""
Test Gate 4: Module 14 Anchor Validation Gate & Poison Rollback
===============================================================
Verifies:
  1. Valid candidate update within tolerances is PROMOTED.
  2. Synthetic label-flipped poison batch (F1 dropping from 0.93 to 0.40) is REJECTED.
  3. Original snapshot weights are retained intact after poison rejection.
  4. Per-step weight change is strictly capped at max_delta_w (<= 0.15).
"""

import pytest
from src.graph.adaptive_updater import AnchorGatedAdaptationController


def test_anchor_gate_promotes_valid_update():
    controller = AnchorGatedAdaptationController(alpha=0.25, max_delta_w=0.15, f1_tol=0.005, fpr_tol=0.010)
    current_weights = {"edge_01": 0.80, "edge_02": 0.50}
    candidate_purities = {"edge_01": 0.95, "edge_02": 0.60}

    # Cand F1 is slightly higher, FPR is slightly lower
    curr_metrics = (0.9350, 0.0140)
    cand_metrics = (0.9380, 0.0135)

    new_weights, status, is_promoted = controller.propose_and_validate_update(
        current_weights=current_weights,
        candidate_purities=candidate_purities,
        current_anchor_metrics=curr_metrics,
        candidate_anchor_metrics=cand_metrics,
        snapshot_version=4
    )

    assert is_promoted is True
    assert "PROMOTED" in status
    assert abs(new_weights["edge_01"] - current_weights["edge_01"]) <= 0.15


def test_anchor_gate_rejects_and_rolls_back_poison():
    controller = AnchorGatedAdaptationController(alpha=0.25, max_delta_w=0.15, f1_tol=0.005, fpr_tol=0.010)
    current_weights = {"edge_01": 0.85, "edge_02": 0.70}
    poisoned_purities = {"edge_01": 0.10, "edge_02": 0.15}

    # Poison batch causes catastrophic anchor drop from 0.9350 to 0.4000
    curr_metrics = (0.9350, 0.0140)
    poison_metrics = (0.4000, 0.2850)

    retained_weights, status, is_promoted = controller.propose_and_validate_update(
        current_weights=current_weights,
        candidate_purities=poisoned_purities,
        current_anchor_metrics=curr_metrics,
        candidate_anchor_metrics=poison_metrics,
        snapshot_version=4
    )

    assert is_promoted is False
    assert "REJECTED_ANCHOR_GATE_ROLLBACK" in status
    # Guarantees rollback: retained weights are identical to current weights
    assert retained_weights == current_weights
