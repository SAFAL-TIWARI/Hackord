import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  BrainCircuit,
  Globe,
  Bot,
  Send,
  Mic,
  MicOff,
  Trash2,
  ExternalLink,
  Users,
  Trophy,
  CalendarDays,
  MapPin,
  Clock,
  Zap,
  Loader2,
  Lock,
  ArrowRight,
  Copy,
  Check,
  Compass,
  Square,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import {
  getExploreConversation,
  sendExploreChatMessage,
  clearExploreConversation,
  type ExploreAiMessage,
} from "@/lib/explore-ai-api";
import type { Hackathon } from "@/lib/hackathon-data";
import { formatDateWord } from "@/lib/date-utils";
import { AiCodeContainer } from "@/components/ai/AiCodeContainer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExploreAiAssistantProps {
  onCreateRoom: (hackathon: Hackathon) => void;
  availableHackathons?: Hackathon[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "TBD";
  return formatDateWord(iso);
}

function daysUntil(iso: string) {
  if (!iso) return 999;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getUrgencyBadge(iso: string) {
  const d = daysUntil(iso);
  if (d < 0) return <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400">Ended</Badge>;
  if (d === 0) return <Badge className="text-[10px] bg-red-600/90 text-white animate-pulse">Ends Today</Badge>;
  if (d <= 3) return <Badge className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40">{d}d left</Badge>;
  if (d <= 7) return <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40">{d}d left</Badge>;
  return <Badge variant="outline" className="text-[10px] text-muted-foreground">{d} days left</Badge>;
}

function groupMessagesByDate(messages: ExploreAiMessage[]) {
  const grouped: Array<{ type: "date"; label: string } | { type: "message"; message: ExploreAiMessage }> = [];
  let lastDate = "";

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  for (const msg of messages) {
    const msgDate = msg.date || (msg.createdAt ? msg.createdAt.split("T")[0] : todayStr);

    if (msgDate !== lastDate) {
      let label = msgDate;
      if (msgDate === todayStr) label = "Today";
      else if (msgDate === yesterdayStr) label = "Yesterday";
      else {
        try {
          label = new Date(msgDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } catch {
          label = msgDate;
        }
      }

      grouped.push({ type: "date", label });
      lastDate = msgDate;
    }

    grouped.push({ type: "message", message: msg });
  }

  return grouped;
}

// ─── Smart Markdown & Table Renderer ──────────────────────────────────────────

interface TableData {
  headers: string[];
  alignments: ("left" | "center" | "right")[];
  rows: string[][];
}

function parseMarkdownTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const cleanRow = (rowStr: string) => {
    let raw = rowStr.trim();
    if (raw.startsWith("|")) raw = raw.slice(1);
    if (raw.endsWith("|")) raw = raw.slice(0, -1);
    return raw.split("|").map((cell) => cell.trim());
  };

  const headers = cleanRow(lines[0]);
  const separatorLine = lines[1];
  const sepCells = cleanRow(separatorLine);

  if (!sepCells.some((c) => c.includes("-"))) return null;

  const alignments: ("left" | "center" | "right")[] = sepCells.map((cell) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
    if (trimmed.endsWith(":")) return "right";
    return "left";
  });

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const rowCells = cleanRow(line);
    while (rowCells.length < headers.length) {
      rowCells.push("");
    }
    rows.push(rowCells.slice(0, headers.length));
  }

  return { headers, alignments, rows };
}

