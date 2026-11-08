"""
Configuration class for AHD-Jailbreak Pre-Inference Defense Guardrail.
Inherits from transformers.PretrainedConfig for native Hugging Face Hub compatibility.
"""

from typing import Dict, Any, Optional
from transformers import PretrainedConfig


class AHDConfig(PretrainedConfig):
    model_type = "ahd_jailbreak"

    def __init__(
        self,
        feature_dim: int = 394,
        surface_dim: int = 10,
        semantic_dim: int = 384,
        hidden_dim: int = 128,
        num_layers: int = 2,
        num_nodes_V0: int = 4084,
        num_hyperedges_E0: int = 198,
        window_turns: int = 5,
        lambda_base: float = 0.20,
        tau_allow: float = 0.35,
        tau_block: float = 0.70,
        tau_uncertainty: float = 0.45,
        temperature_cal: float = 0.84,
        k_neighbors: int = 10,
        max_ego_nodes: int = 120,
        ema_alpha: float = 0.25,
        ema_max_delta: float = 0.15,
        core_anchor_lock_pct: float = 0.80,
        base_encoder: str = "sentence-transformers/all-MiniLM-L6-v2",
        **kwargs: Any
    ) -> None:
        super().__init__(**kwargs)
        self.feature_dim = feature_dim
        self.surface_dim = surface_dim
        self.semantic_dim = semantic_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.num_nodes_V0 = num_nodes_V0
        self.num_hyperedges_E0 = num_hyperedges_E0
        self.window_turns = window_turns
        self.lambda_base = lambda_base
        self.tau_allow = tau_allow
        self.tau_block = tau_block
        self.tau_uncertainty = tau_uncertainty
        self.temperature_cal = temperature_cal
        self.k_neighbors = k_neighbors
        self.max_ego_nodes = max_ego_nodes
        self.ema_alpha = ema_alpha
        self.ema_max_delta = ema_max_delta
        self.core_anchor_lock_pct = core_anchor_lock_pct
        self.base_encoder = base_encoder

