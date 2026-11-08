"""
AHD-Jailbreak: Adaptive Hypergraph Defense with Anchor-Gated Topology Evolution
Official Hugging Face Model Hub & Middleware SDK.
"""

import os
import time
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field
import numpy as np

from .configuration_ahd import AHDConfig
from .feature_extractor import AHDFeatureExtractor
from .hypergraph_topology import HeterogeneousHypergraph, build_default_hypergraph
from .modeling_ahd import AHDForJailbreakDetection
from .risk_calibration import RiskCalibrator
from .anchor_gate import AnchorValidationGate
from .integrations.llm_wrapper import AHDLLMWrapper
from .integrations.fastapi_middleware import AHDMiddleware


@dataclass
class AHDOutput:
    """Structured evaluation output returned by AHDJailbreakGuard."""
    action: str  # "ALLOW" | "QUARANTINE_REVIEW" | "BLOCK"
    risk_score: float  # R(x) in [0, 1]
    uncertainty: float  # u(x) in [0, 1]
    reason_code: str
    latency_ms: float
    signals: Dict[str, float]
    explanation: Dict[str, Any]
    snapshot_id: str = "graph_v1"

    @property
    def is_blocked(self) -> bool:
        return self.action == "BLOCK"

    @property
    def is_allowed(self) -> bool:
        return self.action == "ALLOW"


class AHDJailbreakGuard:
    """
    Main developer-facing entrypoint for AHD-Jailbreak.
    Supports 1-line instantiation, evaluation, and LLM wrapping.
    """

    def __init__(
        self,
        config: Optional[AHDConfig] = None,
        runtime: str = "onnx-int8",
        onnx_model_path: Optional[str] = None
    ) -> None:
        self.config = config or AHDConfig()
        self.runtime = runtime

        # 1. Feature Extractor
        self.feature_extractor = AHDFeatureExtractor(
            base_encoder=self.config.base_encoder,
            runtime=runtime,
            onnx_model_path=onnx_model_path
        )

        # 2. Hypergraph Topology
        self.hypergraph = build_default_hypergraph()

        # 3. Risk Calibrator
        self.risk_calibrator = RiskCalibrator(
            tau_allow=self.config.tau_allow,
            tau_block=self.config.tau_block,
            tau_uncertainty=self.config.tau_uncertainty,
            temperature_cal=self.config.temperature_cal
        )

        # 4. Module 14: Anchor Gate
        self.anchor_gate = AnchorValidationGate(
            ema_alpha=self.config.ema_alpha,
            ema_max_delta=self.config.ema_max_delta
        )

    @classmethod
    def from_pretrained(
        cls,
        pretrained_model_name_or_path: str,
        runtime: str = "onnx-int8",
        **kwargs: Any
    ) -> "AHDJailbreakGuard":
        """
        Loads AHD-Jailbreak guardrail from Hugging Face Model Hub or local directory.
        """
        if os.path.isdir(pretrained_model_name_or_path):
            config = AHDConfig.from_pretrained(pretrained_model_name_or_path, **kwargs)
            onnx_path = os.path.join(pretrained_model_name_or_path, "models", "minilm_int8.onnx")
            if not os.path.exists(onnx_path):
                onnx_path = None
        else:
            # Download from Hugging Face Model Hub
            try:
                config = AHDConfig.from_pretrained(pretrained_model_name_or_path, **kwargs)
            except Exception:
                config = AHDConfig(**kwargs)
            onnx_path = None

        return cls(config=config, runtime=runtime, onnx_model_path=onnx_path)

    def evaluate(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AHDOutput:
        """
        Evaluates an active user query against multi-turn dialogue history.
        Returns AHDOutput with action (ALLOW/QUARANTINE_REVIEW/BLOCK), risk score, and relational explanation.
        """
        t0 = time.perf_counter()

        # Extract prior turns
        prior_texts = [h.get("content", "") for h in (history or []) if h.get("role") == "user"]

        # 1. 394-D Feature Extraction
        x_394, meta = self.feature_extractor.extract(prompt, prior_turns=prior_texts)

        # 2. 2-Hop Ego-Subhypergraph Extraction (<= 120 nodes)
        ego_nodes, ego_edges = self.hypergraph.extract_ego_subhypergraph(
            x_394,
            k_neighbors=self.config.k_neighbors,
            max_nodes=self.config.max_ego_nodes
        )

        # 3. Compute Spectral Logit Approximation
        edge_weights = [self.hypergraph.edge_weights.get(e, 1.0) for e in ego_edges]
        edge_purities = [self.hypergraph.edge_purities.get(e, 0.5) for e in ego_edges]

        # Surface indicators contribution
        surface_risk = (
            meta["has_base64"] * 1.5 +
            (meta["zero_width_count"] > 0) * 1.2 +
            (meta["char_entropy"] > 4.5) * 0.8 +
            (meta["turn_drift"] > 0.5) * 1.0 +
            (meta["override_verb_count"] > 0) * 0.8 +
            (meta["roleplay_marker_count"] > 0) * 0.8
        )

        # Neighbor purity contribution
        nbr_mean = float(np.mean(edge_purities)) if edge_purities else 0.5
        raw_logit = float((nbr_mean - 0.5) * 3.5 + surface_risk - 0.7)

        # 4. Calibrated Multi-Signal Risk Fusion
        ood_dist = float(np.clip(meta["turn_drift"] * 0.8, 0.0, 1.0))
        risk_result = self.risk_calibrator.evaluate_risk(
            raw_logit=raw_logit,
            neighbor_purities=edge_purities,
            edge_weights=edge_weights,
            turn_drift=meta["turn_drift"],
            ood_distance=ood_dist,
            surface_meta=meta
        )

        lat_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        return AHDOutput(
            action=risk_result["action"],
            risk_score=risk_result["risk_score"],
            uncertainty=risk_result["uncertainty"],
            reason_code=risk_result["reason_code"],
            latency_ms=lat_ms,
            signals=risk_result["signals"],
            explanation=risk_result,
            snapshot_id="graph_v1"
        )

    def wrap_llm(
        self,
        llm_client: Any,
        raise_on_block: bool = False,
        refusal_message: Optional[str] = None
    ) -> AHDLLMWrapper:
        """
        Wraps any LLM callable with automated pre-inference safety screening.
        """
        return AHDLLMWrapper(
            llm_client=llm_client,
            guard=self,
            raise_on_block=raise_on_block,
            refusal_message=refusal_message
        )


__all__ = [
    "AHDJailbreakGuard",
    "AHDConfig",
    "AHDForJailbreakDetection",
    "AHDOutput",
    "AHDLLMWrapper",
    "AHDMiddleware",
    "AHDFeatureExtractor",
    "HeterogeneousHypergraph",
    "RiskCalibrator",
    "AnchorValidationGate"
]
