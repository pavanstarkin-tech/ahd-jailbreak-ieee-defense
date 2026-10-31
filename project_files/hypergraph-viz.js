/**
 * AHD-Jailbreak: Interactive Hypergraph Canvas & Convex-Hull Visualizer
 * =====================================================================
 * Authors: Sesetti Pavan Kumar Swamy & Rajana Rajeswari | Godavari Global University
 * 
 * Features:
 * - High-craft Canvas/SVG hybrid rendering for crisp high-DPI displays
 * - Modal clustering (Context, Semantic, Policy, Pattern, Dynamic)
 * - Smooth convex-hull / polygon calculation for hyperedges with live weight-based stroke & glow
 * - Hyperedge centroid hubs with badge labels and weight badges
 * - Animated spectral message passing particle beams (Active Nodes -> Hyperedges -> Policy Anchors)
 * - Pulse glow animation when new adaptive hyperedges are dynamically spawned
 * - Interactive node dragging, panning, zooming, and rich contextual tooltips
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HypergraphVisualizer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const MODALITY_COLORS = {
    context: { fill: '#38BDF8', stroke: '#0284C7', glow: 'rgba(56, 189, 248, 0.4)', text: '#E0F2FE' },
    semantic: { fill: '#F59E0B', stroke: '#D97706', glow: 'rgba(245, 158, 11, 0.4)', text: '#FEF3C7' },
    policy: { fill: '#EF4444', stroke: '#DC2626', glow: 'rgba(239, 68, 68, 0.4)', text: '#FEE2E2' },
    pattern: { fill: '#8B5CF6', stroke: '#7C3AED', glow: 'rgba(139, 92, 246, 0.4)', text: '#EDE9FE' },
    prompt: { fill: '#10B981', stroke: '#059669', glow: 'rgba(16, 185, 129, 0.4)', text: '#D1FAE5' }
  };

  const HYPEREDGE_PALETTE = [
    { fill: 'rgba(239, 68, 68, 0.12)', stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.35)', badge: '#EF4444' }, // DAN
    { fill: 'rgba(245, 158, 11, 0.12)', stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.35)', badge: '#F59E0B' }, // Obfuscation
    { fill: 'rgba(16, 185, 129, 0.10)', stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.30)', badge: '#10B981' }, // Benign Safe
    { fill: 'rgba(139, 92, 246, 0.16)', stroke: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.50)', badge: '#8B5CF6' }, // Adaptive 1
    { fill: 'rgba(236, 72, 153, 0.16)', stroke: '#EC4899', glow: 'rgba(236, 72, 153, 0.50)', badge: '#EC4899' }, // Adaptive 2
    { fill: 'rgba(6, 182, 212, 0.16)', stroke: '#06B6D4', glow: 'rgba(6, 182, 212, 0.50)', badge: '#06B6D4' }  // Adaptive 3
  ];

  // Helper for computing 2D convex hull with Graham Scan
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

  // Smooth closed spline around convex hull points with padding
  function drawPaddedHull(ctx, points, padding = 34) {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, padding, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return;
    }

    // Expand points outward from geometric center
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

    // Render smooth curved polygon
    ctx.beginPath();
    const n = hull.length;
    for (let i = 0; i < n; i++) {
      const curr = hull[i];
      const next = hull[(i + 1) % n];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      if (i === 0) ctx.moveTo(midX, midY);
      else {
        const prev = hull[(i - 1 + n) % n];
        const prevMidX = (prev.x + curr.x) / 2;
        const prevMidY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
    }
    const last = hull[n - 1];
    const first = hull[0];
    ctx.quadraticCurveTo(first.x, first.y, (first.x + hull[1].x) / 2, (first.y + hull[1].y) / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  class Visualizer {
    constructor(canvasContainerId, core, options = {}) {
      this.container = document.getElementById(canvasContainerId);
      if (!this.container) {
        throw new Error(`Container #${canvasContainerId} not found`);
      }
      this.core = core;
      this.options = Object.assign({
        showConvexHulls: true,
        showHubCentroids: true,
        showLabels: true,
        showNodeTooltips: true
      }, options);

      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.className = 'hypergraph-canvas';
      this.container.appendChild(this.canvas);

      // Tooltip element
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'hypergraph-tooltip';
      this.tooltip.style.display = 'none';
      this.container.appendChild(this.tooltip);

      // State
      this.width = this.container.clientWidth || 800;
      this.height = this.container.clientHeight || 560;
      this.dpr = window.devicePixelRatio || 1;

      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.isPanning = false;
      this.draggedNode = null;
      this.hoveredNode = null;
      this.hoveredEdge = null;
      this.lastMouse = { x: 0, y: 0 };

      // Particles for spectral message passing
      this.particles = [];
      this.activeNodeSet = new Set();
      this.recentSpawns = new Set();

      this.initNodesLayout();
      this.resize();
      this.bindEvents();
      this.startRenderLoop();
    }

    initNodesLayout() {
      this.nodePositions = {};
      const w = this.width;
      const h = this.height;
      const cx = w / 2;
      const cy = h / 2;

      // Group positions in an academic radial cluster
      const clusters = {
        context:  { cx: cx - w * 0.28, cy: cy - h * 0.25, r: 90 },
        semantic: { cx: cx,           cy: cy - h * 0.28, r: 130 },
        policy:   { cx: cx + w * 0.28, cy: cy,           r: 100 },
        pattern:  { cx: cx,           cy: cy + h * 0.25, r: 110 }
      };

      const nodesByMod = { context: [], semantic: [], policy: [], pattern: [] };
      this.core.nodes.forEach(nodeId => {
        const mod = AHDDefense.NODE_MODALITIES[nodeId]?.modality || 'semantic';
        if (nodesByMod[mod]) nodesByMod[mod].push(nodeId);
      });

      Object.keys(nodesByMod).forEach(mod => {
        const list = nodesByMod[mod];
        const cl = clusters[mod];
        const n = list.length;
        list.forEach((nodeId, idx) => {
          const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
          const dist = cl.r * (0.6 + 0.4 * (idx % 2));
          this.nodePositions[nodeId] = {
            id: nodeId,
            x: cl.cx + Math.cos(angle) * dist,
            y: cl.cy + Math.sin(angle) * dist,
            vx: 0,
            vy: 0,
            radius: 14,
            modality: mod,
            label: nodeId.split(':')[1].replace(/_/g, ' ')
          };
        });
      });
    }

    resize() {
      this.width = this.container.clientWidth || 800;
      this.height = this.container.clientHeight || 560;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.resize();
      });

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(this.zoom * zoomFactor, 0.4), 3.0);

        // Zoom toward mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        this.panX = mx - (mx - this.panX) * (newZoom / this.zoom);
        this.panY = my - (my - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
      }, { passive: false });

      this.canvas.addEventListener('mousedown', (e) => {
        const pt = this.toWorld(e.clientX, e.clientY);
        this.lastMouse = { x: e.clientX, y: e.clientY };

        const hit = this.hitTestNode(pt.x, pt.y);
        if (hit) {
          this.isDragging = true;
          this.draggedNode = hit;
        } else {
          this.isPanning = true;
        }
      });

      window.addEventListener('mousemove', (e) => {
        const pt = this.toWorld(e.clientX, e.clientY);

        if (this.isDragging && this.draggedNode) {
          this.draggedNode.x = pt.x;
          this.draggedNode.y = pt.y;
        } else if (this.isPanning) {
          const dx = e.clientX - this.lastMouse.x;
          const dy = e.clientY - this.lastMouse.y;
          this.panX += dx;
          this.panY += dy;
          this.lastMouse = { x: e.clientX, y: e.clientY };
        } else {
          const hit = this.hitTestNode(pt.x, pt.y);
          this.hoveredNode = hit;
          this.updateTooltip(hit, e.clientX, e.clientY);
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
        this.isPanning = false;
        this.draggedNode = null;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoveredNode = null;
        this.tooltip.style.display = 'none';
      });
    }

    toWorld(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return {
        x: (x - this.panX) / this.zoom,
        y: (y - this.panY) / this.zoom
      };
    }

    hitTestNode(wx, wy) {
      for (const nodeId of this.core.nodes) {
        const node = this.nodePositions[nodeId];
        if (node) {
          const dist = Math.hypot(node.x - wx, node.y - wy);
          if (dist <= node.radius + 6) return node;
        }
      }
      return null;
    }

    updateTooltip(node, clientX, clientY) {
      if (!node || !this.options.showNodeTooltips) {
        this.tooltip.style.display = 'none';
        return;
      }
      const meta = AHDDefense.NODE_MODALITIES[node.id] || {};
      const { dV } = this.core.buildIncidenceAndLaplacian();
      const nodeIdx = this.core.nodeToIdx[node.id];
      const degree = dV[nodeIdx] !== undefined ? dV[nodeIdx].toFixed(2) : '1.00';
      const isActive = this.activeNodeSet.has(node.id);

      this.tooltip.innerHTML = `
        <div class="tooltip-header">
          <span class="tooltip-badge mod-${node.modality}">${node.modality.toUpperCase()}</span>
          <strong>${meta.name || node.id}</strong>
        </div>
        <div class="tooltip-desc">${meta.desc || ''}</div>
        <div class="tooltip-meta">
          <span>Degree <em>d(v)</em>: <strong>${degree}</strong></span>
          <span>Status: <strong style="color:${isActive ? '#10B981' : '#94A3B8'}">${isActive ? 'ACTIVE IN PROMPT' : 'INACTIVE'}</strong></span>
        </div>
      `;

      const rect = this.container.getBoundingClientRect();
      let left = clientX - rect.left + 16;
      let top = clientY - rect.top + 16;

      if (left + 260 > this.width) left -= 280;
      if (top + 120 > this.height) top -= 130;

      this.tooltip.style.left = `${left}px`;
      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.display = 'block';
    }

    highlightActiveInteraction(activeNodes = [], newlySpawned = null) {
      this.activeNodeSet = new Set(activeNodes);

      if (newlySpawned) {
        this.recentSpawns.add(newlySpawned.name);
        setTimeout(() => {
          this.recentSpawns.delete(newlySpawned.name);
        }, 3500);
      }

      // Generate animated particles for spectral message passing
      this.particles = [];
      const edgeNames = Object.keys(this.core.hyperedges);

      edgeNames.forEach(eName => {
        const eNodes = this.core.hyperedges[eName];
        const activeMatches = [...eNodes].filter(n => this.activeNodeSet.has(n));

        if (activeMatches.length >= 2) {
          // Centroid
          const c = this.getHyperedgeCentroid(eName);
          // Step 1: Active nodes -> Centroid
          activeMatches.forEach(nId => {
            const p = this.nodePositions[nId];
            if (p) {
              for (let i = 0; i < 3; i++) {
                this.particles.push({
                  x: p.x, y: p.y,
                  tx: c.x, ty: c.y,
                  progress: (i * 0.3) % 1,
                  speed: 0.015 + Math.random() * 0.01,
                  color: '#06B6D4',
                  radius: 3,
                  phase: 1
                });
              }
            }
          });

          // Step 2: Centroid -> Policy / Consequent nodes
          [...eNodes].filter(n => n.startsWith('pol:') || !this.activeNodeSet.has(n)).forEach(nId => {
            const p = this.nodePositions[nId];
            if (p) {
              for (let i = 0; i < 3; i++) {
                this.particles.push({
                  x: c.x, y: c.y,
                  tx: p.x, ty: p.y,
                  progress: (i * 0.35) % 1,
                  speed: 0.014 + Math.random() * 0.008,
                  color: '#EF4444',
                  radius: 3.5,
                  phase: 2
                });
              }
            }
          });
        }
      });
    }

    getHyperedgeCentroid(edgeName) {
      const nodeIds = this.core.hyperedges[edgeName];
      if (!nodeIds || nodeIds.size === 0) return { x: this.width / 2, y: this.height / 2 };
      let cx = 0, cy = 0, count = 0;
      nodeIds.forEach(id => {
        const p = this.nodePositions[id];
        if (p) { cx += p.x; cy += p.y; count++; }
      });
      return count > 0 ? { x: cx / count, y: cy / count } : { x: this.width / 2, y: this.height / 2 };
    }

    startRenderLoop() {
      const render = () => {
        this.renderFrame();
        this.animationFrameId = requestAnimationFrame(render);
      };
      this.animationFrameId = requestAnimationFrame(render);
    }

    destroy() {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }

    renderFrame() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#0B1120');
      bgGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Apply zoom & pan transform
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      // Subtle coordinate grid
      this.drawSubtleGrid(ctx);

      const edgeNames = Object.keys(this.core.hyperedges);

      // 1. Render Hyperedge Convex Hulls
      if (this.options.showConvexHulls) {
        edgeNames.forEach((eName, idx) => {
          const colorConfig = HYPEREDGE_PALETTE[idx % HYPEREDGE_PALETTE.length];
          const nodeIds = this.core.hyperedges[eName];
          const weight = this.core.hyperedgeWeights[eName] || 1.0;
          const points = [];
          nodeIds.forEach(id => {
            const p = this.nodePositions[id];
            if (p) points.push({ x: p.x, y: p.y });
          });

          const isSpawning = this.recentSpawns.has(eName);
          const hasActiveOverlap = [...nodeIds].some(n => this.activeNodeSet.has(n));

          ctx.save();
          ctx.fillStyle = isSpawning
            ? 'rgba(139, 92, 246, 0.28)'
            : (hasActiveOverlap ? colorConfig.fill.replace('0.12', '0.22') : colorConfig.fill);
          ctx.strokeStyle = isSpawning ? '#A78BFA' : colorConfig.stroke;
          ctx.lineWidth = Math.min(Math.max(weight * 2.2, 1.8), 5.5);
          ctx.shadowColor = isSpawning ? '#8B5CF6' : colorConfig.glow;
          ctx.shadowBlur = isSpawning ? 22 : (hasActiveOverlap ? 14 : 6);

          drawPaddedHull(ctx, points, 32);
          ctx.restore();
        });
      }

      // 2. Render Hyperedge Centroid Hubs & Badges
      if (this.options.showHubCentroids) {
        edgeNames.forEach((eName, idx) => {
          const colorConfig = HYPEREDGE_PALETTE[idx % HYPEREDGE_PALETTE.length];
          const centroid = this.getHyperedgeCentroid(eName);
          const weight = this.core.hyperedgeWeights[eName] || 1.0;
          const isSpawning = this.recentSpawns.has(eName);

          // Hub point
          ctx.save();
          ctx.beginPath();
          ctx.arc(centroid.x, centroid.y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = isSpawning ? '#C4B5FD' : colorConfig.stroke;
          ctx.shadowColor = colorConfig.glow;
          ctx.shadowBlur = 10;
          ctx.fill();

          // Hub Badge Pill
          const badgeText = `${eName} (w=${weight.toFixed(2)})`;
          ctx.font = '600 11px Inter, sans-serif';
          const textWidth = ctx.measureText(badgeText).width;
          const pillW = textWidth + 18;
          const pillH = 20;
          const pillX = centroid.x - pillW / 2;
          const pillY = centroid.y - 24;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = isSpawning ? '#A78BFA' : colorConfig.stroke;
          ctx.lineWidth = isSpawning ? 2 : 1;
          this.drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSpawning ? '#EDE9FE' : '#F8FAFC';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, centroid.x, pillY + pillH / 2);

          if (isSpawning) {
            ctx.fillStyle = '#C084FC';
            ctx.font = '700 9px Inter, sans-serif';
            ctx.fillText('⚡ NEW HYPEREDGE SPAWNED', centroid.x, pillY - 8);
          }
          ctx.restore();
        });
      }

      // 3. Render Spectral Propagation Particles
      this.particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) p.progress = 0;
        const curX = p.x + (p.tx - p.x) * p.progress;
        const curY = p.y + (p.ty - p.y) * p.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(curX, curY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // 4. Render Vertices
      for (const nodeId of this.core.nodes) {
        const node = this.nodePositions[nodeId];
        if (!node) continue;

        const modConfig = MODALITY_COLORS[node.modality] || MODALITY_COLORS.semantic;
        const isActive = this.activeNodeSet.has(nodeId);
        const isHovered = this.hoveredNode && this.hoveredNode.id === nodeId;

        ctx.save();
        ctx.beginPath();
        const r = node.radius + (isActive ? 3 : (isHovered ? 2 : 0));
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

        if (isActive) {
          ctx.fillStyle = modConfig.fill;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = modConfig.fill;
          ctx.shadowBlur = 18;
        } else {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
          ctx.strokeStyle = modConfig.stroke;
          ctx.lineWidth = isHovered ? 2 : 1.2;
          ctx.shadowColor = modConfig.glow;
          ctx.shadowBlur = isHovered ? 12 : 4;
        }

        ctx.fill();
        ctx.stroke();

        // Inner glowing dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#FFFFFF' : modConfig.fill;
        ctx.fill();

        // Node Label
        if (this.options.showLabels) {
          ctx.font = `${isActive ? '600' : '500'} 10px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = isActive ? '#F8FAFC' : '#94A3B8';
          ctx.fillText(node.label, node.x, node.y + r + 4);
        }
        ctx.restore();
      }

      ctx.restore(); // Restore zoom/pan

      // Static Overlay Controls & Legends
      this.renderCanvasHUD(ctx, w, h);

      ctx.restore(); // Restore dpr
    }

    drawSubtleGrid(ctx) {
      const step = 60;
      const x0 = -1000;
      const y0 = -1000;
      const x1 = 2000;
      const y1 = 2000;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = x0; x < x1; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y1);
        ctx.stroke();
      }
      for (let y = y0; y < y1; y += step) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    renderCanvasHUD(ctx, w, h) {
      // Modality legend top-left
      const modalities = [
        { label: 'Context (V_context)', color: MODALITY_COLORS.context.fill },
        { label: 'Semantic (V_semantic)', color: MODALITY_COLORS.semantic.fill },
        { label: 'Policy (V_policy)', color: MODALITY_COLORS.policy.fill },
        { label: 'Pattern (V_pattern)', color: MODALITY_COLORS.pattern.fill }
      ];

      ctx.save();
      let lx = 14, ly = 14;
      modalities.forEach(m => {
        ctx.beginPath();
        ctx.arc(lx + 5, ly + 6, 4, 0, Math.PI * 2);
        ctx.fillStyle = m.color;
        ctx.fill();

        ctx.font = '500 10.5px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText(m.label, lx + 14, ly + 9);

        lx += ctx.measureText(m.label).width + 26;
      });

      // Quick Help Bottom-Right
      ctx.font = '500 10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Drag nodes • Scroll to Zoom • Hover for Tensor d(v)', w - 16, h - 14);
      ctx.restore();
    }

    resetView() {
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this.initNodesLayout();
    }
  }

  return {
    Visualizer,
    MODALITY_COLORS,
    HYPEREDGE_PALETTE
  };
});
