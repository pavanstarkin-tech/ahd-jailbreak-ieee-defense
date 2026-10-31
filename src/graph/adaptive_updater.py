"""
Module 14: Anchor-Gated Batch Adaptation Controller & Automatic Poison Rollback
================================================================================
Governs topology promotion G_t -> G_{t+1}.
Guarantees that candidate weight updates are committed ONLY if performance on a
locked 500-sample validation anchor set satisfies:
  - Delta F1 >= -0.5% (f1_tol = 0.005)
  - Delta FPR <= +1.0% (fpr_tol = 0.010)
Otherwise, the candidate update is rejected and automatically rolled back to G_t.
"""

from typing import Dict, Tuple, Any, Optional
import numpy as np


class AnchorGatedAdaptationController:
    """
    Module 14 Anchor Validation Gate and Automatic Poison Rollback.
    Enforces Chapter 10.2 Rule 3 of the AHD-Jailbreak blueprint.
    """

    def __init__(
        self,
        alpha: float = 0.25,
        max_delta_w: float = 0.15,
        f1_tol: float = 0.005,
        fpr_tol: float = 0.010
    ):
        self.alpha = alpha
        self.max_delta_w = max_delta_w
        self.f1_tol = f1_tol
        self.fpr_tol = fpr_tol

    def propose_and_validate_update(
        self,
        current_weights: Dict[str, float],
        candidate_purities: Dict[str, float],
        current_anchor_metrics: Tuple[float, float],  # (F1_t, FPR_t) on 500 locked anchors
        candidate_anchor_metrics: Tuple[float, float],  # (F1_{t+1}, FPR_{t+1}) on 500 locked anchors
        snapshot_version: int
    ) -> Tuple[Dict[str, float], str, bool]:
        """
        Evaluates candidate metrics against locked anchors.
        Returns:
          (updated_or_retained_weights, status_message, is_promoted)
        """
        f1_curr, fpr_curr = current_anchor_metrics
        f1_cand, fpr_cand = candidate_anchor_metrics

        # Enforce Anchor Validation Gate (Chapter 10.2 Rule 3):
        # Must not drop F1 by more than f1_tol (0.005) or raise FPR by more than fpr_tol (0.010)
        if (f1_cand < f1_curr - self.f1_tol) or (fpr_cand > fpr_curr + self.fpr_tol):
            status = (
                f"REJECTED_ANCHOR_GATE_ROLLBACK: retained graph_v{snapshot_version} "
                f"(Cand F1={f1_cand:.4f}, FPR={fpr_cand:.4f} vs Baseline F1={f1_curr:.4f}, FPR={fpr_curr:.4f})"
            )
            return current_weights.copy(), status, False

        # Apply capped EMA weight update: |w_{t+1}(e) - w_t(e)| <= max_delta_w (0.15)
        new_weights: Dict[str, float] = {}
        for e_id, w_old in current_weights.items():
            if e_id in candidate_purities:
                purity = candidate_purities[e_id]
                w_target = 0.20 + 0.80 * abs(2.0 * purity - 1.0)
                raw_step = self.alpha * (w_target - w_old)
                capped_step = float(np.clip(raw_step, -self.max_delta_w, self.max_delta_w))
                new_weights[e_id] = float(np.clip(w_old + capped_step, 0.10, 2.00))
            else:
                new_weights[e_id] = w_old

        status = (
            f"PROMOTED: graph_v{snapshot_version} -> graph_v{snapshot_version + 1} "
            f"(Anchor F1={f1_cand:.4f}, FPR={fpr_cand:.4f})"
        )
        return new_weights, status, True
