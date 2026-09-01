import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Copy,
  Check,
  Code2,
  Eye,
  Download,
  RotateCcw,
  ExternalLink,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  Terminal,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface AiCodeContainerProps {
  language?: string;
  code: string;
  className?: string;
}

export function AiCodeContainer({
  language: initialLanguage = 'text',
  code: initialCode = '',
  className = '',
}: AiCodeContainerProps) {
  // Normalize language identifier
  const cleanLang = (initialLanguage || 'text').trim().toLowerCase();

  // Determine if code is HTML or contains HTML/Web markup
  const isHtml = useMemo(() => {
    const htmlLanguages = ['html', 'htm', 'xhtml', 'svg', 'xml'];
    if (htmlLanguages.includes(cleanLang)) return true;

    // Auto-detect HTML markup if language is generic or unspecified
    const trimmed = initialCode.trim();
    if (
      cleanLang === '' ||
      cleanLang === 'text' ||
      cleanLang === 'markup' ||
      cleanLang === 'xml'
    ) {
      if (
        /<!DOCTYPE\s+html>/i.test(trimmed) ||
        /<html[\s>]/i.test(trimmed) ||
        (/<head[\s>]/i.test(trimmed) && /<body[\s>]/i.test(trimmed)) ||
        (/<(?:div|section|main|style|canvas|svg|header|nav|article|button)[\s>]/i.test(trimmed) &&
          /<\/(?:div|section|main|style|canvas|svg|header|nav|article|button)>/i.test(trimmed))
      ) {
        return true;
      }
    }
    return false;
  }, [cleanLang, initialCode]);

  // Code state (editable)
  const [code, setCode] = useState(initialCode);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>(() => {
    // If HTML code, default to 'code' with instant preview switch ready
    return 'code';
  });
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync if initialCode changes externally (e.g., during streaming tokens)
  useEffect(() => {
    if (!isEdited) {
      setCode(initialCode);
    }
  }, [initialCode, isEdited]);

  // Handle Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code.');
    }
  };

  // Handle Reset to original AI code
  const handleReset = () => {
    setCode(initialCode);
    setIsEdited(false);
    toast.info('Code reset to original version.');
  };

  // Handle Download Code File
  const handleDownload = () => {
    const extMap: Record<string, string> = {
      html: 'html',
      htm: 'html',
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      css: 'css',
      json: 'json',
      python: 'py',
      py: 'py',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      'c++': 'cpp',
      csharp: 'cs',
      cs: 'cs',
      go: 'go',
      rust: 'rs',
      rs: 'rs',
      php: 'php',
      ruby: 'rb',
      rb: 'rb',
      sql: 'sql',
      sh: 'sh',
      bash: 'sh',
      shell: 'sh',
      markdown: 'md',
      md: 'md',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      svg: 'svg',
    };

    const ext = extMap[cleanLang] || (isHtml ? 'html' : 'txt');
    const filename = `code_snippet.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  // Open HTML in a new tab
  const handleOpenNewTab = () => {
    const blob = new Blob([getSanitizedHtml(code)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Tab key handling in textarea for smooth code editing experience
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setIsEdited(true);

      // Restore cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Sync line numbers scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Generate line numbers
  const lines = useMemo(() => {
    return code.split('\n');
  }, [code]);
  const lineCount = Math.max(1, lines.length);

  // Construct iframe preview document
  const previewDoc = useMemo(() => {
    return getSanitizedHtml(code);
  }, [code]);

  // Device width mapping for live preview
  const previewWidthClass = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto border-x border-border/40 shadow-2xl',
    mobile: 'max-w-[390px] mx-auto border-x border-border/40 shadow-2xl',
  }[previewDevice];

  // Language display name
  const displayLang = cleanLang ? cleanLang.toUpperCase() : 'CODE';

  return (
    <div
      className={`my-3 rounded-xl border border-zinc-800 bg-[#0d1117] text-slate-100 overflow-hidden shadow-lg transition-all ${
        isFullscreen
          ? 'fixed inset-3 z-50 my-0 max-h-none flex flex-col bg-[#0d1117] border-primary/50 shadow-2xl backdrop-blur-2xl'
          : ''
      } ${className}`}
    >
      {/* Container Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/90 text-xs text-zinc-400 select-none flex-wrap gap-2">
        {/* Left: Language Indicator & Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 font-mono text-[11px] font-semibold text-zinc-200 tracking-wider">
            {cleanLang === 'html' || isHtml ? (
              <FileCode className="h-3.5 w-3.5 text-orange-400" />
            ) : cleanLang === 'javascript' || cleanLang === 'js' || cleanLang === 'ts' || cleanLang === 'typescript' ? (
              <Code2 className="h-3.5 w-3.5 text-amber-400" />
            ) : cleanLang === 'python' || cleanLang === 'py' ? (
              <Terminal className="h-3.5 w-3.5 text-sky-400" />
            ) : cleanLang === 'css' ? (
              <Code2 className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <Terminal className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{displayLang}</span>
          </div>

          {/* Edited indicator & Reset button */}
          {isEdited && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                Edited
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition"
                title="Reset code to original AI output"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Code/Preview Switcher (if HTML), Copy, Download, Fullscreen */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Real-time HTML Preview Toggle */}
          {isHtml && (
            <div className="flex items-center rounded-lg bg-zinc-800/90 p-0.5 border border-zinc-700/60 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-medium transition ${
                  activeTab === 'code'
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-medium transition ${
                  activeTab === 'preview'
                    ? 'bg-emerald-500 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="View Real-Time Live HTML Preview"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span className="flex items-center gap-1">
                  Preview
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                </span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-700/50 pl-1.5">
            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-[11px]"
              title="Download code snippet"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition text-[11px] font-medium border border-zinc-700/50"
              title="Copy code to clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-[10px]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-300" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>

            
          </div>
        </div>
      </div>

      {/* Container Content: Code Editor vs Real-Time Preview */}
      {activeTab === 'code' ? (
        <div
          className={`relative flex font-mono text-xs sm:text-[13px] bg-[#0d1117] text-emerald-400 ${
            isFullscreen ? 'flex-1 overflow-hidden' : ''
          }`}
          style={{
            height: isFullscreen ? '100%' : `${Math.min(500, Math.max(120, lineCount * 24 + 28))}px`,
          }}
        >
          {/* Line Numbers Column */}
          <div
            ref={lineNumbersRef}
            className="select-none py-3 px-2.5 text-right text-zinc-600 bg-zinc-950/80 border-r border-zinc-800 text-[11px] font-mono shrink-0 overflow-hidden leading-6"
            style={{ width: `${Math.max(38, String(lineCount).length * 9 + 20)}px` }}
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Editable Textarea / Code Area */}
          <div className="relative flex-1 min-w-0 h-full overflow-hidden">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setIsEdited(true);
              }}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              wrap="off"
              className="w-full h-full p-3 font-mono text-xs sm:text-[13px] text-emerald-300 bg-transparent border-none outline-none resize-none leading-6 overflow-auto whitespace-pre tab-[2] selection:bg-primary/30 custom-scrollbar"
              placeholder="Enter code here..."
            />
          </div>
        </div>
      ) : (
        /* Real-Time HTML Live Preview Container */
        <div className={`flex flex-col bg-zinc-900 ${isFullscreen ? 'flex-1' : 'min-h-[350px] max-h-[600px]'}`}>
          {/* Preview Sub-toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border-b border-zinc-800 text-[11px] text-zinc-400 flex-wrap gap-2">
            {/* Device Width Switches */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded transition ${
                  previewDevice === 'desktop' ? 'bg-primary/20 text-primary' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Desktop View (100% width)"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded transition ${
                  previewDevice === 'tablet' ? 'bg-primary/20 text-primary' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded transition ${
                  previewDevice === 'mobile' ? 'bg-primary/20 text-primary' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title="Mobile View (390px)"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live sandbox
              </span>

              {/* Reload preview */}
              <button
                type="button"
                onClick={() => setIframeKey((prev) => prev + 1)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-[10px]"
                title="Refresh preview frame"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reload</span>
              </button>

              {/* Open in new tab */}
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-[10px]"
                title="Open preview in new browser tab"
              >
                <ExternalLink className="h-3 w-3" />
                <span>New Tab</span>
              </button>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div className="flex-1 p-2 bg-zinc-950/60 overflow-auto flex items-center justify-center min-h-[300px]">
            <div className={`h-full w-full transition-all duration-200 ${previewWidthClass}`}>
              <iframe
                key={iframeKey}
                title="HTML Live Preview"
                srcDoc={previewDoc}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full h-full min-h-[320px] rounded-lg bg-white border border-zinc-800 shadow-inner"
                style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '350px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ensures HTML preview document has viewport and proper base styling if missing
 */
function getSanitizedHtml(rawHtml: string): string {
  const trimmed = rawHtml.trim();

  // If complete HTML document already exists
  if (/<html[\s>]/i.test(trimmed) || /<!DOCTYPE\s+html>/i.test(trimmed)) {
    return trimmed;
  }

  // If snippet or component, wrap nicely with standard Tailwind / typography styles
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hackord AI Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 16px;
      color: #1e293b;
      background-color: #ffffff;
      box-sizing: border-box;
    }
    *, *::before, *::after {
      box-sizing: inherit;
    }
  </style>
</head>
<body>
  ${trimmed}
</body>
</html>`;
}
