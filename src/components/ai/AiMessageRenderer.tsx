import React, { useState } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { PresentationViewer } from './PresentationViewer';
import { InteractiveChart } from './InteractiveChart';
import { AiGeneratedImageViewer } from './AiGeneratedImageViewer';
import { AiCodeContainer } from './AiCodeContainer';
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
import { cn } from '@/lib/utils';

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
            <AiCodeContainer
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
 * Check if text has explicit slide deck structure
 */
function isSlidePresentationDeck(text: string, plugin?: string | null): boolean {
  if (plugin === 'Generate PPT' || plugin === 'Pitch Generator' || plugin === 'ppt') return true;
  if (text.includes('marp: true')) return true;
  if (text.includes('<!-- slide -->') || text.includes('<!-- _class:')) return true;
  return false;
}

interface MessageBlock {
  type: 'text' | 'mermaid' | 'chart' | 'code';
  language?: string;
  content: string;
}

function parseMessageBlocks(rawText: string): MessageBlock[] {
  if (!rawText) return [];
  const text = rawText.replace(/\r\n/g, '\n');
  const blocks: MessageBlock[] = [];

  // Match code fences: ``` or ~~~ (3+ backticks or tildes), with optional language, up to matching fence or end of text
  const codeBlockRegex = /(?:^|\n)[ \t]*(```+|~~~+)([^\n]*)\n([\s\S]*?)(?:\n[ \t]*\1[ \t]*(?:\n|$)|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index + (fullMatch.startsWith('\n') ? 1 : 0);
    const textBefore = text.slice(lastIndex, matchIndex);

    if (textBefore.trim()) {
      blocks.push({ type: 'text', content: textBefore });
    }

    const fenceInfo = (match[2] || '').trim().toLowerCase();
    const language = fenceInfo.split(/[\s,:]+/)[0] || '';
    let content = match[3] || '';

    // Strip dangling trailing fence if matched until end of text (e.g. streaming)
    content = content.replace(/\n[ \t]*(?:```+|~~~+)[ \t]*$/, '');

    if (language === 'mermaid') {
      blocks.push({ type: 'mermaid', content: content.trim() });
    } else if (
      language === 'chart' ||
      language === 'json-chart' ||
      language === 'chart-json' ||
      isJsonChartContent(language, content)
    ) {
      blocks.push({ type: 'chart', content: content.trim() });
    } else {
      blocks.push({ type: 'code', language, content: content.trimEnd() });
    }

    lastIndex = match.index + fullMatch.length;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText.trim() || blocks.length === 0) {
    const trimmed = remainingText.trim();
    // Auto-detect if raw un-fenced HTML document was provided as the primary message
    if (
      blocks.length === 0 &&
      (/^\s*<!DOCTYPE\s+html>/i.test(trimmed) ||
        (/^\s*<html[\s>]/i.test(trimmed) && /<\/html>\s*$/i.test(trimmed)))
    ) {
      blocks.push({ type: 'code', language: 'html', content: trimmed });
    } else if (trimmed || blocks.length === 0) {
      blocks.push({ type: 'text', content: remainingText });
    }
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

interface TableData {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

function parseMarkdownTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const cleanRow = (rowStr: string) => {
    let raw = rowStr.trim();
    if (raw.startsWith('|')) raw = raw.slice(1);
    if (raw.endsWith('|')) raw = raw.slice(0, -1);
    return raw.split('|').map((cell) => cell.trim());
  };

  const headers = cleanRow(lines[0]);
  const separatorLine = lines[1];
  const sepCells = cleanRow(separatorLine);

  if (!sepCells.some((c) => c.includes('-'))) return null;

  const alignments: ('left' | 'center' | 'right')[] = sepCells.map((cell) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const rowCells = cleanRow(line);
    while (rowCells.length < headers.length) {
      rowCells.push('');
    }
    rows.push(rowCells.slice(0, headers.length));
  }

  return { headers, alignments, rows };
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // Markdown Table
    if (
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|') &&
      lines[i + 1].includes('-')
    ) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      const tableData = parseMarkdownTable(tableLines);
      if (tableData) {
        elements.push(
          <div
            key={`table-${i}`}
            className="my-3.5 overflow-x-auto rounded-xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm"
          >
            <table className="w-full text-left text-xs border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-border/80 bg-primary/10 text-primary font-bold">
                  {tableData.headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className={cn(
                        "px-3.5 py-2.5 font-bold text-[11px] sm:text-xs uppercase tracking-wider text-primary border-r border-border/40 last:border-0",
                        tableData.alignments[hIdx] === 'center' && 'text-center',
                        tableData.alignments[hIdx] === 'right' && 'text-right'
                      )}
                    >
                      {renderFormattedInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {tableData.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-primary/5 transition-colors duration-150 group"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          "px-3.5 py-2.5 text-xs text-foreground/90 leading-relaxed border-r border-border/20 last:border-0 font-normal",
                          tableData.alignments[cIdx] === 'center' && 'text-center',
                          tableData.alignments[cIdx] === 'right' && 'text-right'
                        )}
                      >
                        {renderFormattedInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j;
        continue;
      }
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={`hr-${i}`} className="my-3.5 border-border/50" />);
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h5 key={`h4-${i}`} className="text-xs font-bold text-foreground mt-2.5 mb-1 text-primary">
          {renderFormattedInline(trimmed.replace(/^####\s+/, ''))}
        </h5>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-xs sm:text-sm font-bold text-foreground mt-3 mb-1 flex items-center gap-1.5 text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {renderFormattedInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-sm sm:text-base font-bold text-foreground mt-3.5 mb-1 border-b border-border/40 pb-1">
          {renderFormattedInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-base sm:text-lg font-bold text-foreground mt-4 mb-1.5 text-primary">
          {renderFormattedInline(trimmed.replace(/^#\s+/, ''))}
        </h2>
      );
      i++;
      continue;
    }

    // Bullet point
    if (trimmed.match(/^[-*•]\s+/)) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 pl-1 my-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 mt-1.5 shrink-0" />
          <div className="flex-1 text-foreground/90">{renderFormattedInline(trimmed.replace(/^[-*•]\s+/, ''))}</div>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`nli-${i}`} className="flex items-start gap-2 pl-1 my-1">
          <span className="font-mono text-primary font-bold text-[11px] mt-0.5 shrink-0">{numMatch[1]}.</span>
          <div className="flex-1 text-foreground/90">{renderFormattedInline(numMatch[2])}</div>
        </div>
      );
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-2 border-primary/60 pl-3 py-1 italic text-muted-foreground my-1 bg-muted/10 rounded-r-lg">
          {renderFormattedInline(trimmed.replace(/^>\s*/, ''))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1 text-foreground/90 leading-relaxed">
        {renderFormattedInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function renderFormattedInline(text: string): React.ReactNode {
  if (!text) return text;

  const parts: React.ReactNode[] = [];
  const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|https?:\/\/[^\s)]+)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={`a-${match.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else if (token.startsWith('**') && token.endsWith('**')) {
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
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`em-${match.index}`} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
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
