import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import mermaid from 'mermaid';
import {
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code,
  Eye,
  Sparkles,
  Edit2,
  Plus,
  Play,
  Move,
  Maximize2,
  Minimize2,
  Maximize,
} from 'lucide-react';
import { toast } from 'sonner';

// Initialize Mermaid engine
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#0B0F19',
    primaryColor: '#6366F1',
    primaryTextColor: '#F8FAFC',
    primaryBorderColor: '#818CF8',
    lineColor: '#94A3B8',
    secondaryColor: '#3B82F6',
    tertiaryColor: '#1E293B',
    fontFamily: 'inherit',
    fontSize: '13px',
  },
  securityLevel: 'loose',
});

export interface FlowNode {
  id: string;
  label: string;
  type?: 'process' | 'decision' | 'start' | 'end' | 'actor' | 'database' | 'lane' | 'event' | 'document';
  x: number;
  y: number;
  color?: string;
  lane?: string;
  details?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartData {
  title?: string;
  type?: string;
  direction: 'TD' | 'LR';
  lanes?: string[];
  nodes: FlowNode[];
  edges: FlowEdge[];
}

function calculateContentBounds(nodes: FlowNode[]) {
  if (!nodes || nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 600, maxY: 400, width: 600, height: 400 };
  }
  const minX = Math.min(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxX = Math.max(...nodes.map((n) => n.x + 180));
  const maxY = Math.max(...nodes.map((n) => n.y + 75));
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(100, maxX - minX),
    height: Math.max(100, maxY - minY),
  };
}

/**
 * Parses Mermaid code into nodes, edges, lanes and layout orientation
 */
