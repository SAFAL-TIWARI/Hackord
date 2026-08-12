import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  MessageSquare,
  Search,
  Pin,
  Send,
  Mic,
  Globe,
  User,
  MoreVertical,
  Edit2,
  Trash2,
  CornerDownRight,
  Shield,
  Sparkles,
  Play,
  Pause,
  X,
  Lock,
  ArrowLeft,
  Volume2,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { searchUsers, type DbUser } from "@/lib/users-api";
import {
  getChatMessages,
  sendChatMessage,
  updateChatMessage,
  deleteChatMessage,
  getConversations,
  markChatRead,
  deleteConversation,
  type DbChatMessage,
  type ConversationItem,
} from "@/lib/chat-api";
import { RenderSmartText } from "@/lib/chat-utils";
import { UserProfileModal } from "@/components/UserProfileModal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "General & Chats — Hackord" }] }),
  component: ChatPage,
});

type ReplyTarget = { id: string; text: string; author_name: string } | DbChatMessage | null;

function ChatPage() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { user?: string; userId?: string };

  // activeConvId: null => showing Conversations List View
  // "general" => inside General Conversation Chat
  // userId (string) => inside Direct Conversation Chat with that user
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<DbUser | null>(null);

  // Conversations list & Search
  const [conversations, setConversations] = useState<{
    general: ConversationItem;
    direct: ConversationItem[];
  }>({
    general: {
      id: "general",
      chatType: "general",
      name: "General Conversation",
      subtitle: "Global discussion for all platform users",
      unreadCount: 0,
      isPinnedTop: true,
    },
    direct: [],
  });

  const [convSearch, setConvSearch] = useState("");
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [messages, setMessages] = useState<DbChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Audio Play/Pause tracking
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);

  // Input states
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyTarget>(null);
  const [editingMessage, setEditingMessage] = useState<DbChatMessage | null>(null);

  // `@` mention autocomplete popup states
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<DbUser[]>([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // User Profile Modal inspection
  const [inspectedUser, setInspectedUser] = useState<DbUser | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Pinned message navigation index
  const [pinCycleIndex, setPinCycleIndex] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth Protection redirect
  useEffect(() => {
    if (!authLoading && !currentUser) {
      toast.error("Please sign in to access chats");
      navigate({ to: "/login" });
    }
  }, [authLoading, currentUser, navigate]);

  // 1. Handle incoming search query params (e.g. ?userId=...) to auto-open direct chat
  useEffect(() => {
    const targetId = searchParams?.userId || searchParams?.user;
    if (targetId && currentUser) {
      searchUsers(targetId).then((res) => {
        const found = res.find((u) => u._id === targetId || u.username === targetId);
        if (found) {
          setActiveConvId(found._id);
          setActiveOtherUser(found);
        }
      });
    }
  }, [searchParams, currentUser]);

  // 2. Fetch Conversations list & sync interval
  const loadConversations = async () => {
    if (!currentUser?._id) return;
    try {
      const data = await getConversations(currentUser._id);
      setConversations(data);

      // Sync activeOtherUser's isOnline state in real time
      setActiveOtherUser((prev) => {
        if (!prev) return null;
        const currentConv = data.direct?.find(
          (c) => c.otherUserId === prev._id || c.id === prev._id
        );
        if (currentConv && typeof currentConv.isOnline !== "undefined") {
          return { ...prev, isOnline: currentConv.isOnline };
        }
        return prev;
      });
    } catch {}
  };

  useEffect(() => {
    if (currentUser?._id) {
      loadConversations();
      const interval = setInterval(loadConversations, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // 3. Fetch active chat messages & silent background polling
  const activeOtherUserId = activeOtherUser?._id;
  const currentUserId = currentUser?._id;

  useEffect(() => {
    if (!activeConvId || !currentUserId) return;

    let isSubscribed = true;

    // Show loading spinner ONLY on initial conversation switch
    setLoadingMsgs(true);

    const fetchCurrent = () => {
      if (activeConvId === "general") {
        return getChatMessages({ chatType: "general", userId: currentUserId });
      } else if (activeOtherUserId) {
        return getChatMessages({
          chatType: "direct",
          otherUserId: activeOtherUserId,
          userId: currentUserId,
        });
      }
      return Promise.resolve([]);
    };

    fetchCurrent()
      .then((fetched) => {
        if (isSubscribed) setMessages(fetched);
      })
      .finally(() => {
        if (isSubscribed) setLoadingMsgs(false);
      });

    // Silent background polling (no loading spinner blinking)
    const interval = setInterval(() => {
      fetchCurrent().then((fetched) => {
        if (isSubscribed) setMessages(fetched);
      });
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeConvId, activeOtherUserId, currentUserId]);

  // Mark active chat as read when inside a conversation
  useEffect(() => {
    if (!currentUser?._id || !activeConvId) return;
    markChatRead({
      userId: currentUser._id,
      chatType: activeConvId === "general" ? "general" : "direct",
      otherUserId: activeConvId === "general" ? undefined : activeOtherUser?._id,
    }).then(() => loadConversations());
  }, [activeConvId, activeOtherUser, messages.length, currentUser]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeConvId) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, activeConvId]);

  // Audio Play / Pause handler
  const toggleAudioPlay = (msgId: string, audioUrl: string) => {
    if (playingAudioId === msgId && audioObjRef.current) {
      audioObjRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (audioObjRef.current) {
        audioObjRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioObjRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.play().catch(() => toast.error("Audio playback error"));
      setPlayingAudioId(msgId);
    }
  };

  // Handle `@` Mention Autocomplete logic
  useEffect(() => {
    const lastWord = inputText.split(/\s+/).pop() || "";
    if (lastWord.startsWith("@")) {
      const q = lastWord.slice(1).toLowerCase();
      setMentionQuery(q);
      searchUsers(q).then((users) => {
        const filtered = users.filter((u) => u._id !== currentUser?._id);
        setMentionSuggestions(filtered.slice(0, 5));
        setShowMentionPopup(true);
      });
    } else {
      setShowMentionPopup(false);
    }
  }, [inputText, currentUser]);

  const insertMention = (user: DbUser) => {
    const words = inputText.split(/\s+/);
    words.pop();
    const handle = user.username ? `@${user.username}` : `@${user.name.replace(/\s+/g, "")}`;
    setInputText([...words, handle, ""].join(" "));
    setShowMentionPopup(false);
    inputRef.current?.focus();
  };

  // ── Voice Recording Handler ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (currentUser) {
            await handleSendMessage(base64Audio, recordingSeconds);
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      audioChunksRef.current = [];
      toast("Voice recording cancelled");
    }
  };

  // ── Send Message Handler ──
  const handleSendMessage = async (audioUrl?: string, duration?: number) => {
    if (!currentUser) {
      toast.error("Please sign in to send messages");
      return;
    }

    if (editingMessage) {
      if (!inputText.trim()) return;
      try {
        const updated = await updateChatMessage(editingMessage.id, { text: inputText.trim() });
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditingMessage(null);
        setInputText("");
        toast.success("Message edited");
      } catch {
        toast.error("Failed to edit message");
      }
      return;
    }

    if (!inputText.trim() && !audioUrl) return;

    try {
      const isGeneral = activeConvId === "general";
      const newMsg = await sendChatMessage({
        chatType: isGeneral ? "general" : "direct",
        author_id: currentUser._id,
        author_name: currentUser.name,
        author_username: currentUser.username || "",
        author_avatar: currentUser.avatar || "",
        author_role: currentUser.role || (isAdmin ? "admin" : "user"),
        recipient_id: !isGeneral ? activeOtherUser?._id : undefined,
        recipient_name: !isGeneral ? activeOtherUser?.name : undefined,
        recipient_username: !isGeneral ? activeOtherUser?.username : undefined,
        recipient_avatar: !isGeneral ? activeOtherUser?.avatar : undefined,
        text: inputText.trim() || (audioUrl ? "🎤 Voice message" : ""),
        audio_url: audioUrl || undefined,
        audio_duration: duration || 0,
        reply_to: replyingTo
          ? { id: replyingTo.id, text: replyingTo.text, author_name: replyingTo.author_name }
          : null,
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setReplyingTo(null);
      loadConversations();
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
  };

  // ── User-based Direct Conversation Delete Handler ──
  const handleDeleteConv = async (otherUserId: string) => {
    if (!currentUser?._id) return;
    try {
      await deleteConversation(currentUser._id, otherUserId);
      if (activeConvId === otherUserId) {
        setActiveConvId(null);
        setActiveOtherUser(null);
      }
      loadConversations();
      toast.success("Conversation cleared");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  // ── Message Menu Actions ──
  const handleTogglePin = async (msg: DbChatMessage) => {
    try {
      const updated = await updateChatMessage(msg.id, { pinned: !msg.pinned });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
      toast.success(msg.pinned ? "Message unpinned" : "Message pinned");
    } catch {
      toast.error("Failed to update pin state");
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await deleteChatMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleReplyPrivately = (msg: DbChatMessage) => {
    const targetUser: DbUser = {
      _id: msg.author_id,
      name: msg.author_name,
      username: msg.author_username || "",
      avatar: msg.author_avatar || "",
      skills: [],
    };
    setActiveConvId(targetUser._id);
    setActiveOtherUser(targetUser);
    setReplyingTo({
      id: msg.id,
      text: `[Reply Privately from General Chat]: "${msg.text.slice(0, 80)}"`,
      author_name: msg.author_name,
    });
    toast.info(`Replying privately to ${msg.author_name}`);
  };

  // Pinned Messages Cycling
  const pinnedMessages = useMemo(() => messages.filter((m) => m.pinned), [messages]);

  const handleCyclePinned = () => {
    if (pinnedMessages.length === 0) return;
    const targetMsg = pinnedMessages[pinCycleIndex % pinnedMessages.length];
    setPinCycleIndex((prev) => prev + 1);

    const el = document.getElementById(`msg-${targetMsg.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(targetMsg.id);
      setTimeout(() => setHighlightedMsgId(null), 1500);
    }
  };

  // Filtered Conversations for main list search
  const filteredDirectConvs = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return conversations.direct;
    return conversations.direct.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.lastMessageText && c.lastMessageText.toLowerCase().includes(q))
    );
  }, [conversations.direct, convSearch]);

  // Filtered Messages inside active chat search
  const filteredActiveMessages = useMemo(() => {
    const q = msgSearchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => m.text.toLowerCase().includes(q) || m.author_name.toLowerCase().includes(q));
  }, [messages, msgSearchQuery]);

  const openUserProfileModal = (user: { _id: string; name: string; username?: string; avatar?: string }) => {
    searchUsers(user._id).then((res) => {
      const found = res.find((u) => u._id === user._id) || {
        _id: user._id,
        name: user.name,
        username: user.username || "",
        avatar: user.avatar || "",
        skills: [],
      };
      setInspectedUser(found);
      setProfileModalOpen(true);
    });
  };

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4 max-w-7xl mx-auto pb-6">
        {/* ── DEFAULT VIEW: CONVERSATIONS LIST ── */}
        {activeConvId === null && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            {/* Sleek Compact Header & Main Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 border border-border/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-2xl shadow-sm">
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                  <span>General & Personal Chats</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Participate in global platform discussions or message hackers directly
                </p>
              </div>

              {/* Main Search Bar */}
              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder="Search conversations, names or messages…"
                  className="pl-9 pr-8 bg-sidebar-accent/50 border-border/80 rounded-xl text-xs h-9"
                />
                {convSearch && (
                  <button
                    onClick={() => setConvSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 1. GENERAL CONVERSATION ITEM (ALWAYS PINNED ON TOP) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Pin className="h-3 w-3 text-amber-400 fill-amber-400" />
                  Global Room
                </span>
              </div>

              <div
                onClick={() => {
                  haptic("light");
                  setActiveConvId("general");
                  setActiveOtherUser(null);
                }}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-purple-600/10 to-blue-600/10 p-3 hover:border-primary/60 hover:shadow-glow transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-glow shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold group-hover:text-primary transition truncate">
                        General Conversation
                      </h3>
                    </div>

                    <p className="text-xs text-muted-foreground truncate max-w-xl">
                      {conversations.general.lastMessageText || "Global discussion space for all registered accounts"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {conversations.general.unreadCount > 0 && (
                    <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold text-white shadow-glow">
                      {conversations.general.unreadCount} new
                    </span>
                  )}
                  {conversations.general.lastMessageAt && (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(conversations.general.lastMessageAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>

            {/* 2. DIRECT PERSONAL CONVERSATIONS LIST WITH VERTICAL SCROLLBAR */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Direct Personal Conversations ({filteredDirectConvs.length})
                </h3>
              </div>

              {filteredDirectConvs.length === 0 ? (
                <div className="rounded-2xl border border-border/80 bg-card/30 p-8 text-center space-y-2">
                  <User className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <h4 className="font-semibold text-sm">No direct conversations yet</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Use Global Search at top or click the <strong className="text-emerald-400">"Chat"</strong> button on any user's profile card to start messaging privately!
                  </p>
                </div>
              ) : (
                /* Scrollable container for direct conversations list items */
                <div className="max-h-[380px] sm:max-h-[calc(100vh-23rem)] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {filteredDirectConvs.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        haptic("light");
                        setActiveConvId(conv.otherUserId!);
                        setActiveOtherUser({
                          _id: conv.otherUserId!,
                          name: conv.name,
                          username: conv.username || "",
                          avatar: conv.avatar || "",
                          isOnline: conv.isOnline,
                          skills: [],
                        });
                      }}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/40 p-3 hover:border-primary/40 hover:bg-card/70 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border border-border shrink-0">
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback className="bg-gradient-brand text-white font-bold text-xs">
                            {conv.name[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition truncate">
                              {conv.name}
                            </h4>
                            {conv.username && (
                              <span className="text-xs text-muted-foreground truncate">
                                @{conv.username}
                              </span>
                            )}

                            {/* Online / Offline Badge (Desktop: just right side of name) */}
                            {conv.isOnline ? (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-1.5 py-0 shrink-0">
                                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground bg-secondary/40 border border-border/60 rounded-full px-1.5 py-0 shrink-0">
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                                Offline
                              </span>
                            )}
                          </div>

                          {/* Online / Offline Status Text (Mobile: just below name) */}
                          {conv.isOnline ? (
                            <p className="sm:hidden text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                              online
                            </p>
                          ) : (
                            <p className="sm:hidden text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                              offline
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {conv.lastMessageText || "Click to open conversation"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-glow">
                            {conv.unreadCount} unread
                          </span>
                        )}
                        {conv.lastMessageAt && (
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}

                        {/* USER-BASED DELETE CONVERSATION BUTTON */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConv(conv.otherUserId!);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition"
                          title="Delete conversation from your side"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONVERSATION CHAT VIEW (ACTIVE CHAT) ── */}
        {activeConvId !== null && (
          <div className="rounded-3xl border border-border/80 bg-card/40 backdrop-blur-2xl shadow-spatial overflow-hidden flex flex-col h-[calc(100vh-9.5rem)] animate-in fade-in-50 duration-300">
            {/* Header with Back Button */}
            <header className="h-14 px-4 border-b border-border/70 flex items-center justify-between bg-card/40 backdrop-blur-xl shrink-0 z-10">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* PROMINENT BACK BUTTON TO RETURN TO CONVERSATIONS LIST */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    haptic("light");
                    setActiveConvId(null);
                    setActiveOtherUser(null);
                  }}
                  className="h-8 px-2 text-xs bg-sidebar-accent/80 border-border hover:bg-sidebar-accent shrink-0 gap-1"
                  title="Back to conversations"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>

                <div className="h-5 w-px bg-border/80 shrink-0" />

                {activeConvId === "general" ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="min-w-0">
                      <h2 className="font-bold text-sm sm:text-base truncate flex items-center gap-2">
                        General Conversation
                        <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30 px-1.5 py-0">
                          Global Room
                        </Badge>
                      </h2>
                    </div>
                  </div>
                ) : activeOtherUser ? (
                  <div
                    onClick={() => openUserProfileModal(activeOtherUser)}
                    className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                  >
                    <Avatar className="h-8.5 w-8.5 border border-border shrink-0">
                      <AvatarImage src={activeOtherUser.avatar} />
                      <AvatarFallback className="bg-gradient-brand text-white font-bold text-xs">
                        {activeOtherUser.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm sm:text-base group-hover:text-primary transition truncate">
                          {activeOtherUser.name}
                        </h2>

                        {/* Desktop Online / Offline Badge (just right side of name) */}
                        {activeOtherUser.isOnline ? (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-secondary/40 border border-border/60 rounded-full px-2 py-0.5 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                            Offline
                          </span>
                        )}
                      </div>

                      {/* Mobile Online / Offline text (just below name) */}
                      {activeOtherUser.isOnline ? (
                        <p className="sm:hidden text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          online
                        </p>
                      ) : (
                        <p className="sm:hidden text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                          offline
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right Header Actions */}
              <div className="flex items-center gap-2">
                {pinnedMessages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCyclePinned}
                    className="h-7 px-2.5 text-[11px] bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 gap-1"
                  >
                    <Pin className="h-3 w-3" />
                    <span>Pinned ({pinnedMessages.length})</span>
                  </Button>
                )}

                {/* Direct Chat Delete Conversation Button */}
                {activeConvId !== "general" && activeOtherUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConv(activeOtherUser._id)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/15 gap-1"
                    title="Delete chat from your side"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Delete Chat</span>
                  </Button>
                )}
              </div>
            </header>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
              {loadingMsgs ? (
                <div className="py-16 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
                  Loading conversation messages...
                </div>
              ) : filteredActiveMessages.length === 0 ? (
                <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-sm">No messages yet</h4>
                  <p className="text-xs text-muted-foreground">
                    Be the first to post a message!
                  </p>
                </div>
              ) : (
                filteredActiveMessages.map((msg) => {
                  const isMine = currentUser?._id === msg.author_id;
                  const isAdminMsg = msg.is_important || msg.author_role === "admin";
                  const isHighlighted = highlightedMsgId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={cn(
                        "group relative flex items-start gap-2.5 transition-all duration-300 p-0.5 rounded-2xl",
                        isMine ? "flex-row-reverse" : "flex-row",
                        isHighlighted && "ring-2 ring-amber-400 bg-amber-500/10 scale-[1.01]"
                      )}
                    >
                      {/* Avatar */}
                      <Avatar
                        onClick={() =>
                          openUserProfileModal({
                            _id: msg.author_id,
                            name: msg.author_name,
                            username: msg.author_username,
                            avatar: msg.author_avatar,
                          })
                        }
                        className="h-8 w-8 border border-border shrink-0 cursor-pointer hover:scale-105 transition mt-0.5"
                      >
                        <AvatarImage src={msg.author_avatar} />
                        <AvatarFallback className="bg-gradient-brand text-white font-bold text-[10px]">
                          {msg.author_name[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* Message Bubble Card */}
                      <div
                        className={cn(
                          "max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-sm space-y-1 relative border",
                          isMine
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-500/40 rounded-tr-none"
                            : isAdminMsg
                            ? "bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-purple-950/40 border-amber-500/60 shadow-glow text-amber-100 rounded-tl-none"
                            : "bg-card/80 backdrop-blur-xl border-border/80 text-foreground rounded-tl-none"
                        )}
                      >
                        {/* Admin Highlight Banner */}
                        {isAdminMsg && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg px-2 py-0.5 w-fit">
                            <Shield className="h-3 w-3 text-amber-400 shrink-0" />
                            <span>Admin Message • Important</span>
                          </div>
                        )}

                        {/* Author Bar */}
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1 text-xs">
                          <span
                            onClick={() =>
                              openUserProfileModal({
                                _id: msg.author_id,
                                name: msg.author_name,
                                username: msg.author_username,
                                avatar: msg.author_avatar,
                              })
                            }
                            className={cn(
                              "font-bold cursor-pointer hover:underline truncate text-[11px]",
                              isMine ? "text-white" : isAdminMsg ? "text-amber-300" : "text-primary"
                            )}
                          >
                            {msg.author_name}
                          </span>

                          <div className="flex items-center gap-1 text-[10px] opacity-75 shrink-0">
                            {msg.pinned && <Pin className="h-3 w-3 text-amber-400 fill-amber-400" />}
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                        </div>

                        {/* Reply To Preview Banner */}
                        {msg.reply_to && (
                          <div className="rounded-xl border border-white/15 bg-black/20 p-2 text-xs opacity-90 border-l-4 border-l-primary">
                            <p className="font-semibold text-[11px] opacity-80">
                              Replying to {msg.reply_to.author_name}
                            </p>
                            <p className="line-clamp-1 italic">{msg.reply_to.text}</p>
                          </div>
                        )}

                        {/* Audio Voice Player or Text */}
                        {msg.audio_url ? (
                          <div className="flex items-center gap-3 py-1">
                            <button
                              type="button"
                              onClick={() => toggleAudioPlay(msg.id, msg.audio_url!)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary hover:scale-105 transition shrink-0"
                            >
                              {playingAudioId === msg.id ? (
                                <Pause className="h-3.5 w-3.5 fill-primary" />
                              ) : (
                                <Play className="h-3.5 w-3.5 fill-primary" />
                              )}
                            </button>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold flex items-center gap-1">
                                <Volume2 className="h-3.5 w-3.5" /> Voice Message
                              </p>
                              {msg.audio_duration ? (
                                <span className="text-[10px] opacity-75">{msg.audio_duration}s</span>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                            <RenderSmartText
                              text={msg.text}
                              onMentionClick={(username) => {
                                searchUsers(username).then((res) => {
                                  if (res[0]) openUserProfileModal(res[0]);
                                });
                              }}
                            />
                          </div>
                        )}

                        {/* Footer indicators */}
                        <div className="flex items-center justify-end gap-1.5 text-[10px] opacity-70 pt-0.5">
                          {msg.edited && <span>(edited)</span>}
                        </div>
                      </div>

                      {/* 3-DOTS ACTION MENU (ALWAYS VISIBLE) */}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="opacity-80 hover:opacity-100 p-1 rounded-lg hover:bg-sidebar-accent text-muted-foreground transition shrink-0 mt-1"
                            title="Message actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMine ? "end" : "start"} className="w-44 z-50">
                          {(isMine || isAdmin) && (
                            <DropdownMenuItem onClick={() => {
                              setEditingMessage(msg);
                              setInputText(msg.text);
                              setReplyingTo(null);
                            }}>
                              <Edit2 className="mr-2 h-3.5 w-3.5 text-blue-400" /> Edit Message
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                            <CornerDownRight className="mr-2 h-3.5 w-3.5 text-emerald-400" /> Reply
                          </DropdownMenuItem>

                          {/* Reply Privately (Only in General Chat for messages sent by others) */}
                          {activeConvId === "general" && !isMine && (
                            <DropdownMenuItem onClick={() => handleReplyPrivately(msg)}>
                              <Lock className="mr-2 h-3.5 w-3.5 text-purple-400" /> Reply Privately
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => handleTogglePin(msg)}>
                            <Pin className="mr-2 h-3.5 w-3.5 text-amber-400" />
                            {msg.pinned ? "Unpin Message" : "Pin Message"}
                          </DropdownMenuItem>

                          {(isMine || isAdmin) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(msg.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* `@` Mention Autocomplete Popup */}
            {showMentionPopup && mentionSuggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-border/60 bg-card/95 backdrop-blur-2xl space-y-1 shadow-spatial z-20 animate-in slide-in-from-bottom-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-1">
                  Mention Member (@)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {mentionSuggestions.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => insertMention(u)}
                      className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-gradient-brand hover:text-white transition shadow-sm"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback>{u.name[0]}</AvatarFallback>
                      </Avatar>
                      <span>{u.name}</span>
                      {u.username && <span className="opacity-75">@{u.username}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reply / Edit Preview Banner */}
            {(replyingTo || editingMessage) && (
              <div className="px-4 py-1.5 border-t border-border/60 bg-primary/10 backdrop-blur-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {replyingTo ? (
                    <>
                      <CornerDownRight className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        Replying to <strong>{replyingTo.author_name}</strong>: "{replyingTo.text.slice(0, 50)}..."
                      </span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">Editing message...</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setEditingMessage(null);
                    setInputText("");
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Voice Recording Active Bar */}
            {isRecording ? (
              <div className="p-3 border-t border-border/70 bg-destructive/10 backdrop-blur-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-ping" />
                  <span className="text-xs font-semibold text-destructive">
                    Recording voice note... {recordingSeconds}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelRecording} className="text-xs h-8">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={stopRecording}
                    className="bg-gradient-brand text-white shadow-glow gap-1 text-xs h-8"
                  >
                    <Send className="h-3.5 w-3.5" /> Send Voice
                  </Button>
                </div>
              </div>
            ) : (
              /* Input / Typing Bar */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-border/70 bg-card/40 backdrop-blur-xl flex items-center gap-2 shrink-0"
              >
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeConvId === "general"
                      ? "Enter your message..."
                      : `Message ${activeOtherUser?.name || "user"}...`
                  }
                  className="flex-1 bg-sidebar-accent/60 border-border/70 rounded-xl text-xs sm:text-sm h-10"
                />

                {/* Mic Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={startRecording}
                  className="h-10 w-10 rounded-xl border-border/80 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent shrink-0"
                  title="Record Voice Message"
                >
                  <Mic className="h-4 w-4" />
                </Button>

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!inputText.trim() && !editingMessage}
                  className="h-10 px-3.5 rounded-xl bg-gradient-brand text-white shadow-glow hover:opacity-90 transition shrink-0 gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs font-semibold">Send</span>
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Profile Details Modal */}
        <UserProfileModal
          user={inspectedUser}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />
      </div>
    </AppShell>
  );
}
