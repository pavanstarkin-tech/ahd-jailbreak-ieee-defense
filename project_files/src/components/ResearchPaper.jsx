import React, { useState } from 'react';
import { ExternalLink, Sparkles, BookOpen, Layers, ShieldCheck, Cpu } from 'lucide-react';

export default function ResearchPaper({ onInspectScenario, onInspectMatrix }) {
  const [hoveredVar, setHoveredVar] = useState('H_t');

  const VAR_INFO = {
    'H_t': {
      title: 'H_t — Dynamic Incidence Matrix',
      math: '\\mathbf{H}_t \\in \\{0, 1\\}^{|\\mathcal{V}_t| \\times |\\mathcal{E}_t|}',
      desc: 'Encodes higher-order multi-party affiliations. When an emerging multi-turn attack is intercepted, a new column is dynamically appended in real time.',
      pillColor: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    'W_t': {
      title: 'W_t — Hyperedge Weight Matrix',
      math: '\\mathbf{W}_t = \\text{diag}(w_1, \\dots, w_m)',
      desc: 'Controls hyperedge confidence. Reinforced online for matched adversarial hyperedges: w_{t+1}(e) = min(2.0, \\gamma w_t(e) + \\alpha R(p_t)).',
      pillColor: 'bg-violet-50 text-violet-700 border-violet-200'
    },
    'D_e': {
      title: 'D_e — Hyperedge Degree Matrix',
      math: '\\delta(e) = \\sum_{v} H_t(v, e)',
      desc: 'Cardinality normalizer counting the number of concept vertices participating in each hyperedge e, preventing oversized hyperedges from dominating signal flow.',
      pillColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    'D_v': {
      title: 'D_v — Vertex Degree Matrix',
      math: 'd(v) = \\sum_{e} w_t(e) H_t(v, e)',
      desc: 'Measures cumulative weighted prominence of each concept node across all active hyperedges, scaling hypergraph Laplacian energy.',
      pillColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    'P_t': {
      title: 'P_t — Normalized Hypergraph Laplacian Operator',
      math: '\\mathbf{P}_t = \\mathbf{D}_v^{-1/2} \\mathbf{H}_t \\mathbf{W}_t \\mathbf{D}_e^{-1} \\mathbf{H}_t^\\top \\mathbf{D}_v^{-1/2}',
      desc: 'Two-stage spectral convolution operator that aggregates signals from active nodes to hyperedges, and diffuses back to connected policy anchors.',
      pillColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    'S_anom': {
      title: 'S_anom — Structural Anomaly Score',
      math: 'S_{\\text{anom}}(\\mathcal{A}_t) = \\text{clip}\\big(0.60 + 0.35 \\cdot (1 - \\text{maxOverlap}), 0, 1\\big)',
      desc: 'Higher-order anomaly detector that triggers when policy constraints and adversarial multi-turn crescendo drift co-occur without pre-existing hyperedge coverage.',
      pillColor: 'bg-red-50 text-red-700 border-red-200'
    }
  };

  return (
    <article className="paper-container font-serif text-[17px] leading-[1.78] text-ink-700 space-y-10">
      
      {/* Title & Metadata Card */}
      <header className="border-b border-paper-200 pb-8 space-y-4">
        <div className="flex items-center justify-between text-xs font-sans text-ink-500 uppercase tracking-widest font-semibold">
          <span>B.Tech Major Project • Final Year Research</span>
          <span>Academic Year 2026</span>
        </div>

        <h1 className="font-heading font-extrabold text-ink-900 text-3xl md:text-4xl leading-tight tracking-tight">
          AHD-Jailbreak: Adaptive Hypergraph Defense for Detecting Evolving Jailbreak Attacks in Large Language Models
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 font-sans text-xs">
          <div className="p-3 rounded-lg bg-paper-50 border border-paper-200">
            <span className="text-ink-500 block">Lead Author</span>
            <strong className="text-ink-900 text-[13px]">Sesetti Pavan Kumar Swamy</strong>
            <span className="text-ink-500 block mt-0.5">PIN: 24555A0519 • CSE – C</span>
          </div>
          <div className="p-3 rounded-lg bg-paper-50 border border-paper-200">
            <span className="text-ink-500 block">Co-Author</span>
            <strong className="text-ink-900 text-[13px]">Rajana Rajeswari</strong>
            <span className="text-ink-500 block mt-0.5">PIN: 23551A05C9 • CSE – B</span>
          </div>
          <div className="p-3 rounded-lg bg-paper-50 border border-paper-200">
            <span className="text-ink-500 block">Project Supervisor</span>
            <strong className="text-ink-900 text-[13px]">Mrs. S. Suguna Sri</strong>
            <span className="text-ink-500 block mt-0.5">Assistant Professor, CSE</span>
          </div>
          <div className="p-3 rounded-lg bg-paper-50 border border-paper-200">
            <span className="text-ink-500 block">Institution</span>
            <strong className="text-ink-900 text-[13px]">Godavari Global University</strong>
            <span className="text-ink-500 block mt-0.5">Department of Computer Science</span>
          </div>
        </div>
      </header>

      {/* Abstract */}
      <section className="space-y-3">
        <h2 className="font-heading font-bold text-ink-900 text-xl flex items-center gap-2">
          Abstract
        </h2>
        <div className="p-5 rounded-xl bg-paper-50 border-l-4 border-research-cerulean border border-paper-200 text-ink-700 italic text-[16px] leading-relaxed shadow-sm">
          Large Language Model (LLM) security guardrails face an existential vulnerability: adversarial jailbreaks are no longer static, single-turn keyword injections, but rapidly evolving, higher-order multi-turn conversational campaigns. Conventional defenses—ranging from flat-token guardrails (Meta Llama Guard 3, WildGuard) to recent pairwise graph neural networks (GuardNet, G-Guard)—fail on multi-turn crescendo attacks because each individual dialogue turn appears benign in isolation and only becomes policy-violating through higher-order couplings across conversational history, persona adoption, and restricted targets. In this work, we propose <strong>AHD-Jailbreak</strong>, a model-agnostic, pre-inference defense operating over a dynamic heterogeneous hypergraph {"G_t = (V_t, E_t, W_t)"}. By modeling complex multi-node interactions through spectral hypergraph convolution and higher-order structural anomaly detection, AHD-Jailbreak detects unseen multi-turn attacks with <strong>100% recall</strong> while maintaining <strong>0% False Positive Rate</strong> on benign contrastive queries (XSTest), executing in just <strong>~0.37 ms</strong> before LLM inference.
        </div>
      </section>

      {/* Section 1 */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-ink-900 text-2xl tracking-tight">
          1. Introduction & Evolving Threat Taxonomy
        </h2>
        <p>
          Contemporary safety alignment in commercial Large Language Models relies predominantly on flat token classifiers and reinforcement learning from human feedback (RLHF). While effective against naive single-turn prompts (e.g., direct DAN templates), they are systematically bypassed by multi-turn crescendo jailbreaks (Li et al., 2024; HarmBench).
        </p>
        <p>
          In a crescendo attack, the adversary distributes intent across multiple benign-appearing steps: first establishing a fictional or educational context (such as writing a film script or discussing historical defenses), before requesting restricted exploitation payloads (reverse shell scripts, toxic synthesis, or credential harvesting).
        </p>
        
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 font-sans text-xs text-amber-900 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <strong className="block font-semibold mb-0.5">The Higher-Order Vulnerability:</strong>
            Pairwise graph edges {"e = (u, v)"} can only link two vertices simultaneously. They cannot capture the joint synergistic risk that emerges exclusively when Conversational History ({"V_context"}), Hypothetical Persona Framing ({"V_semantic"}), and Restricted Policy Anchors ({"V_policy"}) coincide in a unified higher-order relationship.
          </div>
        </div>

        <button
          onClick={() => onInspectScenario(2)} // ATK-UNSEEN-01
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-semibold bg-white border border-research-cerulean text-research-cerulean shadow-sm hover:bg-research-lightCerulean transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Inspect Crescendo Attack (ATK-UNSEEN-01) in Live Lab →
        </button>
      </section>

      {/* Section 2 */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-ink-900 text-2xl tracking-tight">
          2. Related Work & Pairwise GNN Gap Analysis
        </h2>
        <p>
          We contrast AHD-Jailbreak with three prevailing architectural paradigms in the security literature:
        </p>
        <div className="space-y-3 font-sans text-sm">
          <div className="p-3.5 rounded-lg bg-white border border-paper-200 shadow-sm">
            <strong className="text-ink-900 block font-semibold">1. Flat Guardrail LLMs (Llama Guard 3, WildGuard, NeMo):</strong>
            <p className="text-ink-600 text-xs mt-1">
              Treat prompts as 1D token strings, incurring 200–800 ms latency per turn. Long conversational histories dilute semantic attention, allowing crescendo attacks to slip past threshold checks.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-white border border-paper-200 shadow-sm">
            <strong className="text-ink-900 block font-semibold">2. Pairwise Graph Defenses (GuardNet, G-Guard 2025):</strong>
            <p className="text-ink-600 text-xs mt-1">
              Construct standard pairwise entity graphs (\(|e|=2\)). Multi-turn correlations suffer from over-smoothing and signal loss across repeated two-node hops.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-white border border-paper-200 shadow-sm">
            <strong className="text-ink-900 block font-semibold">3. Static Hypergraphs (HGNN, AAAI 2019):</strong>
            <p className="text-ink-600 text-xs mt-1">
              Use hyperedges with fixed offline weights. As verified in our experiments, static hypergraphs achieve only 25% recall on novel multi-turn attacks because they lack dynamic online edge spawning.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-ink-900 text-2xl tracking-tight">
          3. Heterogeneous Hypergraph Formulation & Spectral Operator
        </h2>
        <p>
          AHD-Jailbreak formulates LLM prompt security as a dynamic heterogeneous hypergraph {"G_t = (V_t, E_t, W_t)"} partitioned across 17 canonical concept nodes in 5 modalities.
        </p>
        <p>
          High-order contextual signals diffuse through the normalized hypergraph Laplacian operator:
        </p>

        {/* Interactive Equation Card */}
        <div className="p-5 rounded-xl bg-white border border-paper-300 shadow-academic text-center font-mono text-base md:text-lg">
          <div className="text-ink-500 text-xs uppercase tracking-wider mb-2 font-sans font-bold">
            Interactive Spectral Operator (Hover to Inspect Variables)
          </div>
          <div className="inline-flex items-center justify-center gap-1.5 flex-wrap py-2">
            <span className="font-bold text-ink-900">{"P_t ="}</span>
            <button onMouseEnter={() => setHoveredVar('D_v')} className={`math-token ${hoveredVar === 'D_v' ? 'active' : ''}`}>
              {"D_v^{-1/2}"}
            </button>
            <button onMouseEnter={() => setHoveredVar('H_t')} className={`math-token ${hoveredVar === 'H_t' ? 'active' : ''}`}>
              {"H_t"}
            </button>
            <button onMouseEnter={() => setHoveredVar('W_t')} className={`math-token ${hoveredVar === 'W_t' ? 'active' : ''}`}>
              {"W_t"}
            </button>
            <button onMouseEnter={() => setHoveredVar('D_e')} className={`math-token ${hoveredVar === 'D_e' ? 'active' : ''}`}>
              {"D_e^{-1}"}
            </button>
            <button onMouseEnter={() => setHoveredVar('H_t')} className={`math-token ${hoveredVar === 'H_t' ? 'active' : ''}`}>
              {"H_t^T"}
            </button>
            <button onMouseEnter={() => setHoveredVar('D_v')} className={`math-token ${hoveredVar === 'D_v' ? 'active' : ''}`}>
              {"D_v^{-1/2}"}
            </button>
          </div>
        </div>

        {/* Dynamic Variable Inspector */}
        <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 font-sans text-xs space-y-1.5 transition-all">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${VAR_INFO[hoveredVar]?.pillColor}`}>
              {VAR_INFO[hoveredVar]?.title}
            </span>
            <span className="font-mono text-ink-500">{VAR_INFO[hoveredVar]?.math}</span>
          </div>
          <p className="text-ink-600 leading-normal">
            {VAR_INFO[hoveredVar]?.desc}
          </p>
        </div>

        <button
          onClick={onInspectMatrix}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-semibold bg-white border border-paper-300 text-ink-800 shadow-sm hover:bg-paper-100 transition"
        >
          <Layers className="w-3.5 h-3.5 text-research-teal" />
          View Live Incidence Matrix & Heatmap Grid →
        </button>
      </section>

      {/* Section 4 */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-ink-900 text-2xl tracking-tight">
          4. Composite Pre-Inference Risk & Online Adaptation
        </h2>
        <p>
          Incoming user prompts {"p_t"} and prior dialogue turns {"C_{t-1}"} activate a concept subset {"A_t \\subseteq V_t"}. Risk is evaluated before routing to the LLM:
        </p>
        
        <div className="p-4 rounded-xl bg-white border border-paper-300 shadow-sm text-center font-mono text-sm md:text-base">
          {"R(p_t) = clip(\\lambda_1 S_{edge}(\\mathcal{A}_t) + \\lambda_2 S_{spec}(\\mathcal{A}_t) + \\lambda_3 S_{anom}(\\mathcal{A}_t), 0, 1)"}
        </div>

        <p>
          When an interaction triggers a policy violation ({"R(p_t) >= \\tau_{block}"}), the adaptive defense performs two synchronized online operations:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-[16px]">
          <li><strong>Weight Reinforcement:</strong> Matched unsafe hyperedges receive weight updates {"w_{t+1}(e) = min(2.0, \\gamma w_t(e) + \\alpha R(p_t))"}.</li>
          <li><strong>Dynamic Hyperedge Spawning:</strong> If novelty exceeds threshold ({"maxKnownOverlap < \\eta_{novel}"}), a new hyperedge {"e_{emerging}"} is created connecting all nodes in {"\\mathcal{A}_t"}, immunizing the defense against future variants of this attack.</li>
        </ol>
      </section>

      {/* Section 5 */}
      <section className="space-y-4">
        <h2 className="font-heading font-bold text-ink-900 text-2xl tracking-tight">
          5. Experimental Evaluation & Results
        </h2>
        <p>
          We evaluated AHD-Jailbreak against the standard 10-prompt Review 0 benchmark suite comprising known single-turn attacks, unseen multi-turn crescendo attacks, benign technical queries, and contrastive safe queries from XSTest:
        </p>
        <div className="grid grid-cols-2 gap-4 font-sans text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="font-bold text-emerald-900 text-sm block">AHD-Jailbreak (Adaptive)</span>
            <ul className="mt-2 space-y-1 text-emerald-800">
              <li>• Overall Recall (TPR): <strong>100.0%</strong> (6/6 blocked)</li>
              <li>• Unseen Attack Recall: <strong>100.0%</strong> (4/4 blocked)</li>
              <li>• False Positive Rate: <strong>0.0%</strong> (0/4 benign blocked)</li>
              <li>• Macro F1-Score: <strong>100.0%</strong></li>
              <li>• Avg Wrapper Latency: <strong>0.37 ms</strong></li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-300">
            <span className="font-bold text-slate-900 text-sm block">HGNN-Static Baseline</span>
            <ul className="mt-2 space-y-1 text-slate-700">
              <li>• Overall Recall (TPR): <strong>50.0%</strong> (3/6 blocked)</li>
              <li>• Unseen Attack Recall: <strong>25.0%</strong> (1/4 blocked)</li>
              <li>• False Positive Rate: <strong>0.0%</strong></li>
              <li>• Macro F1-Score: <strong>66.7%</strong></li>
              <li>• Avg Wrapper Latency: <strong>0.35 ms</strong></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 6 & 7 */}
      <section className="space-y-4 border-t border-paper-200 pt-6">
        <h2 className="font-heading font-bold text-ink-900 text-2xl tracking-tight">
          6. Implementation Roadmap & Milestones
        </h2>
        <div className="space-y-2.5 font-sans text-xs">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <span className="font-semibold text-emerald-900">Review 0 (Current): Formal Hypergraph Model, Python Reference & Live Interactive Lab</span>
            <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">COMPLETED</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-paper-200 flex items-center justify-between">
            <span className="font-semibold text-ink-800">Review 1: Sentence-Transformers Embeddings & PyG HypergraphConv Integration</span>
            <span className="px-2 py-0.5 rounded bg-paper-100 text-ink-500 font-bold">PLANNED</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-paper-200 flex items-center justify-between">
            <span className="font-semibold text-ink-800">Review 2: JailbreakBench & HarmBench 1,000+ Multi-Turn Evaluation</span>
            <span className="px-2 py-0.5 rounded bg-paper-100 text-ink-500 font-bold">PLANNED</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-paper-200 flex items-center justify-between">
            <span className="font-semibold text-ink-800">Final Defense: IEEE / ACM Conference Submission Draft & Production Docker Image</span>
            <span className="px-2 py-0.5 rounded bg-paper-100 text-ink-500 font-bold">PLANNED</span>
          </div>
        </div>
      </section>

    </article>
  );
}
