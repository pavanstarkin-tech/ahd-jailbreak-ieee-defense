# Table 3: Systematic Ablation Study (Combined Multi-Split Suite with McNemar's Test)

| Configuration | Component Removed | Combined F1 (%) | ΔF1 vs Full | XSTest FPR (%) | Calibration ECE | McNemar χ² (p-value) |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **Full AHD-Jailbreak (B4)** | *None (Reference 14-Module Architecture)* | **90.05%** | **0.00%** | **0.00%** | **0.0502** | **Ref (1.0000)** |
| **Ablation A1** | Remove Context Turns $\mathcal{V}_T$ & $\mathcal{E}_{\text{ctx}}$ | 84.46% | -5.59% | 0.00% | 0.0640 | 15.04 ($p=0.0001$) |
| **Ablation A2** | Zero out 384-D Semantic Embeddings | 22.40% | -67.65% | 3.19% | 0.1322 | 136.10 ($p<0.0001$) |
| **Ablation A3** | Pairwise Graph Only ($|e|=2$ k-NN GCN) | 85.35% | -4.70% | 5.32% | 0.0478 | 10.24 ($p=0.0014$) |
| **Ablation A4** | No Module 14 Adaptive Updates (Static $G_0$) | 84.46% | -5.59% | 5.32% | 0.0510 | 15.04 ($p=0.0001$) |
| **Ablation A5** | No OOD Novelty Signal ($S_{\text{OOD}}=0$) | 84.37% | -5.68% | 4.26% | 0.0668 | 15.04 ($p=0.0001$) |
| **Ablation A6** | Uncalibrated Logits ($T_{\text{cal}}=1.0$) | 83.38% | -6.67% | 12.77% | 0.1371 | 21.04 ($p<0.0001$) |
