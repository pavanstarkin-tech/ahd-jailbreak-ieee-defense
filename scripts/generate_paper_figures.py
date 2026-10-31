"""
AHD-Jailbreak: Publication-Grade IEEE Figure Generator
======================================================
Generates high-resolution publication-quality vector and raster figures for:
  - Figure 1: (A) 5-Seed Master Benchmark Comparison & (B) Systematic Ablation Study
  - Figure 2: (A) Prequential OOD Stream Adaptation & (B) Temperature Scaling Calibration Curve
  - Figure 3: (A) Multi-Turn Crescendo Trajectory & (B) Real-World Stage-by-Stage Latency Breakdown
  - Figure 0: High-Level End-to-End AHD-Jailbreak System Architecture
"""

import os
import matplotlib.pyplot as plt
import numpy as np

# Configure publication-grade styling
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.labelsize": 10,
    "axes.titlesize": 11,
    "xtick.labelsize": 9,
    "ytick.labelsize": 9,
    "legend.fontsize": 8.5,
    "figure.titlesize": 12,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "axes.grid": True,
    "grid.alpha": 0.35,
    "grid.linestyle": "--"
})

TEAL = "#0d9488"
NAVY = "#0f172a"
RED = "#dc2626"
AMBER = "#f59e0b"
BLUE = "#2563eb"
SLATE = "#64748b"
PURPLE = "#7c3aed"
LIGHT_TEAL = "#ccfbf1"
LIGHT_RED = "#fee2e2"


def generate_figure_1(out_dir: str):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    # --- Subplot 1 (A): 5-Seed Benchmark Comparison ---
    models = ["B1: Rule\nFilter", "B2a: TF-IDF\n+ LogReg", "B2b: Matched\n394-D MLP", "B3: Static\nHGNN", "B4: AHD\n(Ours)", "B5: Prompt\nGuard-86M"]
    x = np.arange(len(models))
    width = 0.26

    ood_f1 = [92.94, 97.67, 77.55, 80.74, 93.67, 71.76]
    jbb_f1 = [85.44, 99.03, 74.96, 74.47, 90.32, 69.23]
    safe_acc = [64.89, 76.60, 100.00, 97.02, 98.51, 100.00] # 100 - FPR

    rects1 = ax1.bar(x - width, ood_f1, width, label="Held-Out OOD F1 (%)", color=TEAL, edgecolor=NAVY, linewidth=0.8)
    rects2 = ax1.bar(x, jbb_f1, width, label="Cross-Dataset JBB F1 (%)", color=BLUE, edgecolor=NAVY, linewidth=0.8)
    rects3 = ax1.bar(x + width, safe_acc, width, label="XSTest Safe Acceptance (100 - FPR %)", color=PURPLE, edgecolor=NAVY, linewidth=0.8)

    ax1.set_ylabel("Score / Rate (%)", fontweight="bold")
    ax1.set_title("A. 5-Seed Master Benchmark Comparison (B1–B5)", fontweight="bold", pad=12)
    ax1.set_xticks(x)
    ax1.set_xticklabels(models)
    ax1.set_ylim(40, 115)
    ax1.legend(loc="lower right", framealpha=0.95)

    # Highlight B4 performance
    ax1.annotate("Optimal Balance:\n93.7% OOD & 98.5% Safe", xy=(4, 98.51), xytext=(3.2, 106),
                 arrowprops=dict(facecolor=NAVY, arrowstyle="->", lw=1.2),
                 fontsize=8.5, fontweight="bold", bbox=dict(boxstyle="round,pad=0.3", fc=LIGHT_TEAL, ec=TEAL))

    # --- Subplot 2 (B): Systematic Ablation Study ---
    ablations = [
        "A6: Uncalibrated (T_cal=1)",
        "A5: No OOD Novelty (w4=0)",
        "A4: Static Topology (G_0)",
        "A3: Pairwise GNN (|e|=2)",
        "A2: No 384-d Dense Semantics",
        "A1: No Multi-Turn Ctx (W=1)",
        "Full AHD-Jailbreak (Ref)"
    ]
    f1_scores = [83.38, 84.37, 84.46, 85.35, 22.40, 84.46, 90.05]
    fpr_annotations = [
        "83.38% (-6.67% | FPR: 12.8%)",
        "84.37% (-5.68% | FPR: 4.3%)",
        "84.46% (-5.59% | FPR: 5.3%)",
        "85.35% (-4.70% | FPR: 5.3%)",
        "22.40% (-67.65% | FPR: 3.2%)",
        "84.46% (-5.59% | FPR: 0.0%)",
        "90.05% (Ref | FPR: 0.0%)"
    ]
    colors = [SLATE, SLATE, SLATE, SLATE, RED, SLATE, TEAL]

    y = np.arange(len(ablations))
    bars = ax2.barh(y, f1_scores, color=colors, edgecolor=NAVY, height=0.6, linewidth=0.8)
    ax2.set_xlabel("Combined Benchmark Macro-F1 (%)", fontweight="bold")
    ax2.set_title("B. Systematic Ablation Study (A1–A6) & McNemar Impact", fontweight="bold", pad=12)
    ax2.set_yticks(y)
    ax2.set_yticklabels(ablations)
    ax2.set_xlim(0, 115)

    for bar, text in zip(bars, fpr_annotations):
        width_val = bar.get_width()
        ax2.text(width_val + 1.5, bar.get_y() + bar.get_height() / 2, text, va="center", ha="left", fontsize=8, fontweight="bold", color=NAVY)

    plt.tight_layout()
    png_path = os.path.join(out_dir, "fig1_benchmark_and_ablations.png")
    pdf_path = os.path.join(out_dir, "fig1_benchmark_and_ablations.pdf")
    plt.savefig(png_path)
    plt.savefig(pdf_path)
    plt.close()
    print(f"[SUCCESS] Figure 1 saved to {png_path} and {pdf_path}")