function parseMermaidCode(code: string): FlowchartData {
  const nodesMap = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const lines = code.split('\n');

  let detectedType = 'Flowchart';
  const lower = code.toLowerCase();
  if (lower.includes('subgraph') || lower.includes('swimlane')) detectedType = 'Swimlane / Workflow';
  else if (lower.includes('data flow') || lower.includes('dfd')) detectedType = 'Data Flow Diagram';
  else if (lower.includes('decision') || lower.includes('yes') || lower.includes('no')) detectedType = 'Decision Tree';
  else if (lower.includes('system') || lower.includes('architecture')) detectedType = 'System Flowchart';
  else if (lower.includes('use case') || lower.includes('actor')) detectedType = 'Use Case Flowchart';
  else if (lower.includes('pert') || lower.includes('milestone')) detectedType = 'PERT Chart';
  else if (lower.includes('customer') || lower.includes('journey')) detectedType = 'Customer Journey';
  else if (lower.includes('ecommerce') || lower.includes('e-commerce')) detectedType = 'E-Commerce Flowchart';
  else if (lower.includes('code') || lower.includes('algorithm')) detectedType = 'Code Flowchart';
  else if (lower.includes('document')) detectedType = 'Document Flowchart';

  let direction: 'TD' | 'LR' = 'TD';
  if (code.includes('graph LR') || code.includes('flowchart LR')) {
    direction = 'LR';
  }

  let currentLane = '';
  const lanes: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('graph ') || trimmed.startsWith('flowchart ')) {
      return;
    }

    if (trimmed.startsWith('subgraph ')) {
      const laneName = trimmed.replace(/^subgraph\s+/, '').replace(/\[.*\]/, '').replace(/"/g, '').trim();
      currentLane = laneName;
      if (!lanes.includes(laneName)) lanes.push(laneName);
      return;
    }

    if (trimmed === 'end') {
      currentLane = '';
      return;
    }

    // Edge with labels: A["Text"] -->|label| B["Text"] or A --> B
    const edgeRegex = /([a-zA-Z0-9_-]+)(?:\[(?:\[|\(|\{)?["']?([^\]\)\}"']*)["']?(?:\]|\)|\})?\])?\s*(-->|==>|-.->|--\s*.*?\s*-->)\s*(?:\|([^|]+)\|)?\s*([a-zA-Z0-9_-]+)(?:\[(?:\[|\(|\{)?["']?([^\]\)\}"']*)["']?(?:\]|\)|\})?\])?/;
    const edgeMatch = trimmed.match(edgeRegex);

    if (edgeMatch) {
      const fromId = edgeMatch[1].trim();
      const fromLabel = edgeMatch[2] ? edgeMatch[2].trim() : fromId;
      const edgeLabel = edgeMatch[4] ? edgeMatch[4].trim() : '';
      const toId = edgeMatch[5].trim();
      const toLabel = edgeMatch[6] ? edgeMatch[6].trim() : toId;

      if (!nodesMap.has(fromId)) {
        nodesMap.set(fromId, {
          id: fromId,
          label: fromLabel,
          x: 0,
          y: 0,
          lane: currentLane || undefined,
          type: detectNodeType(fromLabel),
        });
      }

      if (!nodesMap.has(toId)) {
        nodesMap.set(toId, {
          id: toId,
          label: toLabel,
          x: 0,
          y: 0,
          lane: currentLane || undefined,
          type: detectNodeType(toLabel),
        });
      }

      edges.push({ from: fromId, to: toId, label: edgeLabel });
      return;
    }

    // Single node definition: A["Label"] or A{"Decision"}
    const nodeRegex = /([a-zA-Z0-9_-]+)\s*(?:\[|\(|\{)\s*["']?([^\]\)\}"']+)["']?\s*(?:\]|\)|\})/;
    const nodeMatch = trimmed.match(nodeRegex);
    if (nodeMatch) {
      const id = nodeMatch[1].trim();
      const label = nodeMatch[2].trim();
      if (!nodesMap.has(id)) {
        nodesMap.set(id, {
          id,
          label,
          x: 0,
          y: 0,
          lane: currentLane || undefined,
          type: detectNodeType(label),
        });
      }
    }
  });

  const nodes = Array.from(nodesMap.values());

  // Automatic grid layout algorithm
  if (direction === 'LR') {
    const rows = Math.min(3, Math.max(1, Math.ceil(nodes.length / 4)));
    nodes.forEach((node, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      node.x = 60 + col * 220;
      node.y = 80 + row * 130;
    });
  } else {
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(nodes.length))));
    nodes.forEach((node, i) => {
      if (lanes.length > 0 && node.lane) {
        const laneIdx = lanes.indexOf(node.lane);
        const nodesInLane = nodes.filter((n) => n.lane === node.lane);
        const inLaneIdx = nodesInLane.indexOf(node);
        node.x = 60 + laneIdx * 250;
        node.y = 80 + inLaneIdx * 115;
      } else {
        const row = Math.floor(i / cols);
        const col = i % cols;
        node.x = 60 + col * 210;
        node.y = 70 + row * 130;
      }
    });
  }

  return {
    title: detectedType,
    type: detectedType,
    direction,
    lanes: lanes.length > 0 ? lanes : undefined,
    nodes: nodes.length > 0 ? nodes : generateFallbackNodes(),
    edges,
  };
}

function detectNodeType(label: string): FlowNode['type'] {
  const l = label.toLowerCase();
  if (l.includes('?') || l.includes('decision') || l.includes('check') || l.includes('if ') || l.includes('valid') || l.includes('branch')) return 'decision';
  if (l.includes('start') || l.includes('begin') || l.includes('entry') || l.includes('trigger') || l.includes('input')) return 'start';
  if (l.includes('end') || l.includes('finish') || l.includes('output') || l.includes('exit') || l.includes('success')) return 'end';
  if (l.includes('db') || l.includes('database') || l.includes('storage') || l.includes('cache') || l.includes('mongo')) return 'database';
  if (l.includes('user') || l.includes('actor') || l.includes('client') || l.includes('customer') || l.includes('admin') || l.includes('dev')) return 'actor';
  if (l.includes('doc') || l.includes('document') || l.includes('form') || l.includes('contract') || l.includes('pdf')) return 'document';
  if (l.includes('event') || l.includes('notification') || l.includes('alert') || l.includes('signal')) return 'event';
  return 'process';
}

