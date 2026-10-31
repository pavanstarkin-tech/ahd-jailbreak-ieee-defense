# Table 2: 5-Seed Master Benchmark Comparison Matrix (Seeds: 42, 100, 2026, 7, 99)

| Defense Baseline | ID Test F1 (%) | AUROC | AUPRC | XSTest Safe FPR (%) | Held-Out OOD F1 (%) | Cross-Dataset JBB F1 (%) | CPU Hop P50 / P95 (ms) | McNemar p vs B4 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **B1: Rule-Based Heuristic** | 79.02 ± 0.00 | 0.9312 | 0.9247 | 35.11% | 92.94% | 85.44% | 0.43 / 0.89 | < 0.0001 |
| **B2a: TF-IDF + Logistic Reg.** | 100.00 ± 0.00 | 1.0000 | 1.0000 | 23.40% | 97.67% | 99.03% | 1.28 / 1.97 | 0.1814 |
| **B2b: Matched-Encoder 394-D MLP** | 100.00 ± 0.00 | 1.0000 | 1.0000 | 0.00% | 77.55% | 74.96% | 1.12 / 1.78 | < 0.0001 |
| **B3: Static Hypergraph ($G_0$)** | 100.00 ± 0.00 | 1.0000 | 1.0000 | 2.98% | 80.74% | 74.47% | 2.24 / 3.17 | 0.0001 |
| **B4: Adaptive Hypergraph (AHD)** | **100.00 ± 0.00** | **1.0000** | **1.0000** | **1.49%** | **93.67%** | **90.32%** | **2.25 / 3.26** | **Reference** |
| **B5: Prompt-Guard-2-86M** | 73.68 ± 0.00 | 0.9815 | 0.9837 | 0.00% | 71.76% | 69.23% | 1.32 / 2.14 | < 0.0001 |
