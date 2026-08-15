import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, Copy, Check, ZoomIn, ZoomOut, RotateCcw, Code, Eye } from 'lucide-react';
import { toast } from 'sonner';

// Initialize mermaid with sleek modern theme
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

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const cleanChart = chart.trim();
    if (!cleanChart) return;

    const renderId = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    mermaid
      .render(renderId, cleanChart)
      .then(({ svg }) => {
        if (isMounted) {
          setSvgContent(svg);
          setHasError(false);
          setErrorMessage('');
        }
      })
      .catch((err) => {
        console.warn('[Mermaid render error]', err);
        if (isMounted) {
          setHasError(true);
          setErrorMessage(err.message || 'Syntax error in Mermaid code');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chart.trim());
    setCopied(true);
    toast.success('Mermaid diagram code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Diagram exported as SVG!');
  };

  const handleDownloadPNG = () => {
    if (!containerRef.current && !svgContent) {
      toast.error('Diagram not loaded yet');
      return;
    }

    try {
      const svgEl = containerRef.current?.querySelector('svg');
      let cleanSvgStr = svgContent;

      let width = 1200;
      let height = 800;

      if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        width = Math.max(800, Math.round(rect.width * 2));
        height = Math.max(500, Math.round(rect.height * 2));
        const serializer = new XMLSerializer();
        cleanSvgStr = serializer.serializeToString(svgEl);
      }

      // Ensure explicit width, height and xmlns
      if (!cleanSvgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
        cleanSvgStr = cleanSvgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(cleanSvgStr)))}`;
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          handleDownloadSVG();
          return;
        }

        // Clean dark theme background
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(0, 0, width, height);

        // Center the image with padding
        const padding = 40;
        const drawW = width - padding * 2;
        const drawH = height - padding * 2;
        ctx.drawImage(image, padding, padding, drawW, drawH);

        try {
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `mermaid-diagram-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Mermaid diagram exported as PNG image!');
        } catch (e) {
          // If canvas is blocked, export SVG directly
          handleDownloadSVG();
        }
      };

      image.onerror = () => {
        handleDownloadSVG();
      };

      image.src = svgDataUrl;
    } catch (err) {
      console.error('PNG export fallback to SVG:', err);
      handleDownloadSVG();
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-border/80 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md overflow-hidden shadow-card">
      {/* Diagram Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 bg-muted/20 text-xs">
        <div className="flex items-center gap-2 font-semibold text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider text-foreground">
            Flowchart
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Controls */}
          {!showRaw && !hasError && (
            <div className="flex items-center bg-background/60 rounded-lg border border-border/50 p-0.5 mr-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] px-1 font-mono text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Toggle Raw Code / Diagram */}
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition text-[11px]"
            title={showRaw ? 'View Visual Diagram' : 'View Raw Mermaid Code'}
          >
            {showRaw ? <Eye className="h-3 w-3" /> : <Code className="h-3 w-3" />}
            <span>{showRaw ? 'Diagram' : 'Code'}</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition"
            title="Copy Mermaid Code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {/* Download Image (PNG) */}
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary transition text-[11px] font-semibold"
            title="Export as PNG Image"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PNG</span>
          </button>

          {/* Download SVG */}
          <button
            type="button"
            onClick={handleDownloadSVG}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition text-[11px]"
            title="Export as SVG Document"
          >
            <Download className="h-3 w-3" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Diagram Canvas Body */}
      <div className="p-4 overflow-x-auto min-h-[160px] flex items-center justify-center relative">
        {hasError ? (
          <div className="space-y-2 text-center w-full py-4">
            <p className="text-xs text-red-400 font-semibold">Could not render diagram visually</p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">{errorMessage}</p>
            <pre className="text-[11px] font-mono text-left bg-black/40 p-3 rounded-xl border border-red-500/20 text-amber-300 max-h-48 overflow-y-auto">
              {chart}
            </pre>
          </div>
        ) : showRaw ? (
          <pre className="w-full text-xs font-mono text-cyan-300 bg-black/50 p-3.5 rounded-xl border border-border/40 overflow-x-auto">
            {chart}
          </pre>
        ) : (
          <div
            ref={containerRef}
            className="transition-transform duration-150 flex items-center justify-center w-full [&_svg]:max-w-full [&_svg]:h-auto"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
