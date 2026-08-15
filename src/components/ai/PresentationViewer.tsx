import { useState, useMemo } from 'react';
import pptxgen from 'pptxgenjs';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export interface SlideData {
  slideNumber: number;
  title: string;
  subtitle?: string;
  bulletPoints: string[];
  speakerNotes?: string;
}

interface PresentationViewerProps {
  rawMarkdown: string;
  defaultTitle?: string;
}

export function parseMarkdownSlides(text: string): SlideData[] {
  const slides: SlideData[] = [];
  // Split by markdown horizontal rules or Slide headers
  const rawSections = text.split(/\n---\n|\n---(?:\r?\n)/);

  for (let i = 0; i < rawSections.length; i++) {
    const section = rawSections[i].trim();
    if (!section) continue;

    const lines = section.split('\n');
    let title = '';
    let subtitle = '';
    const bulletPoints: string[] = [];
    let speakerNotes = '';

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;

      // Detect Title (# Slide 1: Title or # Title)
      if (line.startsWith('# ') && !title) {
        title = line.replace(/^#\s*(Slide\s*\d+:\s*)?/i, '').trim();
      } else if (line.startsWith('## ') && !title) {
        title = line.replace(/^##\s*(Slide\s*\d+:\s*)?/i, '').trim();
      } else if (line.startsWith('**') && line.endsWith('**') && !subtitle && bulletPoints.length === 0) {
        subtitle = line.replace(/^\*\*|\*\*$/g, '').trim();
      } else if (line.match(/^[-*•]\s+/)) {
        bulletPoints.push(line.replace(/^[-*•]\s+/, '').trim());
      } else if (line.match(/^\d+\.\s+/)) {
        bulletPoints.push(line.replace(/^\d+\.\s+/, '').trim());
      } else if (line.startsWith('>') || line.toLowerCase().includes('speaker notes:')) {
        speakerNotes += (speakerNotes ? ' ' : '') + line.replace(/^>\s*/, '').replace(/\*\*Speaker Notes:\*\*/i, '').trim();
      } else if (!title) {
        title = line;
      } else if (bulletPoints.length === 0 && !subtitle) {
        subtitle = line;
      } else {
        bulletPoints.push(line);
      }
    }

    if (title || bulletPoints.length > 0) {
      slides.push({
        slideNumber: slides.length + 1,
        title: title || `Slide ${slides.length + 1}`,
        subtitle,
        bulletPoints,
        speakerNotes,
      });
    }
  }

  return slides.length > 0
    ? slides
    : [
        {
          slideNumber: 1,
          title: 'Presentation Overview',
          bulletPoints: [text.slice(0, 300)],
        },
      ];
}

export function PresentationViewer({ rawMarkdown, defaultTitle = 'Hackord Presentation Deck' }: PresentationViewerProps) {
  const slides = useMemo(() => parseMarkdownSlides(rawMarkdown), [rawMarkdown]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleNext = () => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  // Generate and download PPTX
  const handleExportPPTX = async () => {
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      pres.author = 'Hackord AI Workspace';
      pres.company = 'Hackord';
      pres.title = defaultTitle;

      // Define brand colors
      const BG_COLOR = '0B0F19';
      const ACCENT_COLOR = '6366F1';
      const TEXT_PRIMARY = 'F8FAFC';
      const TEXT_MUTED = '94A3B8';

      slides.forEach((slide) => {
        const pSlide = pres.addSlide();
        pSlide.background = { color: BG_COLOR };

        // Slide Header / Accent Bar
        pSlide.addShape(pres.ShapeType.rect, {
          x: 0.5,
          y: 0.4,
          w: 0.15,
          h: 0.7,
          fill: { color: ACCENT_COLOR },
        });

        // Slide Title
        pSlide.addText(slide.title, {
          x: 0.8,
          y: 0.35,
          w: 11.5,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: TEXT_PRIMARY,
          fontFace: 'Arial',
        });

        // Subtitle if available
        if (slide.subtitle) {
          pSlide.addText(slide.subtitle, {
            x: 0.8,
            y: 1.15,
            w: 11.5,
            h: 0.4,
            fontSize: 14,
            italic: true,
            color: ACCENT_COLOR,
            fontFace: 'Arial',
          });
        }

        // Bullets content
        const bulletsText = slide.bulletPoints.map((bp) => ({
          text: bp,
          options: {
            bullet: { type: 'bullet' },
            fontSize: 16,
            color: TEXT_PRIMARY,
            breakLine: true,
            paraSpaceAfter: 10,
          },
        }));

        if (bulletsText.length > 0) {
          pSlide.addText(bulletsText as any, {
            x: 0.8,
            y: slide.subtitle ? 1.7 : 1.4,
            w: 11.5,
            h: 4.8,
            fontFace: 'Arial',
          });
        }

        // Slide Footer
        pSlide.addText(`Hackord AI Workspace  |  Slide ${slide.slideNumber} of ${slides.length}`, {
          x: 0.8,
          y: 6.8,
          w: 11.5,
          h: 0.3,
          fontSize: 10,
          color: TEXT_MUTED,
          fontFace: 'Arial',
        });

        // Speaker Notes
        if (slide.speakerNotes) {
          pSlide.addNotes(slide.speakerNotes);
        }
      });

      await pres.writeFile({ fileName: `${defaultTitle.replace(/\s+/g, '_')}.pptx` });
      toast.success('PowerPoint presentation (.pptx) downloaded!');
    } catch (err) {
      console.error('PPTX export error:', err);
      toast.error('Failed to generate PPTX presentation');
    }
  };

  // Download Markdown file (.md)
  const handleDownloadMD = () => {
    const blob = new Blob([rawMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${defaultTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Markdown (.md) deck downloaded!');
  };

  // Print/Download PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print/save PDF.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${defaultTitle} - Hackord Deck</title>
          <style>
            @page { size: landscape; margin: 1cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #111; padding: 20px; }
            .slide { page-break-after: always; min-height: 80vh; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; margin-bottom: 30px; box-sizing: border-box; }
            .slide-header { border-left: 5px solid #6366f1; padding-left: 15px; margin-bottom: 25px; }
            .slide-title { font-size: 26px; font-weight: bold; margin: 0; color: #0f172a; }
            .slide-sub { font-size: 16px; color: #6366f1; margin-top: 5px; }
            ul { font-size: 18px; line-height: 1.6; color: #334155; margin-left: 20px; }
            li { margin-bottom: 12px; }
            .notes { margin-top: 30px; background: #f8fafc; border-left: 3px solid #94a3b8; padding: 10px 15px; font-size: 13px; color: #64748b; font-style: italic; }
            .footer { margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: right; }
          </style>
        </head>
        <body>
          ${slides
            .map(
              (s) => `
            <div class="slide">
              <div class="slide-header">
                <h1 class="slide-title">${s.title}</h1>
                ${s.subtitle ? `<div class="slide-sub">${s.subtitle}</div>` : ''}
              </div>
              <ul>
                ${s.bulletPoints.map((bp) => `<li>${bp}</li>`).join('')}
              </ul>
              ${s.speakerNotes ? `<div class="notes"><strong>Presenter Notes:</strong> ${s.speakerNotes}</div>` : ''}
              <div class="footer">Hackord AI Workspace • Slide ${s.slideNumber} of ${slides.length}</div>
            </div>
          `
            )
            .join('')}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Print dialog opened. Select "Save as PDF" to download!');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    toast.success('Presentation markdown copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`my-3 rounded-2xl border border-border/80 bg-slate-950/80 dark:bg-black/90 backdrop-blur-md shadow-card overflow-hidden transition-all ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : ''}`}>
      {/* Top Deck Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20 text-xs">
        <div className="flex items-center gap-2 font-semibold">
          <Presentation className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-wider text-foreground">
            Presentation Deck ({slides.length} Slides)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Download PPTX */}
          <button
            type="button"
            onClick={handleExportPPTX}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary font-semibold transition text-[11px]"
            title="Download PowerPoint Presentation (.pptx)"
          >
            <Download className="h-3.5 w-3.5" />
            <span>.PPTX</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition text-[11px]"
            title="Export / Print as PDF"
          >
            <FileText className="h-3 w-3" />
            <span>PDF</span>
          </button>

          {/* Download MD */}
          <button
            type="button"
            onClick={handleDownloadMD}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition text-[11px]"
            title="Download Markdown Slides (.md)"
          >
            <Download className="h-3 w-3" />
            <span>.MD</span>
          </button>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition"
            title="Copy Raw Markdown"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition ml-1"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Slide Navigation Pill Tabs */}
      <div className="flex items-center gap-1 px-3.5 py-1.5 border-b border-border/40 overflow-x-auto custom-scrollbar bg-black/20">
        {slides.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlideIndex(idx)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition ${
              currentSlideIndex === idx
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            Slide {s.slideNumber}: {s.title.slice(0, 16)}...
          </button>
        ))}
      </div>

      {/* Active Slide Canvas */}
      <div className={`p-6 flex-1 flex flex-col justify-between min-h-[260px] relative overflow-y-auto ${isFullscreen ? 'p-12' : ''}`}>
        <div className="space-y-4 max-w-3xl">
          {/* Header */}
          <div className="space-y-1 border-l-4 border-primary pl-3">
            <div className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
              Slide {currentSlide.slideNumber} of {slides.length}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {currentSlide.title}
            </h3>
            {currentSlide.subtitle && (
              <p className="text-xs sm:text-sm text-primary italic">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          {/* Bullet Points */}
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground pl-2 leading-relaxed">
            {currentSlide.bulletPoints.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/80 mt-2 shrink-0" />
                <span className="text-foreground/90">{pt}</span>
              </li>
            ))}
          </ul>

          {/* Speaker Notes */}
          {currentSlide.speakerNotes && (
            <div className="rounded-xl border border-border/40 bg-muted/15 p-3 text-[11px] text-muted-foreground/90 space-y-1">
              <div className="font-semibold text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Speaker Notes
              </div>
              <p className="italic">{currentSlide.speakerNotes}</p>
            </div>
          )}
        </div>

        {/* Carousel Bottom Controls */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>

          <span className="text-[11px] font-mono text-muted-foreground">
            {currentSlideIndex + 1} / {slides.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition text-muted-foreground hover:text-foreground"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
