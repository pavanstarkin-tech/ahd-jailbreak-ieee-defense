"""
PyTorch Implementation of AHD-Jailbreak PreTrainedModel.
Inherits from transformers.PreTrainedModel for full Hugging Face Hub compatibility.
Implements 2-Layer Spectral Hypergraph Neural Network with residual connections and LayerNorm.
"""

from typing import Optional, Tuple, Dict, Any, Union
import torch
import torch.nn as nn
from transformers import PreTrainedModel

from .configuration_ahd import AHDConfig


class SpectralHypergraphConv(nn.Module):
    """
    Single layer of Spectral Hypergraph Convolution with residual connection,
    ELU activation, and LayerNorm following Eq. 3 of the paper:
      Z^(l+1) = LayerNorm(Z^(l) + ELU(P_t * Z^(l) * Theta^(l)))
    """

    def __init__(self, in_features: int, out_features: int) -> None:
        super().__init__()
        self.theta = nn.Parameter(torch.empty(in_features, out_features))
        self.bias = nn.Parameter(torch.zeros(out_features))
        self.layer_norm = nn.LayerNorm(out_features)
        self.act = nn.ELU()

        # Xavier initialization
        nn.init.xavier_uniform_(self.theta)

    def forward(self, z: torch.Tensor, p_norm: torch.Tensor) -> torch.Tensor:
        """
        z: [N, in_features]
        p_norm: [N, N] normalized hypergraph adjacency matrix
        """
        # Linear transform: z * theta
        h = torch.matmul(z, self.theta) + self.bias
        # Spectral propagation: P_t * h
        p_h = torch.matmul(p_norm, h)
        # Activation and residual connection
        out = self.layer_norm(z + self.act(p_h))
        return out


class AHDForJailbreakDetection(PreTrainedModel):
    """
    Complete AHD-Jailbreak Pre-Inference Defense Model.
    Compatible with Hugging Face Model Hub, AutoModel, and PreTrainedModel APIs.
    """
    config_class = AHDConfig
    base_model_prefix = "ahd_jailbreak"

    def __init__(self, config: AHDConfig) -> None:
        super().__init__(config)
        self.config = config

        # Input projection: R^394 -> R^128
        self.input_proj = nn.Sequential(
            nn.Linear(config.feature_dim, config.hidden_dim),
            nn.ReLU(),
            nn.LayerNorm(config.hidden_dim)
        )

        # 2-Layer Spectral Hypergraph Neural Network
        self.conv1 = SpectralHypergraphConv(config.hidden_dim, config.hidden_dim)
        self.conv2 = SpectralHypergraphConv(config.hidden_dim, config.hidden_dim)

        # Classification Head: R^128 -> R^1 logit
        self.classifier = nn.Sequential(
            nn.Linear(config.hidden_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 1)
        )

        self.post_init()

    def forward(
        self,
        node_features: torch.Tensor,
        p_norm: torch.Tensor,
        query_idx: int = 0
    ) -> Dict[str, torch.Tensor]:
        """
        node_features: [N, 394] features of ego-subhypergraph vertices
        p_norm: [N, N] normalized hypergraph adjacency matrix
        query_idx: index of query vertex in the ego-subhypergraph (default 0)
        """
        # Z^(0) = ReLU(X * W_in + b_in)
        z0 = self.input_proj(node_features)

        # Z^(1) = SpectralHGNN(Z^(0), P)
        z1 = self.conv1(z0, p_norm)

        # Z^(2) = SpectralHGNN(Z^(1), P)
        z2 = self.conv2(z1, p_norm)

        # Predict logit for query node
        query_repr = z2[query_idx:query_idx+1]
        raw_logit = self.classifier(query_repr).squeeze(-1)

        return {
            "logits": raw_logit,
            "hidden_states": z2,
            "query_representation": query_repr
        }

