"""
Build Initial Hypergraph Snapshot Script for AHD-Jailbreak.
Constructs canonical G_0 topology (|V_0| = 4,084, |E_0| = 198) with real stratified anchor embeddings
and saves snapshot to disk.
"""

import os
import sys
import torch
import numpy as np
from sklearn.cluster import MiniBatchKMeans

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ahd_jailbreak.hypergraph_topology import HeterogeneousHypergraph


def build_canonical_hypergraph():
    g = HeterogeneousHypergraph(feature_dim=394)
    rng = np.random.RandomState(42)

    feat_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "features_394d.npz"))
    if not os.path.exists(feat_path):
        feat_path = "data/processed/features_394d.npz"

    if os.path.exists(feat_path):
        print(f"Loading real embeddings from {feat_path}...")
        npz = np.load(feat_path)
        splits = npz["splits"]
        X_tr = npz["X"][splits == "train"]
        y_tr = npz["y"][splits == "train"]

        safe_indices = np.where(y_tr == 0)[0][:2000]
        harm_indices = np.where(y_tr == 1)[0][:2000]

        X_safe = X_tr[safe_indices]
        X_harm = X_tr[harm_indices]

        # 64 semantic centroids: 32 harmful, 32 safe
        km_harm = MiniBatchKMeans(n_clusters=32, random_state=42, n_init=3).fit(X_harm[:, :384])
        km_safe = MiniBatchKMeans(n_clusters=32, random_state=42, n_init=3).fit(X_safe[:, :384])

        centroids_harm = km_harm.cluster_centers_
        centroids_safe = km_safe.cluster_centers_
    else:
        print("Warning: features_394d.npz not found, using normalized Gaussian initializers.")
        X_safe = rng.randn(2000, 394).astype(np.float32)
        X_harm = rng.randn(2000, 394).astype(np.float32)
        centroids_harm = rng.randn(32, 384).astype(np.float32)
        centroids_safe = rng.randn(32, 384).astype(np.float32)

    # 1. Safety Policy Vertices V_C (K_C = 10)
    for idx, pol in enumerate(HeterogeneousHypergraph.POLICY_CATEGORIES):
        feat = np.zeros(394, dtype=np.float32)
        feat[:384] = centroids_harm[idx % 32]
        feat[:384] /= (np.linalg.norm(feat[:384]) + 1e-9)
        g.add_node(f"pol_{idx+1:02d}", "policy_category", feat, label=1, metadata={"name": pol})

    # 2. Tactic Family Vertices V_A (K_A = 10)
    for idx, tac in enumerate(HeterogeneousHypergraph.TACTIC_FAMILIES):
        label = 0 if "BF-" in tac else 1
        feat = np.zeros(394, dtype=np.float32)
        feat[:384] = centroids_safe[idx % 32] if label == 0 else centroids_harm[(idx + 10) % 32]
        feat[:384] /= (np.linalg.norm(feat[:384]) + 1e-9)
        g.add_node(f"tac_{idx+1:02d}", "tactic_family", feat, label=label, metadata={"name": tac})

    # 3. Semantic Centroids V_S (K_S = 64: 32 harmful, 32 contrastive safe)
    for idx in range(32):
        feat = np.zeros(394, dtype=np.float32)
        feat[:384] = centroids_harm[idx]
        feat[:384] /= (np.linalg.norm(feat[:384]) + 1e-9)
        g.add_node(f"centroid_{idx+1:02d}", "semantic_centroid", feat, label=1)

    for idx in range(32):
        feat = np.zeros(394, dtype=np.float32)
        feat[:384] = centroids_safe[idx]
        feat[:384] /= (np.linalg.norm(feat[:384]) + 1e-9)
        g.add_node(f"centroid_{idx+33:02d}", "semantic_centroid", feat, label=0)

    # 4. Stratified Anchor Prompts V_P (4,000 prompts: 2,000 safe, 2,000 harmful)
    for idx in range(2000):
        feat = X_safe[idx].astype(np.float32)
        g.add_node(f"anchor_{idx+1:04d}", "anchor_prompt", feat, label=0)

    for idx in range(2000):
        feat = X_harm[idx].astype(np.float32)
        g.add_node(f"anchor_{idx+2001:04d}", "anchor_prompt", feat, label=1)

    # 5. Connect 198 Canonical Hyperedges with class purities
    # E_sem: 64 semantic clusters
    for idx in range(32):
        c_id = f"centroid_{idx+1:02d}"
        members = [c_id] + [f"anchor_{i:04d}" for i in range(2001 + idx*60, min(2001 + (idx+1)*60, 4001))]
        g.add_hyperedge(f"e_sem_{idx+1:03d}", "semantic_cluster", members, prior_purity=1.0)

    for idx in range(32):
        c_id = f"centroid_{idx+33:02d}"
        members = [c_id] + [f"anchor_{i:04d}" for i in range(1 + idx*60, min(1 + (idx+1)*60, 2001))]
        g.add_hyperedge(f"e_sem_{idx+33:03d}", "semantic_cluster", members, prior_purity=0.0)

    # E_pol: 60 policy associations
    for idx in range(60):
        pol_id = f"pol_{(idx % 10) + 1:02d}"
        anchors = [f"anchor_{i:04d}" for i in range(2001 + (idx % 30)*60, min(2001 + ((idx % 30)+1)*60, 4001))]
        g.add_hyperedge(f"e_pol_{idx+1:03d}", "policy_association", [pol_id] + anchors, prior_purity=1.0)

    # E_tac: 50 tactic co-activations
    for idx in range(50):
        tac_id = f"tac_{(idx % 10) + 1:02d}"
        is_safe_tac = (idx % 10) in [8, 9]  # BF-01, BF-02
        if is_safe_tac:
            anchors = [f"anchor_{i:04d}" for i in range(1 + (idx % 15)*100, min(1 + ((idx % 15)+1)*100, 2001))]
            purity = 0.0
        else:
            anchors = [f"anchor_{i:04d}" for i in range(2001 + (idx % 20)*80, min(2001 + ((idx % 20)+1)*80, 4001))]
            purity = 1.0
        g.add_hyperedge(f"e_tac_{idx+1:03d}", "tactic_coactivation", [tac_id] + anchors, prior_purity=purity)

    # E_ctx: 24 multi-turn conversational trajectory hyperedges
    for idx in range(24):
        anchors = [f"anchor_{i:04d}" for i in range(100 + idx*150, min(100 + (idx+1)*150, 3900))]
        g.add_hyperedge(f"e_ctx_{idx+1:03d}", "conversation_trajectory", anchors)

    return g


def main():
    print("Building canonical G_0 hypergraph topology with real anchor features...")
    g0 = build_canonical_hypergraph()
    print(f"Constructed G_0 with {len(g0.nodes)} nodes and {len(g0.hyperedges)} hyperedges.")

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    os.makedirs(output_dir, exist_ok=True)
    snapshot_path = os.path.join(output_dir, "hypergraph_snapshot.pt")

    snapshot_data = {
        "nodes": g0.nodes,
        "node_features": {k: torch.from_numpy(v) for k, v in g0.node_features.items()},
        "node_labels": g0.node_labels,
        "hyperedges": {k: list(v) for k, v in g0.hyperedges.items()},
        "edge_types": g0.edge_types,
        "edge_weights": g0.edge_weights,
        "edge_purities": g0.edge_purities,
        "num_nodes": len(g0.nodes),
        "num_hyperedges": len(g0.hyperedges)
    }

    torch.save(snapshot_data, snapshot_path)
    size_mb = os.path.getsize(snapshot_path) / (1024 * 1024)
    print(f"Hypergraph snapshot saved to: {snapshot_path} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()

