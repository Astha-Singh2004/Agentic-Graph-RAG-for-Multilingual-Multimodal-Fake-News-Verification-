'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Network, ZoomIn, ZoomOut, RotateCcw, Compass, MousePointerClick } from 'lucide-react';
const VIEW_W = 960;
const ROW_GAP = 40;
const TOP_PAD = 76;
const BOTTOM_PAD = 56;
const MIN_H = 420;
const MAX_LABEL_CHARS = 24;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const COLUMNS = [
  { type: 'ORGANIZATION', title: 'Organizations', x: 180, labelSide: 'left' },
  { type: 'TOPIC', title: 'Topics and domains', x: 470, labelSide: 'right' },
  { type: 'LOCATION', title: 'Locations', x: 770, labelSide: 'right' },
];

const TYPE_STYLE = {
  ORGANIZATION: { focus: '#06b6d4', base: '#0891b2', dot: 'bg-cyan-400', name: 'Organization' },
  LOCATION: { focus: '#10b981', base: '#059669', dot: 'bg-emerald-400', name: 'Location' },
  TOPIC: { focus: '#a855f7', base: '#7c3aed', dot: 'bg-purple-400', name: 'Topic / Domain' },
};
const DEFAULT_NODES = [
  { id: 'Government / Institution', label: 'Government / Institution', type: 'ORGANIZATION', is_focus: true },
  { id: 'Madhya Pradesh', label: 'Madhya Pradesh', type: 'LOCATION', is_focus: true },
  { id: 'Public Health Advisory', label: 'Public Health Advisory', type: 'TOPIC', is_focus: true },
  { id: 'India-wide', label: 'India-wide', type: 'LOCATION', is_focus: false },
  { id: 'Public Safety Notice', label: 'Public Safety Notice', type: 'TOPIC', is_focus: false },
];

