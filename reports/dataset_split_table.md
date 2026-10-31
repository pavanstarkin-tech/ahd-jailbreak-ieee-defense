# Table 1: Leakage-Free 6-Partition Multi-Benchmark Dataset Summary (14,500 Samples)

| Partition (Split) | Sample Count | Primary Source Datasets | Isolation Protocol & Experimental Usage |
|:---|:---:|:---|:---|
| **1. train** | 8,000 | WildGuardTrain, WildJailbreak (train), ScaleAI MHJ (70%) | Grouped by cluster & conversation_id; fits $G_0$ (4,084 nodes) and HGNN. |
| **2. val** | 2,000 | WildGuardVal & WildJailbreakVal (disjoint clusters) | Tunes thresholds ($	au_{\text{allow}}=0.35, \tau_{\text{block}}=0.70$), $T_{\text{cal}}=0.84$, locks 500 anchors. |
| **3. test_id** | 1,725 | WildGuardTest (human-audited) | Cosine $< 0.90$ to train; evaluates in-distribution accuracy (RQ1). |
| **4. test_ood_family** | 1,200 | Base64, GCG, AutoDAN, Crescendo (30%) | 4 chronological stream windows ($B_1 \dots B_4$) for prequential adaptation (RQ2, RQ3). |
| **5. test_cross_dataset** | 800 | JailbreakBench (500) & StrongREJECT (313) | External benchmarks; measures cross-dataset transferability. |
| **6. test_benign_fpr** | 1,450 | XSTest (450) & OR-Bench-Hard-1K (1,000) | Strictly locked over-refusal test suite; evaluates false-positive rate (RQ4). |
