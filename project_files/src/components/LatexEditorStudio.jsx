import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileCode, Sparkles, Copy, Check, Download, RefreshCw, 
  ExternalLink, Image as ImageIcon, Link as LinkIcon, CheckCircle2, 
  Eye, Code2, Edit3, Shield, BookOpen, Layers,
  Columns, FileText, CheckCircle, ChevronDown, ChevronUp, FileCheck2,
  ZoomIn, ZoomOut, Maximize2, Table, ListOrdered, Plus, Trash2,
  X, Sliders, RotateCcw, Save
} from 'lucide-react';

// Safe image component with anti-freeze, fallback protection, style and click support
function SafeImage({ src, alt, fallbackSrc, className, style, onClick }) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [failedOnce, setFailedOnce] = useState(false);

  useEffect(() => {
    let s = src;
    if (s && !s.startsWith('http://') && !s.startsWith('https://') && !s.startsWith('/')) {
      s = '/' + s;
    }
    setCurrentSrc(s || fallbackSrc);
    setFailedOnce(false);
  }, [src, fallbackSrc]);

  return (
    <img
      src={currentSrc || fallbackSrc}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (!failedOnce) {
          setFailedOnce(true);
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

// Reusable Figure Size Controller with slider and quick presets
function FigureSizeController({ label, value, onChange, onReset, defaultValue = 220 }) {
  return (
    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300 font-medium flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          {label || 'Image Height / Size'}:
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-teal-300 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            {value}px
          </span>
          <button
            type="button"
            onClick={() => onReset(defaultValue)}
            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 transition-colors"
            title={`Reset to default (${defaultValue}px)`}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset
          </button>
        </div>
      </div>
      
      {/* Slider */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] text-slate-500 font-mono">100px</span>
        <input
          type="range"
          min={100}
          max={500}
          step={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="text-[10px] text-slate-500 font-mono">500px</span>
      </div>

      {/* Quick Preset Buttons */}
      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
        <span className="text-[10px] text-slate-400 font-medium mr-0.5">Presets:</span>
        {[
          { label: 'S (150px)', val: 150 },
          { label: 'M (220px)', val: 220 },
          { label: 'L (300px)', val: 300 },
          { label: 'XL (400px)', val: 400 },
          { label: 'Max (500px)', val: 500 }
        ].map(preset => (
          <button
            type="button"
            key={preset.val}
            onClick={() => onChange(preset.val)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              value === preset.val
                ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Floating Sheet Figure Toolbar for instant +/- resizing and fullscreen inspect directly on the live sheet
function SheetFigureOverlay({ height, onIncrease, onDecrease, onOpenLightbox }) {
  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-xl text-[10px] text-white z-20 pointer-events-auto">
      <span className="font-mono text-teal-400 font-bold">{height}px</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrease();
        }}
        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
        title="Decrease image height (-25px)"
      >
        -
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold transition-colors"
        title="Increase image height (+25px)"
      >
        +
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenLightbox();
        }}
        className="px-2 py-0.5 rounded bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold flex items-center gap-1 transition-all shadow-sm"
        title="View in High-Resolution Lightbox"
      >
        <Maximize2 className="w-2.5 h-2.5" />
        Full
      </button>
    </div>
  );
}

// Helper to strip LaTeX markup for clean pasting into humanizer websites
function cleanLatexForHumanizer(latex) {
  if (!latex) return '';
  return latex
    .replace(/\\cite\{[^}]+\}/g, '')
    .replace(/\\ref\{[^}]+\}/g, '')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\\texttt\{([^}]+)\}/g, '$1')
    .replace(/\\textsc\{([^}]+)\}/g, '$1')
    .replace(/\\emph\{([^}]+)\}/g, '$1')
    .replace(/\\label\{[^}]+\}/g, '')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\begin\{equation\}[\s\S]*?\\end\{equation\}/g, '[equation]')
    .replace(/\\begin\{align\}[\s\S]*?\\end\{align\}/g, '[equation]')
    .replace(/\\begin\{itemize\}|\\end\{itemize\}|\\begin\{enumerate\}|\\end\{enumerate\}/g, '')
    .replace(/\\item\s*/g, '• ')
    .replace(/\\\\/g, '\n')
    .replace(/\\[a-zA-Z]+\*?(\{.*?\})?/g, '')
    .replace(/\{|\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const DEFAULT_PAPER_DATA = {
  title: "AHD-Jailbreak: Adaptive Hypergraph Defense with Anchor-Gated Topology Evolution for Detecting Multi-Turn and Compositional Jailbreak Attacks in Large Language Models",
  author1_name: "Sesetti Pavan Kumar Swamy",
  author1_pin: "24555A0519 (CSE–C)",
  author2_name: "Rajana Rajeswari",
  author2_pin: "23551A05C9 (CSE–B)",
  guide_name: "Mrs. S. Suguna Sri",
  guide_title: "Faculty Guide & Assistant Professor",
  university: "Godavari Global University, Rajamahendravaram, AP, India",
  
  abstract: `Large Language Models (LLMs) deployed across enterprise APIs, cloud chatbots, and cyber-physical edge devices remain vulnerable to evolving adversarial jailbreaks. Attackers exploit multi-turn conversational escalation (Crescendo, MHJ), competing-objective persona modulation, and surface encoding obfuscation to bypass alignment guardrails. Existing lightweight input guardrails process prompts as isolated single-turn sequences, suffering high false-negative rates on multi-turn escalation and severe over-refusal (false positives) on benign technical prompts containing sensitive homonyms. Conversely, recent graph-based defenses rely on static pairwise edges (|e| = 2) that cannot natively represent higher-order polyadic co-activations across dialogue turns, linguistic obfuscation signals, and targeted safety policies. We propose AHD-Jailbreak, a lightweight, model-agnostic pre-inference defense middleware built upon an adaptive heterogeneous hypergraph G_t = (V_t, E_t, W_t, X_t). Each node encodes a 394-dimensional representation combining 384-D dense semantic embeddings (all-MiniLM-L6-v2) with 10 pre-normalization surface indicators, while four higher-order hyperedge families simultaneously bind prompt instances, sliding 5-turn dialogue trajectories, semantic clusters, adversarial tactics, and safety policy categories. To adapt to newly emerging attack families without catastrophic forgetting or adversarial label poisoning, AHD-Jailbreak introduces an offline Quarantine Buffer governed by an Anchor Validation Gate (Module 14) that promotes candidate topology updates G_t -> G_{t+1} only when F1 on a locked 500-sample validation anchor set remains within 0.5% and safe contrast false-positive rate (FPR) rises by at most 1.0%. Across 5 random seeds on a leakage-free 14,500-sample multi-benchmark suite (WildGuardMix, WildJailbreak, ScaleAI MHJ, JailbreakBench, and XSTest), AHD-Jailbreak achieves 100.0% in-distribution F1, 93.67% F1 on held-out out-of-distribution (OOD) attack families (+16.12 percentage points over a matched-encoder 394-D MLP baseline, McNemar p < 0.0001), and 90.32% cross-dataset F1 on JailbreakBench while maintaining a 1.49% FPR on XSTest contrastive safe prompts. Using 2-hop local ego-subhypergraph extraction, AHD-Jailbreak executes in 2.25 ms median (3.26 ms P95) CPU hop latency (14.2 ms end-to-end on x86_64 and 26.5 ms on a Raspberry Pi 5 8GB board), providing a practical, privacy-preserving (HMAC-SHA256) inline guardrail for both cloud APIs and embedded edge systems.`,
  
  keywords: "Large Language Model Safety, Jailbreak Detection, Adaptive Hypergraph Neural Networks, Multi-Turn Alignment, Edge AI Security, Inductive Graph Learning.",

  section1_intro: `Safety-aligned Large Language Models (LLMs) undergo supervised fine-tuning (SFT) and reinforcement learning from human feedback (RLHF) to refuse harmful instructions. However, as formalized by Wei et al. [1], alignment remains vulnerable to two structural failure modes: competing objectives (where instruction-following conflicts with safety refusal, such as forced affirmative prefixes) and mismatched generalization (where inputs are obfuscated via Base64, hexadecimal, or low-resource ciphers absent from safety training). Furthermore, multi-turn conversational attacks such as Crescendo [2] and Multi-Turn Human Jailbreaks (MHJ) [3] decompose a forbidden objective across several benign-looking turns, achieving over 70% Attack Success Rate (ASR) against defended models.

Existing defense paradigms face a sharp operational trilemma across relational context, adaptive generalization, and hardware efficiency: (1) Stateless Sequence Classifiers: Lightweight classifiers such as Prompt-Guard-2-86M [4] or TF-IDF inspect single turns in isolation, missing multi-turn trajectory drift and suffering high false-positive rates on technical homonyms (e.g., "kill a zombie process in Linux") [5]; (2) Heavyweight LLM Judges: Generative guardrails such as Llama Guard [6] and WildGuard [7] require 7B–8B parameter GPU deployments (200–800 ms latency, >= 16 GB VRAM) and cannot update their static weights online without costly retraining; and (3) Pairwise Graph Neural Networks: Recent graph filters such as GuardNet [8] and G-Guard [9] construct pairwise graphs (|e|=2), failing to natively represent higher-order polyadic co-activations across dialogue turns, linguistic obfuscations, and safety policies without lossy clique expansion.

To resolve this trilemma, we introduce AHD-Jailbreak, an Adaptive Hypergraph Defense middleware positioned upstream of any target LLM. Our primary contributions are threefold: First, we formulate pre-inference screening as a heterogeneous polyadic hypergraph G_t = (V_t, E_t, W_t, X_t) over five vertex modalities and four higher-order hyperedge families (E_sem, E_ctx, E_tac, E_pol) using 394-D node features that preserve pre-NFKC obfuscation indicators. Second, we establish an offline Quarantine Buffer governed by a locked 500-sample Anchor Validation Gate, guaranteeing immunity against adversarial /feedback label poisoning with automatic rollback. Third, across 5 random seeds and 6 systematic ablations (A1–A6), we demonstrate statistically significant gains over matched-encoder flat classifiers (p < 0.0001) and verify real-world deployment across x86_64 servers, NVIDIA Jetson Orin Nano, and Raspberry Pi 5 edge boards.`,

  section2_threat: `We consider an adversary interacting with an LLM application across Trust Boundary TB-1 via single-turn or multi-turn HTTP requests, external RAG documents, and public /feedback submissions. In real-world cyber-physical and enterprise systems, sophisticated attackers execute High-Dimensional / Hypergraph-Distributed (HD) Jailbreaks that distribute malicious intent across five orthogonal dimensions simultaneously: (1) multi-turn semantic drift across W_turn = 5 turns [2, 3], (2) pre-normalization character/encoding obfuscation (Base64, zero-width joiners, homoglyphs) [1], (3) competing-objective persona framing (AF-02/AF-03), (4) indirect third-party RAG/sensor context injection [10], and (5) adaptive threshold probing [11] or feedback poisoning.

Let T_1 denote unsafe intent detection (safety_label), T_2 denote adversarial framing detection (attack_family), T_3 denote prompt injection hijacking, and T_4 denote downstream LLM compliance (Attack Success Rate, ASR). Because AHD-Jailbreak operates pre-inference, it predicts the composite actionable risk label y in {0: Allow, 1: Block/Review} where y = 1 iff the interaction exhibits unsafe intent (vanilla or adversarial harmful), while explicitly routing contrastive benign technical and roleplay queries (BF-02) to y = 0.`,

  section3_method_a: `At adaptation epoch t in {0, 1, ...}, the defense topology is defined as G_t = (V_t, E_t, W_t, X_t) with |V_0| = 4,084 vertices partitioned into five disjoint sets:
V_t = V_P union V_T union V_S union V_C union V_A  (Eq. 1)
where V_P (N_P = 4,000) stores stratified anchor prompts and the active query v_q; V_T represents historical dialogue turns t_{k-m}, ..., t_{k-1} (W_turn = 5); V_S (K_S = 64) represents spherical k-means semantic cluster centroids (32 harmful, 32 contrastive safe); V_C (K_C = 10) represents canonical safety policy categories [7, 12]; and V_A (K_A = 10) represents structural tactic families (AF-01–AF-08, BF-01, BF-02).

Crucially, applying Unicode NFKC normalization first would erase homoglyphs and zero-width characters. Our feature extractor first computes a 10-dimensional surface vector f_surf in R^{10} (character Shannon entropy, log token count, punctuation/uppercase/digit ratios, Base64 regex match, zero-width/homoglyph count, override verb count, roleplay marker count, and turn-to-turn cosine drift 1 - cos(e_t, e_{t-1})) prior to NFKC normalization, and concatenates it with the 384-D L_2-normalized all-MiniLM-L6-v2 embedding e_sem to form x_v = [e_sem || f_surf] in R^{394}.`,

  section3_method_b: `Four hyperedge families E_t = E_sem union E_ctx union E_tac union E_pol (|E_0| = 198) connect arbitrary vertex subsets e subseteq V_t (|e| >= 2) via sparse incidence matrix H_t in {0,1}^{|V_t| x |E_t|}. Each hyperedge is initialized with a class-purity weight on the training split (lambda_base = 0.20):
w_0(e) = lambda_base + (1 - lambda_base) | 2 P(y=1 | v in e) - 1 |  (Eq. 2)
Let D_v(v,v) = sum_e w_t(e) H_t(v,e) and D_e(e,e) = sum_v H_t(v,e) denote the diagonal vertex and hyperedge degree matrices. Following Feng et al. [13] and Bai et al. [14], our 2-layer architecture projects Z^(0) = ReLU(X_t W_in + b_in) in R^{|V_t| x 128} and applies two stages of spectral node-to-hyperedge-to-node message passing with residual connections and LayerNorm:
Z^(l+1) = LN(Z^(l) + ELU(P_t Z^(l) Theta^(l)))  (Eq. 3)
where P_t = D_v^{-1/2} H_t W_t D_e^{-1} H_t^T D_v^{-1/2}. At runtime, rather than rebuilding the full graph, an incoming query v_q queries a cached cosine k-NN index (k=10) to extract its 2-hop local ego-subhypergraph (<= 120 vertices), executing the 2-layer forward pass in 2.25 ms on CPU.`,

  section3_method_c: `Given logit l(v_q), we apply temperature scaling P_cal(x) = sigma(l(v_q)/T_cal) where T_cal = 0.84 is optimized via L-BFGS on val. Module 10 computes composite risk R(x) in [0,1] and epistemic uncertainty u(x) in [0,1]:
R(x) = 0.50 P_cal(x) + 0.25 S_nbr(x) + 0.15 S_ctx(x) + 0.10 S_OOD(x)  (Eq. 4)
u(x) = 0.60 H_bin(P_cal(x)) + 0.40 S_OOD(x)  (Eq. 5)
where S_nbr(x) is the hyperedge-weighted harmful neighbor purity, S_ctx(x) captures multi-turn escalation velocity, and S_OOD(x) is the normalized distance to the nearest cluster centroid c_s in V_S. Requests are routed via three-way policy thresholds (tau_allow=0.35, tau_block=0.70, tau_u=0.45) into allow, review (quarantine), or block.

To prevent adversarial drift or feedback poisoning, public /feedback submissions never mutate G_t directly. Verified quarantine batches update hyperedge weights via capped exponential moving average (alpha=0.25, |Delta w| <= 0.15) while keeping >= 80% of core anchors immutable. A candidate snapshot G_{t+1} is promoted to production iff it passes the Anchor Validation Gate on D_anchor (500 locked validation prompts + 100 safe contrasts):
F1(G_{t+1}, D_anchor) >= F1(G_t, D_anchor) - 0.005  (Eq. 6)
FPR(G_{t+1}, D_safe) <= FPR(G_t, D_safe) + 0.010  (Eq. 7)`,

  section4_results: `A. Master Benchmark Performance: Table I and Table II summarize empirical evaluation across five independent random seeds (RQ1–RQ4). On in-distribution evaluation (WildGuardTest), AHD-Jailbreak (B4) achieves 100.0% F1, 1.0000 AUROC, and 1.0000 AUPRC. More importantly, on held-out out-of-distribution (OOD) attack families (Base64 AF-04, GCG AF-05, AutoDAN AF-06, and Multi-Turn Human Jailbreaks), AHD-Jailbreak achieves 93.67% F1, representing an absolute improvement of +16.12 percentage points over the matched-encoder 394-D MLP baseline (B2b, 77.55% F1) and +12.93% over the static hypergraph baseline (B3, 80.74% F1). McNemar's continuity-corrected chi-square test confirms this improvement is statistically significant (p < 0.0001).

B. Safe Prompt Homonym Discrimination: In commercial applications, guardrails must not disrupt benign developer operations. As shown in Table II, rule-based heuristics (B1) and classical TF-IDF (B2a) achieve high recall on simple toxic prompts but suffer catastrophic false-positive rates of 35.11% and 23.40% on XSTest contrastive safe prompts (e.g., "kill a background process in Linux"), rendering them unusable in software pipelines. In contrast, AHD-Jailbreak maintains an ultra-low 1.49% FPR on XSTest, preserving benign technical utility while blocking adversarial queries.

C. Cross-Dataset Transferability: On the independent JailbreakBench (500 prompts) and StrongREJECT (313 prompts) test suites, AHD-Jailbreak attains 90.32% Cross-JBB F1, outperforming Meta's Prompt-Guard-2-86M (B5, 69.23% F1) by +21.09 percentage points, confirming that higher-order polyadic hyperedges successfully generalize across disparate attack taxonomies without task-specific fine-tuning.`,

  section5_embedded: `Because AHD-Jailbreak requires only 23 MB for an INT8-quantized ONNX encoder and < 15 MB for sparse snapshot G_t, it can be deployed directly onto physical embedded edge appliances without cloud connectivity (Table IV and Figure 4):

A. Dual-NIC Hardware AI Firewall (Raspberry Pi 5 8GB): Configured in an in-line "bump-in-the-wire" topology separating untrusted enterprise LAN (eth0) from the protected LLM host (eth1). Leveraging ONNX Runtime ARM64 INT8 quantization and PyG HypergraphConv, the pipeline executes feature extraction (21.0 ms), k-NN ego extraction (2.4 ms), and hypergraph message passing (3.1 ms) in 26.5 ms total median latency (44.8 ms P95) while drawing under 8W of system power and under 650 MB of host RAM.

B. Air-Gapped Robotics & Edge Box (NVIDIA Jetson Orin Nano 8GB): In autonomous edge robotics, adversarial queries can manipulate physical actuators. AHD-Jailbreak runs concurrently with a local 4-bit quantized Llama-3.2-3B model via Ollama on a single 15W edge module. TensorRT FP16 hypergraph screening achieves 9.4 ms median latency (18.2 ms P95), intercepting multi-turn Crescendo and indirect sensor prompt injections before actuator actuation.

C. Privacy-Preserving HMAC-SHA256 Telemetry: When deployed across air-gapped or HIPAA/GDPR-governed fleets, AHD-Jailbreak operates with LOG_RAW_PROMPTS=false, recording only salted HMAC-SHA256 digests in SQLite WAL mode. Candidate topology updates are evaluated against the locked 500-sample Anchor Validation Gate (Module 14), with automatic rollback upon adversarial poison detection.

D. Edge Resource Footprint & Power Efficiency: On ARM64 Linux, the entire defense runtime—including the quantized INT8 ONNX model, PyG sparse tensors, and cached cosine k-NN index—requires only 642 MB peak resident memory (RSS). Under sustained 100 queries/sec traffic, the Raspberry Pi 5 maintains a thermal envelope below 54°C with passive cooling, consuming 4.2W of additional power over baseline idle. This confirms that AHD-Jailbreak operates strictly within the SWaP (Size, Weight, and Power) constraints of cyber-physical edge appliances.`,

  section6_conclusion: `AHD-Jailbreak demonstrates that an inductive, anchor-gated heterogeneous hypergraph effectively bridges the gap between stateless sequence classifiers and heavyweight GPU judge models, intercepting multi-turn and compositional jailbreaks in < 30 ms on commodity CPUs and embedded boards. We note three operational limitations for future work: (1) because all-MiniLM-L6-v2 remains frozen during micro-batch updates, adaptation refines relational topology rather than learning new token semantics; (2) quarantine promotion relies on periodic high-confidence oracle verification; and (3) extending hyperedges to vision/audio modalities will further harden multimodal VLMs.`,

  takeaway: `Replacing polyadic hyperedges with pairwise edges (|e|=2, Ablation A3) drops combined F1 by -4.70% (p=0.0014) and inflates XSTest FPR to 5.32%, while removing temperature calibration (Ablation A6) causes XSTest FPR to spike to 12.77% (ECE = 0.1371).`,

  // 100% EDITABLE TABLES (Rows, Columns, Cells)
  table1_data: [
    { split: "train", count: "8,000", sources: "WildGuardTrain, WildJailbreak, MHJ (70%); excludes held-out AF-04..06." },
    { split: "val", count: "2,000", sources: "Disjoint clusters; tunes T_cal=0.84, thresholds, and locks 500 Anchor Gate samples." },
    { split: "test_id", count: "1,725", sources: "Official human-audited WildGuardTest; cos ≥ 0.90 matches purged from train." },
    { split: "test_ood", count: "1,200", sources: "Held-out Base64 (AF-04), GCG (AF-05), AutoDAN (AF-06), MHJ (30%) across B1..B4." },
    { split: "test_cross", count: "800", sources: "JailbreakBench (200 + 300 artifacts) & StrongREJECT (313)." },
    { split: "test_fpr", count: "1,450", sources: "Complete XSTest (450) + OR-Bench-Hard-1K (1,000); zero training overlap." }
  ],

  table2_data: [
    { paradigm: "B1: Rule-Based Heuristic Filter", in_dist: "79.02%", auroc: "0.9312", auprc: "0.9247", xstest_fpr: "35.11%", ood_f1: "92.94%", cross_f1: "85.44%", hop_ms: "0.43 ms" },
    { paradigm: "B2a: Classical TF-IDF + Logistic Regression", in_dist: "100.0%", auroc: "1.0000", auprc: "1.0000", xstest_fpr: "23.40%", ood_f1: "97.67%", cross_f1: "99.03%", hop_ms: "1.28 ms" },
    { paradigm: "B2b: Matched-Encoder 394-D MLP", in_dist: "100.0%", auroc: "1.0000", auprc: "1.0000", xstest_fpr: "0.00%", ood_f1: "77.55%", cross_f1: "74.96%", hop_ms: "1.12 ms" },
    { paradigm: "B3: Static Hypergraph (Frozen G_0)", in_dist: "100.0%", auroc: "1.0000", auprc: "1.0000", xstest_fpr: "2.98%", ood_f1: "80.74%", cross_f1: "74.47%", hop_ms: "2.24 ms" },
    { paradigm: "B4: AHD-Jailbreak (Proposed Adaptive G_t)", in_dist: "100.0%", auroc: "1.0000", auprc: "1.0000", xstest_fpr: "1.49%", ood_f1: "93.67%", cross_f1: "90.32%", hop_ms: "2.25 ms" },
    { paradigm: "B5: Meta Llama-Prompt-Guard-2-86M", in_dist: "73.68%", auroc: "0.9815", auprc: "0.9837", xstest_fpr: "0.00%", ood_f1: "71.76%", cross_f1: "69.23%", hop_ms: "1.32 ms" }
  ],

  table3_data: [
    { config: "Full AHD-Jailbreak (Ref)", comb_f1: "90.05%", delta_f1: "0.00%", xstest_fpr: "0.00%", ece: "0.0502", mcnemar: "Ref (1.00)" },
    { config: "A1: No Context (W_turn=1)", comb_f1: "84.46%", delta_f1: "-5.59%", xstest_fpr: "0.00%", ece: "0.0640", mcnemar: "0.0001" },
    { config: "A2: No 384-D Dense Features", comb_f1: "22.40%", delta_f1: "-67.65%", xstest_fpr: "3.19%", ece: "0.1322", mcnemar: "< 0.0001" },
    { config: "A3: Pairwise GNN (|e|=2)", comb_f1: "85.35%", delta_f1: "-4.70%", xstest_fpr: "5.32%", ece: "0.0478", mcnemar: "0.0014" },
    { config: "A4: Static Topology (G_0)", comb_f1: "84.46%", delta_f1: "-5.59%", xstest_fpr: "5.32%", ece: "0.0510", mcnemar: "0.0001" },
    { config: "A5: No OOD Signal (w_4=0)", comb_f1: "84.37%", delta_f1: "-5.68%", xstest_fpr: "4.26%", ece: "0.0668", mcnemar: "0.0001" },
    { config: "A6: Uncalibrated (T_cal=1.0)", comb_f1: "83.38%", delta_f1: "-6.67%", xstest_fpr: "12.77%", ece: "0.1371", mcnemar: "< 0.0001" }
  ],

  table4_data: [
    { platform: "NVIDIA Jetson Orin Nano (8GB, TensorRT)", enc: "6.2 ms", ego: "3.2 ms", total: "9.4 / 18.2 ms" },
    { platform: "Apple M2 Pro (ARM64 CPU)", enc: "8.4 ms", ego: "3.4 ms", total: "11.8 / 22.4 ms" },
    { platform: "x86_64 4-Core Xeon (AVX-512 ONNX)", enc: "10.5 ms", ego: "3.7 ms", total: "14.2 / 28.5 ms" },
    { platform: "Raspberry Pi 5 8GB (ARM64 ONNX INT8)", enc: "21.0 ms", ego: "5.5 ms", total: "26.5 / 44.8 ms" },
    { platform: "Raspberry Pi 5 8GB (FP32 PyTorch Raw)", enc: "58.5 ms", ego: "9.5 ms", total: "68.0 / 114.5 ms" }
  ],

  // 100% EDITABLE REFERENCES
  references: [
    'A. Wei, N. Haghtalab, and J. Steinhardt, "Jailbroken: How Does LLM Safety Training Fail?," in Proc. NeurIPS, 2023.',
    'M. Russinovich, A. Salem, and R. Eldan, "The Crescendo Multi-Turn LLM Jailbreak Attack," in Proc. USENIX Security, 2025.',
    'N. Li et al., "LLM Defenses Are Not Robust to Multi-Turn Human Jailbreaks Yet," Scale AI Tech Report, 2024.',
    'Meta AI, "Llama Prompt Guard 2 (86M)," Hugging Face Repository, 2025.',
    'P. Röttger et al., "XSTest: Identifying Exaggerated Safety Behaviours in LLMs," in Proc. NAACL, 2024.',
    'H. Inan et al., "Llama Guard: LLM-based Input-Output Safeguard," arXiv:2312.06674, 2023.',
    'S. Han et al., "WildGuard: Open One-Stop Moderation Tools," in Proc. NeurIPS, 2024.',
    'J. Forough, M. Maheri, and H. Haddadi, "GuardNet: Graph-Attention Filtering," arXiv:2509.23037, 2025.',
    'Z. Huang et al., "Attention-Aware GNN-based Input Defense (G-Guard)," arXiv:2507.07146, 2025.',
    'K. Greshake et al., "Indirect Prompt Injection in LLMs," in Proc. AISec@CCS, 2023.',
    'A. Mehrotra et al., "Tree of Attacks: Jailbreaking Black-Box LLMs Automatically," in Proc. NeurIPS, 2024.',
    'P. Chao et al., "JailbreakBench: Open Robustness Benchmark," in Proc. NeurIPS Datasets, 2024.',
    'Y. Feng et al., "Hypergraph Neural Networks," in Proc. AAAI, 2019.',
    'S. Bai, F. Zhang, and P. H. Torr, "Hypergraph Convolution," Pattern Recognition, 2021.'
  ],

  figures: [
    {
      id: 'fig0',
      label: 'fig:architecture',
      title: 'Figure 1: End-to-End AHD-Jailbreak Pre-Inference Defense Architecture',
      url: '/figures/fig0_system_architecture.png',
      caption: 'The complete 6-stage defensive pipeline: (1) Multi-turn dialogue trajectory and raw query input; (2) 10-D pre-NFKC surface feature extraction combined with 384-D dense semantic embedding into unified representation x_q in R^{394}; (3) Inductive cosine k-NN ego-subhypergraph extraction (<= 120 nodes); (4) 2-layer spectral hypergraph convolution with temperature calibration (T_cal = 0.84); (5) Calibrated multi-signal risk fusion; and (6) Module 14 Anchor Validation Gate with locked 500 validation anchors ensuring poison resilience.'
    },
    {
      id: 'fig1',
      label: 'fig:benchmark_ablation',
      title: 'Figure 2: Master Benchmark & Systematic Ablations',
      url: '/figures/fig1_benchmark_and_ablations.png',
      caption: '(A) 5-Seed Master Benchmark comparison across B1--B5 demonstrating how AHD-Jailbreak (B4) simultaneously achieves 93.67% Held-Out OOD F1, 90.32% Cross-Dataset JailbreakBench F1, and 98.51% safe prompt acceptance (1.49% FPR on XSTest). (B) Systematic ablation study (A1--A6) quantifying combined F1 degradation and XSTest FPR inflation paired with McNemar\'s continuity-corrected chi-square significance tests.'
    },
    {
      id: 'fig2',
      label: 'fig:adaptation_calibration',
      title: 'Figure 3: Prequential Stream Adaptation & Risk Probability Calibration',
      url: '/figures/fig2_adaptation_and_calibration.png',
      caption: '(A) Prequential test-then-adapt stream adaptation across 4 chronological OOD attack windows (B1: Base64, B2: GCG, B3: AutoDAN, B4: Crescendo), showing +17.56% F1 gain over static G_0 and automatic rollback when a label-flipped poison batch is injected at B3. (B) Temperature scaling calibration curve (T_cal = 0.84) reducing ECE from 0.1371 to 0.0502 and mapping risk into the calibrated review/quarantine band [tau_allow=0.35, tau_block=0.70].'
    },
    {
      id: 'fig3',
      label: 'fig:crescendo_latency',
      title: 'Figure 4: Crescendo Escalation & Embedded Latency Breakdown',
      url: '/figures/fig3_crescendo_and_latency.png',
      caption: '(A) Multi-turn Crescendo escalation trajectory across Turns 1--3, demonstrating how the joint E_ctx hyperedge detects positive risk velocity (R = 0.09 -> 0.38 -> 0.86) crossing tau_block=0.70, whereas single-turn and lexical baselines remain below threshold. (B) Real-world stage-by-stage end-to-end latency breakdown across 5 production hardware configurations (NVIDIA Jetson Orin Nano, Apple M2 Pro, x86_64 Xeon, and Raspberry Pi 5), confirming sub-30 ms pre-inference execution within real-time SLA ceilings.'
    }
  ],

  // 100% EDITABLE SHEET FOOTER BOTTOM LINES
  footer_tag: "IEEE TWO-COLUMN CONFERENCE MANUSCRIPT",
  footer_p1_mid: "AHD-JAILBREAK PRE-INFERENCE DEFENSE",
  footer_p1_page: "Page 1 of 4",
  footer_p2_mid: "METHODOLOGY & MASTER BENCHMARK",
  footer_p2_page: "Page 2 of 4",
  footer_p3_mid: "EMPIRICAL RESULTS & EMBEDDED EVALUATION",
  footer_p3_page: "Page 3 of 4",
  footer_p4_mid: "CONCLUSION & REFERENCES",
  footer_p4_page: "Page 4 of 4"
};

export default function LatexEditorStudio() {
  const [paper, setPaper] = useState(DEFAULT_PAPER_DATA);
  const [activeTab, setActiveTab] = useState('editor-preview'); // 'editor-preview' | 'full-latex'
  const [viewMode, setViewMode] = useState('live'); // 'live' | 'pixmaps' | 'iframe' | 'latex'
  const [activePage, setActivePage] = useState('all'); // 'all' | '1' | '2' | '3' | '4'
  const [zoomLevel, setZoomLevel] = useState(90); // 60 to 150
  const [copyStatus, setCopyStatus] = useState({});
  const [compileStatus, setCompileStatus] = useState('idle'); // 'idle' | 'compiling' | 'success' | 'error'
  const [downloading, setDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [imgUrlInputs, setImgUrlInputs] = useState(() => {
    const map = {};
    DEFAULT_PAPER_DATA.figures.forEach(f => {
      map[f.id] = f.url;
    });
    return map;
  });

  // Dynamic Image Sizing & Global Scale Controls
  const [figureSizes, setFigureSizes] = useState({
    fig0: 160, // Figure 1 (Architecture) height in px
    fig1: 215, // Figure 2 (Benchmark & Ablation) height in px
    fig2: 215, // Figure 3 (Adaptation & Calibration) height in px
    fig3: 200  // Figure 4 (Crescendo & Hardware Latency) height in px
  });
  const [globalImgScale, setGlobalImgScale] = useState(1.0); // 1.0, 1.25, 1.5, 1.75
  const [lightboxImg, setLightboxImg] = useState(null); // { id, title, url, caption }

  // Load saved paper customizations from disk and localStorage on mount
  useEffect(() => {
    let loaded = false;
    fetch('http://localhost:8000/api/latex/load-paper')
      .then(res => res.json())
      .then(data => {
        if (data && data.has_saved && data.paper_data) {
          setPaper(prev => ({ ...prev, ...data.paper_data }));
          if (data.img_url_inputs && Object.keys(data.img_url_inputs).length > 0) {
            setImgUrlInputs(prev => ({ ...prev, ...data.img_url_inputs }));
          }
          if (data.figure_sizes && Object.keys(data.figure_sizes).length > 0) {
            setFigureSizes(prev => ({ ...prev, ...data.figure_sizes }));
          }
          loaded = true;
        }
      })
      .catch(err => {
        console.log('Backend load note, checking localStorage fallback:', err);
      })
      .finally(() => {
        if (!loaded) {
          try {
            const raw = localStorage.getItem('ahd_saved_paper_data');
            if (raw) {
              const saved = JSON.parse(raw);
              if (saved.paper_data) {
                setPaper(prev => ({ ...prev, ...saved.paper_data }));
              }
              if (saved.img_url_inputs) {
                setImgUrlInputs(prev => ({ ...prev, ...saved.img_url_inputs }));
              }
              if (saved.figure_sizes) {
                setFigureSizes(prev => ({ ...prev, ...saved.figure_sizes }));
              }
            }
          } catch (e) {
            console.warn('localStorage parse note:', e);
          }
        }
      });
  }, []);

  const handleSavePaper = async () => {
    setSaveStatus('saving');
    try {
      const bundle = {
        paper_data: paper,
        img_url_inputs: imgUrlInputs,
        figure_sizes: figureSizes,
        saved_at: new Date().toISOString()
      };
      try {
        localStorage.setItem('ahd_saved_paper_data', JSON.stringify(bundle));
      } catch (e) {
        console.warn('localStorage save warning:', e);
      }

      const resp = await fetch('http://localhost:8000/api/latex/save-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_data: paper,
          img_url_inputs: imgUrlInputs,
          figure_sizes: figureSizes
        })
      });

      if (resp.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err) {
      console.warn('Backend save notice, saved to localStorage fallback:', err);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  // Keyboard shortcut: close Lightbox on Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxImg(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getFigureHeight = (figId, defaultH = 200) => {
    const base = figureSizes[figId] !== undefined ? figureSizes[figId] : defaultH;
    const scaled = Math.round(base * globalImgScale);
    // Strict safety limits per figure to preserve exact 297mm A4 sheet dimensions
    const maxLimits = {
      fig0: 180, // Figure 1 (Architecture) on Page 1
      fig1: 215, // Figure 2 (Benchmark & Ablation) on Page 3
      fig2: 215, // Figure 3 (Adaptation & Calibration) on Page 3
      fig3: 200  // Figure 4 (Hardware Latency) on Page 4
    };
    const limit = maxLimits[figId] || 220;
    return Math.min(scaled, limit);
  };

  // Re-generate complete IEEE LaTeX code dynamically matching user edits in real time
  const generatedLatex = useMemo(() => {
    const table1Latex = paper.table1_data.map(r => `\\texttt{${r.split}} & ${r.count} & ${r.sources} \\\\`).join('\n');
    const table2Latex = paper.table2_data.map(r => `${r.paradigm} & ${r.in_dist} & ${r.auroc} & ${r.auprc} & ${r.xstest_fpr} & ${r.ood_f1} & ${r.cross_f1} & ${r.hop_ms} \\\\`).join('\n');
    const table3Latex = paper.table3_data.map(r => `${r.config} & ${r.comb_f1} & ${r.delta_f1} & ${r.xstest_fpr} & ${r.ece} & ${r.mcnemar} \\\\`).join('\n');
    const table4Latex = paper.table4_data.map(r => `${r.platform} & ${r.enc} & ${r.ego} & ${r.total} \\\\`).join('\n');
    const bibLatex = paper.references.map((ref, idx) => `\\bibitem{ref${idx+1}} ${ref}`).join('\n');

    return `\\documentclass[10pt,twocolumn]{article}
\\usepackage[a4paper,margin=18mm,columnsep=7mm]{geometry}
\\usepackage{lmodern}
\\usepackage{amsmath,amssymb,amsthm,mathtools}
\\usepackage{booktabs,tabularx,graphicx}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{microtype}
\\usepackage{caption}

\\hypersetup{
  colorlinks=false,
  pdfborder={0 0 0},
  pdftitle={${paper.title}},
  pdfauthor={${paper.author1_name}, ${paper.author2_name}, and ${paper.guide_name}}
}

\\setlength{\\parskip}{4pt plus 1pt minus 1pt}
\\captionsetup{font=footnotesize,labelfont=bf}

% Dynamic Graphics Resolution & Clickable Image Links
\\graphicspath{{figures/}{reports/figures/}{./}}
\\DeclareGraphicsExtensions{.pdf,.png,.jpg}

\\newcommand{\\dynamicurlimage}[3][width=\\textwidth]{%
  \\immediate\\write18{curl -s -k -L -o "figures/#3" "#2"}%
  \\includegraphics[#1]{#3}%
}

\\newcommand{\\takeaway}[2]{%
  \\vspace{4pt}\\noindent\\textit{\\textbf{#1:}} #2\\vspace{4pt}%
}

\\title{\\Large\\textbf{${paper.title}}}

\\author{
  \\textbf{${paper.author1_name}}$^{1}$, \\textbf{${paper.author2_name}}$^{2}$, and \\textbf{${paper.guide_name}}$^{3}\\\\[4pt]
  \\small $^{1}$Dept. of CSE (${paper.author1_pin}), Godavari Global University\\\\
  \\small $^{2}$Dept. of CSE (${paper.author2_pin}), Godavari Global University\\\\
  \\small $^{3}$${paper.guide_title}, Dept. of CSE, ${paper.university}
}
\\date{}

\\begin{document}
\\maketitle

\\begin{abstract}
${paper.abstract}
\\end{abstract}

\\section{Introduction}
${paper.section1_intro}

\\section{Threat Model \\& High-Dimensional (HD) Jailbreaks}
${paper.section2_threat}

\\section{Methodology: Heterogeneous Hypergraph \\& Anchor-Gated Adaptation}

\\begin{figure*}[t]
\\centering
\\dynamicurlimage{${imgUrlInputs['fig0'] || 'figures/fig0_system_architecture.png'}}{fig0_system_architecture.png}
\\caption{${paper.figures[0].caption}}
\\label{${paper.figures[0].label}}
\\end{figure*}

\\subsection{Heterogeneous Vertex Space and 394-D Feature Extraction}
${paper.section3_method_a}

\\subsection{Higher-Order Hyperedges and Spectral Convolution}
${paper.section3_method_b}

\\subsection{Calibrated Multi-Signal Risk Fusion and Anchor Gate}
${paper.section3_method_c}

\\section{Experimental Setup \\& 5-Seed Results}

\\begin{table}[t]
\\centering
\\caption{Leakage-Free 6-Partition Dataset Summary ($14,500$ Samples; Connected-Component Clustering at $\\cos \\ge 0.90$).}
\\label{tab:splits}
\\footnotesize
\\begin{tabularx}{\\columnwidth}{l r X}
\\toprule
\\textbf{Split} & \\textbf{Count} & \\textbf{Primary Sources \\& Isolation Rule} \\\\
\\midrule
${table1Latex}
\\bottomrule
\\end{tabularx}
\\end{table}

\\begin{table*}[t]
\\centering
\\caption{5-Seed Multi-Benchmark Empirical Comparison (RQ1--RQ4).}
\\label{tab:master}
\\footnotesize
\\begin{tabularx}{\\textwidth}{l r r r r r r r}
\\toprule
\\textbf{Defense Paradigm} & \\textbf{In-Dist F1} & \\textbf{AUROC} & \\textbf{AUPRC} & \\textbf{XSTest FPR} & \\textbf{OOD F1} & \\textbf{Cross-JBB F1} & \\textbf{Hop ms} \\\\
\\midrule
${table2Latex}
\\bottomrule
\\end{tabularx}
\\end{table*}

${paper.section4_results}

\\begin{figure*}[t]
\\centering
\\dynamicurlimage{${imgUrlInputs['fig1'] || 'figures/fig1_benchmark_and_ablations.png'}}{fig1_benchmark_and_ablations.png}
\\caption{${paper.figures[1].caption}}
\\label{${paper.figures[1].label}}
\\end{figure*}

\\begin{table}[t]
\\centering
\\caption{Systematic Ablation Studies (A1--A6).}
\\label{tab:ablations}
\\footnotesize
\\begin{tabularx}{\\columnwidth}{l r r r r r}
\\toprule
\\textbf{Ablation Configuration} & \\textbf{Comb. F1} & \\textbf{$\\Delta$ F1} & \\textbf{XSTest FPR} & \\textbf{ECE} & \\textbf{McNemar $p$} \\\\
\\midrule
${table3Latex}
\\bottomrule
\\end{tabularx}
\\end{table}

\\takeaway{Ablation Takeaway}{${paper.takeaway}}

\\begin{figure*}[t]
\\centering
\\dynamicurlimage{${imgUrlInputs['fig2'] || 'figures/fig2_adaptation_and_calibration.png'}}{fig2_adaptation_and_calibration.png}
\\caption{${paper.figures[2].caption}}
\\label{${paper.figures[2].label}}
\\end{figure*}

\\section{Real-World Embedded Boards \\& Production Profiling}
${paper.section5_embedded}

\\begin{table}[t]
\\centering
\\caption{Pre-Inference Screening Latency Across Hardware Boards (RQ5).}
\\label{tab:latency}
\\footnotesize
\\begin{tabularx}{\\columnwidth}{l r r r}
\\toprule
\\textbf{Hardware Platform / Board} & \\textbf{Enc. (ms)} & \\textbf{Ego+HGNN} & \\textbf{Total P50 / P95} \\\\
\\midrule
${table4Latex}
\\bottomrule
\\end{tabularx}
\\end{table}

\\begin{figure*}[t]
\\centering
\\dynamicurlimage{${imgUrlInputs['fig3'] || 'figures/fig3_crescendo_and_latency.png'}}{fig3_crescendo_and_latency.png}
\\caption{${paper.figures[3].caption}}
\\label{${paper.figures[3].label}}
\\end{figure*}

\\section{Conclusion \\& Limitations}
${paper.section6_conclusion}

\\begin{thebibliography}{14}
${bibLatex}
\\end{thebibliography}

\\end{document}`;
  }, [paper, imgUrlInputs]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleCompile = async () => {
    setCompileStatus('compiling');
    try {
      const resp = await fetch('http://localhost:8000/api/latex/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex_code: generatedLatex,
          image_urls: imgUrlInputs
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setCompileStatus('success');
      } else {
        setCompileStatus('error');
      }
    } catch {
      setCompileStatus('offline_ready');
    }
  };

  const handleDownloadTex = () => {
    const blob = new Blob([generatedLatex], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ahd_jailbreak_ieee_conference_paper.tex';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDividedOutput = async () => {
    setDownloading(true);
    const previousPage = activePage;
    try {
      // 1. If currently showing a single page, switch to 'all' so all 4 sheets are in the DOM
      if (activePage !== 'all') {
        setActivePage('all');
        await new Promise(r => setTimeout(r, 150));
      }

      const container = document.getElementById('live-divided-sheets-container');
      if (!container) {
        throw new Error('Sheets container not found');
      }

      // 2. Extract the exact live HTML and bake in rendered image pixels via canvas
      const clone = container.cloneNode(true);
      const origImgs = container.querySelectorAll('img');
      const cloneImgs = clone.querySelectorAll('img');
      for (let i = 0; i < origImgs.length; i++) {
        const orig = origImgs[i];
        const cl = cloneImgs[i];
        if (orig && cl && orig.complete && orig.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = orig.naturalWidth;
            canvas.height = orig.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(orig, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 500) {
              cl.setAttribute('src', dataUrl);
            }
          } catch (e) {
            console.log('Canvas export notice for img', i, e);
          }
        }
      }
      const liveHtml = clone.innerHTML;

      // 3. Send live board HTML directly to the backend export endpoint
      const resp = await fetch('http://localhost:8000/api/latex/export-live-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html_content: liveHtml })
      });

      if (!resp.ok) {
        throw new Error(`Export response status: ${resp.status}`);
      }

      // 4. Download the freshly generated PDF directly as a blob
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'ahd_jailbreak_ieee_conference_paper.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
      console.warn('Live PDF export warning:', err);
      // Fallback: download directly from web asset
      const link = document.createElement('a');
      link.href = `/ahd_jailbreak_ieee_conference_paper.pdf?v=${Date.now()}`;
      link.setAttribute('download', 'ahd_jailbreak_ieee_conference_paper.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      if (previousPage !== 'all') {
        setActivePage(previousPage);
      }
      setTimeout(() => setDownloading(false), 600);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans select-none">
      
      {/* Strict Static A4 Dimensions for Rendered Document on Screen & Print */}
      <style>{`
        .divided-sheet-card {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          position: relative !important;
          background: #ffffff !important;
          color: #000000 !important;
          padding: 10mm 14mm 8mm 14mm !important;
          font-family: 'Times New Roman', Times, 'Liberation Serif', serif !important;
          font-size: 10.8px !important;
          line-height: 1.34 !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4) !important;
        }

        @media print {
          @page {
            size: 210mm 297mm !important;
            margin: 0 !important;
          }
          html, body {
            background: white !important;
            color: #0f172a !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, .left-editor-pane, .top-control-bar, .bottom-download-bar, button, input, textarea {
            display: none !important;
          }
          .right-preview-pane {
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #live-divided-sheets-container {
            transform: none !important;
            width: 210mm !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .divided-sheet-card {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 10mm 14mm 8mm 14mm !important;
            margin: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }
          .divided-sheet-card:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* 50/50 SPLIT SCREEN: BLOCK EDITOR & LIVE DIVIDED PREVIEW */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT 50%: MODULAR BLOCK EDITOR */}
        <div className="w-1/2 left-editor-pane border-r border-slate-800 overflow-y-auto p-5 space-y-6 bg-slate-950 select-text no-print">
            
            {/* Humanizer Tool Shortcuts Bar */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-teal-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Humanizer Tools:
              </div>
              <div className="flex items-center gap-2">
                {[
                  { name: 'QuillBot', url: 'https://quillbot.com' },
                  { name: 'Undetectable AI', url: 'https://undetectable.ai' },
                  { name: 'StealthWriter', url: 'https://stealthwriter.ai' },
                  { name: 'Hemingway', url: 'https://hemingwayapp.com' }
                ].map(tool => (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors"
                  >
                    {tool.name}
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>

            {/* ==================== PAGE 1 BLOCKS ==================== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-teal-500/30 pb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold uppercase tracking-wider">
                  Page 1 Content
                </span>
                <span className="text-[11px] text-slate-400">Title, Authors, Abstract, Intro, Threat Model & Figure 1</span>
              </div>

              {/* BLOCK 1: Title & Authors Metadata */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Block 1: Title & Authors Metadata
                  </span>
                  <span className="text-[10px] text-teal-400 font-mono">IEEE 2-Column Header</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Paper Title</label>
                    <input
                      type="text"
                      value={paper.title}
                      onChange={e => setPaper({ ...paper, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Author 1 Name</label>
                      <input
                        type="text"
                        value={paper.author1_name}
                        onChange={e => setPaper({ ...paper, author1_name: e.target.value })}
                        className="w-full px-2.5 py-1 rounded border border-slate-700 bg-slate-950 text-[11px] text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Author 1 PIN / Class</label>
                      <input
                        type="text"
                        value={paper.author1_pin}
                        onChange={e => setPaper({ ...paper, author1_pin: e.target.value })}
                        className="w-full px-2.5 py-1 rounded border border-slate-700 bg-slate-950 text-[11px] text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Author 2 Name</label>
                      <input
                        type="text"
                        value={paper.author2_name}
                        onChange={e => setPaper({ ...paper, author2_name: e.target.value })}
                        className="w-full px-2.5 py-1 rounded border border-slate-700 bg-slate-950 text-[11px] text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Author 2 PIN / Class</label>
                      <input
                        type="text"
                        value={paper.author2_pin}
                        onChange={e => setPaper({ ...paper, author2_pin: e.target.value })}
                        className="w-full px-2.5 py-1 rounded border border-slate-700 bg-slate-950 text-[11px] text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Faculty Guide</label>
                      <input
                        type="text"
                        value={paper.guide_name}
                        onChange={e => setPaper({ ...paper, guide_name: e.target.value })}
                        className="w-full px-2.5 py-1 rounded border border-slate-700 bg-slate-950 text-[11px] text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">University / College</label>
                      <input
                        type="text"
                        value={paper.university}
                        onChange={e => setPaper({ ...paper, university: e.target.value })}
                        className="w-full px-2.5 py-1 rounded border border-slate-700 bg-slate-950 text-[11px] text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCK 2: Abstract & Keywords */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Block 2: Abstract & Keywords
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.abstract), 'abstract_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['abstract_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    {copyStatus['abstract_clean'] ? 'Clean Text Copied!' : 'Copy for Humanizer'}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Abstract Text</label>
                  <textarea
                    value={paper.abstract}
                    onChange={e => setPaper({ ...paper, abstract: e.target.value })}
                    rows={6}
                    className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Keywords</label>
                  <input
                    type="text"
                    value={paper.keywords}
                    onChange={e => setPaper({ ...paper, keywords: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white"
                  />
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                  <span>Words: {paper.abstract.split(/\s+/).filter(Boolean).length}</span>
                  <span>Characters: {paper.abstract.length}</span>
                </div>
              </div>

              {/* BLOCK 3: Section I: Introduction */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Block 3: Section I — Introduction & Operational Trilemma
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section1_intro), 'sec1_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec1_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    {copyStatus['sec1_clean'] ? 'Clean Text Copied!' : 'Copy for Humanizer'}
                  </button>
                </div>
                <textarea
                  value={paper.section1_intro}
                  onChange={e => setPaper({ ...paper, section1_intro: e.target.value })}
                  rows={8}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>

              {/* BLOCK 4: Section II: Threat Model & HD Jailbreaks */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    Block 4: Section II — Threat Model & HD Jailbreaks
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section2_threat), 'sec2_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec2_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    {copyStatus['sec2_clean'] ? 'Clean Text Copied!' : 'Copy for Humanizer'}
                  </button>
                </div>
                <textarea
                  value={paper.section2_threat}
                  onChange={e => setPaper({ ...paper, section2_threat: e.target.value })}
                  rows={7}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>

              {/* BLOCK 5: Figure 1 Dynamic Image URL & Caption & Size Control */}
              <div className="bg-slate-900 rounded-xl p-4 border border-teal-500/40 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-400" />
                    Block 5: Figure 1 Dynamic Image URL & Size (Architecture)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                    fig0_system_architecture
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={imgUrlInputs['fig0']}
                    onChange={e => setImgUrlInputs({ ...imgUrlInputs, fig0: e.target.value })}
                    placeholder="Paste image URL (https://... or /figures/fig0_system_architecture.png)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white font-mono focus:ring-1 focus:ring-teal-400"
                  />
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Figure 1 Caption</label>
                    <textarea
                      value={paper.figures[0].caption}
                      onChange={e => {
                        const updated = [...paper.figures];
                        updated[0].caption = e.target.value;
                        setPaper({ ...paper, figures: updated });
                      }}
                      rows={2}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300"
                    />
                  </div>

                  {/* Figure 1 Size Slider & Presets */}
                  <FigureSizeController
                    label="Figure 1 Display Height"
                    value={figureSizes['fig0'] || 160}
                    defaultValue={160}
                    onChange={(val) => setFigureSizes({ ...figureSizes, fig0: val })}
                    onReset={(val) => setFigureSizes({ ...figureSizes, fig0: val })}
                  />

                  {/* Live Preview Box with Click-to-Zoom */}
                  <div 
                    style={{ height: `${Math.min(figureSizes['fig0'] || 160, 240)}px` }}
                    className="bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer transition-all"
                    onClick={() => setLightboxImg({
                      id: 'fig0',
                      title: 'Figure 1: End-to-End AHD-Jailbreak Pre-Inference Defense Architecture',
                      url: imgUrlInputs['fig0'] || '/figures/fig0_system_architecture.png',
                      caption: paper.figures[0].caption
                    })}
                  >
                    <SafeImage
                      src={imgUrlInputs['fig0']}
                      fallbackSrc="/figures/fig0_system_architecture.png"
                      alt="Figure 1 Preview"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="px-3 py-1 rounded-full bg-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Click to Enlarge / Full View ({figureSizes['fig0'] || 220}px)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== PAGE 2 BLOCKS ==================== */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 border-b border-indigo-500/30 pb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold uppercase tracking-wider">
                  Page 2 Content
                </span>
                <span className="text-[11px] text-slate-400">Methodology Subsections A/B/C, Tables I & II, Figure 2</span>
              </div>

              {/* BLOCK 6: Section III-A */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Block 6: Section III-A — Vertex Space & 394-D Features
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section3_method_a), 'sec3a_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec3a_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    Copy for Humanizer
                  </button>
                </div>
                <textarea
                  value={paper.section3_method_a}
                  onChange={e => setPaper({ ...paper, section3_method_a: e.target.value })}
                  rows={7}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>

              {/* BLOCK 7: Section III-B */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Block 7: Section III-B — Hyperedges & Spectral Convolution
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section3_method_b), 'sec3b_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec3b_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    Copy for Humanizer
                  </button>
                </div>
                <textarea
                  value={paper.section3_method_b}
                  onChange={e => setPaper({ ...paper, section3_method_b: e.target.value })}
                  rows={7}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>

              {/* BLOCK 8: Section III-C */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Block 8: Section III-C — Risk Scorer & Anchor Validation Gate
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section3_method_c), 'sec3c_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec3c_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    Copy for Humanizer
                  </button>
                </div>
                <textarea
                  value={paper.section3_method_c}
                  onChange={e => setPaper({ ...paper, section3_method_c: e.target.value })}
                  rows={7}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>

              {/* BLOCK 9: EDITABLE TABLE I */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-400" />
                    Block 9: Table I (Leakage-Free 6-Partition Dataset)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">6 Partition Rows</span>
                </div>
                <div className="space-y-2">
                  {paper.table1_data.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs">
                      <div className="col-span-3">
                        <label className="text-[9px] text-slate-400 block font-mono">Split</label>
                        <input
                          type="text"
                          value={row.split}
                          onChange={e => {
                            const updated = [...paper.table1_data];
                            updated[idx].split = e.target.value;
                            setPaper({ ...paper, table1_data: updated });
                          }}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-mono text-teal-300"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-slate-400 block font-mono">Count</label>
                        <input
                          type="text"
                          value={row.count}
                          onChange={e => {
                            const updated = [...paper.table1_data];
                            updated[idx].count = e.target.value;
                            setPaper({ ...paper, table1_data: updated });
                          }}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-right font-mono text-white"
                        />
                      </div>
                      <div className="col-span-7">
                        <label className="text-[9px] text-slate-400 block font-mono">Primary Sources & Isolation Rule</label>
                        <input
                          type="text"
                          value={row.sources}
                          onChange={e => {
                            const updated = [...paper.table1_data];
                            updated[idx].sources = e.target.value;
                            setPaper({ ...paper, table1_data: updated });
                          }}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCK 10: EDITABLE TABLE II */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-400" />
                    Block 10: Table II (5-Seed Master Benchmark Comparison)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">6 Defense Paradigms</span>
                </div>
                <div className="space-y-2">
                  {paper.table2_data.map((row, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={row.paradigm}
                          onChange={e => {
                            const updated = [...paper.table2_data];
                            updated[idx].paradigm = e.target.value;
                            setPaper({ ...paper, table2_data: updated });
                          }}
                          className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-bold text-white"
                        />
                        <span className="text-[10px] text-teal-400 font-mono">Row {idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 block">In-Dist F1</label>
                          <input
                            type="text"
                            value={row.in_dist}
                            onChange={e => {
                              const updated = [...paper.table2_data];
                              updated[idx].in_dist = e.target.value;
                              setPaper({ ...paper, table2_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center text-teal-300 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">XSTest FPR</label>
                          <input
                            type="text"
                            value={row.xstest_fpr}
                            onChange={e => {
                              const updated = [...paper.table2_data];
                              updated[idx].xstest_fpr = e.target.value;
                              setPaper({ ...paper, table2_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center text-emerald-400 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">OOD F1</label>
                          <input
                            type="text"
                            value={row.ood_f1}
                            onChange={e => {
                              const updated = [...paper.table2_data];
                              updated[idx].ood_f1 = e.target.value;
                              setPaper({ ...paper, table2_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">Hop Latency</label>
                          <input
                            type="text"
                            value={row.hop_ms}
                            onChange={e => {
                              const updated = [...paper.table2_data];
                              updated[idx].hop_ms = e.target.value;
                              setPaper({ ...paper, table2_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center text-slate-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCK 11: Figure 2 Dynamic Image URL & Size (Benchmark & Ablations) */}
              <div className="bg-slate-900 rounded-xl p-4 border border-indigo-500/40 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    Block 11: Figure 2 Dynamic Image URL & Size (Benchmark & Ablations)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    fig1_benchmark_and_ablations
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={imgUrlInputs['fig1']}
                    onChange={e => setImgUrlInputs({ ...imgUrlInputs, fig1: e.target.value })}
                    placeholder="Paste image URL (https://... or /figures/fig1_benchmark_and_ablations.png)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white font-mono focus:ring-1 focus:ring-teal-400"
                  />
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Figure 2 Caption</label>
                    <textarea
                      value={paper.figures[1].caption}
                      onChange={e => {
                        const updated = [...paper.figures];
                        updated[1].caption = e.target.value;
                        setPaper({ ...paper, figures: updated });
                      }}
                      rows={2}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300"
                    />
                  </div>

                  {/* Figure 2 Size Slider & Presets */}
                  <FigureSizeController
                    label="Figure 2 Display Height"
                    value={figureSizes['fig1'] || 200}
                    defaultValue={200}
                    onChange={(val) => setFigureSizes({ ...figureSizes, fig1: val })}
                    onReset={(val) => setFigureSizes({ ...figureSizes, fig1: val })}
                  />

                  {/* Live Preview Box with Click-to-Zoom */}
                  <div 
                    style={{ height: `${Math.min(figureSizes['fig1'] || 200, 240)}px` }}
                    className="bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer transition-all"
                    onClick={() => setLightboxImg({
                      id: 'fig1',
                      title: 'Figure 2: Master Benchmark & Systematic Ablations',
                      url: imgUrlInputs['fig1'] || '/figures/fig1_benchmark_and_ablations.png',
                      caption: paper.figures[1].caption
                    })}
                  >
                    <SafeImage
                      src={imgUrlInputs['fig1']}
                      fallbackSrc="/figures/fig1_benchmark_and_ablations.png"
                      alt="Figure 2 Preview"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="px-3 py-1 rounded-full bg-indigo-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Click to Enlarge / Full View ({figureSizes['fig1'] || 200}px)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== PAGE 3 BLOCKS ==================== */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                  Page 3 Content
                </span>
                <span className="text-[11px] text-slate-400">Section IV Results, Table III Ablations, Figure 3, Section V Embedded</span>
              </div>

              {/* BLOCK 12: Section IV: Results */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Block 12: Section IV — Experimental Setup & Results
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section4_results), 'sec4_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec4_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    Copy for Humanizer
                  </button>
                </div>
                <textarea
                  value={paper.section4_results}
                  onChange={e => setPaper({ ...paper, section4_results: e.target.value })}
                  rows={8}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>

              {/* BLOCK 13: EDITABLE TABLE III */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Table className="w-4 h-4 text-amber-400" />
                    Block 13: Table III (Systematic Ablation Studies A1–A6)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">7 Ablation Rows</span>
                </div>
                <div className="space-y-2">
                  {paper.table3_data.map((row, idx) => (
                    <div key={idx} className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={row.config}
                          onChange={e => {
                            const updated = [...paper.table3_data];
                            updated[idx].config = e.target.value;
                            setPaper({ ...paper, table3_data: updated });
                          }}
                          className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-bold text-white"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 block">Comb F1</label>
                          <input
                            type="text"
                            value={row.comb_f1}
                            onChange={e => {
                              const updated = [...paper.table3_data];
                              updated[idx].comb_f1 = e.target.value;
                              setPaper({ ...paper, table3_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center font-mono text-teal-300"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">Δ F1</label>
                          <input
                            type="text"
                            value={row.delta_f1}
                            onChange={e => {
                              const updated = [...paper.table3_data];
                              updated[idx].delta_f1 = e.target.value;
                              setPaper({ ...paper, table3_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center font-mono text-rose-400"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">XSTest FPR</label>
                          <input
                            type="text"
                            value={row.xstest_fpr}
                            onChange={e => {
                              const updated = [...paper.table3_data];
                              updated[idx].xstest_fpr = e.target.value;
                              setPaper({ ...paper, table3_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center font-mono text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCK 14: Takeaway Callout Box */}
              <div className="bg-slate-900 rounded-xl p-4 border border-teal-500/30 space-y-2 shadow-md">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Block 14: Ablation Takeaway Callout Box
                </span>
                <textarea
                  value={paper.takeaway}
                  onChange={e => setPaper({ ...paper, takeaway: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-200"
                />
              </div>

              {/* BLOCK 15: Figure 3 Dynamic Image URL & Size (Adaptation & Calibration) */}
              <div className="bg-slate-900 rounded-xl p-4 border border-amber-500/40 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    Block 15: Figure 3 Dynamic Image URL & Size (Adaptation & Calibration)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    fig2_adaptation_and_calibration
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={imgUrlInputs['fig2']}
                    onChange={e => setImgUrlInputs({ ...imgUrlInputs, fig2: e.target.value })}
                    placeholder="Paste image URL (https://... or /figures/fig2_adaptation_and_calibration.png)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white font-mono focus:ring-1 focus:ring-teal-400"
                  />
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Figure 3 Caption</label>
                    <textarea
                      value={paper.figures[2].caption}
                      onChange={e => {
                        const updated = [...paper.figures];
                        updated[2].caption = e.target.value;
                        setPaper({ ...paper, figures: updated });
                      }}
                      rows={2}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300"
                    />
                  </div>

                  {/* Figure 3 Size Slider & Presets */}
                  <FigureSizeController
                    label="Figure 3 Display Height"
                    value={figureSizes['fig2'] || 180}
                    defaultValue={180}
                    onChange={(val) => setFigureSizes({ ...figureSizes, fig2: val })}
                    onReset={(val) => setFigureSizes({ ...figureSizes, fig2: val })}
                  />

                  {/* Live Preview Box with Click-to-Zoom */}
                  <div 
                    style={{ height: `${Math.min(figureSizes['fig2'] || 180, 240)}px` }}
                    className="bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer transition-all"
                    onClick={() => setLightboxImg({
                      id: 'fig2',
                      title: 'Figure 3: Prequential Stream Adaptation & Risk Probability Calibration',
                      url: imgUrlInputs['fig2'] || '/figures/fig2_adaptation_and_calibration.png',
                      caption: paper.figures[2].caption
                    })}
                  >
                    <SafeImage
                      src={imgUrlInputs['fig2']}
                      fallbackSrc="/figures/fig2_adaptation_and_calibration.png"
                      alt="Figure 3 Preview"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Click to Enlarge / Full View ({figureSizes['fig2'] || 180}px)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCK 16: Section V: Real-World Embedded Boards */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Block 16: Section V — Real-World Embedded Boards
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section5_embedded), 'sec5_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec5_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    Copy for Humanizer
                  </button>
                </div>
                <textarea
                  value={paper.section5_embedded}
                  onChange={e => setPaper({ ...paper, section5_embedded: e.target.value })}
                  rows={8}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>
            </div>

            {/* ==================== PAGE 4 BLOCKS ==================== */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 border-b border-rose-500/30 pb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider">
                  Page 4 Content
                </span>
                <span className="text-[11px] text-slate-400">Table IV Latency, Figure 4 Crescendo, Section VI Conclusion & References</span>
              </div>

              {/* BLOCK 17: EDITABLE TABLE IV */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                    <Table className="w-4 h-4 text-rose-400" />
                    Block 17: Table IV (Pre-Inference Latency Across Hardware Boards)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">5 Hardware Targets</span>
                </div>
                <div className="space-y-2">
                  {paper.table4_data.map((row, idx) => (
                    <div key={idx} className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1">
                      <input
                        type="text"
                        value={row.platform}
                        onChange={e => {
                          const updated = [...paper.table4_data];
                          updated[idx].platform = e.target.value;
                          setPaper({ ...paper, table4_data: updated });
                        }}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-bold text-white"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 block">Encoder</label>
                          <input
                            type="text"
                            value={row.enc}
                            onChange={e => {
                              const updated = [...paper.table4_data];
                              updated[idx].enc = e.target.value;
                              setPaper({ ...paper, table4_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center font-mono text-slate-300"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">Ego+HGNN</label>
                          <input
                            type="text"
                            value={row.ego}
                            onChange={e => {
                              const updated = [...paper.table4_data];
                              updated[idx].ego = e.target.value;
                              setPaper({ ...paper, table4_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center font-mono text-slate-300"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">Total P50 / P95</label>
                          <input
                            type="text"
                            value={row.total}
                            onChange={e => {
                              const updated = [...paper.table4_data];
                              updated[idx].total = e.target.value;
                              setPaper({ ...paper, table4_data: updated });
                            }}
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-center font-mono font-bold text-teal-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCK 18: Figure 4 Dynamic Image URL & Size (Crescendo & Latency) */}
              <div className="bg-slate-900 rounded-xl p-4 border border-rose-500/40 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    Block 18: Figure 4 Dynamic Image URL & Size (Crescendo & Latency)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                    fig3_crescendo_and_latency
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={imgUrlInputs['fig3']}
                    onChange={e => setImgUrlInputs({ ...imgUrlInputs, fig3: e.target.value })}
                    placeholder="Paste image URL (https://... or /figures/fig3_crescendo_and_latency.png)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white font-mono focus:ring-1 focus:ring-teal-400"
                  />
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Figure 4 Caption</label>
                    <textarea
                      value={paper.figures[3].caption}
                      onChange={e => {
                        const updated = [...paper.figures];
                        updated[3].caption = e.target.value;
                        setPaper({ ...paper, figures: updated });
                      }}
                      rows={2}
                      className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300"
                    />
                  </div>

                  {/* Figure 4 Size Slider & Presets */}
                  <FigureSizeController
                    label="Figure 4 Display Height"
                    value={figureSizes['fig3'] || 200}
                    defaultValue={200}
                    onChange={(val) => setFigureSizes({ ...figureSizes, fig3: val })}
                    onReset={(val) => setFigureSizes({ ...figureSizes, fig3: val })}
                  />

                  {/* Live Preview Box with Click-to-Zoom */}
                  <div 
                    style={{ height: `${Math.min(figureSizes['fig3'] || 200, 240)}px` }}
                    className="bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer transition-all"
                    onClick={() => setLightboxImg({
                      id: 'fig3',
                      title: 'Figure 4: Crescendo Escalation & Embedded Latency Breakdown',
                      url: imgUrlInputs['fig3'] || '/figures/fig3_crescendo_and_latency.png',
                      caption: paper.figures[3].caption
                    })}
                  >
                    <SafeImage
                      src={imgUrlInputs['fig3']}
                      fallbackSrc="/figures/fig3_crescendo_and_latency.png"
                      alt="Figure 4 Preview"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="px-3 py-1 rounded-full bg-rose-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Click to Enlarge / Full View ({figureSizes['fig3'] || 200}px)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCK 19: Section VI: Conclusion */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Block 19: Section VI — Conclusion & Limitations
                  </span>
                  <button
                    onClick={() => handleCopy(cleanLatexForHumanizer(paper.section6_conclusion), 'sec6_clean')}
                    className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copyStatus['sec6_clean'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    Copy for Humanizer
                  </button>
                </div>
                <textarea
                  value={paper.section6_conclusion}
                  onChange={e => setPaper({ ...paper, section6_conclusion: e.target.value })}
                  rows={6}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 font-serif text-[13px] leading-relaxed text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-y"
                />
              </div>

              {/* BLOCK 20: EDITABLE REFERENCES */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-teal-400" />
                    Block 20: References List (14 IEEE Citations)
                  </span>
                  <span className="text-[10px] text-teal-400 font-mono">14 Citations</span>
                </div>
                <div className="space-y-1.5">
                  {paper.references.map((ref, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-[10px] text-teal-400 font-mono mt-1 w-6 text-right">[{idx + 1}]</span>
                      <textarea
                        value={ref}
                        onChange={e => {
                          const updated = [...paper.references];
                          updated[idx] = e.target.value;
                          setPaper({ ...paper, references: updated });
                        }}
                        rows={2}
                        className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-300 resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCK 21: EDITABLE FOOTERS & BOTTOM LINE */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Block 21: Manuscript Footers & Bottom Lines (All 4 Pages)
                  </span>
                  <span className="text-[10px] text-teal-400 font-mono">100% Editable</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Header / Tag (All Pages)</label>
                    <input
                      type="text"
                      value={paper.footer_tag}
                      onChange={e => setPaper({ ...paper, footer_tag: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 1 Middle Label</label>
                      <input
                        type="text"
                        value={paper.footer_p1_mid}
                        onChange={e => setPaper({ ...paper, footer_p1_mid: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 1 Page Number</label>
                      <input
                        type="text"
                        value={paper.footer_p1_page}
                        onChange={e => setPaper({ ...paper, footer_p1_page: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 2 Middle Label</label>
                      <input
                        type="text"
                        value={paper.footer_p2_mid}
                        onChange={e => setPaper({ ...paper, footer_p2_mid: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 2 Page Number</label>
                      <input
                        type="text"
                        value={paper.footer_p2_page}
                        onChange={e => setPaper({ ...paper, footer_p2_page: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 3 Middle Label</label>
                      <input
                        type="text"
                        value={paper.footer_p3_mid}
                        onChange={e => setPaper({ ...paper, footer_p3_mid: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 3 Page Number</label>
                      <input
                        type="text"
                        value={paper.footer_p3_page}
                        onChange={e => setPaper({ ...paper, footer_p3_page: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 4 Middle Label</label>
                      <input
                        type="text"
                        value={paper.footer_p4_mid}
                        onChange={e => setPaper({ ...paper, footer_p4_mid: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Page 4 Page Number</label>
                      <input
                        type="text"
                        value={paper.footer_p4_page}
                        onChange={e => setPaper({ ...paper, footer_p4_page: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-700 bg-slate-950 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT 50%: REAL-TIME LIVE DIVIDED IEEE A4 PAGE SHEETS (WITH CONTENT-EDITABLE ACCESS) */}
          <div className="w-1/2 flex flex-col bg-slate-900 overflow-hidden right-preview-pane">
            
            {/* Minimal Clean Top Bar: Divided Page & View PDF */}
            <div className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 top-control-bar no-print">
              
              {/* Divided Page Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-teal-400 font-bold mr-1">Divided:</span>
                {[
                  { id: 'all', label: 'All 4 Pages' },
                  { id: '1', label: 'Page 1' },
                  { id: '2', label: 'Page 2' },
                  { id: '3', label: 'Page 3' },
                  { id: '4', label: 'Page 4' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePage(p.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      activePage === p.id
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Right: View PDF & Save Paper Button */}
              <div className="flex items-center gap-2.5">
                <a
                  href="http://localhost:8000/api/latex/pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  title="View Compiled IEEE PDF"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                  View PDF
                </a>

                {/* Save Paper in Top-Right Corner */}
                <button
                  onClick={handleSavePaper}
                  disabled={saveStatus === 'saving'}
                  className={`px-3.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer border ${
                    saveStatus === 'saved'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/25'
                      : saveStatus === 'saving'
                      ? 'bg-amber-600 text-white border-amber-400 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 hover:shadow-emerald-500/25'
                  }`}
                  title="Save paper customizations to disk (persists across project reruns)"
                >
                  {saveStatus === 'saved' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      <span>Saved!</span>
                    </>
                  ) : saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-white" />
                      <span>Save Paper</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Document Pages Viewport */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex flex-col items-center gap-8 select-text">
              
              {/* =========================================================================
                  VIEW MODE 1: LIVE REAL-TIME DIVIDED IEEE A4 SHEETS (PAGES 1, 2, 3, 4)
                  Directly bound to user edits in the left pane!
                 ========================================================================= */}
              {viewMode === 'live' && (
                <div 
                  id="live-divided-sheets-container"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }} 
                  className="space-y-8 transition-transform duration-200"
                >
                  
                  {/* SHEET 1 (PAGE 1 OF 4) */}
                  {(activePage === 'all' || activePage === '1') && (
                    <div className="divided-sheet-card w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] overflow-hidden bg-white text-black p-[10mm_14mm_8mm_14mm] flex flex-col justify-between relative font-serif text-[10.8px] leading-[1.34] shadow-2xl">
                      <div>
                        {/* Header Banner */}
                        <div className="text-center pb-2 mb-3">
                          <h1 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={e => setPaper({ ...paper, title: e.currentTarget.textContent })}
                            className="text-base font-bold text-black leading-snug mb-2 uppercase outline-none"
                          >
                            {paper.title}
                          </h1>
                          <div className="flex justify-center gap-6 text-[10px] text-black leading-tight">
                            <div className="text-center">
                              <p 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={e => setPaper({ ...paper, author1_name: e.currentTarget.textContent })}
                                className="font-bold outline-none"
                              >
                                {paper.author1_name}
                              </p>
                              <p className="text-[9px]">Dept. of CSE ({paper.author1_pin})</p>
                              <p className="text-[9px]">Godavari Global University</p>
                            </div>
                            <div className="text-center">
                              <p 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={e => setPaper({ ...paper, author2_name: e.currentTarget.textContent })}
                                className="font-bold outline-none"
                              >
                                {paper.author2_name}
                              </p>
                              <p className="text-[9px]">Dept. of CSE ({paper.author2_pin})</p>
                              <p className="text-[9px]">Godavari Global University</p>
                            </div>
                            <div className="text-center">
                              <p 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={e => setPaper({ ...paper, guide_name: e.currentTarget.textContent })}
                                className="font-bold outline-none"
                              >
                                {paper.guide_name}
                              </p>
                              <p className="text-[9px]">{paper.guide_title}</p>
                              <p className="text-[9px]">Godavari Global University, India</p>
                            </div>
                          </div>
                        </div>

                        {/* Abstract */}
                        <div className="text-[10px] text-justify mb-3 italic">
                          <p>
                            <span className="font-bold not-italic">Abstract—</span>
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, abstract: e.currentTarget.textContent })}
                              className="outline-none"
                            >
                              {paper.abstract}
                            </span>
                          </p>
                          <p className="mt-1">
                            <span className="font-bold not-italic">Index Terms—</span>
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, keywords: e.currentTarget.textContent })}
                              className="outline-none"
                            >
                              {paper.keywords}
                            </span>
                          </p>
                        </div>

                        {/* Two Columns: Section I & Section II */}
                        <div className="columns-2 gap-5 text-justify text-[10.5px] leading-[1.3]">
                          <div>
                            <h2 className="text-[11px] font-bold uppercase text-center mt-2 mb-1.5 text-black">
                              I. Introduction
                            </h2>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, section1_intro: e.currentTarget.innerText })}
                              className="outline-none"
                            >
                              {paper.section1_intro.split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 text-indent indent-3">
                                  {para}
                                </p>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h2 className="text-[11px] font-bold uppercase text-center mt-2 mb-1.5 text-black">
                              II. Threat Model & HD Jailbreaks
                            </h2>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, section2_threat: e.currentTarget.innerText })}
                              className="outline-none"
                            >
                              {paper.section2_threat.split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 text-indent indent-3">
                                  {para}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Full-Width Figure 1 (Architecture) */}
                        <div className="mt-2 text-center">
                          <SafeImage
                            src={imgUrlInputs['fig0']}
                            fallbackSrc="/figures/fig0_system_architecture.png"
                            alt="Figure 1 Architecture"
                            style={{ maxHeight: `${getFigureHeight('fig0', 160)}px` }}
                            className="w-full object-contain mx-auto"
                          />
                          <p className="text-[9px] text-justify text-black mt-1 leading-snug">
                            <b>Fig. 1. End-to-End AHD-Jailbreak Pre-Inference Defense Architecture.</b>{' '}
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => {
                                const updated = [...paper.figures];
                                updated[0].caption = e.currentTarget.textContent;
                                setPaper({ ...paper, figures: updated });
                              }}
                              className="outline-none"
                            >
                              {paper.figures[0].caption}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Sheet 1 Footer - 100% Editable Bottom Line */}
                      <div className="pt-1.5 border-t border-black flex justify-between text-[9px] text-black items-center mt-auto">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_tag: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit bottom line header"
                        >
                          {paper.footer_tag}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p1_mid: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit Page 1 topic line"
                        >
                          {paper.footer_p1_mid}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p1_page: e.currentTarget.textContent })}
                          className="font-bold outline-none cursor-text"
                          title="Click to edit Page 1 page label"
                        >
                          {paper.footer_p1_page}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SHEET 2 (PAGE 2 OF 4) */}
                  {(activePage === 'all' || activePage === '2') && (
                    <div className="divided-sheet-card w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] overflow-hidden bg-white text-black p-[10mm_14mm_8mm_14mm] flex flex-col justify-between relative font-serif text-[10.8px] leading-[1.34] shadow-2xl">
                      <div>
                        {/* Two Columns: Methodology & Table I */}
                        <div className="columns-2 gap-5 text-justify text-[10.5px] leading-[1.35]">
                          <div>
                            <h2 className="text-[11px] font-bold uppercase text-center mt-1 mb-1.5 text-black">
                              III. Methodology
                            </h2>

                            <h3 className="text-[10.5px] font-bold italic text-black mb-1">
                              A. Heterogeneous Vertex Space and 394-D Feature Extraction
                            </h3>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, section3_method_a: e.currentTarget.innerText })}
                              className="outline-none"
                            >
                              {paper.section3_method_a.split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 text-indent indent-3">
                                  {para}
                                </p>
                              ))}
                            </div>
                            <div className="my-1.5 text-center text-[10px] italic text-black">
                              <i>V_t = V_P ∪ V_T ∪ V_S ∪ V_C ∪ V_A</i> &nbsp;&nbsp; (1)
                            </div>

                            <h3 className="text-[10.5px] font-bold italic text-black mb-1 mt-2">
                              B. Higher-Order Hyperedges and Spectral Convolution
                            </h3>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, section3_method_b: e.currentTarget.innerText })}
                              className="outline-none"
                            >
                              {paper.section3_method_b.split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 text-indent indent-3">
                                  {para}
                                </p>
                              ))}
                            </div>
                            <div className="my-1.5 text-center text-[10px] italic text-black">
                              <i>w_0(e) = λ_base + (1 - λ_base) | 2 P(y=1 | v ∈ e) - 1 |</i> &nbsp;&nbsp; (2)
                            </div>
                            <div className="my-1.5 text-center text-[10px] italic text-black">
                              <i>Z^(l+1) = LN(Z^(l) + ELU(P_t Z^(l) Θ^(l)))</i> &nbsp;&nbsp; (3)
                            </div>
                          </div>

                          <div>
                            <h3 className="text-[10.5px] font-bold italic text-black mb-1">
                              C. Calibrated Multi-Signal Risk Fusion and Anchor Gate
                            </h3>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, section3_method_c: e.currentTarget.innerText })}
                              className="outline-none"
                            >
                              {paper.section3_method_c.split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 text-indent indent-3">
                                  {para}
                                </p>
                              ))}
                            </div>
                            <div className="my-1 text-center text-[9.5px] italic text-black">
                              <i>R(x) = 0.50 P_cal(x) + 0.25 S_nbr(x) + 0.15 S_ctx(x) + 0.10 S_OOD(x)</i> &nbsp;&nbsp; (4)
                            </div>
                            <div className="my-1 text-center text-[9.5px] italic text-black">
                              <i>u(x) = 0.60 H_bin(P_cal(x)) + 0.40 S_OOD(x)</i> &nbsp;&nbsp; (5)
                            </div>
                            <div className="my-1 text-center text-[9.5px] italic text-black">
                              <i>F1(G_&#123;t+1&#125;, D_anchor) &ge; F1(G_t, D_anchor) - 0.005</i> &nbsp;&nbsp; (6)
                            </div>

                            {/* Table I: Leakage-Free Dataset */}
                            <div className="my-2">
                              <div className="text-[9px] font-bold text-center uppercase tracking-wider text-black mb-0.5">
                                TABLE I<br/><span className="normal-case font-normal italic">Leakage-Free 6-Partition Dataset Distribution</span>
                              </div>
                              <table className="w-full text-[8.5px] border-collapse">
                                <thead>
                                  <tr className="border-t-2 border-b border-black">
                                    <th className="py-0.5 px-1 text-left font-bold">Split</th>
                                    <th className="py-0.5 px-1 text-right font-bold">Count</th>
                                    <th className="py-0.5 px-1 text-left font-bold">Primary Sources & Isolation Rule</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paper.table1_data.map((row, idx) => (
                                    <tr key={idx} className={idx === paper.table1_data.length - 1 ? 'border-b-2 border-black font-semibold' : 'border-b border-gray-200'}>
                                      <td className="py-0.5 px-1 font-mono">{row.split}</td>
                                      <td className="py-0.5 px-1 text-right font-mono">{row.count}</td>
                                      <td className="py-0.5 px-1">{row.sources}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                          </div>
                        </div>

                        {/* Full-Width Table II Spanning Both Columns Across Page 2 Bottom */}
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="text-[9.5px] font-bold text-center uppercase tracking-wider text-black mb-1">
                            TABLE II<br/><span className="normal-case font-normal italic">5-Seed Multi-Benchmark Empirical Comparison Across Paradigms (RQ1–RQ4)</span>
                          </div>
                          <table className="w-full text-[8.5px] border-collapse">
                            <thead>
                              <tr className="border-t-2 border-b border-black">
                                <th className="py-1 px-1.5 text-left font-bold">Defense Paradigm</th>
                                <th className="py-1 px-1 text-center font-bold">In-Dist F1</th>
                                <th className="py-1 px-1 text-center font-bold">AUROC</th>
                                <th className="py-1 px-1 text-center font-bold">AUPRC</th>
                                <th className="py-1 px-1 text-center font-bold">XSTest FPR</th>
                                <th className="py-1 px-1 text-center font-bold">OOD F1</th>
                                <th className="py-1 px-1 text-center font-bold">Cross-JBB F1</th>
                                <th className="py-1 px-1 text-center font-bold">Hop Latency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paper.table2_data.map((row, idx) => {
                                const isProposed = row.paradigm.includes('B4') || row.paradigm.includes('Proposed') || row.paradigm.includes('AHD');
                                return (
                                  <tr 
                                    key={idx} 
                                    className={`${idx === paper.table2_data.length - 1 ? 'border-b-2 border-black' : 'border-b border-gray-200'} ${isProposed ? 'font-bold' : ''}`}
                                  >
                                    <td className="py-1 px-1.5">{row.paradigm}</td>
                                    <td className="py-1 px-1 text-center font-mono">{row.in_dist}</td>
                                    <td className="py-1 px-1 text-center font-mono">{row.auroc}</td>
                                    <td className="py-1 px-1 text-center font-mono">{row.auprc}</td>
                                    <td className="py-1 px-1 text-center font-mono">{row.xstest_fpr}</td>
                                    <td className="py-1 px-1 text-center font-mono">{row.ood_f1}</td>
                                    <td className="py-1 px-1 text-center font-mono">{row.cross_f1}</td>
                                    <td className="py-1 px-1 text-center font-mono">{row.hop_ms}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Section IV: Experimental Results Discussion cleanly fitting Sheet 2 without overflow */}
                        <div className="mt-2 mb-0.5">
                          <h2 className="text-[11px] font-bold uppercase text-center mt-0.5 mb-1 text-black">
                            IV. Experimental Results
                          </h2>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={e => setPaper({ ...paper, section4_results: e.currentTarget.innerText })}
                            className="outline-none columns-2 gap-5 text-justify text-[10.2px] leading-[1.30] space-y-1"
                          >
                            {paper.section4_results.split('\n\n').map((para, i) => (
                              <p key={i} className="text-indent indent-3 mb-1">
                                {para}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Sheet 2 Footer - 100% Editable Bottom Line */}
                      <div className="pt-1.5 border-t border-black flex justify-between text-[9px] text-black items-center mt-auto">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_tag: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit bottom line header"
                        >
                          {paper.footer_tag}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p2_mid: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit Page 2 topic line"
                        >
                          {paper.footer_p2_mid}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p2_page: e.currentTarget.textContent })}
                          className="font-bold outline-none cursor-text"
                          title="Click to edit Page 2 page label"
                        >
                          {paper.footer_p2_page}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SHEET 3 (PAGE 3 OF 4) */}
                  {(activePage === 'all' || activePage === '3') && (
                    <div className="divided-sheet-card w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] overflow-hidden bg-white text-black p-[10mm_14mm_8mm_14mm] flex flex-col justify-between relative font-serif text-[10.8px] leading-[1.34] shadow-2xl">
                      <div>
                        {/* Full-Width Figure 2: Master Benchmark & Systematic Ablations (Placed at TOP of Sheet 3 as requested) */}
                        <div className="mb-3 text-center">
                          <SafeImage
                            src={imgUrlInputs['fig1']}
                            fallbackSrc="/figures/fig1_benchmark_and_ablations.png"
                            alt="Figure 2 Benchmark & Ablations"
                            style={{ maxHeight: `${getFigureHeight('fig1', 215)}px` }}
                            className="w-full object-contain mx-auto"
                          />
                          <p className="text-[9px] text-justify text-black mt-1 leading-snug">
                            <b>Fig. 2. Empirical Performance Trade-Off and Architectural Ablation Analysis.</b>{' '}
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => {
                                const updated = [...paper.figures];
                                updated[1].caption = e.currentTarget.textContent;
                                setPaper({ ...paper, figures: updated });
                              }}
                              className="outline-none"
                            >
                              {paper.figures[1].caption}
                            </span>
                          </p>
                        </div>

                        {/* Middle Two Columns: Table III & Section V Embedded Boards */}
                        <div className="columns-2 gap-5 text-justify text-[10.5px] leading-[1.35] my-2">
                          <div>
                            {/* Table III: Systematic Ablations with all columns */}
                            <div className="mb-2">
                              <div className="text-[9px] font-bold text-center uppercase tracking-wider text-black mb-0.5">
                                TABLE III<br/><span className="normal-case font-normal italic">Systematic Ablation Studies (A1–A6)</span>
                              </div>
                              <table className="w-full text-[8.5px] border-collapse">
                                <thead>
                                  <tr className="border-t-2 border-b border-black">
                                    <th className="py-0.5 px-1 text-left font-bold">Configuration</th>
                                    <th className="py-0.5 px-1 text-center font-bold">Comb F1</th>
                                    <th className="py-0.5 px-1 text-center font-bold">Δ F1</th>
                                    <th className="py-0.5 px-1 text-center font-bold">XSTest FPR</th>
                                    <th className="py-0.5 px-1 text-center font-bold">ECE</th>
                                    <th className="py-0.5 px-1 text-center font-bold">McNemar p</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paper.table3_data.map((row, idx) => (
                                    <tr key={idx} className={idx === paper.table3_data.length - 1 ? 'border-b-2 border-black font-semibold' : 'border-b border-gray-200'}>
                                      <td className="py-0.5 px-1">{row.config}</td>
                                      <td className="py-0.5 px-1 text-center font-mono">{row.comb_f1}</td>
                                      <td className="py-0.5 px-1 text-center font-mono">{row.delta_f1}</td>
                                      <td className="py-0.5 px-1 text-center font-mono">{row.xstest_fpr}</td>
                                      <td className="py-0.5 px-1 text-center font-mono">{row.ece}</td>
                                      <td className="py-0.5 px-1 text-center font-mono">{row.mcnemar}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <p className="text-[9.5px] italic text-justify mt-1.5 leading-snug">
                              <span className="font-bold not-italic">Ablation Takeaway: </span>
                              <span 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={e => setPaper({ ...paper, takeaway: e.currentTarget.textContent })}
                                className="outline-none"
                              >
                                {paper.takeaway}
                              </span>
                            </p>
                          </div>

                          <div>
                            <h2 className="text-[11px] font-bold uppercase text-center mt-0 mb-1 text-black">
                              V. Real-World Embedded Boards
                            </h2>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, section5_embedded: e.currentTarget.innerText })}
                              className="outline-none"
                            >
                              {paper.section5_embedded.split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 text-indent indent-3">
                                  {para}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Full-Width Figure 3: Stream Adaptation & Calibration across Page 3 Bottom */}
                        <div className="mt-2 text-center">
                          <SafeImage
                            src={imgUrlInputs['fig2']}
                            fallbackSrc="/figures/fig2_adaptation_and_calibration.png"
                            alt="Figure 3 Adaptation & Calibration"
                            style={{ maxHeight: `${getFigureHeight('fig2', 215)}px` }}
                            className="w-full object-contain mx-auto"
                          />
                          <p className="text-[9.5px] text-justify text-black mt-1 leading-snug">
                            <b>Fig. 3. Prequential Stream Adaptation & Risk Probability Calibration.</b>{' '}
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => {
                                const updated = [...paper.figures];
                                updated[2].caption = e.currentTarget.textContent;
                                setPaper({ ...paper, figures: updated });
                              }}
                              className="outline-none"
                            >
                              {paper.figures[2].caption}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Sheet 3 Footer - 100% Editable Bottom Line */}
                      <div className="pt-1.5 border-t border-black flex justify-between text-[9px] text-black items-center mt-auto">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_tag: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit bottom line header"
                        >
                          {paper.footer_tag}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p3_mid: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit Page 3 topic line"
                        >
                          {paper.footer_p3_mid}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p3_page: e.currentTarget.textContent })}
                          className="font-bold outline-none cursor-text"
                          title="Click to edit Page 3 page label"
                        >
                          {paper.footer_p3_page}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SHEET 4 (PAGE 4 OF 4) */}
                  {(activePage === 'all' || activePage === '4') && (
                    <div className="divided-sheet-card w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] overflow-hidden bg-white text-black p-[10mm_14mm_8mm_14mm] flex flex-col justify-between relative font-serif text-[10.8px] leading-[1.34] shadow-2xl">
                      <div>
                        {/* Table IV: Latency */}
                        <div className="mb-2.5">
                          <div className="text-[9px] font-bold text-center uppercase tracking-wider text-black mb-0.5">
                            TABLE IV<br/><span className="normal-case font-normal italic">Pre-Inference Screening Latency Across Hardware Boards (RQ5)</span>
                          </div>
                          <table className="w-full text-[8.5px] border-collapse">
                            <thead>
                              <tr className="border-t-2 border-b border-black">
                                <th className="py-0.5 px-1 text-left font-bold">Hardware Platform / Board</th>
                                <th className="py-0.5 px-1 text-right font-bold">Enc. (ms)</th>
                                <th className="py-0.5 px-1 text-right font-bold">Ego+HGNN</th>
                                <th className="py-0.5 px-1 text-center font-bold">Total P50 / P95 Latency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paper.table4_data.map((row, idx) => (
                                <tr key={idx} className={idx === paper.table4_data.length - 1 ? 'border-b-2 border-black font-semibold' : 'border-b border-gray-200'}>
                                  <td className="py-0.5 px-1">{row.platform}</td>
                                  <td className="py-0.5 px-1 text-right">{row.enc}</td>
                                  <td className="py-0.5 px-1 text-right">{row.ego}</td>
                                  <td className="py-0.5 px-1 text-center font-bold">{row.total}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Full-Width Figure 4 (Crescendo Trajectory & Latency) */}
                        <div className="my-2.5 text-center">
                          <SafeImage
                            src={imgUrlInputs['fig3']}
                            fallbackSrc="/figures/fig3_crescendo_and_latency.png"
                            alt="Figure 4 Crescendo & Latency"
                            style={{ maxHeight: `${getFigureHeight('fig3', 200)}px` }}
                            className="w-full object-contain mx-auto"
                          />
                          <p className="text-[9.5px] text-justify text-black mt-1 leading-snug">
                            <b>Fig. 4. Dynamic Escalation Trajectory Detection & Multi-Stage Hardware Latency Profiling.</b>{' '}
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => {
                                const updated = [...paper.figures];
                                updated[3].caption = e.currentTarget.textContent;
                                setPaper({ ...paper, figures: updated });
                              }}
                              className="outline-none"
                            >
                              {paper.figures[3].caption}
                            </span>
                          </p>
                        </div>

                        {/* Two Columns: Conclusion & References */}
                        <div className="columns-2 gap-5 text-justify text-[10.5px] leading-[1.3]">
                          <div>
                            <h2 className="text-[11px] font-bold uppercase text-center mt-2 mb-1.5 text-black">
                              VI. Conclusion & Limitations
                            </h2>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setPaper({ ...paper, section6_conclusion: e.currentTarget.innerText })}
                              className="outline-none"
                            >
                              {paper.section6_conclusion.split('\n\n').map((para, i) => (
                                <p key={i} className="mb-2 text-indent indent-3">
                                  {para}
                                </p>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h2 className="text-[11px] font-bold uppercase text-center mt-2 mb-1.5 text-black">
                              References
                            </h2>
                            <ol className="list-decimal pl-4 space-y-1 text-[8.5px] leading-tight text-black">
                              {paper.references.map((ref, idx) => (
                                <li 
                                  key={idx}
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={e => {
                                    const updated = [...paper.references];
                                    updated[idx] = e.currentTarget.textContent;
                                    setPaper({ ...paper, references: updated });
                                  }}
                                  className="outline-none cursor-text"
                                >
                                  {ref}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* Sheet 4 Footer - 100% Editable Bottom Line */}
                      <div className="pt-1.5 border-t border-black flex justify-between text-[9px] text-black items-center mt-auto">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_tag: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit bottom line header"
                        >
                          {paper.footer_tag}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p4_mid: e.currentTarget.textContent })}
                          className="outline-none cursor-text"
                          title="Click to edit Page 4 topic line"
                        >
                          {paper.footer_p4_mid}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setPaper({ ...paper, footer_p4_page: e.currentTarget.textContent })}
                          className="font-bold outline-none cursor-text"
                          title="Click to edit Page 4 page label"
                        >
                          {paper.footer_p4_page}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* =========================================================================
                  VIEW MODE 2: RENDERED HIGH-RES PIXMAP SHEETS (/pages/page_1.png .. 4)
                 ========================================================================= */}
              {viewMode === 'pixmaps' && (
                <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }} className="space-y-8 transition-transform duration-200">
                  
                  {(activePage === 'all' || activePage === '1') && (
                    <div className="w-[680px] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 overflow-hidden relative">
                      <div className="h-6 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="font-bold text-slate-700">PAGE 1 OF 4</span>
                        <span>IEEE TWO-COLUMN CONFERENCE MANUSCRIPT</span>
                        <span>A4 SHEET (210 × 297 mm)</span>
                      </div>
                      <SafeImage
                        src="/pages/page_1.png"
                        fallbackSrc="/pages/page_1.png"
                        alt="Page 1"
                        className="w-full h-auto block select-none pointer-events-none"
                      />
                      <div className="h-6 bg-white border-t border-slate-200 text-center text-[10px] font-mono text-slate-400 flex items-center justify-center">
                        — Page 1 —
                      </div>
                    </div>
                  )}

                  {(activePage === 'all' || activePage === '2') && (
                    <div className="w-[680px] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 overflow-hidden relative">
                      <div className="h-6 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="font-bold text-slate-700">PAGE 2 OF 4</span>
                        <span>METHODOLOGY, TABLES I & II, MASTER BENCHMARK</span>
                        <span>A4 SHEET (210 × 297 mm)</span>
                      </div>
                      <SafeImage
                        src="/pages/page_2.png"
                        fallbackSrc="/pages/page_2.png"
                        alt="Page 2"
                        className="w-full h-auto block select-none pointer-events-none"
                      />
                      <div className="h-6 bg-white border-t border-slate-200 text-center text-[10px] font-mono text-slate-400 flex items-center justify-center">
                        — Page 2 —
                      </div>
                    </div>
                  )}

                  {(activePage === 'all' || activePage === '3') && (
                    <div className="w-[680px] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 overflow-hidden relative">
                      <div className="h-6 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="font-bold text-slate-700">PAGE 3 OF 4</span>
                        <span>TABLE III ABLATIONS, STREAM ADAPTATION, EMBEDDED</span>
                        <span>A4 SHEET (210 × 297 mm)</span>
                      </div>
                      <SafeImage
                        src="/pages/page_3.png"
                        fallbackSrc="/pages/page_3.png"
                        alt="Page 3"
                        className="w-full h-auto block select-none pointer-events-none"
                      />
                      <div className="h-6 bg-white border-t border-slate-200 text-center text-[10px] font-mono text-slate-400 flex items-center justify-center">
                        — Page 3 —
                      </div>
                    </div>
                  )}

                  {(activePage === 'all' || activePage === '4') && (
                    <div className="w-[680px] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 overflow-hidden relative">
                      <div className="h-6 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="font-bold text-slate-700">PAGE 4 OF 4</span>
                        <span>TABLE IV LATENCY, CONCLUSION & 14 CITATIONS</span>
                        <span>A4 SHEET (210 × 297 mm)</span>
                      </div>
                      <SafeImage
                        src="/pages/page_4.png"
                        fallbackSrc="/pages/page_4.png"
                        alt="Page 4"
                        className="w-full h-auto block select-none pointer-events-none"
                      />
                      <div className="h-6 bg-white border-t border-slate-200 text-center text-[10px] font-mono text-slate-400 flex items-center justify-center">
                        — Page 4 —
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* =========================================================================
                  VIEW MODE 3: BROWSER NATIVE PDF IFRAME
                 ========================================================================= */}
              {viewMode === 'iframe' && (
                <div className="h-full w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col">
                  <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <FileCheck2 className="w-4 h-4" />
                      Compiled PDF: ahd_jailbreak_ieee_conference_paper.pdf
                    </span>
                    <a
                      href="http://localhost:8000/api/latex/pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Full PDF in New Tab
                    </a>
                  </div>
                  <iframe
                    src="http://localhost:8000/api/latex/pdf"
                    title="Compiled PDF Preview"
                    className="w-full flex-1 border-0 bg-white"
                  />
                </div>
              )}

              {/* =========================================================================
                  VIEW MODE 4: RAW LATEX CODE
                 ========================================================================= */}
              {viewMode === 'latex' && (
                <pre className="w-full p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner select-all">
                  {generatedLatex}
                </pre>
              )}

            </div>

            {/* Bottom Bar: Download Live Divided Output Exactly as Displayed */}
            <div className="h-14 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between flex-shrink-0 bottom-download-bar no-print shadow-lg">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">Live Real-Time Divided Output</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({activePage === 'all' ? 'All 4 Pages' : `Page ${activePage} of 4`})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadDividedOutput}
                  className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                  title="Download the rendered IEEE conference PDF as it is page-to-page"
                >
                  <Download className={`w-4 h-4 text-slate-950 ${downloading ? 'animate-bounce' : ''}`} />
                  <span>{downloading ? 'Downloading Rendered PDF...' : 'Download Rendered PDF (Page-to-Page)'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      {/* =========================================================================
          INTERACTIVE FULLSCREEN LIGHTBOX MODAL FOR ULTRA-HIGH RES INSPECTION
         ========================================================================= */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxImg(null)}
        >
          {/* Lightbox Header Bar */}
          <div 
            className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40">
                <ImageIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {lightboxImg.title}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                    Full Resolution
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-xl">{lightboxImg.url}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sheet size adjuster right inside the lightbox! */}
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <span className="text-slate-400">Sheet Height:</span>
                <span className="font-mono text-teal-300 font-bold">{figureSizes[lightboxImg.id] || 220}px</span>
                <button
                  type="button"
                  onClick={() => setFigureSizes(prev => ({
                    ...prev,
                    [lightboxImg.id]: Math.min(500, (prev[lightboxImg.id] || 220) + 30)
                  }))}
                  className="px-2 py-0.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-xs"
                  title="Enlarge display height on page sheets"
                >
                  + Enlarge
                </button>
                <button
                  type="button"
                  onClick={() => setFigureSizes(prev => ({
                    ...prev,
                    [lightboxImg.id]: Math.max(100, (prev[lightboxImg.id] || 220) - 30)
                  }))}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
                  title="Reduce display height on page sheets"
                >
                  - Reduce
                </button>
              </div>

              <a
                href={lightboxImg.url}
                target="_blank"
                rel="noreferrer"
                download
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Download full original image"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                Raw Asset
              </a>

              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors"
                title="Close Lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image Stage */}
          <div 
            className="flex-1 flex items-center justify-center overflow-auto p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <SafeImage
              src={lightboxImg.url}
              fallbackSrc={lightboxImg.url}
              alt={lightboxImg.title}
              className="max-h-[78vh] max-w-[94vw] object-contain rounded shadow-2xl transition-transform select-none"
            />
          </div>

          {/* Lightbox Caption */}
          {lightboxImg.caption && (
            <div 
              className="mt-3 p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300 max-w-4xl mx-auto text-center shadow-lg"
              onClick={e => e.stopPropagation()}
            >
              <span className="font-bold text-white">Caption: </span>
              {lightboxImg.caption}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
