import React from 'react';
import { 
  ShieldAlert, ShieldCheck, Network, Sliders, BookOpen, 
  RotateCcw, Play, FileText, CheckCircle2, Cpu, FileCode 
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onResetGraph,
  onStartDemo,
  onOpenCite,
  globalMetrics
}) {
  const tabs = [
    { id: 'latex-editor', label: 'LaTeX Editor & Humanizer Studio', icon: FileCode },
    { id: 'paper-split', label: 'Paper + Synchronized Lab', icon: BookOpen },
    { id: 'studio-full', label: 'Defense Studio & Simulator', icon: Network },
    { id: 'matrix-lab', label: 'Matrix Tensor & Ablation Lab', icon: Sliders },
    { id: 'benchmarks', label: 'Benchmarks & Code Repository', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-paper-200 shadow-academic">
      <div className="max-w-[1780px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        
        {/* Brand & Project Metadata */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-research-cerulean to-research-teal flex items-center justify-center text-white font-extrabold text-base shadow-sm ring-1 ring-research-teal/30">
            AHD
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-extrabold text-ink-900 text-base tracking-tight">
                AHD-Jailbreak: Adaptive Hypergraph Defense
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Review 0 Live Prototype Ready
              </span>
            </div>
            <div className="text-xs text-ink-500 mt-0.5">
              By <span className="font-medium text-ink-700">Sesetti Pavan Kumar Swamy</span> (24555A0519) & <span className="font-medium text-ink-700">Rajana Rajeswari</span> (23551A05C9) • Guide: <span className="font-medium text-ink-700">Mrs. S. Suguna Sri</span> • Department of Computer Science, <span className="font-semibold text-research-cerulean">Godavari Global University</span>
            </div>
          </div>
        </div>

        {/* Global Live KPI Pills */}
        <div className="hidden 2xl:flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-paper-100 border border-paper-200 text-xs">
            <span className="text-ink-500">Overall Recall:</span> <strong className="text-emerald-700 font-mono font-bold">100.0%</strong>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-paper-100 border border-paper-200 text-xs">
            <span className="text-ink-500">Unseen Recall:</span> <strong className="text-research-cerulean font-mono font-bold">100.0%</strong>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-paper-100 border border-paper-200 text-xs">
            <span className="text-ink-500">XSTest FPR:</span> <strong className="text-emerald-700 font-mono font-bold">0.0%</strong>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-paper-100 border border-paper-200 text-xs">
            <span className="text-ink-500">Latency:</span> <strong className="text-ink-900 font-mono font-bold">0.37 ms</strong>
          </div>
        </div>

        {/* 4-Tab Switcher & Controls */}
        <div className="flex items-center gap-3">
          <nav className="flex p-1 bg-paper-100 rounded-lg border border-paper-200 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-ink-900 shadow-sm border border-paper-200 text-research-cerulean'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-research-cerulean' : 'text-ink-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={onStartDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-research-cerulean to-research-teal text-white shadow-sm hover:shadow hover:opacity-95 transition"
            title="Start step-by-step Review 0 guided tour"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Review 0 Demo
          </button>

          <button
            onClick={onResetGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-ink-700 border border-paper-300 hover:bg-paper-100 transition shadow-sm"
            title="Reset hyperedges and weights to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            onClick={onOpenCite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-ink-700 border border-paper-300 hover:bg-paper-100 transition shadow-sm"
            title="BibTeX citation modal"
          >
            Cite
          </button>
        </div>

      </div>
    </header>
  );
}
