import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layers, Network, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { NODE_MODALITIES } from '../engine/hypergraphEngine';

const MODALITY_COLORS = {
  context: { fill: '#EEF2FF', stroke: '#4F46E5', text: '#312E81', dot: '#4F46E5' },
  semantic: { fill: '#FFFBEB', stroke: '#D97706', text: '#78350F', dot: '#D97706' },
  policy: { fill: '#FEF2F2', stroke: '#DC2626', text: '#7F1D1D', dot: '#DC2626' },
  pattern: { fill: '#FAF5FF', stroke: '#9333EA', text: '#581C87', dot: '#9333EA' },
  prompt: { fill: '#F0F9FF', stroke: '#0284C7', text: '#0C4A6E', dot: '#0284C7' }
};

const HYPEREDGE_PALETTE = [
  { fill: 'rgba(220, 38, 38, 0.08)', stroke: '#DC2626', glow: 'rgba(220, 38, 38, 0.25)', badge: '#DC2626' },
  { fill: 'rgba(217, 119, 6, 0.08)', stroke: '#D97706', glow: 'rgba(217, 119, 6, 0.25)', badge: '#D97706' },
  { fill: 'rgba(5, 150, 105, 0.08)', stroke: '#059669', glow: 'rgba(5, 150, 105, 0.20)', badge: '#059669' },
  { fill: 'rgba(124, 58, 237, 0.12)', stroke: '#7C3AED', glow: 'rgba(124, 58, 237, 0.35)', badge: '#7C3AED' },
  { fill: 'rgba(2, 132, 199, 0.12)', stroke: '#0284C7', glow: 'rgba(2, 132, 199, 0.35)', badge: '#0284C7' },
];

