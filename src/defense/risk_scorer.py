"""
Module 9 & 10: Multi-Signal Calibrated Risk Fusion & Uncertainty Scorer
=======================================================================
Combines:
  1. Temperature-scaled logit probability P_cal (T_cal = 0.84 via L-BFGS)
  2. Hyperedge neighborhood purity S_nbr
  3. Multi-turn escalation velocity S_ctx
  4. OOD cluster novelty distance S_OOD

Computes:
  R(x) = 0.50 * P_cal + 0.25 * S_nbr + 0.15 * S_ctx + 0.10 * S_OOD
  u(x) = 0.60 * H_bin(P_cal) + 0.40 * S_OOD
"""

import math
from typing import Dict, Any, List, Optional, Tuple
import numpy as np


class CalibratedRiskScorer:
    """
    Module 9/10 Calibrated Risk Fusion and Tri-State Decision Engine.
    """

    def __init__(
        self,
        tau_allow: float = 0.35,
        tau_block: float = 0.70,
        tau_uncertainty: float = 0.45,
        t_cal: float = 0.84
    ):
        self.tau_allow = tau_allow
        self.tau_block = tau_block
        self.tau_uncertainty = tau_uncertainty
        self.t_cal = t_cal

    @staticmethod
    def _sigmoid(z: float) -> float:
        z_clipped = max(min(z, 20.0), -20.0)
        return 1.0 / (1.0 + math.exp(-z_clipped))

    @staticmethod
    def _binary_entropy(p: float) -> float:
        p = max(min(p, 0.99999), 0.00001)
        return -(p * math.log2(p) + (1.0 - p) * math.log2(1.0 - p))

    def compute_risk(
        self,
        raw_logit: float,
        incident_edge_weights: List[float],
        incident_edge_purities: List[float],
        turn_drift: float = 0.0,
        ood_distance: float = 0.0
    ) -> Dict[str, Any]:
        """
        Computes calibrated risk score, uncertainty, and tri-state decision.
        """
        # 1. Temperature-calibrated model probability P_cal
        calibrated_logit = raw_logit / self.t_cal
        p_cal = float(self._sigmoid(calibrated_logit))

        # 2. Hyperedge neighborhood purity S_nbr
        if incident_edge_weights and incident_edge_purities and sum(incident_edge_weights) > 0:
            total_w = sum(incident_edge_weights)
            s_nbr = float(sum(w * p for w, p in zip(incident_edge_weights, incident_edge_purities)) / total_w)
        else:
            s_nbr = p_cal

        # 3. Contextual escalation velocity S_ctx
        s_ctx = float(min(max(turn_drift, 0.0), 1.0))

        # 4. OOD cluster novelty distance S_OOD
        s_ood = float(min(max(ood_distance, 0.0), 1.0))

        # Multi-signal convex risk fusion
        R = 0.50 * p_cal + 0.25 * s_nbr + 0.15 * s_ctx + 0.10 * s_ood
        R = float(np.clip(R, 0.0, 1.0))

        # Epistemic uncertainty
        h_bin = self._binary_entropy(p_cal)
        u = 0.60 * h_bin + 0.40 * s_ood
        u = float(np.clip(u, 0.0, 1.0))

        # Tri-state decision policy
        if R >= self.tau_block:
            decision = "block"
            reason_code = "MALICIOUS_JAILBREAK_CLUSTER"
        elif R >= self.tau_allow or u >= self.tau_uncertainty:
            decision = "review"
            reason_code = "UNCERTAINTY_QUARANTINE_BUFFER"
        else:
            decision = "allow"
            reason_code = "BENIGN_ALLOW"

        return {
            "decision": decision,
            "risk_score": round(R, 4),
            "uncertainty": round(u, 4),
            "reason_code": reason_code,
            "signals": {
                "P_cal": round(p_cal, 4),
                "S_nbr": round(s_nbr, 4),
                "S_ctx": round(s_ctx, 4),
                "S_OOD": round(s_ood, 4)
            }
        }
