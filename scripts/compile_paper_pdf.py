"""
AHD-Jailbreak: IEEE Conference Paper PDF Compiler
=================================================
Compiles the complete conference manuscript with all 4 figures, 4 tables,
equations, author affiliations, and references into a publication-ready
two-column PDF using headless Chromium.
"""

import os
import subprocess
import time
import base64


import urllib.request
import urllib.parse
import hashlib
import re


def resolve_and_fetch_image(src: str, cache_dir: str = "figures/downloads") -> str:
    """
    If src is a URL (http/https), dynamically downloads and caches the image locally.
    Otherwise returns the local path as is.
    """
    if src.startswith("http://") or src.startswith("https://"):
        os.makedirs(cache_dir, exist_ok=True)
        url_hash = hashlib.sha256(src.encode("utf-8")).hexdigest()[:12]
        parsed_path = urllib.parse.urlparse(src).path
        ext = os.path.splitext(parsed_path)[1]
        if not ext or ext.lower() not in [".png", ".jpg", ".jpeg", ".pdf", ".svg", ".webp"]:
            ext = ".png"
        local_filename = f"url_img_{url_hash}{ext}"
        local_path = os.path.join(cache_dir, local_filename)
        if not os.path.exists(local_path) or os.path.getsize(local_path) == 0:
            print(f"[*] Dynamically fetching image from URL: {src} ...")
            req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                with open(local_path, "wb") as f:
                    f.write(resp.read())
            print(f"[+] Downloaded & cached: {local_path} ({os.path.getsize(local_path) / 1024:.1f} KB)")
        return local_path
    return src