function computeConvexHull(points) {
  if (points.length <= 2) return points;
  const sorted = points.slice().sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function drawPaddedHull(ctx, points, padding = 32) {
  if (!points || points.length === 0) return;
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, padding, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }

  let cx = 0, cy = 0;
  points.forEach(p => { cx += p.x; cy += p.y; });
  cx /= points.length;
  cy /= points.length;

  const expanded = points.map(p => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    return {
      x: p.x + (dx / dist) * padding,
      y: p.y + (dy / dist) * padding
    };
  });

  const hull = computeConvexHull(expanded);
  if (hull.length < 3) {
    ctx.beginPath();
    hull.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  const n = hull.length;
  for (let i = 0; i < n; i++) {
    const curr = hull[i];
    const next = hull[(i + 1) % n];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    if (i === 0) ctx.moveTo(midX, midY);
    else {
      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }
  }
  ctx.quadraticCurveTo(hull[n - 1].x, hull[n - 1].y, (hull[n - 1].x + hull[0].x) / 2, (hull[n - 1].y + hull[0].y) / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export default function HypergraphVisualizer({
  core,
  activeNodes = [],
  newlySpawned = null,
  height = 520
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [viewType, setViewType] = useState('convex'); // 'convex' | 'bipartite'
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [nodePositions, setNodePositions] = useState({});

  // Initialize node layout
  const initPositions = useCallback(() => {
    const w = containerRef.current?.clientWidth || 750;
    const h = height;
    const cx = w / 2;
    const cy = h / 2;

    const positions = {};

    if (viewType === 'convex') {
      const clusters = {
        context: { cx: cx - w * 0.28, cy: cy - h * 0.22, r: 85 },
        semantic: { cx: cx, cy: cy - h * 0.26, r: 120 },
        policy: { cx: cx + w * 0.26, cy: cy, r: 95 },
        pattern: { cx: cx, cy: cy + h * 0.26, r: 105 }
      };

      const nodesByMod = { context: [], semantic: [], policy: [], pattern: [] };
      core.nodes.forEach(nodeId => {
        const mod = NODE_MODALITIES[nodeId]?.modality || 'semantic';
        if (nodesByMod[mod]) nodesByMod[mod].push(nodeId);
      });

      Object.keys(nodesByMod).forEach(mod => {
        const list = nodesByMod[mod];
        const cl = clusters[mod];
        const n = list.length;
        list.forEach((nodeId, idx) => {
          const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
          const dist = cl.r * (0.65 + 0.35 * (idx % 2));
          positions[nodeId] = {
            id: nodeId,
            x: cl.cx + Math.cos(angle) * dist,
            y: cl.cy + Math.sin(angle) * dist,
            radius: 13,
            modality: mod,
            label: nodeId.split(':')[1].replace(/_/g, ' ')
          };
        });
      });
    } else {
      // Bipartite view: Left vertices, Right hyperedges
      const leftX = w * 0.22;
      const stepY = (h - 80) / core.nodes.length;
      core.nodes.forEach((nodeId, idx) => {
        const mod = NODE_MODALITIES[nodeId]?.modality || 'semantic';
        positions[nodeId] = {
          id: nodeId,
          x: leftX,
          y: 40 + idx * stepY,
          radius: 11,
          modality: mod,
          label: nodeId.split(':')[1].replace(/_/g, ' ')
        };
      });
    }

    setNodePositions(positions);
  }, [core.nodes, height, viewType]);

  useEffect(() => {
    initPositions();
  }, [initPositions]);

  // Update particles on active nodes change
  useEffect(() => {
    if (!activeNodes || activeNodes.length === 0) {
      setParticles([]);
      return;
    }

    const newParticles = [];
    const edgeNames = Object.keys(core.hyperedges);

    edgeNames.forEach(eName => {
      const eNodes = core.hyperedges[eName];
      const matches = [...eNodes].filter(n => activeNodes.includes(n));
      if (matches.length >= 2) {
        // Calculate centroid
        let cx = 0, cy = 0, count = 0;
        eNodes.forEach(id => {
          const p = nodePositions[id];
          if (p) { cx += p.x; cy += p.y; count++; }
        });
        if (count > 0) {
          cx /= count;
          cy /= count;

          // Stage 1: Active nodes -> Centroid
          matches.forEach(nId => {
            const p = nodePositions[nId];
            if (p) {
              for (let i = 0; i < 2; i++) {
                newParticles.push({
                  x: p.x, y: p.y,
                  tx: cx, ty: cy,
                  progress: (i * 0.4) % 1,
                  speed: 0.02 + Math.random() * 0.01,
                  color: '#0284C7',
                  radius: 3
                });
              }
            }
          });

          // Stage 2: Centroid -> Policy anchors
          [...eNodes].filter(n => n.startsWith('pol:')).forEach(nId => {
            const p = nodePositions[nId];
            if (p) {
              for (let i = 0; i < 2; i++) {
                newParticles.push({
                  x: cx, y: cy,
                  tx: p.x, ty: p.y,
                  progress: (i * 0.45) % 1,
                  speed: 0.018 + Math.random() * 0.01,
                  color: '#DC2626',
                  radius: 3.5
                });
              }
            }
          });
        }
      }
    });

    setParticles(newParticles);
  }, [activeNodes, core.hyperedges, nodePositions]);

  // Animation Frame Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      const w = containerRef.current?.clientWidth || 750;
      const h = height;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Light background
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, w, h);

      // Draw engineering grid pattern
      ctx.fillStyle = '#CBD5E1';
      for (let x = 8; x < w; x += 16) {
        for (let y = 8; y < h; y += 16) {
          ctx.beginPath();
          ctx.arc(x, y, 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const edgeNames = Object.keys(core.hyperedges);
      const activeSet = new Set(activeNodes);

      if (viewType === 'convex') {
        // 1. Draw Convex Hulls
        edgeNames.forEach((eName, idx) => {
          const colorCfg = HYPEREDGE_PALETTE[idx % HYPEREDGE_PALETTE.length];
          const nodeIds = core.hyperedges[eName];
          const weight = core.hyperedgeWeights[eName] || 1.0;
          const points = [];
          nodeIds.forEach(id => {
            const p = nodePositions[id];
            if (p) points.push({ x: p.x, y: p.y });
          });

          const isNewlySpawned = newlySpawned && newlySpawned.name === eName;
          const hasOverlap = [...nodeIds].some(n => activeSet.has(n));

          ctx.save();
          ctx.fillStyle = isNewlySpawned
            ? 'rgba(124, 58, 237, 0.18)'
            : (hasOverlap ? colorCfg.fill.replace('0.08', '0.16') : colorCfg.fill);
          ctx.strokeStyle = isNewlySpawned ? '#7C3AED' : colorCfg.stroke;
          ctx.lineWidth = Math.min(Math.max(weight * 2.0, 1.5), 4.5);
          drawPaddedHull(ctx, points, 30);
          ctx.restore();
        });

        // 2. Draw Hyperedge Hub Pills
        edgeNames.forEach((eName, idx) => {
          const colorCfg = HYPEREDGE_PALETTE[idx % HYPEREDGE_PALETTE.length];
          const nodeIds = core.hyperedges[eName];
          const weight = core.hyperedgeWeights[eName] || 1.0;
          let cx = 0, cy = 0, count = 0;
          nodeIds.forEach(id => {
            const p = nodePositions[id];
            if (p) { cx += p.x; cy += p.y; count++; }
          });
          if (count > 0) {
            cx /= count;
            cy /= count;

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = colorCfg.stroke;
            ctx.fill();

            const text = `${eName} (w=${weight.toFixed(2)})`;
            ctx.font = '600 10.5px Inter, sans-serif';
            const tw = ctx.measureText(text).width;

            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = colorCfg.stroke;
            ctx.lineWidth = 1.2;
            const px = cx - tw / 2 - 8;
            const py = cy - 22;
            ctx.beginPath();
            ctx.roundRect(px, py, tw + 16, 18, 9);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0F172A';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, cx, py + 9);
            ctx.restore();
          }
        });
      } else {
        // Bipartite View: Right Hyperedges and connections
        const rightX = w * 0.78;
        const eStepY = (h - 80) / edgeNames.length;

        edgeNames.forEach((eName, eIdx) => {
          const eY = 50 + eIdx * eStepY;
          const weight = core.hyperedgeWeights[eName] || 1.0;
          const nodeIds = core.hyperedges[eName];

          // Draw bipartite edges from left vertices to right hyperedge hub
          nodeIds.forEach(nId => {
            const vp = nodePositions[nId];
            if (vp) {
              const isActiveEdge = activeSet.has(nId);
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(vp.x + vp.radius, vp.y);
              ctx.bezierCurveTo(vp.x + (rightX - vp.x) * 0.45, vp.y, vp.x + (rightX - vp.x) * 0.55, eY, rightX - 10, eY);
              ctx.strokeStyle = isActiveEdge ? '#0284C7' : 'rgba(203, 213, 225, 0.7)';
              ctx.lineWidth = isActiveEdge ? Math.max(weight * 1.8, 2) : 1;
              ctx.stroke();
              ctx.restore();
            }
          });

          // Draw Hyperedge Node
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(rightX - 12, eY - 14, 180, 28, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = eName.startsWith('he_adaptive') ? '#7C3AED' : '#0284C7';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = '600 11px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${eName} (w=${weight.toFixed(2)})`, rightX + 6, eY);
          ctx.restore();
        });
      }

      // 3. Draw Spectral Propagation Particles
      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) p.progress = 0;
        const curX = p.x + (p.tx - p.x) * p.progress;
        const curY = p.y + (p.ty - p.y) * p.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(curX, curY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      });

      // 4. Draw Vertex Nodes
      core.nodes.forEach(nodeId => {
        const node = nodePositions[nodeId];
        if (!node) return;

        const modCfg = MODALITY_COLORS[node.modality] || MODALITY_COLORS.semantic;
        const isActive = activeSet.has(nodeId);
        const isHovered = hoveredNode?.id === nodeId;

        ctx.save();
        ctx.beginPath();
        const r = node.radius + (isActive ? 3 : (isHovered ? 2 : 0));
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

        if (isActive) {
          ctx.fillStyle = modCfg.dot;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = modCfg.dot;
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = modCfg.fill;
          ctx.strokeStyle = modCfg.stroke;
          ctx.lineWidth = isHovered ? 2.5 : 1.5;
        }

        ctx.fill();
        ctx.stroke();

        // Node center dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#FFFFFF' : modCfg.dot;
        ctx.fill();

        // Label
        ctx.font = `${isActive ? '600' : '500'} 10px Inter, sans-serif`;
        ctx.textAlign = viewType === 'bipartite' ? 'right' : 'center';
        ctx.textBaseline = viewType === 'bipartite' ? 'middle' : 'top';
        ctx.fillStyle = isActive ? '#0F172A' : '#475569';
        const lx = viewType === 'bipartite' ? node.x - r - 6 : node.x;
        const ly = viewType === 'bipartite' ? node.y : node.y + r + 3;
        ctx.fillText(node.label, lx, ly);
        ctx.restore();
      });

      ctx.restore(); // Pan/zoom
      ctx.restore(); // DPR

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [core.hyperedges, core.hyperedgeWeights, core.nodes, activeNodes, hoveredNode, newlySpawned, nodePositions, pan, particles, viewType, zoom, height]);

  // Mouse Handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const wx = (e.clientX - rect.left - pan.x) / zoom;
    const wy = (e.clientY - rect.top - pan.y) / zoom;

    for (const nodeId of core.nodes) {
      const node = nodePositions[nodeId];
      if (node && Math.hypot(node.x - wx, node.y - wy) <= node.radius + 6) {
        setIsDragging(true);
        setDraggedNode(node);
        return;
      }
    }
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const wx = (e.clientX - rect.left - pan.x) / zoom;
    const wy = (e.clientY - rect.top - pan.y) / zoom;

    if (isDragging && draggedNode) {
      setNodePositions(prev => ({
        ...prev,
        [draggedNode.id]: { ...draggedNode, x: wx, y: wy }
      }));
    } else {
      let found = null;
      for (const nodeId of core.nodes) {
        const node = nodePositions[nodeId];
        if (node && Math.hypot(node.x - wx, node.y - wy) <= node.radius + 6) {
          found = node;
          break;
        }
      }
      setHoveredNode(found);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  return (
    <div className="relative w-full rounded-xl border border-paper-200 bg-paper-50 overflow-hidden shadow-academic" ref={containerRef}>
      
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        
        {/* View Switcher */}
        <div className="flex p-0.5 bg-white/90 backdrop-blur rounded-lg border border-paper-300 shadow-sm pointer-events-auto">
          <button
            onClick={() => setViewType('convex')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              viewType === 'convex' ? 'bg-research-cerulean text-white shadow-xs' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Convex-Hull View
          </button>
          <button
            onClick={() => setViewType('bipartite')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              viewType === 'bipartite' ? 'bg-research-cerulean text-white shadow-xs' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Bipartite Incidence View
          </button>
        </div>

        {/* Zoom & Recenter Controls */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur p-1 rounded-lg border border-paper-300 shadow-sm pointer-events-auto">
          <button
            onClick={() => setZoom(z => Math.min(z * 1.15, 2.5))}
            className="p-1.5 text-ink-600 hover:text-ink-900 rounded hover:bg-paper-100"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z * 0.85, 0.5))}
            className="p-1.5 text-ink-600 hover:text-ink-900 rounded hover:bg-paper-100"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); initPositions(); }}
            className="p-1.5 text-ink-600 hover:text-ink-900 rounded hover:bg-paper-100"
            title="Recenter view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ width: '100%', height: `${height}px`, display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
      />

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur border border-paper-300 p-2.5 rounded-lg shadow-academic text-xs pointer-events-none max-w-xs">
          <div className="flex items-center gap-1.5 font-bold text-ink-900">
            <span className="w-2 h-2 rounded-full" style={{ background: MODALITY_COLORS[hoveredNode.modality]?.dot }} />
            {NODE_MODALITIES[hoveredNode.id]?.name || hoveredNode.id}
          </div>
          <p className="text-ink-500 text-[11px] mt-0.5">{NODE_MODALITIES[hoveredNode.id]?.desc}</p>
        </div>
      )}

      {/* Footer Legend */}
      <div className="absolute bottom-3 right-3 text-[11px] text-ink-400 font-sans pointer-events-none">
        Drag vertices • 2-Stage Message Passing (\(V \to E \to V\))
      </div>
    </div>
  );
}
