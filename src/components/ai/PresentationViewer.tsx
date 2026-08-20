import { useState, useMemo, useEffect, useCallback } from 'react';
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
  LayoutGrid,
  FileCode,
  Edit3,
  Play,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPdf, exportToMarkdown } from '@/lib/document-exporter';

export interface SlideData {
  slideNumber: number;
  title: string;
  subtitle?: string;
  bulletPoints: string[];
  codeBlock?: { language: string; code: string };
  speakerNotes?: string;
  themeClass?: string;
}

interface PresentationViewerProps {
  rawMarkdown: string;
  defaultTitle?: string;
  onClose?: () => void;
}

/**
 * Robust Marp & Markdown Slide Parser
 * Parses both standard markdown and Marp slide formats (marp: true, --- delimiters, <!-- notes -->)
 */
export function parseMarkdownSlides(text: string): SlideData[] {
  const slides: SlideData[] = [];
  
  // Clean frontmatter if present (e.g. marp: true, theme: uncover, etc.)
  let cleanText = text;
  if (cleanText.startsWith('---')) {
    const secondDelim = cleanText.indexOf('---', 3);
    if (secondDelim !== -1) {
      const frontmatter = cleanText.substring(3, secondDelim);
      if (frontmatter.toLowerCase().includes('marp') || frontmatter.toLowerCase().includes('theme')) {
        cleanText = cleanText.substring(secondDelim + 3);
      }
    }
  }

  // Split by markdown horizontal rules or Slide markers
  const rawSections = cleanText.split(/\n---\n|\n---(?:\r?\n)/);

  for (let i = 0; i < rawSections.length; i++) {
    const section = rawSections[i].trim();
    if (!section) continue;

    const lines = section.split('\n');
    let title = '';
    let subtitle = '';
    const bulletPoints: string[] = [];
    let speakerNotes = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines: string[] = [];

    for (let j = 0; j < lines.length; j++) {
      const rawLine = lines[j];
      const line = rawLine.trim();
      if (!line && !inCodeBlock) continue;

      // Handle Code Blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace(/^```/, '').trim();
          codeLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(rawLine);
        continue;
      }

      // Marp HTML Comments & Speaker Notes (<!-- note: ... --> or <!-- _class: lead -->)
      if (line.startsWith('<!--') && line.endsWith('-->')) {
        const commentContent = line.replace(/^<!--\s*|\s*-->$/g, '');
        if (commentContent.toLowerCase().startsWith('note:') || commentContent.toLowerCase().startsWith('presenter:')) {
          speakerNotes += (speakerNotes ? ' ' : '') + commentContent.replace(/^(note|presenter):\s*/i, '');
        }
        continue;
      }

      // Detect Title (# Slide 1: Title or # Title or ## Title)
      if (line.startsWith('# ') && !title) {
        title = line.replace(/^#\s*(Slide\s*\d+:\s*)?/i, '').trim();
      } else if (line.startsWith('## ') && !title) {
        title = line.replace(/^##\s*(Slide\s*\d+:\s*)?/i, '').trim();
      } else if (line.startsWith('### ') && !title) {
        title = line.replace(/^###\s*(Slide\s*\d+:\s*)?/i, '').trim();
      } else if (line.startsWith('**') && line.endsWith('**') && !subtitle && bulletPoints.length === 0) {
        subtitle = line.replace(/^\*\*|\*\*$/g, '').trim();
      } else if (line.match(/^[-*•]\s+/)) {
        bulletPoints.push(line.replace(/^[-*•]\s+/, '').trim());
      } else if (line.match(/^\d+\.\s+/)) {
        bulletPoints.push(line.replace(/^\d+\.\s+/, '').trim());
      } else if (line.startsWith('>') || line.toLowerCase().includes('speaker notes:') || line.toLowerCase().includes('presenter notes:')) {
        speakerNotes += (speakerNotes ? ' ' : '') + line.replace(/^>\s*/, '').replace(/\*\*(Speaker|Presenter)\s*Notes:\*\*/i, '').trim();
      } else if (!title) {
        title = line;
      } else if (bulletPoints.length === 0 && !subtitle && line.length < 90) {
        subtitle = line;
      } else {
        bulletPoints.push(line);
      }
    }

    if (title || bulletPoints.length > 0 || codeLines.length > 0) {
      slides.push({
        slideNumber: slides.length + 1,
        title: title || `Slide ${slides.length + 1}`,
        subtitle,
        bulletPoints,
        codeBlock: codeLines.length > 0 ? { language: codeLanguage, code: codeLines.join('\n') } : undefined,
        speakerNotes,
      });
    }
  }

  return slides.length > 0
    ? slides
    : [
        {
          slideNumber: 1,
          title: 'Presentation Pitch Deck',
          subtitle: 'Generated via Hackord AI Workspace',
          bulletPoints: [
            'Turn raw markdown notes and project architectures into presentation slides',
            'Compatible with Marp for VS Code slide syntax and export',
            'Downloadable as .pptx, formatted PDF, or Marp Markdown',
          ],
        },
      ];
}

export function PresentationViewer({ rawMarkdown, defaultTitle = 'Hackord Pitch Deck', onClose }: PresentationViewerProps) {
  const [editableMarkdown, setEditableMarkdown] = useState(rawMarkdown);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid' | 'editor'>('carousel');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditableMarkdown(rawMarkdown);
  }, [rawMarkdown]);

  const slides = useMemo(() => parseMarkdownSlides(editableMarkdown), [editableMarkdown]);
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'editor') return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFullscreen, viewMode]);

  // Generate and download PPTX with pptxgenjs
  const handleExportPPTX = async () => {
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      pres.author = 'Hackord AI Workspace';
      pres.company = 'Hackord';
      pres.title = defaultTitle;

      // Brand Theme Colors
      const BG_COLOR = '0B0F19';
      const CARD_BG = '131B2E';
      const ACCENT_COLOR = '6366F1';
      const TEXT_PRIMARY = 'F8FAFC';
      const TEXT_MUTED = '94A3B8';
      const ACCENT_CYAN = '38BDF8';

      slides.forEach((slide) => {
        const pSlide = pres.addSlide();
        pSlide.background = { color: BG_COLOR };

        // Accent top bar
        pSlide.addShape(pres.ShapeType.rect, {
          x: 0.6,
          y: 0.45,
          w: 0.15,
          h: 0.7,
          fill: { color: ACCENT_COLOR },
        });

        // Slide Title
        pSlide.addText(slide.title, {
          x: 0.9,
          y: 0.4,
          w: 11.5,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: TEXT_PRIMARY,
          fontFace: 'Segoe UI',
        });

        // Subtitle if available
        if (slide.subtitle) {
          pSlide.addText(slide.subtitle, {
            x: 0.9,
            y: 1.15,
            w: 11.5,
            h: 0.4,
            fontSize: 14,
            italic: true,
            color: ACCENT_CYAN,
            fontFace: 'Segoe UI',
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
            paraSpaceAfter: 12,
          },
        }));

        if (bulletsText.length > 0) {
          pSlide.addText(bulletsText as any, {
            x: 0.9,
            y: slide.subtitle ? 1.7 : 1.45,
            w: slide.codeBlock ? 6.5 : 11.2,
            h: 4.6,
            fontFace: 'Segoe UI',
          });
        }

        // Code block if present
        if (slide.codeBlock) {
          pSlide.addShape(pres.ShapeType.roundRect, {
            x: 7.7,
            y: 1.6,
            w: 4.8,
            h: 4.4,
            fill: { color: CARD_BG },
            line: { color: '334155', width: 1 },
          });

          pSlide.addText(slide.codeBlock.code, {
            x: 7.9,
            y: 1.8,
            w: 4.4,
            h: 4.0,
            fontSize: 11,
            color: '67E8F9',
            fontFace: 'Consolas',
          });
        }

        // Slide Footer
        pSlide.addText(`Hackord AI Workspace  |  Slide ${slide.slideNumber} of ${slides.length}`, {
          x: 0.9,
          y: 6.8,
          w: 11.2,
          h: 0.3,
          fontSize: 10,
          color: TEXT_MUTED,
          fontFace: 'Segoe UI',
        });

        // Speaker Notes
        if (slide.speakerNotes) {
          pSlide.addNotes(slide.speakerNotes);
        }
      });

      const fileName = `${defaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation.pptx`;
      await pres.writeFile({ fileName });
      toast.success(`PowerPoint presentation "${fileName}" downloaded!`);
    } catch (err) {
      console.error('PPTX export error:', err);
      toast.error('Failed to generate PPTX presentation');
    }
  };

  // Download Marp-compatible Markdown (.md)
  const handleDownloadMarpMD = () => {
    let marpContent = `---
marp: true
theme: uncover
paginate: true
backgroundColor: #0b0f19
color: #f8fafc
---

`;
    marpContent += editableMarkdown.trim();
    exportToMarkdown(marpContent, `${defaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_marp.md`);
  };

  // Export PDF
  const handleExportPDF = () => {
    exportToPdf(defaultTitle, editableMarkdown);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(editableMarkdown);
    setCopied(true);
    toast.success('Presentation markdown copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3.5 rounded-2xl border border-border/80 bg-card dark:bg-black/90 backdrop-blur-xl shadow-card overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-3 sm:inset-6 z-50 flex flex-col' : ''
      }`}
    >
      {/* Top Deck Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <div className="p-1 rounded-lg bg-primary/20 text-primary">
            <Presentation className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-foreground">
              Presentation Slide Deck
            </span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
              {slides.length} Slides
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-background/60 rounded-lg border border-border/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
                viewMode === 'carousel' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Slide Carousel View"
            >
              <Play className="h-3 w-3" />
              <span>Slides</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
                viewMode === 'grid' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Marp Grid Overview"
            >
              <LayoutGrid className="h-3 w-3" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
                viewMode === 'editor' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Edit Marp Markdown"
            >
              <Edit3 className="h-3 w-3" />
              <span>Editor</span>
            </button>
          </div>

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
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Download Marp MD */}
          <button
            type="button"
            onClick={handleDownloadMarpMD}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition text-[11px]"
            title="Download Marp-compatible Markdown (.md)"
          >
            <FileCode className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
            <span>Marp .MD</span>
          </button>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition"
            title="Copy Raw Markdown"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Slide Carousel Mode */}
      {viewMode === 'carousel' && (
        <div className="flex flex-col flex-1">
          {/* Slide Navigation Pill Tabs */}
          <div className="flex items-center gap-1 px-3.5 py-1.5 border-b border-border/40 overflow-x-auto custom-scrollbar bg-muted/20 dark:bg-black/30">
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
          <div className={`p-6 sm:p-8 flex-1 flex flex-col justify-between min-h-[280px] relative overflow-y-auto ${isFullscreen ? 'p-12 sm:p-16' : ''}`}>
            <div className="space-y-4 max-w-4xl">
              {/* Header */}
              <div className="space-y-1.5 border-l-4 border-primary pl-3.5">
                <div className="text-[10px] uppercase font-bold tracking-widest text-primary/90 flex items-center gap-2">
                  <span>Slide {currentSlide.slideNumber} of {slides.length}</span>
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  <span className="text-muted-foreground font-mono">Marp Ready</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {currentSlide.title}
                </h3>
                {currentSlide.subtitle && (
                  <p className="text-xs sm:text-sm text-cyan-600 dark:text-cyan-400 font-medium italic">
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              {/* Bullet Points */}
              <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90 pl-1 leading-relaxed">
                {currentSlide.bulletPoints.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0 shadow-sm" />
                    <span className="text-foreground font-normal">{pt}</span>
                  </li>
                ))}
              </ul>

              {/* Code Block if any */}
              {currentSlide.codeBlock && (
                <div className="mt-3 rounded-xl border border-border/60 bg-slate-900 dark:bg-slate-950 p-3 overflow-x-auto text-xs font-mono text-cyan-300">
                  <pre>{currentSlide.codeBlock.code}</pre>
                </div>
              )}

              {/* Speaker Notes */}
              {currentSlide.speakerNotes && (
                <div className="rounded-xl border border-border/50 bg-primary/5 p-3 text-[11px] text-muted-foreground/90 space-y-1 mt-4">
                  <div className="font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Speaker Notes
                  </div>
                  <p className="italic">{currentSlide.speakerNotes}</p>
                </div>
              )}
            </div>

            {/* Carousel Bottom Navigation */}
            <div className="flex items-center justify-between pt-4 mt-6 border-t border-border/40 text-xs">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {currentSlideIndex + 1} / {slides.length}
                </span>
                <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                  (Use ← / → keys to navigate)
                </span>
              </div>

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
      )}

      {/* VIEW 2: Grid Overview Mode */}
      {viewMode === 'grid' && (
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[500px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((s, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCurrentSlideIndex(idx);
                setViewMode('carousel');
              }}
              className="p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 hover:border-primary/50 transition cursor-pointer flex flex-col justify-between min-h-[160px] shadow-sm group"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-primary mb-2">
                  <span>Slide {s.slideNumber}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition text-[9px] text-muted-foreground">Click to present</span>
                </div>
                <h4 className="font-bold text-sm text-foreground mb-1 line-clamp-2">{s.title}</h4>
                {s.subtitle && <p className="text-[11px] text-cyan-400 italic mb-2 line-clamp-1">{s.subtitle}</p>}
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {s.bulletPoints.slice(0, 2).map((bp, bIdx) => (
                    <li key={bIdx} className="line-clamp-1 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/30 mt-2 flex justify-between">
                <span>{s.bulletPoints.length} points</span>
                {s.speakerNotes && <span className="text-primary font-medium">Notes</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: Live Marp Markdown Editor */}
      {viewMode === 'editor' && (
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              Marp Presentation Markdown (Edit & Live Sync)
            </span>
            <button
              type="button"
              onClick={() => {
                setEditableMarkdown(rawMarkdown);
                toast.success('Reset to original markdown');
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          <textarea
            value={editableMarkdown}
            onChange={(e) => setEditableMarkdown(e.target.value)}
            rows={12}
            className="w-full p-4 rounded-xl border border-border/80 bg-black/90 font-mono text-xs text-cyan-300 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y custom-scrollbar"
            placeholder="# Slide 1: Title&#10;**Subtitle**&#10;- Bullet point 1&#10;- Bullet point 2&#10;&#10;---&#10;&#10;# Slide 2: Next Section&#10;- Content"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              Separate slides with <code className="text-primary font-mono">---</code> delimiter
            </span>
            <button
              type="button"
              onClick={() => {
                setViewMode('carousel');
                toast.success('Slides updated from Markdown editor!');
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-brand text-white font-semibold text-xs shadow-glow hover:opacity-90 transition"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Apply & View Slides
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
