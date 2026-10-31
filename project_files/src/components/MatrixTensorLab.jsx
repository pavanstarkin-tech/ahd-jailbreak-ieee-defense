import React, { useState, useMemo } from 'react';
import { Layers, Sliders, RotateCcw, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { BENCHMARK_DATASET, AdaptiveHypergraphCore } from '../engine/hypergraphEngine';

export default function MatrixTensorLab({ core }) {
  const [matrixView, setMatrixView] = useState('incidence'); // 'incidence' | 'laplacian'
  const [selectedCell, setSelectedCell] = useState(null);

  // Ablation Sliders State
  const [tau, setTau] = useState(0.52);
  const [alpha, setAlpha] = useState(0.28);
  const [gamma, setGamma] = useState(0.98);
  const [eta, setEta] = useState(0.65);
  const [lambda3, setLambda3] = useState(0.55);

  const { H, P, edgeNames, dV } = useMemo(() => {
    return core.buildIncidenceAndLaplacian();
  }, [core]);

  // Real-time evaluation of all 10 prompts under current slider parameters
  const ablationMetrics = useMemo(() => {
    const tempCore = new AdaptiveHypergraphCore({
      adaptiveMode: true,
      tauBlock: tau,
      alpha: alpha,
      gamma: gamma,
      etaNovel: eta,
      lambda3: lambda3
    });
    return tempCore.evaluateDataset(BENCHMARK_DATASET);
  }, [tau, alpha, gamma, eta, lambda3]);

  const resetSliders = () => {
    setTau(0.52);
    setAlpha(0.28);
    setGamma(0.98);
    setEta(0.65);
    setLambda3(0.55);
  };

  return (
    <div className="space-y-6">
      
      {/* Module 3: Incidence Matrix & Laplacian Heatmap */}
      <div className="bg-white rounded-xl border border-paper-200 p-5 shadow-academic space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-paper-200 pb-3">
          <div>
            <h2 className="font-heading font-bold text-ink-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-research-cerulean" />
              Live Incidence Matrix {"H_t in {0,1}^{17 x m}"} & Spectral Operator
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Click any cell {"(v, e)"} to inspect concept vertex membership and hyperedge degree {"\\delta(e)"}.
            </p>
          </div>

          <div className="flex p-0.5 bg-paper-100 rounded-lg border border-paper-200 text-xs">
            <button
              onClick={() => setMatrixView('incidence')}
              className={`px-3 py-1 rounded font-semibold transition ${
                matrixView === 'incidence' ? 'bg-research-cerulean text-white shadow-xs' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Incidence Matrix {"H_t"}
            </button>
            <button
              onClick={() => setMatrixView('laplacian')}
              className={`px-3 py-1 rounded font-semibold transition ${
                matrixView === 'laplacian' ? 'bg-research-cerulean text-white shadow-xs' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Laplacian {"P_t"}
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-lg border border-paper-200 bg-paper-50 p-3">
          {matrixView === 'incidence' ? (
            <table className="w-full border-collapse font-mono text-[11px] text-center">
              <thead>
                <tr className="border-b border-paper-300">
                  <th className="p-2 text-left text-ink-500 font-semibold">Node {"v in V_t"}</th>
                  <th className="p-2 text-ink-500 font-semibold bg-emerald-50 text-emerald-800">d(v)</th>
                  {edgeNames.map(eName => (
                    <th 
                      key={eName}
                      className={`p-2 font-semibold ${eName.startsWith('he_adaptive') ? 'bg-violet-50 text-violet-700' : 'text-ink-700'}`}
                    >
                      {eName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {core.nodes.map((nodeId, vIdx) => (
                  <tr key={nodeId} className="border-b border-paper-200/60 hover:bg-paper-100/50">
                    <td className="p-1.5 text-left text-ink-800 font-medium whitespace-nowrap">{nodeId}</td>
                    <td className="p-1.5 bg-emerald-50/50 font-bold text-emerald-700">{dV[vIdx]?.toFixed(2)}</td>
                    {edgeNames.map((eName, eIdx) => {
                      const val = H[vIdx][eIdx];
                      const isSelected = selectedCell?.v === nodeId && selectedCell?.e === eName;
                      return (
                        <td
                          key={eName}
                          onClick={() => setSelectedCell({ v: nodeId, e: eName, val })}
                          className={`p-1.5 cursor-pointer transition ${
                            val > 0
                              ? 'bg-sky-100 text-sky-800 font-bold border border-sky-200'
                              : 'text-ink-400'
                          } ${isSelected ? 'ring-2 ring-research-cerulean' : ''}`}
                        >
                          {val > 0 ? '1' : '0'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse font-mono text-[10px] text-center">
              <thead>
                <tr className="border-b border-paper-300">
                  <th className="p-2 text-left text-ink-500 font-semibold">Node</th>
                  {core.nodes.map(n => (
                    <th key={n} className="p-1 text-ink-600 font-semibold">{n.split(':')[1].substring(0, 4)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {core.nodes.map((rNode, rIdx) => (
                  <tr key={rNode} className="border-b border-paper-200/60">
                    <td className="p-1.5 text-left text-ink-700 font-medium whitespace-nowrap text-[11px]">{rNode}</td>
                    {core.nodes.map((cNode, cIdx) => {
                      const val = P[rIdx][cIdx];
                      const bg = val > 0.05 ? `rgba(2, 132, 199, ${Math.min(val * 1.5, 0.45)})` : 'transparent';
                      return (
                        <td key={cNode} style={{ backgroundColor: bg }} className="p-1 text-ink-800 font-medium">
                          {val > 0 ? val.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedCell && (
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
            <div>
              Selected Cell: Vertex <strong>{selectedCell.v}</strong> in Hyperedge <strong>{selectedCell.e}</strong> → Affiliation: <strong>{selectedCell.val > 0 ? 'ACTIVE (1)' : 'INACTIVE (0)'}</strong>
            </div>
            <button onClick={() => setSelectedCell(null)} className="text-sky-700 hover:underline">Clear</button>
          </div>
        )}
      </div>

      {/* Module 5: Real-Time Ablation Laboratory & Sliders */}
      <div className="bg-white rounded-xl border border-paper-200 p-5 shadow-academic space-y-5">
        <div className="flex items-center justify-between border-b border-paper-200 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-research-teal" />
            <h2 className="font-heading font-bold text-ink-900 text-sm">
              Hyperparameter Sensitivity & Ablation Suite (Live Recomputation)
            </h2>
          </div>
          <button
            onClick={resetSliders}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-paper-100 hover:bg-paper-200 text-ink-700 border border-paper-300 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sliders Column */}
          <div className="space-y-4">
            
            <div className="p-3.5 rounded-lg bg-paper-50 border border-paper-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink-800">Blocking Threshold {"(\\tau_{block})"}</span>
                <span className="font-mono text-research-cerulean font-bold">{tau.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.10" max="0.95" step="0.01" value={tau}
                onChange={e => setTau(parseFloat(e.target.value))}
                className="w-full accent-research-cerulean cursor-pointer"
              />
              <span className="text-[11px] text-ink-500 block">Pre-inference decision threshold. Default = 0.52.</span>
            </div>

            <div className="p-3.5 rounded-lg bg-paper-50 border border-paper-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink-800">Online Learning Rate {"(\\alpha)"}</span>
                <span className="font-mono text-research-cerulean font-bold">{alpha.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.00" max="0.60" step="0.02" value={alpha}
                onChange={e => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-research-cerulean cursor-pointer"
              />
              <span className="text-[11px] text-ink-500 block">Online weight reinforcement coefficient. Default = 0.28.</span>
            </div>

            <div className="p-3.5 rounded-lg bg-paper-50 border border-paper-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink-800">Decay Factor {"(\\gamma)"}</span>
                <span className="font-mono text-research-cerulean font-bold">{gamma.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.85" max="1.00" step="0.01" value={gamma}
                onChange={e => setGamma(parseFloat(e.target.value))}
                className="w-full accent-research-cerulean cursor-pointer"
              />
              <span className="text-[11px] text-ink-500 block">Temporal hyperedge retention across interactions. Default = 0.98.</span>
            </div>

            <div className="p-3.5 rounded-lg bg-paper-50 border border-paper-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink-800">Novelty Spawning Threshold {"(\\eta_{novel})"}</span>
                <span className="font-mono text-research-cerulean font-bold">{eta.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.30" max="0.90" step="0.05" value={eta}
                onChange={e => setEta(parseFloat(e.target.value))}
                className="w-full accent-research-cerulean cursor-pointer"
              />
              <span className="text-[11px] text-ink-500 block">{"Spawns dynamic hyperedges when overlap with existing edges is below \\eta. Default = 0.65."}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-paper-50 border border-paper-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink-800">Structural Anomaly Weight {"(\\lambda_3)"}</span>
                <span className="font-mono text-research-cerulean font-bold">{lambda3.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.00" max="1.00" step="0.05" value={lambda3}
                onChange={e => setLambda3(parseFloat(e.target.value))}
                className="w-full accent-research-cerulean cursor-pointer"
              />
              <span className="text-[11px] text-ink-500 block">Weight for higher-order multi-party coupling anomaly. Setting to 0 simulates static baseline. Default = 0.55.</span>
            </div>

          </div>

          {/* Ablation Results KPI Cards */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-xs text-ink-500 uppercase tracking-wider">
              Ablation Benchmark Metrics (Across All 10 Interactions)
            </h3>

            <div className="grid grid-cols-2 gap-3 font-sans">
              <div className="p-4 rounded-xl bg-paper-50 border border-paper-200">
                <span className="text-xs font-semibold text-ink-500 block">Overall Recall (TPR)</span>
                <strong className={`font-mono text-2xl font-extrabold ${ablationMetrics.metrics.tprRecall >= 90 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {ablationMetrics.metrics.tprRecall}%
                </strong>
                <span className="text-[11px] text-ink-500 block mt-1">{ablationMetrics.metrics.blockedCount} of 6 attacks caught</span>
              </div>

              <div className="p-4 rounded-xl bg-paper-50 border border-paper-200">
                <span className="text-xs font-semibold text-ink-500 block">Unseen Crescendo Recall</span>
                <strong className={`font-mono text-2xl font-extrabold ${ablationMetrics.metrics.unseenRecall >= 80 ? 'text-research-cerulean' : 'text-red-600'}`}>
                  {ablationMetrics.metrics.unseenRecall}%
                </strong>
                <span className="text-[11px] text-ink-500 block mt-1">Multi-turn drift detection</span>
              </div>

              <div className="p-4 rounded-xl bg-paper-50 border border-paper-200">
                <span className="text-xs font-semibold text-ink-500 block">False Positive Rate (XSTest)</span>
                <strong className={`font-mono text-2xl font-extrabold ${ablationMetrics.metrics.xstestFpr === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {ablationMetrics.metrics.xstestFpr}%
                </strong>
                <span className="text-[11px] text-ink-500 block mt-1">Benign technical preservation</span>
              </div>

              <div className="p-4 rounded-xl bg-paper-50 border border-paper-200">
                <span className="text-xs font-semibold text-ink-500 block">Macro F1-Score</span>
                <strong className="font-mono text-2xl font-extrabold text-research-teal">
                  {ablationMetrics.metrics.f1}%
                </strong>
                <span className="text-[11px] text-ink-500 block mt-1">Harmonic mean balance</span>
              </div>
            </div>

            {/* Threshold Sensitivity Bar Chart */}
            <div className="p-4 rounded-xl bg-white border border-paper-200 space-y-2">
              <span className="text-xs font-semibold text-ink-800 block">Threshold Alignment vs. Benchmark Interactions:</span>
              <div className="space-y-1.5 font-mono text-[10px]">
                {ablationMetrics.decisions.map(d => (
                  <div key={d.interaction_id} className="flex items-center gap-2">
                    <span className="w-24 text-ink-500 truncate">{d.interaction_id}</span>
                    <div className="flex-1 h-3 bg-paper-100 rounded overflow-hidden relative">
                      <div
                        className={`h-full rounded ${d.blocked ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(d.risk_score * 100, 100)}%` }}
                      />
                      {/* Threshold Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                        style={{ left: `${Math.min(tau * 100, 100)}%` }}
                        title={`Threshold: ${tau.toFixed(2)}`}
                      />
                    </div>
                    <span className="w-10 text-right font-bold text-ink-700">{d.risk_score.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
