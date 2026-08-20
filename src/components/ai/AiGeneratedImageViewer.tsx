import React, { useState } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ZoomIn,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface AiGeneratedImageViewerProps {
  imageUrl: string;
  prompt?: string;
  modelName?: string;
  aspectRatio?: string;
}

export function AiGeneratedImageViewer({
  imageUrl,
  prompt = 'AI Generated Image',
  modelName = 'Google Imagen 3',
  aspectRatio = '16:9',
}: AiGeneratedImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagen3_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded as PNG!');
    } catch (e) {
      window.open(imageUrl, '_blank');
      toast.info('Opened image in new tab for direct download.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    toast.success('Image link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3 rounded-2xl border border-border/80 bg-card dark:bg-black/90 backdrop-blur-xl shadow-card overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-4 sm:inset-8 z-50 flex flex-col' : 'max-w-2xl'
      }`}
    >
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-gradient-brand text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-[11px] uppercase tracking-wider text-foreground">
              {modelName}
            </span>
            <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-mono bg-primary/15 text-primary border border-primary/25">
              High Resolution
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Download PNG */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary font-semibold transition text-[11px]"
            title="Download full resolution PNG image"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PNG</span>
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition"
            title="Copy image URL"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Image Frame */}
      <div className={`relative flex items-center justify-center bg-muted/30 dark:bg-black/60 p-2 sm:p-4 overflow-hidden ${isFullscreen ? 'flex-1' : 'min-h-[240px]'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 dark:bg-slate-950/70 backdrop-blur-sm z-10">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-[11px] text-muted-foreground font-mono">Rendering visual...</span>
          </div>
        )}

        <img
          src={imageUrl}
          alt={prompt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`rounded-xl object-contain transition-all duration-300 shadow-md ${
            isFullscreen ? 'max-h-[82vh] max-w-full' : 'max-h-[460px] w-full'
          }`}
        />
      </div>

      {/* Bottom Prompt Bar */}
      {prompt && (
        <div className="px-3.5 py-2.5 border-t border-border/40 bg-muted/10 text-xs flex items-center justify-between gap-3">
          <p className="text-muted-foreground italic truncate text-[11px] flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">"{prompt}"</span>
          </p>
        </div>
      )}
    </div>
  );
}