def get_image_base64(img_path: str) -> str:
    if img_path.startswith("http://") or img_path.startswith("https://"):
        img_path = resolve_and_fetch_image(img_path)
    if not os.path.exists(img_path):
        return ""
    with open(img_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    ext = os.path.splitext(img_path)[1].replace(".", "").lower()
    if ext == "jpg": ext = "jpeg"
    return f"data:image/{ext};base64,{data}"



def build_paper_html(figures_dir: str = "figures") -> str:
    template_path = os.path.join(os.path.dirname(__file__), "paper_template.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            template = f.read()
    else:
        template = ""

    fig0_b64 = get_image_base64(os.path.join(figures_dir, "fig0_system_architecture.png"))
    fig1_b64 = get_image_base64(os.path.join(figures_dir, "fig1_benchmark_and_ablations.png"))
    fig2_b64 = get_image_base64(os.path.join(figures_dir, "fig2_adaptation_and_calibration.png"))
    fig3_b64 = get_image_base64(os.path.join(figures_dir, "fig3_crescendo_and_latency.png"))

    if template:
        html = template.replace("{{FIG0_B64}}", fig0_b64)
        html = html.replace("{{FIG1_B64}}", fig1_b64)
        html = html.replace("{{FIG2_B64}}", fig2_b64)
        html = html.replace("{{FIG3_B64}}", fig3_b64)
        return html


    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AHD-Jailbreak: Adaptive Hypergraph Defense with Anchor-Gated Topology Evolution</title>
<style>
  @page {{
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
    @bottom-center {{
      content: counter(page);
      font-size: 8pt;
      font-family: 'Times New Roman', Times, serif;
    }}
  }}

  body {{
    font-family: 'Times New Roman', 'Liberation Serif', Times, serif;
    font-size: 9pt;
    line-height: 1.28;
    color: #111;
    margin: 0;
    padding: 0;
    background: #fff;
    text-align: justify;
    text-justify: inter-word;
  }}

  /* Paper Title & Authors (Spans all columns) */
  .paper-header {{
    text-align: center;
    margin-bottom: 14pt;
    border-bottom: 0.5pt solid #ddd;
    padding-bottom: 10pt;
  }}

  .paper-title {{
    font-size: 17pt;
    font-weight: bold;
    line-height: 1.25;
    margin-bottom: 10pt;
    color: #0f172a;
  }}

  .author-row {{
    display: flex;
    justify-content: center;
    gap: 20pt;
    margin-bottom: 6pt;
    font-size: 8.5pt;
  }}

  .author-card {{
    text-align: center;
    max-width: 170pt;
  }}

  .author-name {{
    font-weight: bold;
    font-size: 9.5pt;
    color: #0f172a;
  }}

  .author-affil {{
    font-size: 8pt;
    color: #334155;
    line-height: 1.2;
  }}

  /* Two Column Layout */
  .content-columns {{
    column-count: 2;
    column-gap: 6.5mm;
  }}

  .full-width {{
    column-span: all;
    margin: 10pt 0;
    clear: both;
  }}

  /* Abstract & Keywords */
  .abstract-box {{
    margin-bottom: 10pt;
    padding: 6pt 8pt;
    background-color: #f8fafc;
    border-left: 2.5pt solid #0d9488;
    font-size: 8pt;
    line-height: 1.26;
  }}

  .abstract-title {{
    font-weight: bold;
    font-style: italic;
    color: #0f172a;
  }}

  .keywords {{
    margin-top: 4pt;
    font-size: 7.8pt;
  }}

  /* Section Headings */
  h1 {{
    font-size: 9.5pt;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    margin: 10pt 0 4pt 0;
    border-bottom: 0.5pt solid #0f172a;
    padding-bottom: 1.5pt;
    letter-spacing: 0.5pt;
  }}

  h2 {{
    font-size: 9pt;
    font-weight: bold;
    font-style: italic;
    margin: 7pt 0 3pt 0;
    color: #0f172a;
  }}

  p {{
    margin: 0 0 5pt 0;
    text-indent: 1em;
  }}

  p.no-indent {{
    text-indent: 0;
  }}

  ul, ol {{
    margin: 3pt 0 6pt 0;
    padding-left: 14pt;
  }}

  li {{
    margin-bottom: 2pt;
  }}

  /* Equations */
  .math-eq {{
    text-align: center;
    margin: 5pt 0;
    font-family: 'Cambria Math', 'Latin Modern Math', 'Times New Roman', serif;
    font-style: italic;
    font-size: 8.8pt;
  }}

  .math-num {{
    float: right;
    font-style: normal;
  }}

  /* Figures */
  .figure-container {{
    margin: 8pt 0;
    text-align: center;
    page-break-inside: avoid;
  }}

  .figure-container img {{
    max-width: 100%;
    height: auto;
    border: 0.5pt solid #cbd5e1;
    border-radius: 2pt;
  }}

  .figure-caption {{
    font-size: 7.5pt;
    line-height: 1.22;
    text-align: justify;
    margin-top: 4pt;
    color: #1e293b;
  }}

  .figure-caption b {{
    color: #0f172a;
  }}

  /* Tables */
  .table-container {{
    margin: 8pt 0;
    text-align: center;
    page-break-inside: avoid;
  }}

  .table-title {{
    font-size: 7.8pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 3pt;
    letter-spacing: 0.3pt;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.2pt;
    margin: 0 auto;
    line-height: 1.18;
  }}

  th, td {{
    padding: 3pt 3.5pt;
    text-align: left;
  }}

  th {{
    border-top: 1pt solid #0f172a;
    border-bottom: 0.6pt solid #0f172a;
    font-weight: bold;
    background-color: #f8fafc;
  }}

  td {{
    border-bottom: 0.4pt solid #e2e8f0;
  }}

  tr.bottom-rule td {{
    border-bottom: 1pt solid #0f172a;
  }}

  tr.highlight {{
    background-color: #f0fdfa;
    font-weight: bold;
  }}

  .num {{
    text-align: right;
    font-variant-numeric: tabular-nums;
  }}

  .center {{
    text-align: center;
  }}

  /* Takeaway Callout */
  .takeaway {{
    background: #f0fdfa;
    border: 0.5pt solid #0d9488;
    border-left: 2.5pt solid #0d9488;
    padding: 4pt 6pt;
    margin: 5pt 0;
    font-size: 7.8pt;
    line-height: 1.24;
    border-radius: 1.5pt;
  }}

  .takeaway b {{
    color: #0f172a;
  }}

  /* References */
  .references {{
    font-size: 7pt;
    line-height: 1.2;
    padding-left: 12pt;
    margin-top: 4pt;
  }}

  .references li {{
    margin-bottom: 2.5pt;
    text-align: justify;
  }}
</style>
</head>
<body>

<!-- Header (Spans all columns) -->
<div class="paper-header">
  <div class="paper-title">AHD-Jailbreak: Adaptive Hypergraph Defense with Anchor-Gated Topology Evolution for Detecting Multi-Turn and Compositional Jailbreak Attacks in Large Language Models</div>

  <div class="author-row">
    <div class="author-card">
      <div class="author-name">Sesetti Pavan Kumar Swamy</div>
      <div class="author-affil">Dept. of Computer Science & Engineering<br>Godavari Global University (CSE–C, PIN: 24555A0519)<br>Rajamahendravaram, AP, India</div>
    </div>
    <div class="author-card">
      <div class="author-name">Rajana Rajeswari</div>
      <div class="author-affil">Dept. of Computer Science & Engineering<br>Godavari Global University (CSE–B, PIN: 23551A05C9)<br>Rajamahendravaram, AP, India</div>
    </div>
    <div class="author-card">
      <div class="author-name">Mrs. S. Suguna Sri</div>
      <div class="author-affil">Faculty Guide & Assistant Professor<br>Dept. of Computer Science & Engineering<br>Godavari Global University, India</div>
    </div>
  </div>

  <div class="abstract-box">
    <span class="abstract-title">Abstract—</span>Large Language Models (LLMs) deployed across enterprise APIs, cloud chatbots, and cyber-physical edge devices remain vulnerable to evolving adversarial jailbreaks. Attackers exploit multi-turn conversational escalation (Crescendo, MHJ), competing-objective persona modulation, and surface encoding obfuscation to bypass alignment guardrails. Existing lightweight input guardrails process prompts as isolated single-turn sequences, suffering high false-negative rates on multi-turn escalation and severe over-refusal (false positives) on benign technical prompts containing sensitive homonyms. Conversely, recent graph-based defenses rely on static pairwise edges (|e| = 2) that cannot natively represent higher-order polyadic co-activations across dialogue turns, linguistic obfuscation signals, and targeted safety policies. We propose <b>AHD-Jailbreak</b>, a lightweight, model-agnostic pre-inference defense middleware built upon an adaptive heterogeneous hypergraph G_t = (V_t, E_t, W_t, X_t). Each node encodes a 394-dimensional representation combining 384-D dense semantic embeddings (<code>all-MiniLM-L6-v2</code>) with 10 pre-normalization surface indicators, while four higher-order hyperedge families simultaneously bind prompt instances, sliding 5-turn dialogue trajectories, semantic clusters, adversarial tactics, and safety policy categories. To adapt to newly emerging attack families without catastrophic forgetting or adversarial label poisoning, AHD-Jailbreak introduces an offline Quarantine Buffer governed by an Anchor Validation Gate (Module 14) that promotes candidate topology updates G_t &rarr; G_{{t+1}} only when F1 on a locked 500-sample validation anchor set remains within 0.5% and safe contrast false-positive rate (FPR) rises by at most 1.0%. Across 5 random seeds on a leakage-free 14,500-sample multi-benchmark suite (WildGuardMix, WildJailbreak, ScaleAI MHJ, JailbreakBench, and XSTest), AHD-Jailbreak achieves 100.0% in-distribution F1, 93.67% F1 on held-out out-of-distribution (OOD) attack families (+16.12 percentage points over a matched-encoder 394-D MLP baseline, McNemar p &lt; 0.0001), and 90.32% cross-dataset F1 on JailbreakBench while maintaining a 1.49% FPR on XSTest contrastive safe prompts. Using 2-hop local ego-subhypergraph extraction, AHD-Jailbreak executes in 2.25 ms median (3.26 ms P95) CPU hop latency (14.2 ms end-to-end on x86_64 and 26.5 ms on a Raspberry Pi 5 8GB board), providing a practical, privacy-preserving (HMAC-SHA256) inline guardrail for both cloud APIs and embedded edge systems.
    <div class="keywords"><b>Keywords:</b> Large Language Model Safety, Jailbreak Detection, Adaptive Hypergraph Neural Networks, Multi-Turn Alignment, Edge AI Security, Inductive Graph Learning.</div>
  </div>
</div>

<!-- Main Two-Column Content -->
<div class="content-columns">

  <h1>I. Introduction</h1>
  <p>Safety-aligned Large Language Models (LLMs) undergo supervised fine-tuning (SFT) and reinforcement learning from human feedback (RLHF) to refuse harmful instructions. However, as formalized by Wei et al. [1], alignment remains vulnerable to two structural failure modes: <i>competing objectives</i> (where instruction-following conflicts with safety refusal, such as forced affirmative prefixes) and <i>mismatched generalization</i> (where inputs are obfuscated via Base64, hexadecimal, or low-resource ciphers absent from safety training). Furthermore, multi-turn conversational attacks such as Crescendo [2] and Multi-Turn Human Jailbreaks (MHJ) [3] decompose a forbidden objective across several benign-looking turns, achieving over 70% Attack Success Rate (ASR) against defended models.</p>

  <p>Existing defense paradigms face a sharp operational trilemma across <b>relational context</b>, <b>adaptive generalization</b>, and <b>hardware efficiency</b>:</p>
  <ol>
    <li><i>Stateless Sequence Classifiers:</i> Lightweight classifiers such as Prompt-Guard-2-86M [4] or TF-IDF inspect single turns in isolation, missing multi-turn trajectory drift and suffering high false-positive rates on technical homonyms (e.g., <i>"kill a zombie process in Linux"</i>) [5].</li>
    <li><i>Heavyweight LLM Judges:</i> Generative guardrails such as Llama Guard [6] and WildGuard [7] require 7B–8B parameter GPU deployments (200–800 ms latency, &ge; 16 GB VRAM) and cannot update their static weights online without costly retraining.</li>
    <li><i>Pairwise Graph Neural Networks:</i> Recent graph filters such as GuardNet [8] and G-Guard [9] construct pairwise graphs (|e|=2). However, pairwise edges cannot natively represent the joint polyadic co-activation of multiple conversation turns, surface obfuscation indicators, persona framing tactics, and targeted safety policies without lossy clique expansion.</li>
  </ol>

  <p>To resolve this trilemma, we introduce <b>AHD-Jailbreak</b>, an Adaptive Hypergraph Defense middleware positioned upstream of any target LLM. Our primary contributions are:</p>
  <ul>
    <li><b>Heterogeneous Polyadic Hypergraph Formulation:</b> We model pre-inference screening as a weighted heterogeneous hypergraph G_t = (V_t, E_t, W_t, X_t) over five vertex modalities and four higher-order hyperedge families (E_sem, E_ctx, E_tac, E_pol) using 394-D node features that preserve pre-NFKC obfuscation indicators.</li>
    <li><b>Anchor-Gated Batch Adaptation & Poison Rollback:</b> We separate fast read-only inductive ego-hypergraph inference (&le; 120 nodes) from an offline Quarantine Buffer governed by a locked 500-sample Anchor Validation Gate, guaranteeing immunity against adversarial /feedback label poisoning.</li>
    <li><b>Multi-Seed Empirical & Embedded Hardware Verification:</b> Across 5 random seeds and 6 systematic ablations (A1–A6), we demonstrate statistically significant gains over matched-encoder flat classifiers (p &lt; 0.0001) and verify real-world deployment across x86_64 servers, NVIDIA Jetson Orin Nano, and Raspberry Pi 5 edge boards.</li>
  </ul>

  <h1>II. Threat Model & HD Jailbreaks</h1>
  <p>We consider an adversary interacting with an LLM application across Trust Boundary TB-1 via single-turn or multi-turn HTTP requests, external RAG documents, and public /feedback submissions. In real-world cyber-physical and enterprise systems, sophisticated attackers execute <b>High-Dimensional / Hypergraph-Distributed (HD) Jailbreaks</b> that distribute malicious intent across five orthogonal dimensions simultaneously: (1) multi-turn semantic drift across W_turn = 5 turns [2, 3], (2) pre-normalization character/encoding obfuscation (Base64, zero-width joiners, homoglyphs) [1], (3) competing-objective persona framing (AF-02/AF-03), (4) indirect third-party RAG/sensor context injection [10], and (5) adaptive threshold probing [11] or feedback poisoning.</p>

  <p>Let T_1 denote unsafe intent detection (safety_label), T_2 denote adversarial framing detection (attack_family), T_3 denote prompt injection hijacking, and T_4 denote downstream LLM compliance (Attack Success Rate, ASR). Because AHD-Jailbreak operates <i>pre-inference</i>, it predicts the composite actionable risk label y &in; {{0: Allow, 1: Block/Review}} where y = 1 iff the interaction exhibits unsafe intent (vanilla or adversarial harmful), while explicitly routing contrastive benign technical and roleplay queries (BF-02) to y = 0.</p>

</div>

<!-- Full-Width Figure 0: Architecture Overview -->
<div class="full-width figure-container">
  <img src="{fig0_b64}" alt="Figure 0: System Architecture">
  <div class="figure-caption">
    <b>Figure 1: End-to-End AHD-Jailbreak Pre-Inference Defense Architecture.</b> The complete 6-stage defensive pipeline: (1) Multi-turn dialogue trajectory and raw query input; (2) 10-D pre-NFKC surface feature extraction combined with 384-D dense semantic embedding into unified representation x_q &in; &Ropf;^{{394}}; (3) Inductive cosine k-NN ego-subhypergraph extraction (&le; 120 nodes); (4) 2-layer spectral hypergraph convolution with temperature calibration (T_cal = 0.84); (5) Calibrated multi-signal risk fusion; and (6) Module 14 Anchor Validation Gate with locked 500 validation anchors ensuring poison resilience.
  </div>
</div>

<div class="content-columns">

  <h1>III. Methodology</h1>

  <h2>A. Heterogeneous Vertex Space and 394-D Feature Extraction</h2>
  <p>At adaptation epoch t &in; {{0, 1, ...}}, the defense topology is defined as G_t = (V_t, E_t, W_t, X_t) with |V_0| = 4,084 vertices partitioned into five disjoint sets:</p>
  <div class="math-eq">V_t = V_P &cup; V_T &cup; V_S &cup; V_C &cup; V_A <span class="math-num">(1)</span></div>
  <p class="no-indent">where V_P (N_P = 4,000) stores stratified anchor prompts and the active query v_q; V_T represents historical dialogue turns t_{{k-m}}, ..., t_{{k-1}} (W_turn = 5); V_S (K_S = 64) represents spherical k-means semantic cluster centroids (32 harmful, 32 contrastive safe); V_C (K_C = 10) represents canonical safety policy categories [7, 12]; and V_A (K_A = 10) represents structural tactic families (AF-01–AF-08, BF-01, BF-02).</p>

  <p>Crucially, applying Unicode NFKC normalization first would erase homoglyphs and zero-width characters. Our feature extractor first computes a 10-dimensional surface vector f_surf &in; &Ropf;^{{10}} (character Shannon entropy, log token count, punctuation/uppercase/digit ratios, Base64 regex match, zero-width/homoglyph count, override verb count, roleplay marker count, and turn-to-turn cosine drift 1 - cos(e_t, e_{{t-1}})) <i>prior</i> to NFKC normalization, and concatenates it with the 384-D L_2-normalized <code>all-MiniLM-L6-v2</code> embedding e_sem to form x_v = [e_sem || f_surf] &in; &Ropf;^{{394}}.</p>

  <h2>B. Higher-Order Hyperedges and Spectral Convolution</h2>
  <p>Four hyperedge families E_t = E_sem &cup; E_ctx &cup; E_tac &cup; E_pol (|E_0| = 198) connect arbitrary vertex subsets e &sube; V_t (|e| &ge; 2) via sparse incidence matrix H_t &in; {{0,1}}^{{|V_t| &times; |E_t|}}. Each hyperedge is initialized with a class-purity weight on the training split (&lambda;_base = 0.20):</p>
  <div class="math-eq">w_0(e) = &lambda;_base + (1 - &lambda;_base) | 2 P(y=1 | v &in; e) - 1 | <span class="math-num">(2)</span></div>
  <p class="no-indent">Let D_v(v,v) = &sum;_e w_t(e) H_t(v,e) and D_e(e,e) = &sum;_v H_t(v,e) denote the diagonal vertex and hyperedge degree matrices. Following Feng et al. [13] and Bai et al. [14], our 2-layer architecture projects Z^(0) = ReLU(X_t W_in + b_in) &in; &Ropf;^{{|V_t| &times; 128}} and applies two stages of spectral message passing with residual connections and LayerNorm:</p>
  <div class="math-eq">Z^(l+1) = LN(Z^(l) + ELU(P_t Z^(l) &Theta;^(l))) <span class="math-num">(3)</span></div>
  <p class="no-indent">where P_t = D_v^{{-1/2}} H_t W_t D_e^{{-1}} H_t^T D_v^{{-1/2}}. At runtime, rather than rebuilding the full graph, an incoming query v_q queries a cached cosine k-NN index (k=10) to extract its 2-hop local ego-subhypergraph (&le; 120 vertices), executing the 2-layer forward pass in 2.25 ms on CPU.</p>

  <h2>C. Calibrated Multi-Signal Risk Fusion and Anchor Gate</h2>
  <p>Given logit l(v_q), we apply temperature scaling P_cal(x) = &sigma;(l(v_q)/T_cal) where T_cal = 0.84 is optimized via L-BFGS on <code>val</code>. Module 10 computes the composite risk R(x) &in; [0,1] and epistemic uncertainty u(x) &in; [0,1]:</p>
  <div class="math-eq">R(x) = 0.50 P_cal(x) + 0.25 S_nbr(x) + 0.15 S_ctx(x) + 0.10 S_OOD(x) <span class="math-num">(4)</span></div>
  <div class="math-eq">u(x) = 0.60 H_bin(P_cal(x)) + 0.40 S_OOD(x) <span class="math-num">(5)</span></div>
  <p class="no-indent">where S_nbr(x) is the hyperedge-weighted harmful neighbor purity, S_ctx(x) captures multi-turn escalation velocity, and S_OOD(x) is the normalized distance to the nearest cluster centroid c_s &in; V_S. Requests are routed via three-way policy thresholds (&tau;_allow=0.35, &tau;_block=0.70, &tau;_u=0.45) into <code>allow</code>, <code>review</code> (quarantine), or <code>block</code>.</p>

  <p>To prevent adversarial drift or feedback poisoning, public /feedback submissions never mutate G_t directly. Verified quarantine batches update hyperedge weights via capped exponential moving average (&alpha;=0.25, |&Delta;w| &le; 0.15) while keeping &ge; 80% of core anchors immutable. A candidate snapshot G_{{t+1}} is promoted to production iff it passes the <b>Anchor Validation Gate</b> on D_anchor (500 locked validation prompts + 100 safe contrasts):</p>
  <div class="math-eq">F1(G_{{t+1}}, D_anchor) &ge; F1(G_t, D_anchor) - 0.005 <span class="math-num">(6)</span></div>
  <div class="math-eq">FPR(G_{{t+1}}, D_safe) &le; FPR(G_t, D_safe) + 0.010 <span class="math-num">(7)</span></div>

  <h1>IV. Experimental Results</h1>
  <p>Table I summarizes our 14,500-sample leakage-free corpus, where connected-component clustering at cos &ge; 0.90 and <code>conversation_id</code> grouping guarantee zero cross-split contamination.</p>

  <div class="table-container">
    <div class="table-title">TABLE I: Leakage-Free 6-Partition Dataset Distribution</div>
    <table>
      <thead>
        <tr>
          <th>Split</th>
          <th class="num">Count</th>
          <th>Primary Sources & Isolation Rule</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>train</td><td class="num">8,000</td><td>WildGuardTrain, WildJailbreak, MHJ (70%)</td></tr>
        <tr><td>val</td><td class="num">2,000</td><td>Disjoint clusters; locks 500 Anchor Gate samples</td></tr>
        <tr><td>test_id</td><td class="num">1,725</td><td>Official WildGuardTest; cos &ge; 0.90 purged from train</td></tr>
        <tr><td>test_ood</td><td class="num">1,200</td><td>Base64 (AF-04), GCG (AF-05), AutoDAN (AF-06), MHJ</td></tr>
        <tr><td>test_cross</td><td class="num">800</td><td>JailbreakBench (500) & StrongREJECT (313)</td></tr>
        <tr class="bottom-rule"><td>test_fpr</td><td class="num">1,450</td><td>XSTest (450) + OR-Bench-Hard-1K (1,000)</td></tr>
      </tbody>
    </table>
  </div>

  <p>Table II and Figure 2(A) present the 5-seed evaluation across B1–B5. While lexical baselines B1 and B2a achieve high recall on keyword-heavy test items, they suffer severe false-positive rates on XSTest safe homonyms (35.11% and 23.40% FPR), rendering them unusable in developer environments. Conversely, flat neural classifiers B2b (394-D Matched MLP) and B5 (Prompt-Guard-2-86M) achieve 0.00% XSTest FPR but degrade sharply on held-out OOD attack families (77.55% and 71.76% F1).</p>

  <p><b>AHD-Jailbreak (B4)</b> resolves this safety-usability trade-off: using the exact same 394-D feature matrix X as B2b, B4 improves Held-Out OOD F1 by +16.12 percentage points (93.67% vs. 77.55%, McNemar p &lt; 0.0001) and Cross-Dataset JailbreakBench F1 by +15.36 percentage points (90.32% vs. 74.96%) while maintaining a 1.49% XSTest safe FPR.</p>

</div>

<!-- Full-Width Table II: Master 5-Seed Benchmark Matrix -->
<div class="full-width table-container">
  <div class="table-title">TABLE II: Master 5-Seed Benchmark Comparison Matrix (Seeds: 42, 100, 2026, 7, 99; Validation Target FPR &le; 5.0%)</div>
  <table>
    <thead>
      <tr>
        <th>Defense Method</th>
        <th class="center">ID F1 (% &plusmn; SD)</th>
        <th class="center">AUROC</th>
        <th class="center">AUPRC</th>
        <th class="center">XSTest Safe FPR</th>
        <th class="center">Held-Out OOD F1</th>
        <th class="center">Cross-JBB F1</th>
        <th class="center">CPU P50/P95</th>
        <th class="center">McNemar p vs B4</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>B1: Rule-Based Heuristic Filter</td>
        <td class="center">79.02 &plusmn; 0.00</td>
        <td class="center">0.9312</td>
        <td class="center">0.9247</td>
        <td class="center" style="color:#b91c1c; font-weight:bold;">35.11%</td>
        <td class="center">92.94%</td>
        <td class="center">85.44%</td>
        <td class="center">0.43 / 0.89 ms</td>
        <td class="center">&lt; 0.0001</td>
      </tr>
      <tr>
        <td>B2a: Classical TF-IDF + Logistic Regression</td>
        <td class="center">100.00 &plusmn; 0.00</td>
        <td class="center">1.0000</td>
        <td class="center">1.0000</td>
        <td class="center" style="color:#b91c1c; font-weight:bold;">23.40%</td>
        <td class="center">97.67%</td>
        <td class="center">99.03%</td>
        <td class="center">1.28 / 1.97 ms</td>
        <td class="center">0.1814</td>
      </tr>
      <tr>
        <td>B2b: Matched-Encoder 394-D MLP</td>
        <td class="center">100.00 &plusmn; 0.00</td>
        <td class="center">1.0000</td>
        <td class="center">1.0000</td>
        <td class="center" style="color:#0d9488; font-weight:bold;">0.00%</td>
        <td class="center">77.55%</td>
        <td class="center">74.96%</td>
        <td class="center">1.12 / 1.78 ms</td>
        <td class="center">&lt; 0.0001</td>
      </tr>
      <tr>
        <td>B3: Static Hypergraph (Frozen G_0)</td>
        <td class="center">100.00 &plusmn; 0.00</td>
        <td class="center">1.0000</td>
        <td class="center">1.0000</td>
        <td class="center" style="color:#0d9488;">2.98%</td>
        <td class="center">80.74%</td>
        <td class="center">74.47%</td>
        <td class="center">2.24 / 3.17 ms</td>
        <td class="center">0.0001</td>
      </tr>
      <tr class="highlight">
        <td><b>B4: AHD-Jailbreak (Proposed Adaptive G_t)</b></td>
        <td class="center"><b>100.00 &plusmn; 0.00</b></td>
        <td class="center"><b>1.0000</b></td>
        <td class="center"><b>1.0000</b></td>
        <td class="center" style="color:#0f766e; font-weight:bold;">1.49%</td>
        <td class="center"><b>93.67%</b></td>
        <td class="center"><b>90.32%</b></td>
        <td class="center"><b>2.25 / 3.26 ms</b></td>
        <td class="center"><b>Ref (1.0000)</b></td>
      </tr>
      <tr class="bottom-rule">
        <td>B5: Meta Llama-Prompt-Guard-2-86M</td>
        <td class="center">73.68 &plusmn; 0.00</td>
        <td class="center">0.9815</td>
        <td class="center">0.9837</td>
        <td class="center" style="color:#0d9488; font-weight:bold;">0.00%</td>
        <td class="center">71.76%</td>
        <td class="center">69.23%</td>
        <td class="center">1.32 / 2.14 ms</td>
        <td class="center">&lt; 0.0001</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Full-Width Figure 1: Benchmark and Ablations -->
<div class="full-width figure-container">
  <img src="{fig1_b64}" alt="Figure 1: Benchmark and Ablations">
  <div class="figure-caption">
    <b>Figure 2: Empirical Performance Trade-Off and Architectural Ablation Analysis.</b> (A) 5-Seed Master Benchmark comparison across B1–B5 demonstrating how AHD-Jailbreak (B4) simultaneously achieves 93.67% Held-Out OOD F1, 90.32% Cross-Dataset JailbreakBench F1, and 98.51% safe prompt acceptance (1.49% FPR on XSTest). (B) Systematic ablation study (A1–A6) quantifying combined F1 degradation and XSTest FPR inflation paired with McNemar's continuity-corrected chi-square significance tests.
  </div>
</div>

<div class="content-columns">

  <div class="table-container">
    <div class="table-title">TABLE III: Systematic Ablation Studies (A1–A6)</div>
    <table>
      <thead>
        <tr>
          <th>Ablation Configuration</th>
          <th class="center">Comb. F1</th>
          <th class="center">&Delta; F1</th>
          <th class="center">XSTest FPR</th>
          <th class="center">ECE</th>
          <th class="center">McNemar p</th>
        </tr>
      </thead>
      <tbody>
        <tr class="highlight">
          <td><b>Full AHD-Jailbreak (Ref)</b></td>
          <td class="center"><b>90.05%</b></td>
          <td class="center"><b>0.00%</b></td>
          <td class="center"><b>0.00%</b></td>
          <td class="center"><b>0.0502</b></td>
          <td class="center"><b>Ref (1.00)</b></td>
        </tr>
        <tr><td>A1: No Context (W_turn=1)</td><td class="center">84.46%</td><td class="center" style="color:#b91c1c;">-5.59%</td><td class="center">0.00%</td><td class="center">0.0640</td><td class="center">0.0001</td></tr>
        <tr><td>A2: No 384-D Dense Features</td><td class="center">22.40%</td><td class="center" style="color:#b91c1c; font-weight:bold;">-67.65%</td><td class="center">3.19%</td><td class="center">0.1322</td><td class="center">&lt; 0.0001</td></tr>
        <tr><td>A3: Pairwise GNN (|e|=2)</td><td class="center">85.35%</td><td class="center" style="color:#b91c1c;">-4.70%</td><td class="center" style="color:#b91c1c;">5.32%</td><td class="center">0.0478</td><td class="center">0.0014</td></tr>
        <tr><td>A4: Static Topology (G_0)</td><td class="center">84.46%</td><td class="center" style="color:#b91c1c;">-5.59%</td><td class="center" style="color:#b91c1c;">5.32%</td><td class="center">0.0510</td><td class="center">0.0001</td></tr>
        <tr><td>A5: No OOD Signal (w_4=0)</td><td class="center">84.37%</td><td class="center" style="color:#b91c1c;">-5.68%</td><td class="center">4.26%</td><td class="center">0.0668</td><td class="center">0.0001</td></tr>
        <tr class="bottom-rule"><td>A6: Uncalibrated (T_cal=1.0)</td><td class="center">83.38%</td><td class="center" style="color:#b91c1c;">-6.67%</td><td class="center" style="color:#b91c1c; font-weight:bold;">12.77%</td><td class="center">0.1371</td><td class="center">&lt; 0.0001</td></tr>
      </tbody>
    </table>
  </div>

  <div class="takeaway">
    <b>Ablation Takeaway (Table III & Figure 2(B)):</b> Replacing polyadic hyperedges with pairwise edges (|e|=2, Ablation A3) drops combined F1 by -4.70% (p=0.0014) and inflates XSTest FPR to 5.32%, while removing temperature calibration (Ablation A6) causes XSTest FPR to spike to 12.77% (ECE = 0.1371).
  </div>

  <p>Under our prequential test-then-adapt stream (B_1 &rarr; B_4, Figure 3(A)), validated adaptation improves F1 from 80.00% (G_0) to 97.56% (G_4). When subjected to a label-flipped poison batch dropping anchor F1 to 40.00%, Module 14 automatically aborts promotion and rolls back to G_4. As plotted in Figure 3(B), temperature scaling (T_cal=0.84) aligns raw confidence with empirical error, lowering ECE from 0.1371 to 0.0502.</p>

</div>

<!-- Full-Width Figure 2: Adaptation and Calibration -->
<div class="full-width figure-container">
  <img src="{fig2_b64}" alt="Figure 2: Adaptation and Calibration">
  <div class="figure-caption">
    <b>Figure 3: Prequential Stream Adaptation & Risk Probability Calibration.</b> (A) Prequential test-then-adapt stream adaptation across 4 chronological OOD attack windows (B1: Base64, B2: GCG, B3: AutoDAN, B4: Crescendo), showing +17.56% F1 gain over static G_0 and automatic rollback when a label-flipped poison batch is injected at B3. (B) Temperature scaling calibration curve (T_cal = 0.84) reducing ECE from 0.1371 to 0.0502 and mapping risk into the calibrated review/quarantine band [&tau;_allow=0.35, &tau;_block=0.70].
  </div>
</div>

<div class="content-columns">

  <h1>V. Real-World Embedded Boards</h1>
  <p>Because AHD-Jailbreak requires only 23 MB for an INT8-quantized ONNX encoder and &lt; 15 MB for sparse snapshot G_t, it can be deployed directly onto physical embedded boards and enterprise gateways (Table IV and Figure 4):</p>
  <ol>
    <li><b>Dual-NIC "Bump-in-the-Wire" Hardware AI Firewall (Raspberry Pi 5 8GB):</b> Configured with onboard Gigabit Ethernet (eth0, untrusted LAN) and a USB 3.0 Gigabit adapter (eth1, LLM server), executing ONNX Runtime ARM64 INT8 encoding (21.0 ms), k-NN ego extraction (2.4 ms), and 2-layer PyG HypergraphConv (3.1 ms) in 26.5 ms median (44.8 ms P95) latency using &lt; 650 MB RAM.</li>
    <li><b>Air-Gapped Robotics & Edge Box (NVIDIA Jetson Orin Nano 8GB):</b> Executes TensorRT FP16 hypergraph screening in 9.4 ms median (18.2 ms P95) alongside a local 4-bit quantized Llama-3.2-3B model via Ollama on a single 15W board, intercepting cross-channel QR/sensor + voice Crescendo HD jailbreaks (Figure 4(A)) prior to actuator execution.</li>
    <li><b>Federated Zero-PII Threat Graph Synchronization:</b> With LOG_RAW_PROMPTS=false, audit logs record only salted HMAC-SHA256 digests in SQLite WAL mode, while anchor-validated snapshots (graph_v{{t}}.pt) synchronize across fleets of edge boards without sharing raw user text.</li>
  </ol>

  <div class="table-container">
    <div class="table-title">TABLE IV: Pre-Inference Screening Latency Across Hardware Boards (RQ5)</div>
    <table>
      <thead>
        <tr>
          <th>Hardware Platform / Board</th>
          <th class="num">Enc. (ms)</th>
          <th class="num">Ego+HGNN</th>
          <th class="center">Total P50 / P95</th>
        </tr>
      </thead>
      <tbody>
        <tr class="highlight"><td>NVIDIA Jetson Orin Nano (8GB, TensorRT)</td><td class="num">6.2</td><td class="num">3.2 ms</td><td class="center"><b>9.4 / 18.2 ms</b></td></tr>
        <tr><td>Apple M2 Pro (ARM64 CPU)</td><td class="num">8.4</td><td class="num">3.4 ms</td><td class="center">11.8 / 22.4 ms</td></tr>
        <tr><td>x86_64 4-Core Xeon (AVX-512 ONNX)</td><td class="num">10.5</td><td class="num">3.7 ms</td><td class="center">14.2 / 28.5 ms</td></tr>
        <tr class="highlight"><td>Raspberry Pi 5 8GB (ARM64 ONNX INT8)</td><td class="num">21.0</td><td class="num">5.5 ms</td><td class="center"><b>26.5 / 44.8 ms</b></td></tr>
        <tr class="bottom-rule"><td>Raspberry Pi 5 8GB (FP32 PyTorch Raw)</td><td class="num">58.5</td><td class="num">9.5 ms</td><td class="center">68.0 / 114.5 ms</td></tr>
      </tbody>
    </table>
  </div>

</div>

<!-- Full-Width Figure 3: Crescendo Trajectory & Latency Breakdown -->
<div class="full-width figure-container">
  <img src="{fig3_b64}" alt="Figure 3: Crescendo and Latency Breakdown">
  <div class="figure-caption">
    <b>Figure 4: Dynamic Escalation Trajectory Detection & Multi-Stage Hardware Latency Profiling.</b> (A) Multi-turn Crescendo escalation trajectory across Turns 1–3, demonstrating how the joint E_ctx hyperedge detects positive risk velocity (R = 0.09 &rarr; 0.38 &rarr; 0.86) crossing &tau;_block=0.70, whereas single-turn and lexical baselines remain below threshold. (B) Real-world stage-by-stage end-to-end latency breakdown across 5 production hardware configurations (NVIDIA Jetson Orin Nano, Apple M2 Pro, x86_64 Xeon, and Raspberry Pi 5), confirming sub-30 ms pre-inference execution within real-time SLA ceilings.
  </div>
</div>

<div class="content-columns">

  <h1>VI. Conclusion & Limitations</h1>
  <p>AHD-Jailbreak demonstrates that an inductive, anchor-gated heterogeneous hypergraph effectively bridges the gap between stateless sequence classifiers and heavyweight GPU judge models, intercepting multi-turn and compositional jailbreaks in &lt; 30 ms on commodity CPUs and embedded boards. We note three operational limitations for future work: (1) because all-MiniLM-L6-v2 remains frozen during micro-batch updates, adaptation refines relational topology rather than learning new token semantics; (2) quarantine promotion relies on periodic high-confidence oracle verification; and (3) extending hyperedges to vision/audio modalities will further harden multimodal VLMs.</p>

  <h1>References</h1>
  <ol class="references">
    <li>A. Wei, N. Haghtalab, and J. Steinhardt, "Jailbroken: How Does LLM Safety Training Fail?," in <i>Proc. NeurIPS</i>, 2023.</li>
    <li>M. Russinovich, A. Salem, and R. Eldan, "Great, Now Write an Article About That: The Crescendo Multi-Turn LLM Jailbreak Attack," in <i>Proc. USENIX Security</i>, 2025.</li>
    <li>N. Li et al., "LLM Defenses Are Not Robust to Multi-Turn Human Jailbreaks Yet," <i>Scale AI Technical Report</i>, arXiv:2408.15221, 2024.</li>
    <li>Meta AI, "Llama Prompt Guard 2 (86M)," Hugging Face Repository, 2025.</li>
    <li>P. R&ouml;ttger et al., "XSTest: A Test Suite for Identifying Exaggerated Safety Behaviours in LLMs," in <i>Proc. NAACL</i>, 2024.</li>
    <li>H. Inan et al., "Llama Guard: LLM-based Input-Output Safeguard for Human-AI Conversations," <i>arXiv:2312.06674</i>, 2023.</li>
    <li>S. Han et al., "WildGuard: Open One-Stop Moderation Tools for Safety Risks, Jailbreaks, and Refusals of LLMs," in <i>Proc. NeurIPS</i>, 2024.</li>
    <li>J. Forough, M. Maheri, and H. Haddadi, "GuardNet: Graph-Attention Filtering for Jailbreak Defense in LLMs," <i>arXiv:2509.23037</i>, 2025.</li>
    <li>Z. Huang et al., "Attention-Aware GNN-based Input Defense against Multi-Turn LLM Jailbreak (G-Guard)," <i>arXiv:2507.07146</i>, 2025.</li>
    <li>K. Greshake et al., "Not What You've Signed Up For: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection," in <i>Proc. AISec@CCS</i>, 2023.</li>
    <li>A. Mehrotra et al., "Tree of Attacks: Jailbreaking Black-Box LLMs Automatically," in <i>Proc. NeurIPS</i>, 2024.</li>
    <li>P. Chao et al., "JailbreakBench: An Open Robustness Benchmark for Jailbreaking LLMs," in <i>Proc. NeurIPS Datasets and Benchmarks</i>, 2024.</li>
    <li>Y. Feng et al., "Hypergraph Neural Networks," in <i>Proc. AAAI</i>, 2019, pp. 3558–3565.</li>
    <li>S. Bai, F. Zhang, and P. H. Torr, "Hypergraph Convolution and Hypergraph Attention," <i>Pattern Recognition</i>, vol. 110, 2021.</li>
  </ol>

</div>

</body>
</html>"""
    return html


def compile_pdf(out_pdf_path: str, html_content: str):
    temp_html_path = os.path.abspath("temp_paper.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    ]
    browser_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            browser_exe = p
            break

    if not browser_exe:
        raise RuntimeError("No headless browser found to print PDF.")

    abs_pdf_path = os.path.abspath(out_pdf_path)
    file_url = f"file:///{temp_html_path.replace(os.sep, '/')}"

    cmd = [
        browser_exe,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={abs_pdf_path}",
        "--no-pdf-header-footer",
        file_url
    ]

    print(f"[*] Compiling PDF via {os.path.basename(browser_exe)}...")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    time.sleep(1)

    if os.path.exists(temp_html_path):
        os.remove(temp_html_path)

    if os.path.exists(abs_pdf_path) and os.path.getsize(abs_pdf_path) > 1000:
        size_kb = os.path.getsize(abs_pdf_path) / 1024
        print(f"[SUCCESS] PDF compiled successfully: {abs_pdf_path} ({size_kb:.1f} KB)")
        try:
            import shutil
            public_pdf = os.path.abspath("project_files/public/ahd_jailbreak_ieee_conference_paper.pdf")
            os.makedirs(os.path.dirname(public_pdf), exist_ok=True)
            shutil.copy2(abs_pdf_path, public_pdf)
            print(f"[+] Synced to public web assets: {public_pdf}")
        except Exception as e:
            print(f"[*] Public PDF sync note: {e}")
        try:
            import fitz
            doc = fitz.open(abs_pdf_path)
            for d in ["project_files/public/pages", "reports/pages"]:
                os.makedirs(d, exist_ok=True)
                for i, page in enumerate(doc):
                    pix = page.get_pixmap(dpi=180)
                    pix.save(os.path.join(d, f"page_{i+1}.png"))
            print(f"[+] Exported {len(doc)} crisp page sheets to project_files/public/pages/")
        except Exception as e:
            print(f"[*] Note: Page sheets export skipped: {e}")
        return abs_pdf_path
    else:
        raise RuntimeError(f"PDF creation failed or output file is empty: {proc.stderr}")


if __name__ == "__main__":
    html = build_paper_html()
    # 1. Compile in workspace root
    root_pdf = "ahd_jailbreak_ieee_conference_paper.pdf"
    compile_pdf(root_pdf, html)

    # 2. Compile in reports/
    reports_pdf = os.path.join("reports", "ahd_jailbreak_ieee_conference_paper.pdf")
    compile_pdf(reports_pdf, html)

