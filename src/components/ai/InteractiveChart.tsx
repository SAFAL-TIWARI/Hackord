import React, { useState, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from 'recharts';
import {
  Download,
  Copy,
  Check,
  Edit3,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Table as TableIcon,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export type ChartType =
  | 'area'
  | 'line'
  | 'bar'
  | 'column'
  | 'stacked-bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'pareto'
  | 'kpi'
  | 'sparkline'
  | 'geo-bubble'
  | 'histogram';

export interface ChartDataPoint {
  [key: string]: any;
}

export interface ChartSpecification {
  type: ChartType;
  title: string;
  subtitle?: string;
  xAxisKey?: string;
  dataKeys?: {
    key: string;
    label?: string;
    color?: string;
    fill?: string;
    unit?: string;
    stackId?: string;
  }[];
  data: ChartDataPoint[];
  kpi?: {
    value: string | number;
    target?: string | number;
    change?: string | number;
    changeType?: 'positive' | 'negative' | 'neutral';
    unit?: string;
    description?: string;
  };
}

const MODERN_PALETTE = [
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#F43F5E', // Rose
];

export function InteractiveChart({
  rawSpec,
  initialSpec,
}: {
  rawSpec?: string;
  initialSpec?: ChartSpecification;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial specification safely
  const parsedInitial = useMemo<ChartSpecification>(() => {
    if (initialSpec) return initialSpec;
    if (rawSpec) {
      try {
        const clean = rawSpec.trim().replace(/^```(json-chart|chart|json)?\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(clean);
      } catch (e) {
        console.warn('[InteractiveChart] Error parsing rawSpec JSON:', e);
      }
    }
    return {
      type: 'area',
      title: 'Metrics Overview',
      xAxisKey: 'name',
      dataKeys: [{ key: 'value', label: 'Metric', color: '#6366F1' }],
      data: [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 650 },
        { name: 'Mar', value: 900 },
        { name: 'Apr', value: 1200 },
      ],
    };
  }, [rawSpec, initialSpec]);

  const [spec, setSpec] = useState<ChartSpecification>(parsedInitial);
  const [activeType, setActiveType] = useState<ChartType>(parsedInitial.type || 'area');
  const [isEditingData, setIsEditingData] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Derive keys if not explicitly defined
  const xAxisKey = useMemo(() => {
    if (spec.xAxisKey) return spec.xAxisKey;
    if (spec.data && spec.data.length > 0) {
      const firstRow = spec.data[0];
      const keys = Object.keys(firstRow);
      return keys.find((k) => typeof firstRow[k] === 'string') || keys[0] || 'name';
    }
    return 'name';
  }, [spec.xAxisKey, spec.data]);

  const dataKeys = useMemo(() => {
    if (spec.dataKeys && spec.dataKeys.length > 0) {
      return spec.dataKeys;
    }
    if (spec.data && spec.data.length > 0) {
      const firstRow = spec.data[0];
      const numericKeys = Object.keys(firstRow).filter(
        (k) => k !== xAxisKey && typeof firstRow[k] === 'number'
      );
      if (numericKeys.length > 0) {
        return numericKeys.map((key, idx) => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          color: MODERN_PALETTE[idx % MODERN_PALETTE.length],
        }));
      }
    }
    return [{ key: 'value', label: 'Value', color: MODERN_PALETTE[0] }];
  }, [spec.dataKeys, spec.data, xAxisKey]);

  // Pareto calculated dataset
  const paretoData = useMemo(() => {
    if (activeType !== 'pareto' || !spec.data) return spec.data;
    const primaryKey = dataKeys[0]?.key || 'value';
    const sorted = [...spec.data].sort((a, b) => (Number(b[primaryKey]) || 0) - (Number(a[primaryKey]) || 0));
    const total = sorted.reduce((sum, item) => sum + (Number(item[primaryKey]) || 0), 0);
    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += Number(item[primaryKey]) || 0;
      const percentage = total > 0 ? Math.round((cumulative / total) * 100) : 0;
      return {
        ...item,
        paretoCumulative: percentage,
      };
    });
  }, [spec.data, activeType, dataKeys]);

  // Handle Real-time data editing
  const handleDataChange = (rowIndex: number, columnKey: string, newValue: string) => {
    const updated = [...spec.data];
    const isNum = !isNaN(Number(newValue)) && newValue.trim() !== '';
    updated[rowIndex] = {
      ...updated[rowIndex],
      [columnKey]: isNum ? Number(newValue) : newValue,
    };
    setSpec({ ...spec, data: updated });
  };

  const handleAddRow = () => {
    const newRow: ChartDataPoint = { [xAxisKey]: `Item ${spec.data.length + 1}` };
    dataKeys.forEach((dk) => {
      newRow[dk.key] = 100;
    });
    setSpec({ ...spec, data: [...spec.data, newRow] });
    toast.success('New data row added');
  };

  const handleDeleteRow = (index: number) => {
    if (spec.data.length <= 1) {
      toast.error('Must have at least one data row');
      return;
    }
    const updated = spec.data.filter((_, i) => i !== index);
    setSpec({ ...spec, data: updated });
  };

  // Export functions
  const handleDownloadPNG = () => {
    if (!containerRef.current) return;
    try {
      const svgEl = containerRef.current.querySelector('svg');
      if (!svgEl) {
        toast.error('Chart SVG not found for export');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const rect = svgEl.getBoundingClientRect();
      const width = Math.max(800, rect.width * 2);
      const height = Math.max(500, rect.height * 2);

      canvas.width = width;
      canvas.height = height;

      img.onload = () => {
        if (!ctx) return;
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 20, 20, width - 40, height - 40);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-') || 'chart'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Chart exported as PNG image!');
      };

      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    } catch (err) {
      console.error('PNG export failed:', err);
      toast.error('PNG export failed. You can export as CSV or JSON.');
    }
  };

  const handleDownloadSVG = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-') || 'chart'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Chart exported as SVG vector!');
  };

  const handleDownloadCSV = () => {
    if (!spec.data || spec.data.length === 0) return;
    const headers = [xAxisKey, ...dataKeys.map((dk) => dk.key)];
    const csvRows = [
      headers.join(','),
      ...spec.data.map((row) =>
        headers.map((h) => `"${row[h] !== undefined ? row[h] : ''}"`).join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-') || 'chart-data'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Data exported as CSV spreadsheet!');
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(spec, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.title.toLowerCase().replace(/\s+/g, '-') || 'chart-spec'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Chart specification exported as JSON!');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    setCopied(true);
    toast.success('Chart JSON copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom rich dark tooltip with glass styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="rounded-2xl border border-border/80 bg-popover dark:bg-slate-950/95 text-popover-foreground p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[160px]">
          <div className="font-bold border-b border-border/40 pb-1 text-foreground">{label}</div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                {entry.unit ? ` ${entry.unit}` : ''}
              </span>
            </div>
          ))}
        </div>
    );
  };

  return (
    <div className="my-3.5 rounded-2xl border border-border/80 bg-card dark:bg-black/80 backdrop-blur-md overflow-hidden shadow-card">
      {/* Header & Controls Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-border/60 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-bold text-sm text-foreground tracking-tight">{spec.title}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20 uppercase tracking-wider">
              {activeType}
            </span>
          </div>
          {spec.subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{spec.subtitle}</p>
          )}
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Chart Type Switcher */}
          <div className="flex items-center bg-background/60 rounded-lg border border-border/60 p-0.5">
            <button
              type="button"
              onClick={() => setActiveType('area')}
              className={`p-1.5 rounded-md transition ${activeType === 'area' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Area Chart"
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveType('bar')}
              className={`p-1.5 rounded-md transition ${activeType === 'bar' || activeType === 'column' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Bar / Column Chart"
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveType('pie')}
              className={`p-1.5 rounded-md transition ${activeType === 'pie' || activeType === 'donut' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Pie / Donut Chart"
            >
              <PieIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveType('radar')}
              className={`p-1.5 rounded-md transition ${activeType === 'radar' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Radar Chart"
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Edit Data Toggle */}
          <button
            type="button"
            onClick={() => setIsEditingData(!isEditingData)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              isEditingData
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-background/50 border-border/60 hover:bg-background text-muted-foreground hover:text-foreground'
            }`}
            title="Edit Data in Real Time"
          >
            {isEditingData ? <TableIcon className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            <span>{isEditingData ? 'View Chart' : 'Edit Data'}</span>
          </button>

          {/* Download PNG */}
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold transition"
            title="Export as PNG Image"
          >
            <ImageIcon className="h-3 w-3" />
            <span>PNG</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground text-xs transition"
            title="Export as CSV Spreadsheet"
          >
            <FileSpreadsheet className="h-3 w-3" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJSON}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition"
            title="Copy Chart JSON"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Visual Canvas or Real-Time Data Editor */}
      {isEditingData ? (
        /* Real-Time Live Data Editor */
        <div className="p-4 bg-black/40 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Modify values or labels below. The chart updates in real time.
            </p>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/30 transition"
            >
              <Plus className="h-3 w-3" /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 max-h-64 custom-scrollbar">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="p-2 font-mono uppercase">{xAxisKey}</th>
                  {dataKeys.map((dk) => (
                    <th key={dk.key} className="p-2 font-mono" style={{ color: dk.color }}>
                      {dk.label || dk.key}
                    </th>
                  ))}
                  <th className="p-2 w-10 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {spec.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/10 transition">
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row[xAxisKey] ?? ''}
                        onChange={(e) => handleDataChange(rIdx, xAxisKey, e.target.value)}
                        className="w-full px-2 py-1 rounded bg-background/80 border border-border/60 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                      />
                    </td>
                    {dataKeys.map((dk) => (
                      <td key={dk.key} className="p-1.5">
                        <input
                          type="number"
                          value={row[dk.key] ?? ''}
                          onChange={(e) => handleDataChange(rIdx, dk.key, e.target.value)}
                          className="w-full px-2 py-1 rounded bg-background/80 border border-border/60 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        />
                      </td>
                    ))}
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIdx)}
                        className="p-1 text-muted-foreground hover:text-red-400 rounded transition"
                        title="Delete Row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Chart Visualization Canvas */
        <div ref={containerRef} className="p-4 sm:p-5 w-full min-h-[300px] flex items-center justify-center">
          {renderActiveChart(activeType, spec, xAxisKey, dataKeys, paretoData, CustomTooltip)}
        </div>
      )}

      {/* Chart Footer with Interactive Indicators */}
      <div className="px-4 py-2 border-t border-border/40 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{spec.data.length} Data Points</span>
          {/* <span>•</span>
          <span>Interactive Tooltips Enabled</span> */}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSVG}
            className="hover:text-primary transition"
          >
            SVG
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="hover:text-primary transition"
          >
            JSON
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Render appropriate Recharts component based on type
 */
function renderActiveChart(
  type: ChartType,
  spec: ChartSpecification,
  xAxisKey: string,
  dataKeys: { key: string; label?: string; color?: string; fill?: string; unit?: string; stackId?: string }[],
  paretoData: any[],
  CustomTooltip: React.ComponentType<any>
) {
  // 1. KPI Card View
  if (type === 'kpi' && spec.kpi) {
    const kpi = spec.kpi;
    const isPos = kpi.changeType === 'positive' || (typeof kpi.change === 'string' && kpi.change.startsWith('+'));
    return (
      <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/30 border border-border shadow-lg text-center space-y-4">
        <span className="text-xs uppercase font-mono text-muted-foreground tracking-widest">{spec.title}</span>
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
          {kpi.value}
          {kpi.unit && <span className="text-xl text-muted-foreground font-normal ml-1">{kpi.unit}</span>}
        </div>
        {kpi.change && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{kpi.change}</span>
          </div>
        )}
        {spec.data && spec.data.length > 0 && (
          <div className="h-16 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spec.data}>
                <Area
                  type="monotone"
                  dataKey={dataKeys[0]?.key || 'value'}
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {kpi.description && <p className="text-xs text-muted-foreground">{kpi.description}</p>}
      </div>
    );
  }

  // 2. Sparkline
  if (type === 'sparkline') {
    return (
      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spec.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKeys[0]?.key || 'value'}
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#sparklineGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 3. Radar Chart
  if (type === 'radar') {
    return (
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={spec.data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey={xAxisKey} stroke="#94A3B8" fontSize={11} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#475569" fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((dk, idx) => (
              <Radar
                key={dk.key}
                name={dk.label || dk.key}
                dataKey={dk.key}
                stroke={dk.color || MODERN_PALETTE[idx % MODERN_PALETTE.length]}
                fill={dk.color || MODERN_PALETTE[idx % MODERN_PALETTE.length]}
                fillOpacity={0.4}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 4. Pie / Donut Chart
  if (type === 'pie' || type === 'donut') {
    const isDonut = type === 'donut';
    const primaryKey = dataKeys[0]?.key || 'value';
    return (
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Pie
              data={spec.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={isDonut ? 60 : 0}
              outerRadius={95}
              paddingAngle={3}
              dataKey={primaryKey}
              nameKey={xAxisKey}
            >
              {spec.data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={MODERN_PALETTE[index % MODERN_PALETTE.length]}
                  stroke="#0B0F19"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 5. Pareto Chart (Composed Bars + Cumulative Line)
  if (type === 'pareto') {
    const primaryKey = dataKeys[0]?.key || 'value';
    return (
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={paretoData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis yAxisId="left" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              unit="%"
              stroke="#F59E0B"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar
              yAxisId="left"
              dataKey={primaryKey}
              name={dataKeys[0]?.label || 'Frequency'}
              fill="#6366F1"
              radius={[6, 6, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="paretoCumulative"
              name="Cumulative %"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ r: 4, fill: '#F59E0B' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 6. Geographic Bubble / Scatter Chart
  if (type === 'geo-bubble') {
    const primaryKey = dataKeys[0]?.key || 'value';
    return (
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis
              type="category"
              dataKey={xAxisKey}
              name="Region / Point"
              stroke="#94A3B8"
              fontSize={11}
            />
            <YAxis
              type="number"
              dataKey={primaryKey}
              name="Metric Magnitude"
              stroke="#94A3B8"
              fontSize={11}
            />
            <ZAxis type="number" dataKey={primaryKey} range={[100, 1200]} name="Scale" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
            <Scatter name="Geographic Hubs" data={spec.data} fill="#06B6D4">
              {spec.data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={MODERN_PALETTE[index % MODERN_PALETTE.length]}
                  fillOpacity={0.7}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 7. Stacked Bar or Standard Bar / Column / Histogram
  if (type === 'bar' || type === 'column' || type === 'stacked-bar' || type === 'histogram') {
    return (
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spec.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {dataKeys.map((dk, idx) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.label || dk.key}
                stackId={type === 'stacked-bar' ? 'stack1' : undefined}
                fill={dk.color || MODERN_PALETTE[idx % MODERN_PALETTE.length]}
                radius={type === 'stacked-bar' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 8. Default Area / Line Chart
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={spec.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {dataKeys.map((dk, idx) => (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.label || dk.key}
                stroke={dk.color || MODERN_PALETTE[idx % MODERN_PALETTE.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1.5, fill: '#0B0F19' }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={spec.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              {dataKeys.map((dk, idx) => {
                const color = dk.color || MODERN_PALETTE[idx % MODERN_PALETTE.length];
                return (
                  <linearGradient key={`grad-${dk.key}`} id={`grad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            {dataKeys.map((dk, idx) => (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.label || dk.key}
                stroke={dk.color || MODERN_PALETTE[idx % MODERN_PALETTE.length]}
                strokeWidth={2}
                fill={`url(#grad-${dk.key})`}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