def generate_figure_2(out_dir: str):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    # --- Subplot 1 (A): Prequential OOD Stream Adaptation & Poison Rollback ---
    windows = ["Window B1\n(AF-04 Base64)", "Window B2\n(AF-05 GCG)", "Window B3\n(AF-06 AutoDAN)", "Window B4\n(AF-07 Crescendo)"]
    x = np.arange(len(windows))

    ahd_f1 = [80.00, 100.00, 97.44, 97.56]
    static_f1 = [77.78, 82.93, 82.35, 80.00]

    ax1.plot(x, ahd_f1, marker="o", color=TEAL, linewidth=2.5, markersize=8, label="Validated Adaptive Hypergraph ($G_t$)")
    ax1.plot(x, static_f1, marker="s", color=SLATE, linewidth=2.0, linestyle="--", markersize=7, label="Frozen Static Hypergraph ($G_0$)")

    # Poison Injection at Window B3
    poison_x = 2.0
    poison_y = 37.44
    ax1.plot(poison_x, poison_y, marker="X", color=RED, markersize=12, label="Poisoned Batch Candidate (Anchor F1=40%)")
    ax1.annotate("Anchor Gate Rollback!\nRetains $G_2$ (97.44%)", xy=(poison_x, poison_y), xytext=(poison_x - 0.45, poison_y + 16),
                 arrowprops=dict(facecolor=RED, arrowstyle="->", lw=1.2),
                 fontsize=8.5, fontweight="bold", color=RED, bbox=dict(boxstyle="round,pad=0.3", fc=LIGHT_RED, ec=RED))

    # Annotate final gain
    ax1.annotate("+17.56% F1 Gain over Static", xy=(3, 97.56), xytext=(2.2, 90),
                 arrowprops=dict(facecolor=TEAL, arrowstyle="->", lw=1.2),
                 fontsize=8.5, fontweight="bold", color=TEAL, bbox=dict(boxstyle="round,pad=0.3", fc=LIGHT_TEAL, ec=TEAL))

    for i in range(len(windows)):
        ax1.text(x[i], ahd_f1[i] + 2.5, f"{ahd_f1[i]:.1f}%", ha="center", fontsize=8.5, fontweight="bold", color=TEAL)
        ax1.text(x[i], static_f1[i] - 4.5, f"{static_f1[i]:.1f}%", ha="center", fontsize=8, color=SLATE)

    ax1.set_ylabel("Prequential Test-Then-Adapt F1 (%)", fontweight="bold")
    ax1.set_title("A. Prequential OOD Stream Adaptation & Poison Rollback (RQ3)", fontweight="bold", pad=12)
    ax1.set_xticks(x)
    ax1.set_xticklabels(windows)
    ax1.set_ylim(25, 110)
    ax1.legend(loc="lower left", framealpha=0.95)

    # --- Subplot 2 (B): Calibration Curve & Policy Threshold Transfer ---
    prob_pred = np.linspace(0.05, 0.95, 10)
    uncalibrated = np.array([0.15, 0.28, 0.45, 0.58, 0.72, 0.81, 0.89, 0.93, 0.96, 0.98])
    calibrated = np.array([0.06, 0.14, 0.24, 0.36, 0.48, 0.60, 0.71, 0.81, 0.90, 0.95])

    ax2.plot([0, 1], [0, 1], "k--", label="Perfect Calibration (Diagonal)", alpha=0.6)
    ax2.plot(prob_pred, uncalibrated, marker="^", color=RED, linestyle="-", linewidth=2.0, label="Uncalibrated Logits ($T=1.0$, ECE=0.1371, FPR=12.77%)")
    ax2.plot(prob_pred, calibrated, marker="o", color=TEAL, linestyle="-", linewidth=2.5, label="Temperature Scaled ($T_{\mathrm{cal}}=0.84$, ECE=0.0502, FPR=1.49%)")

    # Shaded Quarantine Band
    ax2.axvspan(0.35, 0.70, color=AMBER, alpha=0.15, label="Review / Quarantine Band [$\\tau_{\mathrm{allow}}=0.35, \\tau_{\mathrm{block}}=0.70$]")
    ax2.axvline(0.35, color=AMBER, linestyle=":", alpha=0.8)
    ax2.axvline(0.70, color=RED, linestyle=":", alpha=0.8)

    ax2.set_xlabel("Predicted Calibrated Risk Probability $P_{\mathrm{cal}}(x)$", fontweight="bold")
    ax2.set_ylabel("Empirical Unsafe Fraction (Validation / Test)", fontweight="bold")
    ax2.set_title("B. Risk Calibration Curve & Policy Threshold Transfer (RQ4)", fontweight="bold", pad=12)
    ax2.set_xlim(0, 1)
    ax2.set_ylim(0, 1.05)
    ax2.legend(loc="upper left", framealpha=0.95, fontsize=8)

    plt.tight_layout()
    png_path = os.path.join(out_dir, "fig2_adaptation_and_calibration.png")
    pdf_path = os.path.join(out_dir, "fig2_adaptation_and_calibration.pdf")
    plt.savefig(png_path)
    plt.savefig(pdf_path)
    plt.close()
    print(f"[SUCCESS] Figure 2 saved to {png_path} and {pdf_path}")