function RenderAiMarkdown({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code block
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      const codeFence = trimmed.slice(0, 3);
      const codeLanguage = trimmed.replace(/^[~`]{3,}/, "").trim() || "text";
      const codeBlockBuffer: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(codeFence)) {
        codeBlockBuffer.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing fence
      elements.push(
        <AiCodeContainer
          key={`cb-${i}`}
          language={codeLanguage}
          code={codeBlockBuffer.join("\n")}
        />
      );
      continue;
    }

    // 2. Empty line
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 3. Markdown Table (starts with | and followed by separator row)
    if (
      trimmed.startsWith("|") &&
      trimmed.endsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith("|") &&
      lines[i + 1].includes("-")
    ) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith("|") && lines[j].trim().endsWith("|")) {
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
                        tableData.alignments[hIdx] === "center" && "text-center",
                        tableData.alignments[hIdx] === "right" && "text-right"
                      )}
                    >
                      {formatInline(h)}
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
                          tableData.alignments[cIdx] === "center" && "text-center",
                          tableData.alignments[cIdx] === "right" && "text-right"
                        )}
                      >
                        {formatInline(cell)}
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

    // 4. Horizontal Rules
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(<hr key={`hr-${i}`} className="my-3.5 border-border/50" />);
      i++;
      continue;
    }

    // 5. Headers
    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h5 key={`h4-${i}`} className="font-bold text-foreground text-xs mt-2.5 mb-1 text-primary">
          {formatInline(trimmed.replace(/^####\s+/, ""))}
        </h5>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${i}`} className="font-bold text-foreground text-xs sm:text-sm mt-3 mb-1 text-primary flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {formatInline(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${i}`} className="font-bold text-foreground text-sm sm:text-base mt-3.5 mb-1.5 border-b border-border/30 pb-1">
          {formatInline(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${i}`} className="font-bold text-foreground text-base sm:text-lg mt-4 mb-2 text-primary">
          {formatInline(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      i++;
      continue;
    }

    // 6. Blockquote
    if (trimmed.startsWith(">")) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-2 border-primary/60 pl-3 py-1 my-1.5 italic text-muted-foreground bg-muted/10 rounded-r-lg"
        >
          {formatInline(trimmed.replace(/^>\s*/, ""))}
        </blockquote>
      );
      i++;
      continue;
    }

    // 7. Bullet points
    if (trimmed.match(/^[-*•]\s+/)) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 text-muted-foreground pl-1">
          <span className="text-primary mt-1 text-[10px]">•</span>
          <span className="flex-1 text-foreground/90">{formatInline(trimmed.replace(/^[-*•]\s+/, ""))}</span>
        </div>
      );
      i++;
      continue;
    }

    // 8. Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`nli-${i}`} className="flex items-start gap-2 my-1 text-muted-foreground pl-1">
          <span className="text-primary font-mono text-[10px] mt-0.5">{numMatch[1]}.</span>
          <span className="flex-1 text-foreground/90">{formatInline(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // 9. Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-foreground/90">
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  if (!text) return text;

  const tokens: React.ReactNode[] = [];
  const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|https?:\/\/[^\s)]+)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        tokens.push(
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
        tokens.push(token);
      }
    } else if (token.startsWith("**") && token.endsWith("**")) {
      tokens.push(
        <strong key={`b-${match.index}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push(
        <code
          key={`c-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-muted/60 text-primary font-mono text-[11px] border border-border/50"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push(
        <em key={`em-${match.index}`} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("http://") || token.startsWith("https://")) {
      tokens.push(
        <a
          key={`u-${match.index}`}
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
    tokens.push(text.substring(lastIdx));
  }

  return tokens.length > 0 ? tokens : text;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExploreAiAssistant({ onCreateRoom }: ExploreAiAssistantProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ExploreAiMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingUserMessage, setEditingUserMessage] = useState<ExploreAiMessage | null>(null);

  // Find ID of the latest user prompt message so Edit button only shows on latest prompt
  const latestUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "user") {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // Speech Recognition state (matching rooms.$roomId.tsx implementation)
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load conversation from DB when logged in
  useEffect(() => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

    let isMounted = true;
    async function loadConversation() {
      setInitialLoading(true);
      try {
        const conv = await getExploreConversation();
        if (isMounted && conv && conv.messages) {
          setMessages(conv.messages);
        }
      } catch (err) {
        console.error("[ExploreAiAssistant] Error loading conversation:", err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    loadConversation();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-IN";

        rec.onresult = (event: any) => {
          let finalSessionTranscript = "";
          let interimSessionTranscript = "";

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalSessionTranscript += transcript;
            } else {
              interimSessionTranscript += transcript;
            }
          }

          const sessionTranscript = (finalSessionTranscript + interimSessionTranscript).trim();
          if (sessionTranscript) {
            const newText = baseTextRef.current
              ? `${baseTextRef.current} ${sessionTranscript}`
              : sessionTranscript;
            setInputPrompt(newText);
          }
        };

        rec.onerror = (e: any) => {
          console.error("[Voice typing error]", e.error);
          setIsRecording(false);
          if (e.error === "not-allowed") {
            toast.error("Microphone permission denied. Please allow microphone access.");
          } else {
            toast.error(`Voice typing error: ${e.error}`);
          }
        };

        rec.onend = () => setIsRecording(false);
        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
      toast.info("Voice typing stopped.");
    } else {
      baseTextRef.current = inputPrompt;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening... Speak your prompt now!", { duration: 2500 });
      } catch (err) {
        console.error(err);
        toast.error("Could not start microphone.");
        setIsRecording(false);
      }
    }
  };

  // Start editing a previous user prompt
  const handleStartEditPrompt = (msg: ExploreAiMessage) => {
    setEditingUserMessage(msg);
    setInputPrompt(msg.text);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelEditPrompt = () => {
    setEditingUserMessage(null);
    setInputPrompt("");
  };

  // Stop Response Generator
  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    toast.info("AI generation stopped.");
  };

  // Submit Prompt (handles new prompt or editing previous prompt)
  const handleSendPrompt = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || loading) return;

    if (!user) {
      toast.error("Please sign in to ask questions and save AI responses.");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
    }

    const editingMsg = editingUserMessage;
    setInputPrompt("");
    setEditingUserMessage(null);

    const tempUserMsg: ExploreAiMessage = {
      id: editingMsg ? editingMsg.id : `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().split("T")[0],
      isEdited: Boolean(editingMsg),
    };

    if (editingMsg) {
      setMessages((prev) => {
        const editIdx = prev.findIndex((m) => m.id === editingMsg.id);
        if (editIdx !== -1) {
          return [...prev.slice(0, editIdx), tempUserMsg];
        }
        return [...prev, tempUserMsg];
      });
    } else {
      setMessages((prev) => [...prev, tempUserMsg]);
    }
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await sendExploreChatMessage(text, editingMsg ? editingMsg.id : undefined, controller.signal);
      if (result && result.conversation && result.conversation.messages) {
        setMessages(result.conversation.messages);
      } else if (result && result.aiMessage) {
        setMessages((prev) => [...prev, result.aiMessage]);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        console.log("[ExploreAiAssistant] Generation aborted by user");
      } else {
        console.error("[ExploreAiAssistant] Send error:", err);
        toast.error(err.message || "Failed to get AI response. Please try again.");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearExploreConversation();
      setMessages([]);
      setClearDialogOpen(false);
      toast.success("Chat history cleared");
    } catch (err) {
      toast.error("Failed to clear chat history");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── UN-AUTHENTICATED STATE ──────────────────────────────────────────────
  if (!user) {
    return (
      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 via-card/40 to-background p-8 text-center shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-indigo-500/25 ring-4 ring-primary/20">
            <Bot className="h-8 w-8 text-white" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <BrainCircuit className="h-3.5 w-3.5" />
              AI Hackathon & Event Search
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Discover & Analyze Hackathons with AI
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Please sign in to your Hackord account to chat with the AI event intelligence, search active and upcoming hackathons.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card/60 border border-border/50">
              <Globe className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Global & India Search:</span>
                <span className="text-muted-foreground block">Explore Devfolio, Devpost, Unstop, & MLH events.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card/60 border border-border/50">
              <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Instant Room Creation:</span>
                <span className="text-muted-foreground block">One-click team room generation right from AI results.</span>
              </div>
            </div>
            
            
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/login">
              <Button className="w-full sm:w-auto gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 px-6">
                <Lock className="h-4 w-4" />
                Sign In / Register
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const promptSuggestions = [
    { label: "🇮🇳 Top Hackathons in India", query: "Show upcoming hackathons in India across Devfolio, Unstop, and SIH with prize pools and deadlines." },
    { label: "🔥 Global AI & Web3 Events", query: "Show top upcoming global AI and Web3 hackathons with prize pools and deadlines." },
    { label: "⚡ Closing This Week", query: "Which hackathons have registration closing in the next 7 days? Give deadlines and links." },
    { label: "🏆 $10,000+ Prize Pools", query: "Find high prize pool hackathons offering $10,000+ USD or ₹5,00,000+ INR with remote participation." },
    { label: "🌐 Beginner-Friendly Online", query: "What are the best beginner-friendly online hackathons for student developers?" },
  ];

  const groupedItems = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-2xl overflow-hidden relative">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-card/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md shadow-indigo-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Hackord AI Event Intelligence</h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Message Thread ─── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs">Loading conversation history...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-5 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Compass className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-foreground">
                Ask About Any Upcoming or Active Hackathon
              </h4>
            </div>

            {/* Quick Prompt Chips */}
            <div className="w-full space-y-2 pt-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block text-left">
                Suggested Inquiries:
              </span>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(s.query)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-card/80 hover:bg-primary/10 hover:border-primary/40 text-xs text-foreground/90 transition-all shadow-sm text-left"
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Grouped Messages */
          <div className="space-y-5 w-full max-w-full md:px-2 lg:px-3 mx-auto">
            {groupedItems.map((item, idx) => {
              if (item.type === "date") {
                return (
                  <div key={`date-${idx}`} className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-muted/40 border border-border/60 text-muted-foreground shadow-sm">
                      {item.label}
                    </span>
                  </div>
                );
              }

              const msg = item.message;
              const isUser = msg.sender === "user";

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3 max-w-[95%] sm:max-w-[88%] md:max-w-[90%] lg:max-w-[94%] xl:max-w-[96%] group",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <Avatar className="h-8 w-8 shrink-0 border border-primary/40 shadow-sm mt-1">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.name || "User"} />}
                      <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
                        {(user.name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md shadow-indigo-500/20 mt-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div
                    className={cn(
                      "relative p-4 rounded-2xl text-xs leading-relaxed shadow-sm transition-all border w-full min-w-0 overflow-hidden",
                      isUser
                        ? "bg-primary text-white border-transparent rounded-tr-sm shadow-md"
                        : "bg-card/95 border-border/80 text-foreground rounded-tl-sm shadow-sm"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-1.5 mb-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-bold text-[11px]", isUser ? "text-white" : "text-primary")}>
                          {isUser ? "You" : "Hackord AI Search"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] opacity-80">
                        {msg.date && <span className="hidden sm:inline">{msg.date}</span>}
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="p-1 rounded transition flex items-center gap-1 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={cn("text-xs leading-relaxed", isUser ? "text-white/95 whitespace-pre-wrap font-medium" : "text-foreground")}>
                      {isUser ? msg.text : <RenderAiMarkdown text={msg.text} />}
                    </div>

                    {/* User Prompt Footer: (edited) tag, Edit Prompt (for latest message only), and Copy */}
                    {isUser && (
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-white/20 mt-2">
                        {msg.isEdited && (
                          <span className="text-[10px] text-white/70 italic mr-auto font-normal">
                            (edited)
                          </span>
                        )}
                        {latestUserMessageId === msg.id && (
                          <button
                            type="button"
                            onClick={() => handleStartEditPrompt(msg)}
                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/20 text-white hover:bg-white/30 border border-white/30 transition-all shadow-sm"
                            title="Edit your latest prompt message"
                          >
                            <Edit className="h-2.5 w-2.5" />
                            <span>Edit prompt</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="flex items-center gap-1 text-[10px] text-white/80 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/15 transition"
                          title="Copy prompt text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-2.5 w-2.5 text-white" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                        </button>
                      </div>
                    )}
                    {/* Structured Hackathon Result Cards */}
                    {msg.hackathons && msg.hackathons.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5 text-amber-400" />
                            Recommended Hackathons ({msg.hackathons.length})
                          </span>
                          <span className="text-[10px] text-muted-foreground">Click Create Room to collaborate</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {msg.hackathons.map((h, hIdx) => (
                            <div
                              key={h.id || hIdx}
                              className="group/card rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-all p-3.5 shadow-sm space-y-3 flex flex-col justify-between"
                            >
                              <div>
                                {h.banner && (
                                  <div className="relative h-24 w-full rounded-lg overflow-hidden mb-2.5 bg-muted">
                                    <img
                                      src={h.banner}
                                      alt={h.name}
                                      className="h-full w-full object-cover group-hover/card:scale-105 transition duration-300"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                      <Badge className="bg-black/60 backdrop-blur-md text-amber-400 border-amber-400/30 text-[10px] font-semibold gap-1">
                                        <Trophy className="h-3 w-3" />
                                        {h.prizePool || "TBD"}
                                      </Badge>
                                      {getUrgencyBadge(h.registrationDeadline)}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <h5 className="font-bold text-foreground text-xs leading-tight line-clamp-1">
                                    {h.name}
                                  </h5>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                                    by <span className="font-medium text-foreground/80">{h.organizer}</span>
                                  </p>
                                </div>

                                {h.tags && h.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {h.tags.slice(0, 3).map((t, tIdx) => (
                                      <span
                                        key={tIdx}
                                        className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] text-muted-foreground border border-border/40"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="mt-2.5 pt-2 border-t border-border/30 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-primary" />
                                    <span>Reg: {formatDate(h.registrationDeadline)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-emerald-400" />
                                    <span>{h.mode || "Online"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons Responsive */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1.5 w-full">
                                {h.platformUrl && (
                                  <a
                                    href={h.platformUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:flex-1 block"
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full h-8 text-[11px] gap-1.5 justify-center border-border/80 hover:border-primary/40 active:scale-[0.98] transition"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Website
                                    </Button>
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => onCreateRoom(h)}
                                  className="w-full sm:flex-1 h-8 text-[11px] gap-1.5 justify-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm active:scale-[0.98] transition"
                                >
                                  <Zap className="h-3 w-3 text-amber-300" />
                                  Create Room
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Generating Skeleton */}
            {loading && (
              <div className="flex items-start gap-3 max-w-[85%] mr-auto">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md shadow-indigo-500/20 animate-pulse">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-card/95 border border-border text-foreground space-y-2 w-72 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Searching hackathons...</span>
                  </div>
                  <div className="space-y-1.5 opacity-60">
                    <div className="h-2.5 bg-muted rounded-full w-full animate-pulse" />
                    <div className="h-2.5 bg-muted rounded-full w-4/5 animate-pulse" />
                    <div className="h-2.5 bg-muted rounded-full w-3/5 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ─── Editing Prompt Banner ─── */}
      {editingUserMessage && (
        <div className="flex items-center justify-between border-t border-b border-primary/30 bg-primary/10 px-4 py-2 text-xs backdrop-blur-sm animate-fade-in shrink-0">
          <div className="flex items-center gap-2 text-foreground truncate min-w-0">
            <Edit className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-bold text-primary">Editing prompt:</span>
            <span className="truncate italic text-muted-foreground">"{editingUserMessage.text}"</span>
          </div>
          <button
            type="button"
            onClick={handleCancelEditPrompt}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold px-2 py-0.5 rounded hover:bg-primary/20 transition shrink-0 ml-2"
            title="Cancel editing"
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ─── Bottom Input Bar (Aligned Row) ─── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt();
        }}
        className="flex items-center gap-2 p-3 sm:p-4 border-t border-border/60 bg-card/90 backdrop-blur-md shrink-0"
      >
        {/* Speech Mic Button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={loading}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-xl border transition shadow-sm shrink-0 disabled:opacity-50",
            isRecording
              ? "bg-red-500/15 border-red-500 text-red-500 animate-pulse shadow-md"
              : "bg-muted/40 border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
          )}
          title={isRecording ? "Stop voice dictation" : "Voice Dictation (Speech-to-Text)"}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Text Input */}
        <Input
          ref={inputRef}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={loading}
          placeholder={
            isRecording
              ? "Listening... Speak your prompt"
              : "Ask about hackathons, prizes, tracks, deadlines..."
          }
          className="flex-1 rounded-xl border border-border bg-background/50 text-xs sm:text-sm h-10 px-3.5 outline-none focus:border-primary/50 transition min-w-0"
        />

        {/* Send or Stop Button */}
        {loading ? (
          <Button
            type="button"
            onClick={handleStopResponse}
            className="bg-destructive hover:bg-destructive/90 text-white rounded-xl px-3.5 h-10 gap-1.5 text-xs font-semibold shrink-0 animate-pulse shadow-sm"
            title="Stop AI response generation"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>Stop</span>
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!inputPrompt.trim()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl px-3.5 sm:px-4 h-10 gap-1.5 text-xs font-semibold shrink-0 shadow-md shadow-indigo-500/20 disabled:opacity-40"
            title="Send prompt"
          >
            <span className="hidden sm:inline">Send</span>
            <Send className="h-3.5 w-3.5" />
          </Button>
        )}
      </form>

      {/* ─── Clear Chat Confirmation Dialog ─── */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-foreground">
              <Trash2 className="h-4 w-4 text-red-400" /> Clear AI Chat History?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will erase past conversation messages from your database account. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearChat}>
              Yes, Clear History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
