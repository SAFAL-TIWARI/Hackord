import React, { useState } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { PresentationViewer } from './PresentationViewer';
import { Copy, Check, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface AiMessageRendererProps {
  text: string;
  plugin?: string | null;
}

export function AiMessageRenderer({ text, plugin }: AiMessageRendererProps) {
  // Check if text is a slide presentation deck (either PPT plugin or contains multiple # Slide markers)
  const isSlideDeck =
    plugin === 'Generate PPT' ||
    (text.includes('# Slide 1') && (text.includes('# Slide 2') || text.includes('---')));

  if (isSlideDeck) {
    return <PresentationViewer rawMarkdown={text} />;
  }

  // Parse text into blocks (Mermaid code blocks, general code blocks, and standard markdown paragraphs)
  const blocks = parseMessageBlocks(text);

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed min-w-0 break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'mermaid') {
          return <MermaidDiagram key={idx} chart={block.content} />;
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
    </div>
  );
}

interface MessageBlock {
  type: 'text' | 'mermaid' | 'code';
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
  // Parse inline bold (**bold**), inline code (`code`), and links ([text](url))
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
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-muted/40 font-mono text-[11px] text-cyan-400 border border-border/40">
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
