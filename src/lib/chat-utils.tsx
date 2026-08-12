import React from "react";
import { ExternalLink, Mail, Phone } from "lucide-react";

interface RenderSmartTextProps {
  text: string;
  className?: string;
  onMentionClick?: (username: string) => void;
}

/**
 * Parses and renders text with interactive links:
 * - URLs (http, https, www) -> Clickable blue link opening in new tab
 * - Email addresses -> mailto: link
 * - Phone numbers -> tel: link
 * - Code snippets (```code``` or `code`) -> Code block / inline code
 * - Mentions (@username) -> Highlighted pill
 */
export function RenderSmartText({ text, className = "", onMentionClick }: RenderSmartTextProps) {
  if (!text) return null;

  // 1. Process code blocks with triple backticks first: ```code```
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      parts.push(parseInlineTokens(textBefore, onMentionClick, `inline-before-${match.index}`));
    }

    const codeContent = match[1].trim();
    parts.push(
      <div key={`codeblock-${match.index}`} className="my-2 overflow-x-auto rounded-xl border border-zinc-700/60 bg-zinc-950/80 p-3 text-xs font-mono text-emerald-400 shadow-inner">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2 text-[10px] uppercase tracking-wider text-zinc-500 select-none">
          <span>Code Snippet</span>
        </div>
        <pre className="whitespace-pre-wrap break-words">{codeContent}</pre>
      </div>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText) {
    parts.push(parseInlineTokens(remainingText, onMentionClick, `inline-after-last`));
  }

  return <span className={className}>{parts}</span>;
}

/**
 * Helper to parse inline URLs, single backtick code, emails, phone numbers, and @mentions
 */
function parseInlineTokens(
  str: string,
  onMentionClick?: (username: string) => void,
  keyPrefix: string = "token"
): React.ReactNode {
  // Regex token matching pattern:
  // 1. Single backtick code: `code`
  // 2. Full URL: https?:\/\/[^\s<]+ | www\.[^\s<]+
  // 3. Email address: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
  // 4. Phone number: (\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}
  // 5. User mention: @[a-zA-Z0-9_]+
  const combinedRegex =
    /(`[^`]+`)|(https?:\/\/[^\s<]+|www\.[^\s<]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|((?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(@[a-zA-Z0-9_]+)/g;

  const elements: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = combinedRegex.exec(str)) !== null) {
    const plainText = str.slice(lastIdx, m.index);
    if (plainText) {
      elements.push(plainText);
    }

    const token = m[0];
    const itemKey = `${keyPrefix}-${m.index}`;

    if (m[1]) {
      // Single backtick inline code
      const codeText = token.slice(1, -1);
      elements.push(
        <code
          key={itemKey}
          className="mx-0.5 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary font-semibold"
        >
          {codeText}
        </code>
      );
    } else if (m[2]) {
      // URL match
      let url = token;
      if (url.startsWith("www.")) {
        url = `https://${url}`;
      }
      elements.push(
        <a
          key={itemKey}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors break-all"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{token}</span>
          <ExternalLink className="h-3 w-3 shrink-0 inline" />
        </a>
      );
    } else if (m[3]) {
      // Email match
      elements.push(
        <a
          key={itemKey}
          href={`mailto:${token}`}
          className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="h-3 w-3 shrink-0 inline" />
          <span>{token}</span>
        </a>
      );
    } else if (m[4]) {
      // Phone number match
      const cleanPhone = token.replace(/[^\d+]/g, "");
      elements.push(
        <a
          key={itemKey}
          href={`tel:${cleanPhone}`}
          className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="h-3 w-3 shrink-0 inline" />
          <span>{token}</span>
        </a>
      );
    } else if (m[5]) {
      // Mention match @username
      const username = token.slice(1);
      elements.push(
        <span
          key={itemKey}
          onClick={(e) => {
            e.stopPropagation();
            if (onMentionClick) onMentionClick(username);
          }}
          className="inline-flex items-center rounded-md bg-gradient-brand-soft px-1.5 py-0.5 text-xs font-semibold text-primary-foreground cursor-pointer hover:underline transition-all"
        >
          {token}
        </span>
      );
    }

    lastIdx = combinedRegex.lastIndex;
  }

  const remaining = str.slice(lastIdx);
  if (remaining) {
    elements.push(remaining);
  }

  return <React.Fragment key={keyPrefix}>{elements}</React.Fragment>;
}