function generateFallbackNodes(): FlowNode[] {
  return [
    { id: 'A', label: 'User Request', x: 60, y: 60, type: 'start' },
    { id: 'B', label: 'Processing & Validation', x: 280, y: 60, type: 'decision' },
    { id: 'C', label: 'Execute Action', x: 280, y: 190, type: 'process' },
    { id: 'D', label: 'Completed Result', x: 500, y: 190, type: 'end' },
  ];
}

/**
 * Re-serializes FlowData back to clean Mermaid diagram code
 */
function serializeFlowchartToMermaid(flow: FlowchartData): string {
  const lines: string[] = [`graph ${flow.direction || 'TD'}`];

  if (flow.lanes && flow.lanes.length > 0) {
    flow.lanes.forEach((lane) => {
      lines.push(`  subgraph ${lane}`);
      flow.nodes
        .filter((n) => n.lane === lane)
        .forEach((n) => {
          lines.push(`    ${n.id}["${n.label}"]`);
        });
      lines.push('  end');
    });
  }

  // Add remaining nodes
  flow.nodes
    .filter((n) => !n.lane)
    .forEach((n) => {
      if (n.type === 'decision') {
        lines.push(`  ${n.id}{"${n.label}"}`);
      } else {
        lines.push(`  ${n.id}["${n.label}"]`);
      }
    });

  // Add edges
  flow.edges.forEach((e) => {
    if (e.label) {
      lines.push(`  ${e.from} -->|${e.label}| ${e.to}`);
    } else {
      lines.push(`  ${e.from} --> ${e.to}`);
    }
  });

  return lines.join('\n');
}

