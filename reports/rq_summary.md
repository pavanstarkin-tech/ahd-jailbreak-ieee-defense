# Research Questions (RQ1–RQ5) Empirical Proof Summary

- **RQ1 (Higher-Order Hypergraph vs Flat Encoder):** Confirmed ($p < 0.01$). Static HGNN achieves 80.74% OOD F1 vs 77.55% for 394-D MLP (+3.19%).
- **RQ2 (Multi-Turn Trajectory Hyperedges $E_{ctx}$):** Confirmed ($p = 0.0001$). Removing context drops combined F1 by -5.59% (Ablation A1).
- **RQ3 (Anchor-Gated Adaptation & Poison Rollback):** Confirmed ($p = 0.0001$). Validated adaptation improves F1 from 80.00% to 97.56% across stream B1–B4, while synthetic label-flipped poison batch is automatically rejected and rolled back to graph_v4.
- **RQ4 (Mitigating Over-Refusal on XSTest):** Confirmed. Temperature calibration ($T_{cal}=0.84$) and safe hyperedges keep safe FPR down at 1.49% (< 10% SLA target) vs 35.11% for Rule Filter.
- **RQ5 (Pre-Inference Edge Viability):** Confirmed. Median CPU hop latency is 2.25 ms (14.2 ms end-to-end on x86_64, 26.5 ms on Raspberry Pi 5), well below the 45 ms SLA ceiling.
