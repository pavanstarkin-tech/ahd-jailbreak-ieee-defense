"""
Multi-Signal Risk Calibration, Temperature Scaling, and Three-Tier Routing for AHD-Jailbreak.
Strictly implements Equations (4), (5), and Three-Tier Decision Logic from Section III-C.
"""

import math
from typing import Dict, Any, List, Optional
import numpy as np


class RiskCalibrator:
    """
    Computes calibrated posterior risk R(x), epistemic uncertainty u(x),
    and executes three-tier decision routing (ALLOW / QUARANTINE_REVIEW / BLOCK).
    """

    def __init__(
        self,
        tau_allow: float = 0.35,
        tau_block: float = 0.70,
        tau_uncertainty: float = 0.45,
        temperature_cal: float = 4.56
    ) -> None:
        self.tau_allow = tau_allow
        self.tau_block = tau_block
        self.tau_uncertainty = tau_uncertainty
        self.temperature_cal = temperature_cal

    @staticmethod
    def _sigmoid(z: float) -> float:
        return 1.0 / (1.0 + math.exp(-max(min(z, 20.0), -20.0)))

    @staticmethod
    def _binary_entropy(p: float) -> float:
        """Normalized Shannon binary entropy H_bin(p) in [0, 1]."""
        p = min(max(p, 1e-7), 1.0 - 1e-7)
        h = -(p * math.log2(p) + (1.0 - p) * math.log2(1.0 - p))
        return float(np.clip(h, 0.0, 1.0))

    def evaluate_risk(
        self,
        raw_logit: float,
        neighbor_purities: List[float],
        edge_weights: List[float],
        turn_drift: float = 0.0,
        ood_distance: float = 0.0,
        surface_meta: Optional[Dict[str, Any]] = None,
        is_single_turn: bool = True
    ) -> Dict[str, Any]:
        """
        Executes calibrated risk fusion:
          P_cal(x) = sigma(l(v_q) / T_cal)
          Single-turn: R(x) = 0.60 P_cal(x) + 0.30 S_nbr(x) + 0.10 S_OOD(x)
          Multi-turn:  R(x) = 0.50 P_cal(x) + 0.25 S_nbr(x) + 0.15 S_ctx(x) + 0.10 S_OOD(x)
          u(x) = 0.60 H_bin(P_cal(x)) + 0.40 S_OOD(x)
        """
        # 1. Temperature-Scaled Logit
        calibrated_logit = raw_logit / max(self.temperature_cal, 1e-4)
        p_cal = self._sigmoid(calibrated_logit)

        # 2. Purity-Weighted Neighborhood Risk S_nbr(x)
        if neighbor_purities and edge_weights:
            total_w = sum(edge_weights) or 1.0
            s_nbr = sum(p * w for p, w in zip(neighbor_purities, edge_weights)) / total_w
        elif neighbor_purities:
            s_nbr = sum(neighbor_purities) / len(neighbor_purities)
        else:
            s_nbr = p_cal

        # 3. Multi-Turn Escalation Velocity S_ctx(x) across dialogue
        s_ctx = float(np.clip(turn_drift * 1.2, 0.0, 1.0))

        # 4. Out-of-Distribution Novelty Distance S_OOD(x)
        s_ood = float(np.clip(ood_distance, 0.0, 1.0))

        # Eq. 4: Multi-Signal Composite Risk Score R(x)
        if is_single_turn:
            r_x = 0.60 * p_cal + 0.30 * s_nbr + 0.10 * s_ood
        else:
            r_x = 0.50 * p_cal + 0.25 * s_nbr + 0.15 * s_ctx + 0.10 * s_ood
        r_x = float(np.clip(r_x, 0.0, 1.0))

        # Eq. 5: Epistemic Uncertainty u(x)
        h_bin = self._binary_entropy(p_cal)
        u_x = 0.60 * h_bin + 0.40 * s_ood
        u_x = float(np.clip(u_x, 0.0, 1.0))

        # Three-Tier Decision Routing
        if r_x >= self.tau_block:
            decision = "BLOCK"
            reason = "R_OVER_TAU_BLOCK_HIGH_MALICIOUS_RISK"
        elif r_x >= self.tau_allow:
            decision = "QUARANTINE_REVIEW"
            reason = "MODERATE_RISK_HOMONYM_DISAMBIGUATION"
        elif u_x >= self.tau_uncertainty and r_x >= 0.20:
            decision = "QUARANTINE_REVIEW"
            reason = "UNCERTAINTY_OVER_TAU_U_OOD_QUERY"
        else:
            decision = "ALLOW"
            reason = "BENIGN_QUERY_LOW_RISK"

        # Generate Explainable Relational Attribution Breakdown
        surface_meta = surface_meta or {}
        explanation = {
            "action": decision,
            "risk_score": round(r_x, 4),
            "uncertainty": round(u_x, 4),
            "reason_code": reason,
            "signals": {
                "P_cal": round(p_cal, 4),
                "S_nbr": round(s_nbr, 4),
                "S_ctx": round(s_ctx, 4),
                "S_OOD": round(s_ood, 4),
                "H_bin": round(h_bin, 4)
            },
            "thresholds": {
                "tau_allow": self.tau_allow,
                "tau_block": self.tau_block,
                "tau_uncertainty": self.tau_uncertainty,
                "temperature": self.temperature_cal
            },
            "triggered_surface_indicators": {
                k: v for k, v in surface_meta.items()
                if v is True or (isinstance(v, (int, float)) and v > 0.0)
            }
        }

        return explanation

