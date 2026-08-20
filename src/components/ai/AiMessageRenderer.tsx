import React, { useState } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { PresentationViewer } from './PresentationViewer';
import { InteractiveChart } from './InteractiveChart';
import { AiGeneratedImageViewer } from './AiGeneratedImageViewer';
import {
  Copy,
  Check,
  Terminal,
  Presentation,
  Download,
  FileText,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPdf, exportToDocx, exportToCsv, exportToMarkdown } from '@/lib/document-exporter';

interface AiMessageRendererProps {
  text: string;
  plugin?: string | null;
  isStreaming?: boolean;
}

export function AiMessageRenderer({ text, plugin, isStreaming }: AiMessageRendererProps) {
  const [showPresentationViewer, setShowPresentationViewer] = useState<boolean>(() => {
    return isSlidePresentationDeck(text, plugin);
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check if message is an AI Image generation request / response
  const imageMatch = text.match(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
  const isImageGeneration =
    plugin === 'Generate Image' ||
    plugin === 'image' ||
    plugin === 'Create Image' ||
    Boolean(imageMatch) ||
    text.startsWith('https://image.pollinations.ai') ||
    text.includes('pollinations.ai/prompt');

  if (isImageGeneration) {
    let imageUrl = '';
    let prompt = '';

    if (imageMatch) {
      prompt = imageMatch[1] || 'AI Generated Image';
      imageUrl = imageMatch[2];
    } else if (text.trim().startsWith('http')) {
      imageUrl = text.trim();
      prompt = 'AI Generated Image';
    } else {
      prompt = text.trim();
      const encoded = encodeURIComponent(`${prompt}, high quality 8k photorealistic masterpiece`);
      imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&model=flux`;
    }

    return <AiGeneratedImageViewer imageUrl={imageUrl} prompt={prompt} modelName="Google Imagen 3" />;
  }

  // Check if text is a slide presentation deck
  const isDetectedDeck = isSlidePresentationDeck(text, plugin);

  // Text-To-Speech SpeechSynthesis player
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text for speech
    const cleanSpeechText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_>]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    toast.success('Playing voice readout...');
  };

  // If user requested presentation or auto-detected deck
  if (showPresentationViewer) {
    return (
      <div className="space-y-2">
        <PresentationViewer
          rawMarkdown={text}
          onClose={() => setShowPresentationViewer(false)}
        />
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowPresentationViewer(false)}
            className="text-[11px] text-muted-foreground hover:text-foreground underline transition"
          >
            Switch to Standard Markdown View
          </button>
        </div>
      </div>
    );
  }

  // Parse text into blocks (Mermaid diagrams, Interactive charts, Code blocks, and Markdown)
  const blocks = parseMessageBlocks(text);
  const hasTable = text.includes('|') && text.includes('---');

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed min-w-0 break-words">
      {/* Quick Action Toolbar */}
      <div className="flex items-center justify-between gap-1.5 py-1 px-2 rounded-lg bg-muted/10 border border-border/40 text-[11px] text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Open in Slide Deck button if slide markers or PPT plugin exists */}
          {isDetectedDeck && (
            <button
              type="button"
              onClick={() => setShowPresentationViewer(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition font-semibold"
            >
              <Presentation className="h-3 w-3" />
              <span>Open Slide Deck (.PPTX)</span>
            </button>
          )}

          {/* Export PDF */}
          <button
            type="button"
            onClick={() => exportToPdf('Hackord AI Document', text)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition"
            title="Download formatted PDF"
          >
            <FileText className="h-3 w-3" />
            <span>PDF</span>
          </button>

          {/* Export DOCX */}
          <button
            type="button"
            onClick={() => exportToDocx('Hackord AI Document', text)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition"
            title="Download Microsoft Word document (.docx)"
          >
            <Download className="h-3 w-3" />
            <span>DOCX</span>
          </button>

          {/* Export CSV if table detected */}
          {hasTable && (
            <button
              type="button"
              onClick={() => exportToCsv(text, 'hackord_data.csv')}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
              title="Download table as CSV spreadsheet"
            >
              <FileSpreadsheet className="h-3 w-3" />
              <span>CSV</span>
            </button>
          )}

          {/* Export Markdown */}
          <button
            type="button"
            onClick={() => exportToMarkdown(text, 'hackord_ai_response.md')}
            className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition"
            title="Download raw Markdown (.md)"
          >
            <FileCode className="h-3 w-3" />
            <span>MD</span>
          </button>
        </div>

        {/* Audio TTS Speech Synthesis */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition ${
              isSpeaking
                ? 'bg-primary text-white font-semibold animate-pulse'
                : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
            }`}
            title={isSpeaking ? 'Stop voice readout' : 'Listen to response'}
          >
            {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
          </button>
        </div>
      </div>

      {/* Render Parsed Blocks */}
      {blocks.map((block, idx) => {
        if (block.type === 'mermaid') {
          return <MermaidDiagram key={idx} chart={block.content} />;
        }

        if (block.type === 'chart') {
          return <InteractiveChart key={idx} rawSpec={block.content} />;
        }

        if (block.type === 'code') {
          return (
            <CodeBlock
              key={idx}
              language={block.language || 'text'}
              code={block.content}
            />
          );
        }

        return <MarkdownText key={idx} content={block.content} />;
      })}

      {isStreaming && (
        <span className="inline-flex items-center gap-1 text-primary font-mono text-xs animate-pulse font-bold mt-1">
          <span className="inline-block w-1.5 h-3.5 bg-primary rounded-sm align-middle" />
          <span className="text-[10px] text-muted-foreground font-sans">generating...</span>
        </span>
      )}
    </div>
  );
}

/**
 * Check if text has slide deck structure
 */
function isSlidePresentationDeck(text: string, plugin?: string | null): boolean {
  if (plugin === 'Generate PPT' || plugin === 'Pitch Generator' || plugin === 'ppt') return true;
  if (text.includes('marp: true')) return true;
  if (text.includes('# Slide 1') && (text.includes('# Slide 2') || text.includes('---'))) return true;
  if (text.includes('<!-- slide -->') || text.includes('<!-- _class:')) return true;
  return false;
}

interface MessageBlock {
  type: 'text' | 'mermaid' | 'chart' | 'code';
  language?: string;
  content: string;
}

function parseMessageBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      blocks.push({ type: 'text', content: textBefore });
    }

    const language = (match[1] || '').trim().toLowerCase();
    const content = match[2].trim();

    if (language === 'mermaid') {
      blocks.push({ type: 'mermaid', content });
    } else if (
      language === 'chart' ||
      language === 'json-chart' ||
      language === 'chart-json' ||
      isJsonChartContent(language, content)
    ) {
      blocks.push({ type: 'chart', content });
    } else {
      blocks.push({ type: 'code', language, content });
    }

    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText.trim() || blocks.length === 0) {
    blocks.push({ type: 'text', content: remainingText });
  }

  return blocks;
}

/**
 * Check if a JSON block is a Chart specification
 */
function isJsonChartContent(language: string, content: string): boolean {
  if (language !== 'json' && language !== '') return false;
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed.type || parsed.chartType) &&
      (Array.isArray(parsed.data) || parsed.kpi)
    ) {
      const validTypes = [
        'area',
        'line',
        'bar',
        'column',
        'stacked-bar',
        'pie',
        'donut',
        'radar',
        'pareto',
        'kpi',
        'sparkline',
        'geo-bubble',
        'histogram',
      ];
      const t = (parsed.type || parsed.chartType || '').toLowerCase();
      return validTypes.includes(t);
    }
  } catch (e) {
    return false;
  }
  return false;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-border/80 bg-slate-950/90 dark:bg-black/95 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/20 text-[11px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1.5 text-foreground/80 font-semibold">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground transition text-[10px]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono overflow-x-auto text-emerald-300 dark:text-emerald-300 leading-normal custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headers
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs sm:text-sm font-bold text-foreground mt-2 mb-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {renderFormattedInline(line.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm sm:text-base font-bold text-foreground mt-3 mb-1 border-b border-border/40 pb-1">
              {renderFormattedInline(line.replace(/^##\s+/, ''))}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-base sm:text-lg font-bold text-foreground mt-3 mb-1.5 text-primary">
              {renderFormattedInline(line.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // Bullet point
        if (trimmed.match(/^[-*•]\s+/)) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 mt-1.5 shrink-0" />
              <div className="flex-1 text-foreground/90">{renderFormattedInline(trimmed.replace(/^[-*•]\s+/, ''))}</div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-mono text-primary font-bold text-[11px] mt-0.5 shrink-0">{numMatch[1]}.</span>
              <div className="flex-1 text-foreground/90">{renderFormattedInline(numMatch[2])}</div>
            </div>
          );
        }

        // Blockquote
        if (trimmed.startsWith('>')) {
          return (
            <blockquote key={idx} className="border-l-2 border-primary/60 pl-3 italic text-muted-foreground my-1 bg-muted/10 py-1 rounded-r-lg">
              {renderFormattedInline(trimmed.replace(/^>\s*/, ''))}
            </blockquote>
          );
        }

        // Table row
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          if (trimmed.includes('---')) {
            return null;
          }
          const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
          return (
            <div key={idx} className="overflow-x-auto my-1">
              <div className="flex items-center gap-2 py-1 px-2 rounded bg-muted/20 border border-border/40 font-mono text-[11px]">
                {cells.map((cell, cIdx) => (
                  <div key={cIdx} className="flex-1 min-w-[80px]">
                    {renderFormattedInline(cell)}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-foreground/90">
            {renderFormattedInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderFormattedInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-muted/50 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 border border-border/40 font-medium">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      parts.push(
        <a
          key={match.index}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:opacity-80 break-all"
        >
          {token}
        </a>
      );
    }

    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}
