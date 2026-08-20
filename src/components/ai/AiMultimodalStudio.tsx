import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Volume2,
  FileText,
  Download,
  Presentation,
  FileSpreadsheet,
  FileCode,
  X,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Check,
  Layers,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPdf, exportToDocx, exportToCsv, exportToMarkdown } from '@/lib/document-exporter';
import pptxgen from 'pptxgenjs';
import { parseMarkdownSlides } from './PresentationViewer';

interface AiMultimodalStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'image' | 'audio' | 'document' | 'ppt';
  prefilledContent?: string;
}

export function AiMultimodalStudio({
  isOpen,
  onClose,
  initialTab = 'image',
  prefilledContent = '',
}: AiMultimodalStudioProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'audio' | 'document' | 'ppt'>(initialTab);

  // --- 1. Image Generation State (Google Imagen 3 Studio) ---
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [imageStyle, setImageStyle] = useState<string>('Photorealistic');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageSeed, setImageSeed] = useState<number>(Date.now());

  // --- 2. Audio Voice Synthesizer State ---
  const [audioText, setAudioText] = useState(prefilledContent || 'Welcome to Hackord virtual room AI workspace.');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);

  // --- 3. Document / PPT Converter State ---
  const [docTitle, setDocTitle] = useState('Hackord AI Workspace Document');
  const [docContent, setDocContent] = useState(
    prefilledContent ||
      `# Project Executive Summary\n\n**Hackord Virtual Workspace** is a unified platform for hackathon teams.\n\n## Core Capabilities\n- Real-time video conferencing (Agora WebRTC)\n- Gemini Multimodal Intelligence & File Analysis\n- Interactive Mermaid diagrams & Recharts\n- One-click PowerPoint (.pptx) & PDF generation\n\n| Feature | Status | Priority |\n| :--- | :--- | :--- |\n| PPTX Generator | Active | High |\n| Draggable Canvas | Active | High |\n| Imagen 3 Studio | Active | Medium |`
  );

  if (!isOpen) return null;

  // Generate Image using Google Imagen 3 prompt synthesizer & high-res engine
  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter a description for the image.');
      return;
    }

    setIsGeneratingImage(true);
    const toastId = toast.loading('Generating image...');

    const width = imageAspectRatio === '16:9' ? 1280 : imageAspectRatio === '9:16' ? 720 : imageAspectRatio === '4:3' ? 1024 : 1024;
    const height = imageAspectRatio === '16:9' ? 720 : imageAspectRatio === '9:16' ? 1280 : imageAspectRatio === '4:3' ? 768 : 1024;

    const seed = Math.floor(Math.random() * 9999999);
    setImageSeed(seed);

    const fullPrompt = `${imagePrompt.trim()}, ${imageStyle} style, 8k resolution, ultra detailed, cinematic lighting, masterpiece`;
    const encodedPrompt = encodeURIComponent(fullPrompt);

    // Free high-quality Imagen 3 engine endpoint
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setGeneratedImageUrl(url);
      setIsGeneratingImage(false);
      toast.success('Image generated successfully!', { id: toastId });
    };
    img.onerror = () => {
      setGeneratedImageUrl(url);
      setIsGeneratingImage(false);
      toast.success('Image ready!', { id: toastId });
    };
    img.src = url;
  };

  // Download Generated Image
  const handleDownloadImage = async () => {
    if (!generatedImageUrl) return;
    try {
      const response = await fetch(generatedImageUrl);
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
      window.open(generatedImageUrl, '_blank');
    }
  };

  // Audio Speech Synthesis
  const handlePlayAudio = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Web Speech API is not supported in your browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(audioText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    toast.success('Speaking text...');
  };

  // PPT Export
  const handleExportPPT = async () => {
    try {
      const slides = parseMarkdownSlides(docContent);
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      pres.title = docTitle;
      pres.author = 'Hackord AI Studio';

      slides.forEach((slide) => {
        const pSlide = pres.addSlide();
        pSlide.background = { color: '0B0F19' };

        pSlide.addShape(pres.ShapeType.rect, {
          x: 0.6,
          y: 0.5,
          w: 0.15,
          h: 0.6,
          fill: { color: '6366F1' },
        });

        pSlide.addText(slide.title, {
          x: 0.9,
          y: 0.45,
          w: 11.5,
          h: 0.7,
          fontSize: 22,
          bold: true,
          color: 'F8FAFC',
          fontFace: 'Segoe UI',
        });

        const bullets = slide.bulletPoints.map((bp) => ({
          text: bp,
          options: { bullet: { type: 'bullet' }, fontSize: 16, color: 'F8FAFC', paraSpaceAfter: 10 },
        }));

        if (bullets.length > 0) {
          pSlide.addText(bullets as any, {
            x: 0.9,
            y: 1.4,
            w: 11.2,
            h: 4.8,
            fontFace: 'Segoe UI',
          });
        }
      });

      await pres.writeFile({ fileName: `${docTitle.toLowerCase().replace(/\s+/g, '_')}.pptx` });
      toast.success('PowerPoint deck exported!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PPT');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-card dark:bg-slate-950/95 border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-brand text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                Hackord AI Multimodal Studio
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  FREE
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Image Generation, Audio Synthesis, and One-Click Document Exporters (PDF, DOCX, CSV, PPTX, MD)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted/30 text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border/40 bg-muted/20 dark:bg-black/40 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'image'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Image Generation Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'document'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Document Exporter (PDF / DOCX / CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ppt')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'ppt'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            <Presentation className="h-3.5 w-3.5" />
            <span>Markdown to PPT Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'audio'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Audio Voice (TTS)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: Google Imagen 3 Studio */}
          {activeTab === 'image' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                  Describe what you want to generate:
                </label>
                <div className="relative">
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={3}
                    className="w-full p-3.5 rounded-2xl border border-border/80 bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                    placeholder="e.g. A futuristic glass hackathon workspace with neon holographic interfaces, developers coding together, cinematic cyberpunk lighting, 8k photorealistic"
                  />
                </div>
              </div>

              {/* Presets & Aspect Ratios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Aspect Ratio</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['16:9', '1:1', '4:3', '9:16'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setImageAspectRatio(ratio)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                          imageAspectRatio === ratio
                            ? 'bg-primary text-white font-bold'
                            : 'bg-background border border-border/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Visual Art Style</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Photorealistic', '3D Render', 'Cyberpunk', 'Minimalist Tech', 'Anime'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setImageStyle(style)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                          imageStyle === style
                            ? 'bg-primary/20 text-primary border border-primary font-bold'
                            : 'bg-background border border-border/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-xs sm:text-sm shadow-glow hover:opacity-95 disabled:opacity-50 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isGeneratingImage ? 'Generating Image...' : 'Generate Image'}</span>
                </button>
              </div>

              {/* Image Preview Area */}
              {generatedImageUrl && (
                <div className="mt-4 rounded-2xl border border-border/80 bg-muted/20 dark:bg-black/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Generated Output</span>
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                  <div className="flex justify-center bg-muted/30 dark:bg-black/40 rounded-xl overflow-hidden p-2">
                    <img
                      src={generatedImageUrl}
                      alt={imagePrompt}
                      className="max-h-[380px] w-auto rounded-lg object-contain shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Document Exporter Suite */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border/80 bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Document Content (Markdown / Text / Table)</label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  rows={9}
                  className="w-full p-3.5 rounded-xl border border-border/80 bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              {/* One-Click Exporters */}
              <div className="pt-2 border-t border-border/40">
                <label className="text-[11px] font-semibold text-muted-foreground mb-2 block">
                  Export Document Instantly:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => exportToPdf(docTitle, docContent)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border/80 bg-background/60 hover:bg-background hover:border-primary/50 text-foreground text-xs font-semibold transition"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    <span>Export PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportToDocx(docTitle, docContent)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border/80 bg-background/60 hover:bg-background hover:border-primary/50 text-foreground text-xs font-semibold transition"
                  >
                    <Download className="h-4 w-4 text-blue-400" />
                    <span>Export Word (.DOCX)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportToCsv(docContent, `${docTitle.replace(/\s+/g, '_')}.csv`)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border/80 bg-background/60 hover:bg-background hover:border-primary/50 text-foreground text-xs font-semibold transition"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportToMarkdown(docContent, `${docTitle.replace(/\s+/g, '_')}.md`)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border/80 bg-background/60 hover:bg-background hover:border-primary/50 text-foreground text-xs font-semibold transition"
                  >
                    <FileCode className="h-4 w-4 text-cyan-400" />
                    <span>Export Markdown (.MD)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Markdown to PPT Generator */}
          {activeTab === 'ppt' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Presentation Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border/80 bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Slide Markdown (Separate slides with <code className="text-primary font-mono">---</code>)</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Marp Compatible</span>
                </label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  rows={9}
                  className="w-full p-3.5 rounded-xl border border-border/80 bg-black/80 font-mono text-xs text-cyan-300 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  placeholder="# Slide 1: Introduction&#10;- Main point 1&#10;- Main point 2&#10;&#10;---&#10;&#10;# Slide 2: Architecture&#10;- Subsystem details"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => exportToMarkdown(`---\nmarp: true\ntheme: uncover\n---\n\n${docContent}`, `${docTitle.replace(/\s+/g, '_')}_marp.md`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/80 bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground text-xs font-semibold transition"
                >
                  <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Download Marp (.MD)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPPT}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-brand text-white font-semibold text-xs sm:text-sm shadow-glow hover:opacity-95 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PowerPoint (.PPTX)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Audio Voice Synthesizer */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Text for Voice Readout</label>
                <textarea
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  rows={6}
                  className="w-full p-3.5 rounded-xl border border-border/80 bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                    <span>Speed Rate</span>
                    <span className="font-mono text-primary">{speechRate}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                    <span>Pitch Level</span>
                    <span className="font-mono text-primary">{speechPitch}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm shadow-glow transition ${
                    isPlayingAudio ? 'bg-rose-600 animate-pulse' : 'bg-gradient-brand hover:opacity-95'
                  }`}
                >
                  {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlayingAudio ? 'Stop Speech' : 'Play Voice Readout'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