def generate_figure_3(out_dir: str):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    # --- Subplot 1 (A): Multi-Turn Crescendo Trajectory ---
    turns = ["Turn 1\n(Benign Protocol Q)", "Turn 2\n(Legacy Token Validation)", "Turn 3\n(Forge Token Exploit)"]
    x = np.arange(len(turns))

    ahd_trajectory = [0.09, 0.38, 0.86]
    single_turn_traj = [0.06, 0.18, 0.42]
    regex_traj = [0.00, 0.04, 0.35]

    ax1.plot(x, ahd_trajectory, marker="o", color=RED, linewidth=2.8, markersize=8, label="B4: AHD-Jailbreak (Joint $E_{\mathrm{ctx}}$ Hyperedge)")
    ax1.plot(x, single_turn_traj, marker="s", color=BLUE, linewidth=2.0, linestyle="--", markersize=7, label="B2b/B3: Single-Turn / Static Baseline")
    ax1.plot(x, regex_traj, marker="^", color=SLATE, linewidth=1.8, linestyle=":", markersize=6, label="B1: Lexical Regex Filter")

    ax1.axhline(0.70, color=RED, linestyle="-.", linewidth=1.5, label="Block Threshold ($\\tau_{\mathrm{block}}=0.70$)")
    ax1.axhline(0.35, color=TEAL, linestyle="--", linewidth=1.2, label="Review Threshold ($\\tau_{\mathrm{allow}}=0.35$)")

    ax1.text(0, 0.09 + 0.04, "R = 0.09", fontweight="bold", color=RED, fontsize=8.5)
    ax1.text(1, 0.38 + 0.04, "R = 0.38", fontweight="bold", color=RED, fontsize=8.5)
    ax1.text(2, 0.86 + 0.04, "R = 0.86", fontweight="bold", color=RED, fontsize=8.5)

    ax1.set_ylabel("Calibrated Risk Score $R(x)$", fontweight="bold")
    ax1.set_title("A. Multi-turn Crescendo Escalation Trajectory (Scenario 4 / RQ2)", fontweight="bold", pad=12)
    ax1.set_xticks(x)
    ax1.set_xticklabels(turns)
    ax1.set_ylim(-0.05, 1.1)
    ax1.legend(loc="upper left", framealpha=0.95)

    # --- Subplot 2 (B): Stage-by-Stage Latency Breakdown Across Hardware ---
    platforms = [
        "Jetson Orin Nano\n(8GB TensorRT)",
        "Apple M2 Pro\n(ARM64 CPU)",
        "x86_64 Xeon\n(AVX-512 ONNX)",
        "Raspberry Pi 5\n(ARM64 INT8)",
        "Raspberry Pi 5\n(FP32 PyTorch)"
    ]

    minilm_lat = np.array([6.2, 8.4, 10.5, 21.0, 58.5])
    knn_ego_lat = np.array([1.8, 2.0, 2.2, 2.4, 4.5])
    hgnn_lat = np.array([1.4, 1.4, 1.5, 3.1, 5.0])

    x_hw = np.arange(len(platforms))
    w = 0.55

    b1 = ax2.bar(x_hw, minilm_lat, w, label="394-d MiniLM + Surface Extraction (ms)", color=BLUE, edgecolor=NAVY, linewidth=0.8)
    b2 = ax2.bar(x_hw, knn_ego_lat, w, bottom=minilm_lat, label="k-NN Index & 2-Hop Ego-Graph Extraction (ms)", color=TEAL, edgecolor=NAVY, linewidth=0.8)
    b3 = ax2.bar(x_hw, hgnn_lat, w, bottom=minilm_lat + knn_ego_lat, label="2-Layer PyG HypergraphConv + Calibration (ms)", color=AMBER, edgecolor=NAVY, linewidth=0.8)

    # SLA threshold lines
    ax2.axhline(45, color=SLATE, linestyle="--", linewidth=1.5, label="Target Median Latency SLA (45 ms)")
    ax2.axhline(120, color=RED, linestyle=":", linewidth=1.5, label="Max P95 Ceiling (120 ms)")

    totals = minilm_lat + knn_ego_lat + hgnn_lat
    for i in range(len(platforms)):
        ax2.text(x_hw[i], totals[i] + 2.0, f"{totals[i]:.1f} ms", ha="center", fontsize=8.5, fontweight="bold", color=NAVY)

    ax2.set_ylabel("End-to-End Middleware Latency (ms)", fontweight="bold")
    ax2.set_title("B. Real-World Board Stage-by-Stage Latency Profile (RQ5)", fontweight="bold", pad=12)
    ax2.set_xticks(x_hw)
    ax2.set_xticklabels(platforms)
    ax2.set_ylim(0, 130)
    ax2.legend(loc="upper left", framealpha=0.95)

    plt.tight_layout()
    png_path = os.path.join(out_dir, "fig3_crescendo_and_latency.png")
    pdf_path = os.path.join(out_dir, "fig3_crescendo_and_latency.pdf")
    plt.savefig(png_path)
    plt.savefig(pdf_path)
    plt.close()
    print(f"[SUCCESS] Figure 3 saved to {png_path} and {pdf_path}")


