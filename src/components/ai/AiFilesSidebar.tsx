import { useMemo } from 'react';
import {
  FileText,
  Presentation,
  Workflow,
  Download,
  ExternalLink,
  X,
  FileCode,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { openFileInNewTab, type AiConversation, type AiFileAttachment } from '@/lib/ai-api';
import { toast } from 'sonner';

interface AiFilesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: AiConversation[];
  activeChatId: string | null;
  onSelectFile?: (file: AiFileAttachment) => void;
}

interface ArtifactItem {
  id: string;
  title: string;
  type: string;
  format: 'MD' | 'PPTX' | 'MERMAID' | 'CODE';
  icon: any;
  content: string;
  conversationTitle: string;
}

export function AiFilesSidebar({
  isOpen,
  onClose,
  conversations,
  activeChatId,
}: AiFilesSidebarProps) {
  // Collect all uploaded files across room conversations (or active conversation)
  const { uploadedFiles, artifacts } = useMemo(() => {
    const filesMap = new Map<string, AiFileAttachment>();
    const artifactList: ArtifactItem[] = [];

    // Prioritize active conversation first, then other room conversations
    const targetConvs = activeChatId
      ? [
          ...conversations.filter((c) => c.id === activeChatId),
          ...conversations.filter((c) => c.id !== activeChatId),
        ]
      : conversations;

    for (const conv of targetConvs) {
      for (const msg of conv.messages) {
        // Collect attached files
        if (msg.fileAttachment && msg.fileAttachment.name) {
          const key = `${msg.fileAttachment.name}_${msg.fileAttachment.size || 0}`;
          if (!filesMap.has(key)) {
            filesMap.set(key, {
              ...msg.fileAttachment,
              author_name: msg.author_name || msg.fileAttachment.author_name || 'Team Member',
            });
          }
        }

        // Collect AI-generated artifacts (Decks, Flowcharts, READMEs)
        if (msg.sender === 'ai' && msg.text) {
          if (
            msg.plugin === 'Generate PPT' ||
            (msg.text.includes('# Slide 1') && msg.text.includes('---'))
          ) {
            artifactList.push({
              id: `art-ppt-${msg.id}`,
              title: conv.title ? `${conv.title} Deck` : 'Presentation Pitch Deck',
              type: 'Pitch Deck',
              format: 'PPTX',
              icon: Presentation,
              content: msg.text,
              conversationTitle: conv.title,
            });
          } else if (msg.text.includes('```mermaid')) {
            artifactList.push({
              id: `art-diag-${msg.id}`,
              title: conv.title ? `${conv.title} Flowchart` : 'Architecture Diagram',
              type: 'System Flowchart',
              format: 'MERMAID',
              icon: Workflow,
              content: msg.text,
              conversationTitle: conv.title,
            });
          } else if (
            msg.plugin === 'Generate README' ||
            (msg.text.includes('# ') && msg.text.includes('## Installation'))
          ) {
            artifactList.push({
              id: `art-readme-${msg.id}`,
              title: 'Project README.md',
              type: 'Documentation',
              format: 'MD',
              icon: FileCode,
              content: msg.text,
              conversationTitle: conv.title,
            });
          } else if (msg.text.length > 500 && (msg.text.includes('### ') || msg.text.includes('## '))) {
            const firstHeader = msg.text.match(/^#+\s*(.+)$/m);
            const title = firstHeader ? firstHeader[1].slice(0, 30) : conv.title;
            artifactList.push({
              id: `art-doc-${msg.id}`,
              title: title || 'Workspace Document',
              type: 'Document',
              format: 'MD',
              icon: FileText,
              content: msg.text,
              conversationTitle: conv.title,
            });
          }
        }
      }
    }

    return {
      uploadedFiles: Array.from(filesMap.values()),
      artifacts: artifactList.slice(0, 15),
    };
  }, [conversations, activeChatId]);

  if (!isOpen) return null;

  const handleDownloadArtifact = (art: ArtifactItem) => {
    const blob = new Blob([art.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${art.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${art.title}"`);
  };

  return (
    <div className="w-full md:w-80 border-l border-border bg-sidebar/85 backdrop-blur-xl flex flex-col h-full overflow-hidden transition-all duration-300 z-30 shadow-spatial">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/80 bg-card/30 shrink-0">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Artifacts & Content
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition"
          title="Close Sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Two Independent Scrollable Panels with Separate Vertical Scrollbars */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 gap-3">
        {/* ---------------- 1. ARTIFACTS PANEL (SEPARATE VERTICAL SCROLLBAR) ---------------- */}
        <div className="flex-1 flex flex-col min-h-0 bg-card/30 rounded-2xl border border-border/60 p-3 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 mb-2">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Artifacts
            </h4>
            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">
              {artifacts.length}
            </span>
          </div>

          {/* Independent Vertical Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {artifacts.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-border/70 text-center text-muted-foreground text-[11px] space-y-1 my-auto">
                <Sparkles className="h-4 w-4 text-primary mx-auto" />
                <p>No generated artifacts yet.</p>
                <p className="text-[10px] text-muted-foreground/75">
                  Generate PPTs, diagrams, or READMEs to see them here.
                </p>
              </div>
            ) : (
              artifacts.map((art) => {
                const Icon = art.icon;
                return (
                  <div
                    key={art.id}
                    className="group relative flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card/50 hover:bg-card hover:border-primary/40 transition shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 grid place-items-center shrink-0 border border-primary/20">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="truncate">
                        <h5 className="font-semibold text-foreground text-[11px] truncate">
                          {art.title}
                        </h5>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {art.type} • {art.format}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadArtifact(art)}
                      className="p-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-primary/20 hover:text-primary transition shrink-0"
                      title="Download artifact"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ---------------- 2. CONTENT & FILES PANEL (SEPARATE VERTICAL SCROLLBAR) ---------------- */}
        <div className="flex-1 flex flex-col min-h-0 bg-card/30 rounded-2xl border border-border/60 p-3 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 mb-2">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-emerald-400" />
              Content & Files
            </h4>
            <span className="text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5 font-semibold">
              {uploadedFiles.length}
            </span>
          </div>

          {/* Independent Vertical Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            {uploadedFiles.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-border/70 text-center text-muted-foreground text-[11px] space-y-1 my-auto">
                <FileText className="h-4 w-4 text-emerald-400 mx-auto" />
                <p>No attached files in this room.</p>
                <p className="text-[10px] text-muted-foreground/75">
                  Drag & drop or attach PDFs, code, docs, and images.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {uploadedFiles.map((file, idx) => {
                  const isImage =
                    file.type?.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|webp)$/i);
                  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

                  return (
                    <div
                      key={idx}
                      onClick={() => openFileInNewTab(file)}
                      className="group relative cursor-pointer flex flex-col justify-between p-2 rounded-xl border border-border/80 bg-card/50 hover:bg-card hover:border-emerald-500/40 transition shadow-sm overflow-hidden h-24"
                    >
                      {/* Visual Preview / Thumbnail */}
                      <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-black/40 p-1 mb-1 border border-border/40 relative">
                        {isImage && file.dataUrl ? (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="h-full w-full object-cover rounded"
                          />
                        ) : isPdf ? (
                          <div className="text-center">
                            <FileText className="h-5 w-5 text-red-400 mx-auto" />
                            <span className="text-[7px] uppercase font-bold text-red-400 tracking-wider">
                              PDF
                            </span>
                          </div>
                        ) : (
                          <div className="p-1 text-[8px] font-mono text-cyan-300 line-clamp-2 text-left w-full leading-tight opacity-75">
                            {file.extractedText ? file.extractedText.slice(0, 80) : file.name}
                          </div>
                        )}

                        <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[7px] font-mono bg-black/80 text-white border border-white/20">
                          {isPdf ? 'PDF' : isImage ? 'IMG' : 'FILE'}
                        </span>
                      </div>

                      {/* Filename & Info */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="truncate font-semibold text-foreground/90 max-w-[80px]">
                          {file.name}
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground group-hover:text-emerald-400 shrink-0 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
