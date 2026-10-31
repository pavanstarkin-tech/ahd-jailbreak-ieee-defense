"""
AHD-Jailbreak: Heterogeneous Hypergraph Engine & Spectral Convolution
=====================================================================
Implements the heterogeneous hypergraph G_t = (V_t, E_t, W_t, X_t) with:
  - 5-modality vertex space: V_P (prompts), V_T (turns), V_S (clusters),
    V_C (policies), V_A (tactics).
  - 4 higher-order hyperedge families: E_sem, E_ctx, E_tac, E_pol.
  - Spectral hypergraph convolution: D_v^{-1/2} H W D_e^{-1} H^T D_v^{-1/2}.
  - 2-hop local ego-subhypergraph extraction (<= 120 nodes) for fast inference.
"""

from typing import Dict, List, Set, Tuple, Optional, Any
import numpy as np


class HeterogeneousHypergraph:
    """
    Weighted Heterogeneous Hypergraph G_t = (V_t, E_t, W_t, X_t)
    with sparse incidence computation and spectral propagation.
    """

    def __init__(self, feature_dim: int = 394):
        self.feature_dim = feature_dim
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.hyperedges: Dict[str, Set[str]] = {}
        self.edge_types: Dict[str, str] = {}
        self.edge_weights: Dict[str, float] = {}
        self.edge_purities: Dict[str, float] = {}

    def add_node(self, node_id: str, node_type: str, features: np.ndarray, label: Optional[int] = None):
        feat = np.asarray(features, dtype=np.float32)
        if feat.shape[0] != self.feature_dim:
            raise ValueError(f"Feature dim mismatch: expected {self.feature_dim}, got {feat.shape[0]}")
        self.nodes[node_id] = {
            "type": node_type,
            "features": feat,
            "label": label
        }

    def add_hyperedge(self, edge_id: str, edge_type: str, member_nodes: List[str], weight: float = 1.0, purity: float = 0.5):
        valid_members = {nid for nid in member_nodes if nid in self.nodes}
        if not valid_members:
            return
        self.hyperedges[edge_id] = valid_members
        self.edge_types[edge_id] = edge_type
        self.edge_weights[edge_id] = float(weight)
        self.edge_purities[edge_id] = float(purity)

    def extract_ego_subhypergraph(self, query_features: np.ndarray, k_neighbors: int = 10, max_nodes: int = 120) -> Tuple[List[str], List[str]]:
        """
        Extracts 2-hop local ego-subhypergraph around query prompt:
          1. Finds top-k nearest prompt/prototype nodes via cosine similarity.
          2. Extracts all 1-hop incident hyperedges.
          3. Expands to 2-hop incident nodes capped at max_nodes.
        """
        if not self.nodes:
            return [], []

        node_keys = list(self.nodes.keys())
        node_feats = np.stack([self.nodes[nid]["features"] for nid in node_keys], axis=0)

        q_norm = query_features / (np.linalg.norm(query_features) + 1e-9)
        n_norms = node_feats / (np.linalg.norm(node_feats, axis=1, keepdims=True) + 1e-9)
        sims = np.dot(n_norms, q_norm)

        top_k_indices = np.argsort(sims)[::-1][:min(k_neighbors, len(node_keys))]
        seed_nodes = {node_keys[idx] for idx in top_k_indices}

        # 1-Hop: Collect all hyperedges containing any seed node
        incident_edges = set()
        for e_id, members in self.hyperedges.items():
            if seed_nodes.intersection(members):
                incident_edges.add(e_id)

        # 2-Hop: Collect all nodes belonging to incident hyperedges
        sub_nodes = set(seed_nodes)
        for e_id in incident_edges:
            sub_nodes.update(self.hyperedges[e_id])
            if len(sub_nodes) >= max_nodes:
                break

        selected_nodes = list(sub_nodes)[:max_nodes]
        selected_edges = [e_id for e_id in incident_edges if self.hyperedges[e_id].intersection(selected_nodes)]
        return selected_nodes, selected_edges

    def compute_spectral_operator(self, selected_nodes: List[str], selected_edges: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Computes the normalized hypergraph Laplacian propagation operator:
          P = D_v^{-1/2} H W D_e^{-1} H^T D_v^{-1/2}
        """
        num_v = len(selected_nodes)
        num_e = len(selected_edges)
        if num_v == 0 or num_e == 0:
            return np.zeros((0, 0), dtype=np.float32), np.zeros((0, self.feature_dim), dtype=np.float32)

        node_idx = {nid: i for i, nid in enumerate(selected_nodes)}
        H = np.zeros((num_v, num_e), dtype=np.float32)
        W = np.zeros(num_e, dtype=np.float32)

        for j, e_id in enumerate(selected_edges):
            W[j] = self.edge_weights.get(e_id, 1.0)
            for nid in self.hyperedges[e_id]:
                if nid in node_idx:
                    H[node_idx[nid], j] = 1.0

        # Degree computations
        De_diag = np.sum(H, axis=0)  # Hyperedge degrees
        De_diag[De_diag == 0] = 1.0
        De_inv = 1.0 / De_diag

        # Weighted vertex degree Dv = H W 1
        Dv_diag = np.sum(H * (W * De_inv), axis=1)
        Dv_diag[Dv_diag <= 1e-6] = 1.0
        Dv_inv_sqrt = 1.0 / np.sqrt(Dv_diag)

        # High-order propagation operator P
        HWDeInv = H * (W * De_inv)
        P = (Dv_inv_sqrt[:, None] * HWDeInv) @ (H.T * Dv_inv_sqrt[None, :])

        X = np.stack([self.nodes[nid]["features"] for nid in selected_nodes], axis=0)
        return P, X

    def spectral_propagate(self, selected_nodes: List[str], selected_edges: List[str], num_layers: int = 2) -> np.ndarray:
        """
        Executes multi-layer spectral message passing with residual normalization.
        """
        P, X = self.compute_spectral_operator(selected_nodes, selected_edges)
        if P.shape[0] == 0:
            return np.zeros((0, self.feature_dim), dtype=np.float32)

        Z = X.copy()
        for _ in range(num_layers):
            # Propagate features through hypergraph topology
            Z_next = P @ Z
            # Non-linear activation (ELU approximation) and residual
            Z = np.maximum(Z_next, 0.1 * (np.exp(np.clip(Z_next, -5.0, 5.0)) - 1.0)) + 0.1 * Z
            # Layer normalization
            mean = np.mean(Z, axis=-1, keepdims=True)
            std = np.std(Z, axis=-1, keepdims=True) + 1e-6
            Z = (Z - mean) / std

        return Z


def build_default_anchor_graph(feature_dim: int = 394) -> HeterogeneousHypergraph:
    """
    Initializes canonical G_0 topology (4,084 nodes, 198 hyperedges)
    covering 64 semantic clusters, 10 safety policies, and 10 attack tactics.
    """
    graph = HeterogeneousHypergraph(feature_dim=feature_dim)
    rng = np.random.RandomState(42)

    # 1. Add 10 Safety Policy constraint nodes (V_C)
    policies = [
        "pol:malware_cyber", "pol:cbrn_weapons", "pol:self_harm", "pol:hate_harass",
        "pol:sexual_violence", "pol:fraud_deception", "pol:privacy_leakage",
        "pol:illegal_acts", "pol:system_override", "pol:physical_harm"
    ]
    for pol_id in policies:
        feat = rng.randn(feature_dim).astype(np.float32)
        feat /= np.linalg.norm(feat) + 1e-9
        graph.add_node(pol_id, "policy", feat, label=1)

    # 2. Add 10 Structural Attack Taxonomy nodes (V_A)
    tactics = [
        "tac:crescendo_drift", "tac:persona_roleplay", "tac:base64_cipher",
        "tac:gcg_suffix", "tac:autodan_template", "tac:hypothetical_distancing",
        "tac:few_shot_override", "tac:refusal_suppression", "tac:multilingual_pivot",
        "tac:contrastive_benign"
    ]
    for tac_id in tactics:
        feat = rng.randn(feature_dim).astype(np.float32)
        feat /= np.linalg.norm(feat) + 1e-9
        graph.add_node(tac_id, "tactic", feat, label=0 if "benign" in tac_id else 1)

    # 3. Add 64 Spherical Semantic Cluster Prototypes (V_S)
    for i in range(64):
        cid = f"sem_cluster_{i:02d}"
        is_safe = (i % 2 == 1)
        feat = rng.randn(feature_dim).astype(np.float32)
        feat /= np.linalg.norm(feat) + 1e-9
        graph.add_node(cid, "cluster", feat, label=0 if is_safe else 1)

    # 4. Add 4,000 Anchor Prompts (V_P)
    for i in range(4000):
        pid = f"anchor_prompt_{i:04d}"
        is_harmful = (i < 2000)
        feat = rng.randn(feature_dim).astype(np.float32)
        feat /= np.linalg.norm(feat) + 1e-9
        graph.add_node(pid, "prompt", feat, label=1 if is_harmful else 0)

    # 5. Connect Initial Hyperedges (E_sem, E_ctx, E_tac, E_pol = 198 hyperedges)
    # 64 Semantic hyperedges
    for i in range(64):
        cid = f"sem_cluster_{i:02d}"
        sample_anchors = [f"anchor_prompt_{(i*60 + j) % 4000:04d}" for j in range(15)]
        purity = 0.05 if (i % 2 == 1) else 0.95
        w = 0.20 + 0.80 * abs(2.0 * purity - 1.0)
        graph.add_hyperedge(f"edge_sem_{i:02d}", "E_sem", [cid] + sample_anchors, weight=w, purity=purity)

    # 10 Policy hyperedges
    for j, pol in enumerate(policies):
        sample_anchors = [f"anchor_prompt_{(j*150 + k) % 2000:04d}" for k in range(25)]
        graph.add_hyperedge(f"edge_pol_{j:02d}", "E_pol", [pol] + sample_anchors, weight=1.0, purity=0.98)

    # 10 Tactic hyperedges
    for k, tac in enumerate(tactics):
        purity = 0.02 if "benign" in tac else 0.96
        sample_anchors = [f"anchor_prompt_{(k*120 + m) % 4000:04d}" for m in range(20)]
        w = 0.20 + 0.80 * abs(2.0 * purity - 1.0)
        graph.add_hyperedge(f"edge_tac_{k:02d}", "E_tac", [tac] + sample_anchors, weight=w, purity=purity)

    # Contextual multi-turn escalation hyperedges
    for c in range(114):
        members = [f"anchor_prompt_{(c*33 + n) % 4000:04d}" for n in range(4)]
        graph.add_hyperedge(f"edge_ctx_{c:03d}", "E_ctx", members, weight=0.85, purity=0.88)

    return graph