const DEFAULT_LINKS = [
  { source: 'Government / Institution', target: 'Public Health Advisory', relation: 'ADMINISTERS' },
  { source: 'Government / Institution', target: 'India-wide', relation: 'JURISDICTION' },
  { source: 'India-wide', target: 'Madhya Pradesh', relation: 'CONTAINS_STATE' },
  { source: 'Public Health Advisory', target: 'Madhya Pradesh', relation: 'IMPLEMENTED_IN' },
  { source: 'Public Health Advisory', target: 'Public Safety Notice', relation: 'SYNERGY' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const normalizeType = (t) => {
  const upper = String(t || '').toUpperCase();
  return upper === 'ORGANIZATION' || upper === 'LOCATION' ? upper : 'TOPIC';
};

// Links may reference nodes by id or by object (d3-style); support both.
const endId = (end) => (end !== null && typeof end === 'object' ? end.id : end);

const truncate = (text, max = MAX_LABEL_CHARS) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

// Builds an SVG path and its midpoint (for the relation label) between two nodes.
const buildEdgeGeometry = (u, v) => {
  if (u.x === v.x) {
    // Same lane: bulge outward so the curve does not run through other nodes.
    const direction = u.x === COLUMNS[2].x ? 1 : -1;
    const bulge = Math.min(110, 24 + Math.abs(v.y - u.y) * 0.3) * direction;
    const c1x = u.x + bulge;
    const c2x = v.x + bulge;
    return {
      d: `M ${u.x} ${u.y} C ${c1x} ${u.y}, ${c2x} ${v.y}, ${v.x} ${v.y}`,
      midX: (u.x + 3 * c1x + 3 * c2x + v.x) / 8,
      midY: (u.y + v.y) / 2,
    };
  }
  const mx = (u.x + v.x) / 2;
  return {
    d: `M ${u.x} ${u.y} C ${mx} ${u.y}, ${mx} ${v.y}, ${v.x} ${v.y}`,
    midX: mx,
    midY: (u.y + v.y) / 2,
  };
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function GraphViewer({ subgraph, graphInfo }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());

  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const rawNodes = subgraph?.nodes || DEFAULT_NODES;
  const rawLinks = subgraph?.links || DEFAULT_LINKS;
  const shortestPath = useMemo(
    () => (Array.isArray(graphInfo?.shortest_path) ? graphInfo.shortest_path : []),
    [graphInfo]
  );

  /* ---------------- Build layout, edges and adjacency ---------------- */
  const model = useMemo(() => {
    // 1. Normalise nodes and drop duplicates / invalid entries.
    const seen = new Set();
    const allNodes = [];
    rawNodes.forEach((n) => {
      if (!n || n.id === undefined || n.id === null || seen.has(n.id)) return;
      seen.add(n.id);
      allNodes.push({
        ...n,
        label: String(n.label ?? n.id),
        type: normalizeType(n.type),
        is_focus: Boolean(n.is_focus),
      });
    });

    const typeCounts = { ORGANIZATION: 0, TOPIC: 0, LOCATION: 0 };
    allNodes.forEach((n) => {
      typeCounts[n.type] += 1;
    });

    // 2. Path helpers (consecutive pairs only, in either direction).
    const pathNodeIds = new Set(shortestPath);
    const pathEdgeKeys = new Set();
    for (let i = 0; i < shortestPath.length - 1; i += 1) {
      pathEdgeKeys.add(`${shortestPath[i]}|${shortestPath[i + 1]}`);
      pathEdgeKeys.add(`${shortestPath[i + 1]}|${shortestPath[i]}`);
    }

    // 3. Group visible nodes by type; focus nodes first, then path nodes, then A-Z.
    const rank = (n) => (n.is_focus ? 0 : pathNodeIds.has(n.id) ? 1 : 2);
    const byType = { ORGANIZATION: [], TOPIC: [], LOCATION: [] };
    allNodes
      .filter((n) => !hiddenTypes.has(n.type))
      .forEach((n) => byType[n.type].push(n));
    Object.values(byType).forEach((list) =>
      list.sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label))
    );

    const rows = Math.max(1, ...Object.values(byType).map((l) => l.length));
    const height = Math.max(MIN_H, TOP_PAD + (rows - 1) * ROW_GAP + BOTTOM_PAD);
    const areaH = height - TOP_PAD - BOTTOM_PAD;

    // 4. Assign coordinates (each lane is vertically centred).
    const positions = {};
    COLUMNS.forEach((col) => {
      const list = byType[col.type];
      const span = (list.length - 1) * ROW_GAP;
      const startY = TOP_PAD + (areaH - span) / 2;
      list.forEach((n, i) => {
        positions[n.id] = { ...n, x: col.x, y: startY + i * ROW_GAP, side: col.labelSide };
      });
    });

    // 5. Edges between visible nodes only.
    const edges = [];
    rawLinks.forEach((link, idx) => {
      if (!link) return;
      const s = endId(link.source);
      const t = endId(link.target);
      const u = positions[s];
      const v = positions[t];
      if (!u || !v || s === t) return;
      edges.push({
        key: `${s}|${t}|${idx}`,
        source: s,
        target: t,
        relation: String(link.relation || ''),
        isPath: pathEdgeKeys.has(`${s}|${t}`),
        touchesFocus: u.is_focus || v.is_focus,
        ...buildEdgeGeometry(u, v),
      });
    });

    // 6. Adjacency for highlighting and the detail panel.
    const adjacency = {};
    edges.forEach((e) => {
      if (!adjacency[e.source]) adjacency[e.source] = [];
      if (!adjacency[e.target]) adjacency[e.target] = [];
      adjacency[e.source].push({ id: e.target, relation: e.relation, direction: 'out' });
      adjacency[e.target].push({ id: e.source, relation: e.relation, direction: 'in' });
    });

    return { positions, edges, adjacency, height, typeCounts, pathNodeIds, visibleCount: Object.keys(positions).length };
  }, [rawNodes, rawLinks, shortestPath, hiddenTypes]);

  const { positions, edges, adjacency, height, typeCounts, pathNodeIds, visibleCount } = model;

  /* ---------------- Highlight state ---------------- */
  const activeId = hoveredId && positions[hoveredId] ? hoveredId : selectedId && positions[selectedId] ? selectedId : null;
  const neighborIds = useMemo(
    () => (activeId ? new Set((adjacency[activeId] || []).map((a) => a.id)) : null),
    [activeId, adjacency]
  );

  const edgeVisual = (e) => {
    const isActive = activeId && (e.source === activeId || e.target === activeId);
    let opacity;
    if (activeId) opacity = isActive ? 1 : e.isPath ? 0.5 : 0.06;
    else opacity = e.isPath ? 1 : e.touchesFocus ? 0.4 : 0.16;
    return {
      isActive: Boolean(isActive),
      opacity,
      stroke: isActive ? '#a5b4fc' : e.isPath ? '#818cf8' : '#475569',
      width: isActive ? 2 : e.isPath ? 2.5 : 1,
      weight: isActive ? 2 : e.isPath ? 1 : 0,
    };
  };

  // Draw faint edges first, path edges next, highlighted edges on top.
  const orderedEdges = useMemo(
    () =>
      edges
        .map((e) => ({ e, v: edgeVisual(e) }))
        .sort((a, b) => a.v.weight - b.v.weight),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edges, activeId]
  );

  const selectedNode = selectedId ? positions[selectedId] : null;
  const selectedConnections = selectedNode ? adjacency[selectedNode.id] || [] : [];

  /* ---------------- Interaction handlers ---------------- */
  const toggleType = (type) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedId(null);
    setHoveredId(null);
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = VIEW_W / rect.width;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    setPan({ x: drag.panX + dx * scale, y: drag.panY + dy * scale });
  };

  const handlePointerUp = (e) => {
    const drag = dragRef.current;
    if (drag && !drag.moved) setSelectedId(null); // plain click on the background clears selection
    dragRef.current = null;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleNodeKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedId((prev) => (prev === id ? null : id));
    }
  };

  const centerX = VIEW_W / 2;
  const centerY = height / 2;
  const groupTransform = `translate(${pan.x} ${pan.y}) translate(${centerX} ${centerY}) scale(${zoom}) translate(${-centerX} ${-centerY})`;
  const hops = graphInfo?.hops ?? Math.max(shortestPath.length - 1, 0);

  /* ---------------- Render ---------------- */
  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">Interactive Neo4j Entity Knowledge Graph</h3>
        </div>

        {/* Legend (click to show / hide a node type) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {COLUMNS.map((col) => {
            const style = TYPE_STYLE[col.type];
            const hidden = hiddenTypes.has(col.type);
            return (
              <button
                key={col.type}
                type="button"
                aria-pressed={!hidden}
                onClick={() => toggleType(col.type)}
                title={hidden ? `Show ${style.name}` : `Hide ${style.name}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  hidden
                    ? 'border-slate-800 bg-slate-950 text-slate-600 line-through'
                    : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-indigo-500/40'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${style.dot} ${hidden ? 'opacity-30' : ''}`} />
                <span>{style.name}</span>
                <span className="text-slate-500">{typeCounts[col.type]}</span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(+(prev + 0.2).toFixed(2), MAX_ZOOM))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(+(prev - 0.2).toFixed(2), MIN_ZOOM))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            title="Reset view"
            aria-label="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dijkstra Shortest Path Banner */}
      {graphInfo && (
        <div className="px-6 py-2 bg-indigo-950/30 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-indigo-300">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              <strong>Dijkstra Shortest Path:</strong>{' '}
              {shortestPath.length ? shortestPath.join(' → ') : 'No path found'}
            </span>
          </div>
          <div>
            <span>Hops: {hops}</span> •{' '}
            <span>
              Structural Consistency: {Math.round((graphInfo.relational_consistency || 0.8) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative w-full bg-slate-950/70 overflow-x-auto">
        {visibleCount === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-500">
            All node types are hidden. Use the legend above to show them again.
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${height}`}
            className="block w-full h-auto min-w-[680px] select-none"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="group"
            aria-label="Entity knowledge graph"
          >
            <defs>
              <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={VIEW_W} height={height} fill="url(#graph-grid)" />

            <g transform={groupTransform} style={{ transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}>
              {/* Column headers */}
              {COLUMNS.map((col) => (
                <text
                  key={col.type}
                  x={col.x}
                  y={34}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="12"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {col.title} ({positions ? Object.values(positions).filter((n) => n.type === col.type).length : 0})
                </text>
              ))}

              {/* Edges */}
              {orderedEdges.map(({ e, v }) => (
                <path
                  key={e.key}
                  d={e.d}
                  fill="none"
                  stroke={v.stroke}
                  strokeWidth={v.width}
                  strokeDasharray={e.isPath ? '5 3' : undefined}
                  strokeLinecap="round"
                  opacity={v.opacity}
                  className="pointer-events-none"
                />
              ))}

              {/* Nodes */}
              {Object.values(positions).map((node) => {
                const style = TYPE_STYLE[node.type];
                const color = node.is_focus ? style.focus : style.base;
                const radius = node.is_focus ? 11 : 9;
                const isActive = node.id === activeId;
                const isSelected = node.id === selectedId;
                const isNeighbor = neighborIds ? neighborIds.has(node.id) : false;
                const isOnPath = pathNodeIds.has(node.id);
                const dimmed = activeId ? !(isActive || isNeighbor) : false;
                const labelX = node.side === 'left' ? -(radius + 9) : radius + 9;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    opacity={dimmed ? 0.25 : 1}
                    style={{ transition: 'opacity 0.15s' }}
                    className="cursor-pointer focus:outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label={`${node.label}, ${style.name}${node.is_focus ? ', claim focus entity' : ''}`}
                    aria-pressed={isSelected}
                    onPointerDown={(ev) => ev.stopPropagation()}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelectedId((prev) => (prev === node.id ? null : node.id));
                    }}
                    onKeyDown={(ev) => handleNodeKeyDown(ev, node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(node.id)}
                    onBlur={() => setHoveredId(null)}
                  >
                    <title>{node.label}</title>

                    {/* Focus halo */}
                    {node.is_focus && (
                      <circle
                        r={radius + 6}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeOpacity="0.5"
                        className="animate-pulse"
                      />
                    )}

                    {/* Shortest-path ring */}
                    {isOnPath && !node.is_focus && (
                      <circle r={radius + 4} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.9" />
                    )}

                    {/* Selection ring */}
                    {isSelected && <circle r={radius + 5} fill="none" stroke="#ffffff" strokeWidth="2" />}

                    {/* Node body */}
                    <circle r={isActive ? radius + 2 : radius} fill={color} stroke="#090d16" strokeWidth="3" />

                    {/* Label with a dark outline so it stays readable over edges */}
                    <text
                      x={labelX}
                      y={0}
                      dominantBaseline="central"
                      textAnchor={node.side === 'left' ? 'end' : 'start'}
                      fill={isActive || node.is_focus ? '#ffffff' : '#cbd5e1'}
                      fontSize="11.5"
                      fontWeight={node.is_focus || isActive ? '700' : '500'}
                      stroke="#020617"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      className="pointer-events-none"
                    >
                      {truncate(node.label)}
                    </text>
                  </g>
                );
              })}

              {/* Relation labels: only for the highlighted node and the shortest path */}
              {orderedEdges
                .filter(({ e, v }) => e.relation && (v.isActive || e.isPath))
                .map(({ e, v }) => {
                  const width = e.relation.length * 5.4 + 14;
                  return (
                    <g key={`label-${e.key}`} className="pointer-events-none" opacity={v.isActive || !activeId ? 1 : 0.5}>
                      <rect
                        x={e.midX - width / 2}
                        y={e.midY - 9}
                        width={width}
                        height="18"
                        rx="5"
                        fill="#090d16"
                        stroke={v.isActive ? '#818cf8' : '#1e293b'}
                        strokeWidth="1"
                      />
                      <text
                        x={e.midX}
                        y={e.midY}
                        dominantBaseline="central"
                        textAnchor="middle"
                        fill={v.isActive || e.isPath ? '#c7d2fe' : '#64748b'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {e.relation}
                      </text>
                    </g>
                  );
                })}
            </g>
          </svg>
        )}
      </div>

      {/* Detail panel */}
      <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
        {selectedNode ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${TYPE_STYLE[selectedNode.type].dot}`} />
                <span className="text-sm font-bold text-white">{selectedNode.label}</span>
                <span className="font-mono text-indigo-400">{TYPE_STYLE[selectedNode.type].name}</span>
                <span className="text-slate-400">
                  {selectedNode.is_focus ? 'Claim focus entity' : 'Neighbor context'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-slate-400 hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded px-1"
              >
                Clear selection
              </button>
            </div>

            <div>
              <span className="text-slate-400 font-mono">
                {selectedConnections.length} connection{selectedConnections.length === 1 ? '' : 's'}
              </span>
              {selectedConnections.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {selectedConnections.map((c, i) => (
                    <button
                      key={`${c.id}-${c.relation}-${i}`}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <span className="font-mono text-indigo-400 mr-1">
                        {c.direction === 'out' ? '→' : '←'} {c.relation}
                      </span>
                      {positions[c.id]?.label || c.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <MousePointerClick className="w-4 h-4" />
            <span>
              Click a node to highlight its connections. Drag the background to pan. Click a legend item to hide that
              node type.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}