export function InteractiveFlowchart({ chart }: { chart: string }) {
  const rawId = useId();
  const instanceId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Live editable code state
  const [liveCode, setLiveCode] = useState<string>(chart.trim());
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.85);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Canvas Pan (Drag background to navigate infinite canvas)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isPanningCanvas, setIsPanningCanvas] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selected & Hovered nodes
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<FlowNode | null>(null);
  const [isEditingSelectedNode, setIsEditingSelectedNode] = useState<boolean>(false);
  const [editingNodeText, setEditingNodeText] = useState<string>('');

  // Flowchart parsed data state
  const [flowData, setFlowData] = useState<FlowchartData>(() => parseMermaidCode(chart));

  // Node Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-fit function to center and frame diagram comfortably
  const fitView = useCallback((nodes: FlowNode[]) => {
    if (!containerRef.current || !nodes.length) return;
    const container = containerRef.current.getBoundingClientRect();
    if (container.width === 0 || container.height === 0) return;

    const bounds = calculateContentBounds(nodes);
    const padding = 50;
    const availWidth = Math.max(100, container.width - padding * 2);
    const availHeight = Math.max(100, container.height - padding * 2);

    const scaleX = availWidth / bounds.width;
    const scaleY = availHeight / bounds.height;
    const calculatedZoom = Math.min(1.1, Math.max(0.45, Math.min(scaleX, scaleY)));

    const centerX = (container.width - bounds.width * calculatedZoom) / 2 - bounds.minX * calculatedZoom;
    const centerY = (container.height - bounds.height * calculatedZoom) / 2 - bounds.minY * calculatedZoom;

    setZoom(Number(calculatedZoom.toFixed(2)));
    setPan({ x: Math.round(centerX), y: Math.round(centerY) });
  }, []);

  // Update whenever chart prop changes
  useEffect(() => {
    setLiveCode(chart.trim());
    const parsed = parseMermaidCode(chart);
    setFlowData(parsed);
    // Fit view after small timeout to allow container rendering
    setTimeout(() => {
      fitView(parsed.nodes);
    }, 50);
  }, [chart, fitView]);

  // Smooth Wheel Zoom & Two-Finger Pan on Canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Pinch / Ctrl + Wheel Zoom
        const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
        setZoom((prev) => Math.min(3.0, Math.max(0.2, Number((prev * zoomDelta).toFixed(2)))));
      } else {
        // Trackpad 2-finger pan or regular mouse wheel scroll
        setPan((prev) => ({
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  const handleCodeChange = (newCode: string) => {
    setLiveCode(newCode);
    try {
      const parsed = parseMermaidCode(newCode);
      if (parsed.nodes.length > 0) {
        setFlowData(parsed);
      }
    } catch {}
  };

  const handleToggleView = () => {
    if (isEditingCode) {
      const parsed = parseMermaidCode(liveCode);
      setFlowData(parsed);
      setIsEditingCode(false);
      setTimeout(() => fitView(parsed.nodes), 50);
      toast.success('Diagram updated from edited code!');
    } else {
      setIsEditingCode(true);
    }
  };

  // Canvas Background Pointer Down (Canvas Panning)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    setIsPanningCanvas(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  // Node Pointer Down (Dragging Node)
  const handleNodePointerDown = (node: FlowNode, e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    setDraggingNodeId(node.id);
    setSelectedNode(node);
    setEditingNodeText(node.label);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const mouseX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseY = (e.clientY - containerRect.top - pan.y) / zoom;
      setDragOffset({
        x: mouseX - node.x,
        y: mouseY - node.y,
      });
    }
  };

  // Unified Pointer Move (handles Node drag & Canvas pan)
  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. If dragging a node
    if (draggingNodeId && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseY = (e.clientY - containerRect.top - pan.y) / zoom;

      const newX = Math.round(mouseX - dragOffset.x);
      const newY = Math.round(mouseY - dragOffset.y);

      setFlowData((prev) => {
        const updatedNodes = prev.nodes.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
        return { ...prev, nodes: updatedNodes };
      });
      return;
    }

    // 2. If panning the canvas background
    if (isPanningCanvas) {
      setPan({
        x: Math.round(e.clientX - panStart.x),
        y: Math.round(e.clientY - panStart.y),
      });
    }
  };

  // Unified Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
      setDraggingNodeId(null);
    }
    if (isPanningCanvas) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
      setIsPanningCanvas(false);
    }
  };

  // Save node edit directly
  const handleSaveNodeLabel = (nodeId: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    const updatedNodes = flowData.nodes.map((n) => (n.id === nodeId ? { ...n, label: newLabel.trim() } : n));
    const updatedFlow: FlowchartData = {
      ...flowData,
      nodes: updatedNodes,
    };
    setFlowData(updatedFlow);
    const newMermaid = serializeFlowchartToMermaid(updatedFlow);
    setLiveCode(newMermaid);
    setIsEditingSelectedNode(false);
    toast.success('Node label updated and synced to code!');
  };

  // Add Node dynamically
  const handleAddNode = () => {
    const nextId = String.fromCharCode(65 + (flowData.nodes.length % 26)) + (flowData.nodes.length >= 26 ? flowData.nodes.length : '');
    const newNode: FlowNode = {
      id: nextId,
      label: `New Step ${flowData.nodes.length + 1}`,
      x: 100 + (flowData.nodes.length % 4) * 60,
      y: 100 + Math.floor(flowData.nodes.length / 4) * 80,
      type: 'process',
    };
    const lastNode = flowData.nodes[flowData.nodes.length - 1];
    const newEdges = [...flowData.edges];
    if (lastNode) {
      newEdges.push({ from: lastNode.id, to: newNode.id });
    }

    const updatedFlow: FlowchartData = {
      ...flowData,
      nodes: [...flowData.nodes, newNode],
      edges: newEdges,
    };
    setFlowData(updatedFlow);
    setLiveCode(serializeFlowchartToMermaid(updatedFlow));
    setSelectedNode(newNode);
    toast.success(`Node "${newNode.label}" added to diagram!`);
  };

  // Reset Pan and Zoom & Fit View
  const handleReset = () => {
    const parsed = parseMermaidCode(chart);
    setLiveCode(chart.trim());
    setFlowData(parsed);
    fitView(parsed.nodes);
    toast.success('Diagram view & layout reset');
  };

  // Export SVG
  const handleDownloadSVG = () => {
    if (canvasRef.current) {
      const bounds = calculateContentBounds(flowData.nodes);
      const padding = 60;
      const exportWidth = bounds.width + padding * 2;
      const exportHeight = bounds.height + padding * 2;

      const serializer = new XMLSerializer();
      const clonedSvg = canvasRef.current.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', String(exportWidth));
      clonedSvg.setAttribute('height', String(exportHeight));
      clonedSvg.setAttribute('viewBox', `${bounds.minX - padding} ${bounds.minY - padding} ${exportWidth} ${exportHeight}`);
      
      const contentGroup = clonedSvg.querySelector('[data-diagram-content]');
      if (contentGroup) {
        contentGroup.removeAttribute('transform');
      }

      const svgStr = serializer.serializeToString(clonedSvg);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flowchart-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Diagram exported as SVG vector!');
    }
  };

  // Export PNG
  const handleDownloadPNG = () => {
    const targetElement = canvasRef.current;
    if (!targetElement || !flowData.nodes.length) {
      toast.error('Flowchart canvas not ready');
      return;
    }

    try {
      const bounds = calculateContentBounds(flowData.nodes);
      const padding = 60;
      const exportWidth = Math.max(800, bounds.width + padding * 2);
      const exportHeight = Math.max(500, bounds.height + padding * 2);

      const serializer = new XMLSerializer();
      const clonedSvg = targetElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', String(exportWidth));
      clonedSvg.setAttribute('height', String(exportHeight));
      clonedSvg.setAttribute('viewBox', `${bounds.minX - padding} ${bounds.minY - padding} ${exportWidth} ${exportHeight}`);

      const contentGroup = clonedSvg.querySelector('[data-diagram-content]');
      if (contentGroup) {
        contentGroup.removeAttribute('transform');
      }

      const svgStr = serializer.serializeToString(clonedSvg);
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = exportWidth * 2;
        canvas.height = exportHeight * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `flowchart-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Flowchart exported as high-res PNG image!');
      };

      image.onerror = () => handleDownloadSVG();
      image.src = svgDataUrl;
    } catch (e) {
      handleDownloadSVG();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(liveCode.trim());
    setCopied(true);
    toast.success('Mermaid code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Node Color styling
  const getNodeStyles = (type?: FlowNode['type']) => {
    switch (type) {
      case 'decision':
        return { bg: '#7C3AED', border: '#A78BFA', text: '#EDE9FE', badge: 'DECISION', glow: 'rgba(124, 58, 237, 0.4)' };
      case 'start':
        return { bg: '#059669', border: '#34D399', text: '#ECFDF5', badge: 'START / INPUT', glow: 'rgba(5, 150, 105, 0.4)' };
      case 'end':
        return { bg: '#E11D48', border: '#FB7185', text: '#FFF1F2', badge: 'OUTCOME', glow: 'rgba(225, 29, 72, 0.4)' };
      case 'database':
        return { bg: '#0891B2', border: '#22D3EE', text: '#ECFEFF', badge: 'DATABASE', glow: 'rgba(8, 145, 178, 0.4)' };
      case 'actor':
        return { bg: '#2563EB', border: '#60A5FA', text: '#EFF6FF', badge: 'ACTOR / ROLE', glow: 'rgba(37, 99, 235, 0.4)' };
      case 'document':
        return { bg: '#D97706', border: '#FBBF24', text: '#FFFBEB', badge: 'DOCUMENT', glow: 'rgba(217, 119, 6, 0.4)' };
      case 'event':
        return { bg: '#DB2777', border: '#F472B6', text: '#FDF2F8', badge: 'EVENT TRIGGER', glow: 'rgba(219, 39, 119, 0.4)' };
      default:
        return { bg: '#4F46E5', border: '#818CF8', text: '#EEF2FF', badge: 'PROCESS', glow: 'rgba(79, 70, 229, 0.4)' };
    }
  };

  const gridPatternId = `canvas-grid-${instanceId}`;
  const arrowMarkerId = `flow-arrow-${instanceId}`;

  return (
    <div
      className={`my-3.5 rounded-2xl border border-border/80 bg-card dark:bg-black/80 backdrop-blur-md overflow-hidden shadow-card transition-all ${
        isFullscreen ? 'fixed inset-3 sm:inset-6 z-50 flex flex-col' : 'w-full max-w-full'
      }`}
    >
      {/* Interactive Toolbar */}
      <div className="p-2.5 sm:p-3.5 border-b border-border/60 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h3 className="font-bold text-xs sm:text-sm text-foreground tracking-tight truncate">
            {flowData.title || 'Interactive Flowchart'}
          </h3>
         
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 shrink-0">
          {/* Zoom controls & Pan reset */}
          {!isEditingCode && (
            <div className="flex items-center bg-background/60 rounded-lg border border-border/60 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.15).toFixed(2))))}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                title="Zoom Out (or Ctrl + Scroll)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => fitView(flowData.nodes)}
                className="text-[10px] px-1 font-mono text-muted-foreground hover:text-primary transition"
                title="Click to Fit Diagram to Screen"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.15).toFixed(2))))}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                title="Zoom In (or Ctrl + Scroll)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition ml-0.5"
                title="Reset View & Recenter"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Fit View Button */}
          {!isEditingCode && (
            <button
              type="button"
              onClick={() => fitView(flowData.nodes)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground text-xs font-semibold transition shrink-0"
              title="Fit entire flowchart into screen"
            >
              <Maximize className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Fit</span>
            </button>
          )}

          {/* Add Step Button */}
          {!isEditingCode && (
            <button
              type="button"
              onClick={handleAddNode}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold transition shrink-0"
              title="Add a new node to diagram"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Step</span>
            </button>
          )}

          {/* Toggle View: Diagram vs Code */}
          <button
            type="button"
            onClick={handleToggleView}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition shrink-0 ${
              isEditingCode
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-background/60 border-border/60 hover:bg-background text-muted-foreground hover:text-foreground'
            }`}
            title={isEditingCode ? 'Switch to Diagram View & Auto-Save' : 'Edit Mermaid Code'}
          >
            {isEditingCode ? <Eye className="h-3.5 w-3.5" /> : <Code className="h-3.5 w-3.5" />}
            <span>{isEditingCode ? 'Diagram' : 'Code'}</span>
          </button>

          {/* Download PNG */}
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground text-xs font-semibold transition shrink-0"
            title="Export as High-Res PNG Image"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          {/* Copy Mermaid Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition shrink-0"
            title="Copy Mermaid Code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          {/* <button
            type="button"
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => fitView(flowData.nodes), 100);
            }}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button> */}
        </div>
      </div>

      {/* Main Flowchart Canvas or Live Editable Code View */}
      {isEditingCode ? (
        <div className="p-4 bg-slate-950/90 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-[10px] text-primary">{liveCode.split('\n').length} lines</span>
          </div>

          <div className="relative rounded-xl border border-border/80 bg-black/80 overflow-hidden shadow-inner">
            <textarea
              value={liveCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              rows={12}
              className="w-full p-4 text-xs font-mono text-cyan-300 bg-transparent resize-y focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed custom-scrollbar"
              placeholder="graph TD&#10;  A[Input] --> B[Process]&#10;  B --> C{Decision?}"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => handleCodeChange(chart.trim())}
              className="text-[11px] text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset to original
            </button>
            <button
              type="button"
              onClick={handleToggleView}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-brand text-white font-semibold text-xs shadow-glow hover:opacity-90 transition"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Apply & View Diagram
            </button>
          </div>
        </div>
      ) : (
        /* Live Infinite Interactive Draggable Canvas */
        <div
          ref={containerRef}
          className={`relative w-full h-[400px] sm:h-[480px] overflow-hidden bg-[#070a13] select-none cursor-grab active:cursor-grabbing ${
            isFullscreen ? 'flex-1 h-full min-h-[500px]' : ''
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <svg
            ref={canvasRef}
            className="w-full h-full block overflow-visible select-none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <marker
                id={arrowMarkerId}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#818CF8" />
              </marker>

              {/* Infinite Grid Dots synced to pan & zoom */}
              <pattern
                id={gridPatternId}
                width={28 * zoom}
                height={28 * zoom}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${pan.x}, ${pan.y})`}
              >
                <circle
                  cx={2 * zoom}
                  cy={2 * zoom}
                  r={Math.max(0.8, 1.2 * Math.min(zoom, 1.2))}
                  fill="#475569"
                  fillOpacity="0.45"
                />
              </pattern>
            </defs>

            {/* Full Viewport Infinite Grid Background */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={`url(#${gridPatternId})`}
              className="pointer-events-auto"
            />

            {/* Scaled & Translated Diagram Content Group (Never Clipped) */}
            <g
              data-diagram-content="true"
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
              style={{
                transformOrigin: '0 0',
                transition: isPanningCanvas || draggingNodeId ? 'none' : 'transform 0.08s ease-out',
              }}
            >
              {/* Swimlane Column Containers if detected */}
              {flowData.lanes &&
                flowData.lanes.map((lane, laneIdx) => (
                  <g key={`lane-${laneIdx}`}>
                    <rect
                      x={40 + laneIdx * 250}
                      y={20}
                      width={230}
                      height={460}
                      rx={14}
                      fill="#1E293B"
                      fillOpacity={0.25}
                      stroke="#334155"
                      strokeDasharray="4 4"
                    />
                    <rect
                      x={40 + laneIdx * 250}
                      y={20}
                      width={230}
                      height={32}
                      rx={14}
                      fill="#0F172A"
                      fillOpacity={0.6}
                    />
                    <text
                      x={55 + laneIdx * 250}
                      y={41}
                      fill="#94A3B8"
                      fontSize={10}
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      letterSpacing="1px"
                    >
                      {lane.toUpperCase()}
                    </text>
                  </g>
                ))}

              {/* Dynamic Connection Lines between movable nodes */}
              {flowData.edges.map((edge, eIdx) => {
                const sourceNode = flowData.nodes.find((n) => n.id === edge.from);
                const targetNode = flowData.nodes.find((n) => n.id === edge.to);
                if (!sourceNode || !targetNode) return null;

                const nodeWidth = 160;
                const nodeHeight = 56;

                const startX = sourceNode.x + nodeWidth / 2;
                const startY = sourceNode.y + nodeHeight / 2;
                const endX = targetNode.x + nodeWidth / 2;
                const endY = targetNode.y + nodeHeight / 2;

                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                const pathD = `M ${startX} ${startY} Q ${midX} ${startY} ${endX} ${endY}`;

                return (
                  <g key={`edge-${eIdx}`} className="pointer-events-none">
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="2.5"
                      strokeOpacity="0.8"
                      markerEnd={`url(#${arrowMarkerId})`}
                    />
                    {edge.label && (
                      <g transform={`translate(${midX}, ${midY - 8})`}>
                        <rect
                          x="-35"
                          y="-10"
                          width="70"
                          height="18"
                          rx="4"
                          fill="#0B0F19"
                          stroke="#818CF8"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dy="3"
                          fill="#E0E7FF"
                          fontSize="9"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Direct Movable / Draggable Node Elements */}
              {flowData.nodes.map((node) => {
                const styles = getNodeStyles(node.type);
                const isDragging = draggingNodeId === node.id;
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onPointerDown={(e) => handleNodePointerDown(node, e)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onDoubleClick={() => {
                      setSelectedNode(node);
                      setEditingNodeText(node.label);
                      setIsEditingSelectedNode(true);
                    }}
                    className="cursor-grab active:cursor-grabbing transition-transform duration-75"
                  >
                    {/* Element Outer Glow & Box Container */}
                    <rect
                      width={160}
                      height={56}
                      rx={node.type === 'decision' ? 4 : 12}
                      fill={styles.bg}
                      fillOpacity={isDragging || isSelected ? 0.95 : 0.8}
                      stroke={isSelected || isDragging ? '#38BDF8' : styles.border}
                      strokeWidth={isSelected || isDragging ? 2.5 : 1.5}
                      style={{
                        filter: isDragging
                          ? `drop-shadow(0 10px 20px ${styles.glow})`
                          : isHovered
                          ? `drop-shadow(0 4px 12px ${styles.glow})`
                          : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
                      }}
                    />

                    {/* Node Badge Tag */}
                    <rect x={10} y={7} width={64} height={13} rx={3.5} fill="#000000" fillOpacity={0.4} />
                    <text x={14} y={16.5} fill={styles.text} fontSize={7.5} fontWeight="bold" fontFamily="monospace">
                      {styles.badge}
                    </text>

                    {/* Element Label */}
                    <text
                      x={80}
                      y={36}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={11.5}
                      fontWeight="600"
                      fontFamily="sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Canvas Navigation Hint Pill */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 border border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 pointer-events-none backdrop-blur-sm shadow-md">
            <Move className="h-3 w-3 text-primary shrink-0" />
            <span className="hidden sm:inline">Drag or scroll to pan canvas</span>
            <span className="sm:hidden">Drag to pan</span>
          </div>

          {/* Node Tooltip & Inline Editor */}
          {(hoveredNode || selectedNode) && (
            <div className="absolute bottom-3 left-3 bg-popover dark:bg-slate-950/95 text-popover-foreground border border-border/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl max-w-sm z-30 pointer-events-auto text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{(hoveredNode || selectedNode)?.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = hoveredNode || selectedNode;
                    if (target) {
                      setSelectedNode(target);
                      setEditingNodeText(target.label);
                      setIsEditingSelectedNode(true);
                    }
                  }}
                  className="p-1 rounded hover:bg-muted/30 text-primary text-[10px] flex items-center gap-1 transition"
                  title="Edit element text"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              </div>

              {isEditingSelectedNode && selectedNode ? (
                <div className="pt-1 space-y-2">
                  <input
                    type="text"
                    value={editingNodeText}
                    onChange={(e) => setEditingNodeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNodeLabel(selectedNode.id, editingNodeText);
                    }}
                    className="w-full px-2.5 py-1 rounded-lg bg-background border border-primary text-xs text-foreground focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingSelectedNode(false)}
                      className="px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNodeLabel(selectedNode.id, editingNodeText)}
                      className="px-2.5 py-0.5 rounded bg-primary text-white text-[10px] font-semibold"
                    >
                      Save & Sync
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-0.5">
                  <div>
                    Type: <strong className="text-primary uppercase font-mono">{(hoveredNode || selectedNode)?.type}</strong>
                  </div>
                  <div>
                    Connections: <strong className="text-foreground">{flowData.edges.filter((e) => e.from === (hoveredNode || selectedNode)?.id || e.to === (hoveredNode || selectedNode)?.id).length} links</strong>
                  </div>
                  <div className="col-span-2 text-[9px] opacity-75">
                    Drag elements freely or pan/zoom background canvas to explore
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="px-3 sm:px-4 py-2 border-t border-border/40 bg-muted/10 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span>{flowData.nodes.length} Elements</span>
          <span>•</span>
          <span>{flowData.edges.length} Connections</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={handleDownloadSVG} className="hover:text-primary transition">
            SVG
          </button>
          <span>•</span>
          <button type="button" onClick={handleCopyCode} className="hover:text-primary transition">
            Copy Code
          </button>
        </div>
      </div>
    </div>
  );
}

