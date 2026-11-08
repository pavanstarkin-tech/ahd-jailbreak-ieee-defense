"""
Build Initial Hypergraph Snapshot Script for AHD-Jailbreak.
Constructs canonical G_0 topology (|V_0| = 4,084, |E_0| = 198) and saves snapshot to disk.
"""

import os
import sys
import torch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ahd_jailbreak.hypergraph_topology import build_default_hypergraph


def main():
    print("Building canonical G_0 hypergraph topology...")
    g0 = build_default_hypergraph()
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