def generate_figure_0_architecture(out_dir: str):
    """
    Renders clean publication-grade architecture diagram of AHD-Jailbreak.
    """
    fig, ax = plt.subplots(figsize=(13, 5.2))
    ax.axis("off")

    # Pipeline stages
    boxes = [
        {"x": 0.02, "y": 0.36, "w": 0.16, "h": 0.36, "title": "1. Multi-Turn Query\n& Context History", "desc": "Prompt $v_q$ + History\n$W_{\\mathrm{turn}} = 5$ turns\n$\\mathcal{V}_T$ Trajectory", "color": "#e0f2fe", "ec": "#0284c7"},
        {"x": 0.21, "y": 0.36, "w": 0.18, "h": 0.36, "title": "2. Pre-NFKC Surface\n+ Dense Feature Engine", "desc": "10-D Surface Indicators\n(Entropy, B64, ZW, Drift)\n+ 384-D MiniLM $\\to \\mathbf{x}_q \\in \\mathbb{R}^{394}$", "color": "#f0fdf4", "ec": "#16a34a"},
        {"x": 0.42, "y": 0.36, "w": 0.18, "h": 0.36, "title": "3. Inductive 2-Hop\nEgo-Hypergraph", "desc": "$k$-NN Index ($k=10$)\n$\\leq 120$ Incident Nodes\n$\\mathcal{E}_{\\mathrm{sem}}, \\mathcal{E}_{\\mathrm{ctx}}, \\mathcal{E}_{\\mathrm{tac}}, \\mathcal{E}_{\\mathrm{pol}}$", "color": "#ccfbf1", "ec": "#0d9488"},
        {"x": 0.63, "y": 0.36, "w": 0.17, "h": 0.36, "title": "4. 2-Layer Spectral\nHypergraphConv", "desc": "$\\mathbf{P}_t = \\mathbf{D}_v^{-1/2} \\mathbf{H}_t \\mathbf{W}_t \\dots$\nTemperature Scaling\n$T_{\\mathrm{cal}} = 0.84$ (L-BFGS)", "color": "#fef3c7", "ec": "#d97706"},
        {"x": 0.83, "y": 0.36, "w": 0.15, "h": 0.36, "title": "5. Multi-Signal\nRisk Fusion", "desc": "$R(x) = 0.50 P_{\\mathrm{cal}} +$\n$0.25 S_{\\mathrm{nbr}} + 0.15 S_{\\mathrm{ctx}}$\n$+ 0.10 S_{\\mathrm{OOD}}$", "color": "#f3e8ff", "ec": "#7c3aed"}
    ]

    for b in boxes:
        rect = plt.Rectangle((b["x"], b["y"]), b["w"], b["h"], facecolor=b["color"], edgecolor=b["ec"], linewidth=1.5, transform=ax.transAxes, zorder=2)
        ax.add_patch(rect)
        ax.text(b["x"] + b["w"] / 2, b["y"] + b["h"] - 0.08, b["title"], ha="center", va="center", fontsize=8.5, fontweight="bold", color=NAVY, transform=ax.transAxes, zorder=3)
        ax.text(b["x"] + b["w"] / 2, b["y"] + 0.10, b["desc"], ha="center", va="center", fontsize=7.5, color=NAVY, transform=ax.transAxes, zorder=3)

    # Connecting arrows between pipeline stages
    for i in range(len(boxes) - 1):
        x_start = boxes[i]["x"] + boxes[i]["w"]
        x_end = boxes[i + 1]["x"]
        y_mid = 0.54
        ax.annotate("", xy=(x_end, y_mid), xytext=(x_start, y_mid),
                    arrowprops=dict(facecolor=NAVY, arrowstyle="->", lw=1.5), xycoords=ax.transAxes)

    # Outcomes & Actions
    rect_allow = plt.Rectangle((0.83, 0.80), 0.15, 0.13, facecolor="#dcfce7", edgecolor="#16a34a", linewidth=1.5, transform=ax.transAxes)
    rect_block = plt.Rectangle((0.83, 0.04), 0.15, 0.13, facecolor="#fee2e2", edgecolor="#dc2626", linewidth=1.5, transform=ax.transAxes)
    rect_anchor = plt.Rectangle((0.36, 0.04), 0.43, 0.19, facecolor="#f8fafc", edgecolor="#475569", linewidth=1.5, linestyle="--", transform=ax.transAxes)

    ax.add_patch(rect_allow)
    ax.add_patch(rect_block)
    ax.add_patch(rect_anchor)

    ax.text(0.905, 0.865, "ALLOW (R < 0.35)\nForward to LLM", ha="center", va="center", fontsize=8, fontweight="bold", color="#15803d", transform=ax.transAxes)
    ax.text(0.905, 0.105, "BLOCK (R >= 0.70)\nInline Refusal (403)", ha="center", va="center", fontsize=8, fontweight="bold", color="#b91c1c", transform=ax.transAxes)
    ax.text(0.575, 0.135, "Module 14: Anchor Validation Gate & Quarantine Buffer\nPromote G_{t+1} iff Delta F1 >= -0.5% and Delta FPR <= +1.0%\nLocked 500 Validation Anchors | Automatic Poison Rollback", ha="center", va="center", fontsize=8, fontweight="bold", color="#334155", transform=ax.transAxes)

    # Connecting arrows to outcomes
    ax.annotate("", xy=(0.905, 0.80), xytext=(0.905, 0.72), arrowprops=dict(facecolor="#16a34a", arrowstyle="->", lw=1.6), xycoords=ax.transAxes)
    ax.annotate("", xy=(0.905, 0.17), xytext=(0.905, 0.36), arrowprops=dict(facecolor="#dc2626", arrowstyle="->", lw=1.6), xycoords=ax.transAxes)
    ax.annotate("Quarantine / Ambiguous", xy=(0.79, 0.14), xytext=(0.84, 0.28),
                arrowprops=dict(facecolor="#d97706", arrowstyle="->", lw=1.4, connectionstyle="arc3,rad=-0.15"),
                fontsize=7.5, color="#d97706", fontweight="bold", xycoords=ax.transAxes)

    # Title Banner
    ax.text(0.5, 0.97, "AHD-Jailbreak: Inductive Pre-Inference Defense Architecture & Anchor-Gated Adaptation Pipeline",
            ha="center", va="center", fontsize=11.5, fontweight="bold", color=NAVY, transform=ax.transAxes)

    plt.tight_layout()
    png_path = os.path.join(out_dir, "fig0_system_architecture.png")
    pdf_path = os.path.join(out_dir, "fig0_system_architecture.pdf")
    plt.savefig(png_path)
    plt.savefig(pdf_path)
    plt.close()
    print(f"[SUCCESS] Figure 0 saved to {png_path} and {pdf_path}")


if __name__ == "__main__":
    out_figures = "figures"
    os.makedirs(out_figures, exist_ok=True)
    generate_figure_0_architecture(out_figures)
    generate_figure_1(out_figures)
    generate_figure_2(out_figures)
    generate_figure_3(out_figures)
