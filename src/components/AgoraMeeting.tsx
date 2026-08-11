import { useState, useEffect, useRef, useMemo } from "react";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateRoom, getAgoraToken, getLoggedInUser, getRoom } from "@/lib/rooms-api";
import { Mic, MicOff, Video, VideoIcon, VideoOff, MonitorUp, Smile, Hand, MoreVertical, PhoneOff, MessageSquare, Users, Copy, Check, Info, Maximize2, Minimize2, PictureInPicture, ShieldAlert, Sparkles, LayoutGrid, UserCheck, Send, X, Pin, PinOff, UserX, VolumeX, CameraOff, Shield } from "lucide-react";

interface MeetingMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number;
}

export interface AgoraMeetingProps {
  roomId: string;
  roomName: string;
  userName: string;
  userAvatar: string;
  existingMeetingCode?: string;
  isMemberOrAdmin?: boolean;
  isOwnerOrAdmin?: boolean;
  onLeave?: () => void;
  roomMembersCount?: number;
}

// ─── Sub-Component for Remote Screen Share Presenter ───
function RemotePresenterPlayer({
  remoteUsers,
  presenterUid,
  userInfo,
}: {
  remoteUsers: IAgoraRTCRemoteUser[];
  presenterUid: string | number;
  userInfo?: { name: string; avatar: string; isHost?: boolean };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const presenterUser = remoteUsers.find((u) => String(u.uid) === String(presenterUid));
  const displayName = userInfo?.name || `Member (${presenterUid})`;

  useEffect(() => {
    if (containerRef.current && presenterUser?.videoTrack) {
      presenterUser.videoTrack.play(containerRef.current);
    }
    return () => {
      try {
        presenterUser?.videoTrack?.stop();
      } catch {}
    };
  }, [presenterUser?.videoTrack]);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-black">
      <div ref={containerRef} className="w-full h-full object-contain" />
      <div className="absolute top-3 left-3 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur border border-border">
        🖥️ {displayName} is presenting their screen
      </div>
    </div>
  );
}

// ─── Sub-Component for Remote User Video Stream Player ───
function RemoteUserTile({
  user,
  userInfo,
  isPinned,
  isOwnerOrAdmin,
  isAudioMuted,
  isVideoMuted,
  isHandRaised,
  isHost,
  onTogglePin,
  onMuteMic,
  onTurnOffCamera,
  onKick,
}: {
  user: IAgoraRTCRemoteUser;
  userInfo?: { name: string; avatar: string; isHost?: boolean };
  isPinned: boolean;
  isOwnerOrAdmin: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  onTogglePin: () => void;
  onMuteMic: () => void;
  onTurnOffCamera: () => void;
  onKick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayName = userInfo?.name || `Member (${user.uid})`;
  const displayAvatar = userInfo?.avatar;

  useEffect(() => {
    if (containerRef.current && user.videoTrack && user.hasVideo && !isVideoMuted) {
      user.videoTrack.play(containerRef.current);
    }
    return () => {
      try {
        user.videoTrack?.stop();
      } catch {}
    };
  }, [user.videoTrack, user.hasVideo, isVideoMuted]);

  useEffect(() => {
    if (user.audioTrack && user.hasAudio && !isAudioMuted) {
      user.audioTrack.play();
    } else if (user.audioTrack && isAudioMuted) {
      try {
        user.audioTrack.stop();
      } catch {}
    }
  }, [user.audioTrack, user.hasAudio, isAudioMuted]);

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[260px] rounded-xl overflow-hidden bg-card border border-border/80 flex items-center justify-center shadow-md",
        isPinned && "border-2 border-primary shadow-glow"
      )}
    >
      <div ref={containerRef} className="w-full h-full object-cover rounded-xl" />

      {(!user.hasVideo || isVideoMuted) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card">
          <Avatar className="h-20 w-20 border-2 border-border shadow-card">
            {displayAvatar && <AvatarImage src={displayAvatar} />}
            <AvatarFallback className="text-xl font-bold bg-gradient-brand text-white">
              {displayName[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-foreground">{displayName}</p>
            {isHost && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 rounded-lg bg-background/80 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-foreground border border-border/80 shadow-md flex items-center gap-1.5">
        <span>{displayName}</span>
        {isHost && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
        {isHandRaised && <span className="text-base animate-pulse">✋</span>}
        {isAudioMuted && <span className="text-destructive font-bold text-[10px]">(Muted)</span>}
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          onClick={onTogglePin}
          className="p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border text-foreground hover:text-primary transition"
        >
          {isPinned ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5" />}
        </button>

        {isOwnerOrAdmin && (
          <div className="flex items-center gap-1 bg-background/90 backdrop-blur border border-border rounded-full p-1 shadow-md">
            <button
              onClick={onMuteMic}
              className="p-1 text-muted-foreground hover:text-destructive transition"
              title="Mute Mic"
            >
              <VolumeX className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onTurnOffCamera}
              className="p-1 text-muted-foreground hover:text-destructive transition"
              title="Turn Off Camera"
            >
              <CameraOff className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onKick}
              className="p-1 text-destructive hover:scale-110 transition"
              title="Remove User"
            >
              <UserX className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AgoraMeeting({
  roomId,
  roomName,
  userName,
  userAvatar,
  existingMeetingCode,
  isMemberOrAdmin = true,
  isOwnerOrAdmin = false,
  onLeave,
  roomMembersCount,
}: AgoraMeetingProps) {
  const sessionKey = `meeting_joined_${roomId}`;

  const localUid = useMemo(() => {
    try {
      const user = getLoggedInUser();
      const userId = user?.id || userName || "";
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = (hash << 5) - hash + userId.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash) || Math.floor(Math.random() * 1000000);
    } catch {
      return Math.floor(Math.random() * 1000000);
    }
  }, [userName]);

  const [joined, setJoined] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(sessionKey) === "true";
    }
    return false;
  });

  // Call State
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"tiled" | "spotlight" | "sidebar">("tiled");
  const [pinnedUid, setPinnedUid] = useState<string | number | null>(null);

  // Fullscreen Menus State
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);

  // Audio Frequency Level (0 to 100)
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Remote Users (Agora RTC Multi-User) & User Meta
  const [remoteUsersState, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const zombieUidsRef = useRef<Set<string | number>>(new Set());
  const remoteUsers = useMemo(() => {
    return remoteUsersState.filter(
      (u) => !zombieUidsRef.current.has(u.uid) && !zombieUidsRef.current.has(String(u.uid))
    );
  }, [remoteUsersState]);

  const [userInfoMap, setUserInfoMap] = useState<Record<string | number, { userId?: string; name: string; avatar: string; isHost?: boolean }>>({});
  const [remotePresenterUid, setRemotePresenterUid] = useState<string | number | null>(null);

  // Hand Raised UIDs state for multi-user sync
  const [raisedHandsUids, setRaisedHandsUids] = useState<Set<string | number>>(new Set());

  // Remote Mute Overrides (Host Controls)
  const [mutedRemoteAudioUids, setMutedRemoteAudioUids] = useState<Set<string | number>>(new Set());
  const [mutedRemoteVideoUids, setMutedRemoteVideoUids] = useState<Set<string | number>>(new Set());

  // Side Drawers
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  // Floating Emoji Reactions
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // In-meeting Messages
  const [messages, setMessages] = useState<MeetingMessage[]>([
    {
      id: "msg_welcome",
      sender: "System Bot",
      avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=meeting",
      text: `Welcome to ${roomName} live meeting workspace!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [chatText, setChatText] = useState("");

  // Clock
  const [currentTime, setCurrentTime] = useState("");

  // Broadcast Channel for Multi-Tab In-Meeting Messages & Reactions Sync
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Refs
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC & Audio Meter Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Agora RTC SDK Refs
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const dataStreamIdRef = useRef<number | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const agoraRtcRef = useRef<any>(null);
  const localScreenTrackRef = useRef<any>(null);

  // Meeting Code e.g. "kxa-yjab-kxi"
  const [meetingCode, setMeetingCode] = useState<string>(() => {
    if (existingMeetingCode && existingMeetingCode.trim()) return existingMeetingCode.trim();
    if (!roomId) return "meet-room-access";
    const cleaned = roomId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const p1 = cleaned.slice(0, 3) || "kxa";
    const p2 = cleaned.slice(3, 7) || "yjab";
    const p3 = cleaned.slice(7, 10) || "kxi";
    return `${p1}-${p2}-${p3}`;
  });

  // Meeting Sync Waiting State Timer (5 seconds)
  const [syncTimer, setSyncTimer] = useState<number>(0);

  // 5-second Countdown Interval Handler
  useEffect(() => {
    if (syncTimer <= 0) return;
    const timer = setInterval(() => {
      setSyncTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [syncTimer]);

  // Helper to trigger meeting code sync across state, leave old call, & set 5s timer
  const triggerMeetingCodeSync = (newCode: string) => {
    if (joined) {
      handleLeaveCall();
      setMessages([
        {
          id: "msg_welcome",
          sender: "System Bot",
          avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=meeting",
          text: `Welcome to ${roomName} live meeting workspace!`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setHandRaised(false);
      setJoined(false);
      toast.info("A new instant meeting was created! Moved to meeting lobby.");
    }
    setMeetingCode(newCode);
    setSyncTimer(5);
  };

  // Sync session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(sessionKey, joined ? "true" : "false");
    }
  }, [joined, sessionKey]);

  // Persist meeting_code to MongoDB
  useEffect(() => {
    if (roomId && meetingCode && (!existingMeetingCode || existingMeetingCode !== meetingCode)) {
      updateRoom({
        roomId,
        data: { meeting_code: meetingCode },
      }).catch(() => {});
    }
  }, [roomId, meetingCode, existingMeetingCode]);

  // Poll to sync meeting code changes (detecting new meetings created by others within 2 seconds)
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await getRoom({ data: { roomId } });
        if (fresh && fresh.meeting_code && fresh.meeting_code !== meetingCode) {
          triggerMeetingCodeSync(fresh.meeting_code);
        }
      } catch (err) {
        console.warn("Error polling room meeting code:", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [roomId, meetingCode, joined, roomName]);

  // Handle Instant Meeting Creation
  const handleCreateInstantMeeting = async () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const p1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const p3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const newCode = `${p1}-${p2}-${p3}`;

    try {
      // Move to lobby if in call, update code, start 5s countdown state
      triggerMeetingCodeSync(newCode);

      // Persist to MongoDB
      await updateRoom({
        roomId,
        data: { meeting_code: newCode },
      });

      // Multi-Tab real-time broadcast
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: "NEW_MEETING_CODE",
          payload: { code: newCode },
        });
      }

      toast.success(`Created instant meeting! Code: ${newCode}. Syncing database...`);
    } catch {
      toast.error("Failed to create instant meeting");
    }
  };

  // Real-time BroadcastChannel Sync for Messages, Emojis, Hand Raising & New Meeting Codes
  useEffect(() => {
    if (typeof window !== "undefined" || !roomId) return;

    const channel = new BroadcastChannel(`hackord_meet_${roomId}`);
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (data.type === "NEW_MEETING_CODE") {
        const incomingCode = data.payload?.code;
        if (incomingCode && incomingCode !== meetingCode) {
          triggerMeetingCodeSync(incomingCode);
        }
      }
      if (data.type === "CHAT_MSG") {
        setMessages((prev) => [...prev, data.payload]);
      }
      if (data.type === "REACTION") {
        const newRx: FloatingReaction = {
          id: `rx_${Date.now()}_${Math.random()}`,
          emoji: data.payload.emoji,
          left: 20 + Math.random() * 60,
        };
        setReactions((prev) => [...prev, newRx]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== newRx.id));
        }, 2500);
      }
      if (data.type === "HAND_RAISE") {
        const incomingUid = data.payload.uid;
        const raised = data.payload.raised;
        setRaisedHandsUids((prev) => {
          const next = new Set(prev);
          if (raised) next.add(incomingUid);
          else next.delete(incomingUid);
          return next;
        });
      }
      if (data.type === "USER_INFO") {
        const incomingUid = data.payload.uid;
        const incomingUserId = data.payload.userId;
        if (incomingUid && String(incomingUid) !== String(localUid)) {
          setUserInfoMap((prev) => ({
            ...prev,
            [incomingUid]: {
              userId: incomingUserId,
              name: data.payload.name,
              avatar: data.payload.avatar,
              isHost: data.payload.isHost,
            },
          }));
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [roomId, meetingCode]);

  // Update Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen for Fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Background Tab Switch -> Auto Picture-in-Picture (PiP)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden" && joined && cameraOn && localVideoRef.current) {
        try {
          if (!document.pictureInPictureElement && typeof localVideoRef.current.requestPictureInPicture === "function") {
            await localVideoRef.current.requestPictureInPicture();
          }
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [joined, cameraOn]);

  // Play local screen share stream once container mounts
  useEffect(() => {
    if (screenSharing && screenVideoRef.current && localScreenTrackRef.current) {
      let videoTrack: any;
      if (Array.isArray(localScreenTrackRef.current)) {
        videoTrack = localScreenTrackRef.current[0];
      } else {
        videoTrack = localScreenTrackRef.current;
      }
      if (videoTrack) {
        try {
          videoTrack.play(screenVideoRef.current);
        } catch (err) {
          console.warn("[AgoraRTC] Error playing local screen share track:", err);
        }
      }
    }
  }, [screenSharing]);

  // Real-time Mic Frequency Audio Analyzer
  useEffect(() => {
    if (!micOn) {
      setAudioLevel(0);
      return;
    }

    let isMounted = true;

    async function startAudioMeter() {
      try {
        if (!mediaStreamRef.current && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (!isMounted) return;
          mediaStreamRef.current = stream;
        }

        if (mediaStreamRef.current && mediaStreamRef.current.getAudioTracks().length > 0) {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(mediaStreamRef.current);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const analyze = () => {
            if (!isMounted) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            setAudioLevel(normalized);
            animFrameRef.current = requestAnimationFrame(analyze);
          };

          analyze();
        }
      } catch {
        // ignore
      }
    }

    startAudioMeter();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [micOn, joined]);

  // Lobby Camera Preview
  useEffect(() => {
    if (joined) return;
    let stream: MediaStream | null = null;
    async function startLobbyCamera() {
      if (cameraOn && navigator.mediaDevices) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          if (lobbyVideoRef.current) {
            lobbyVideoRef.current.srcObject = stream;
          }
          mediaStreamRef.current = stream;
        } catch (err) {
          console.warn("[Lobby] Camera stream warning:", err);
        }
      }
    }
    startLobbyCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [joined, cameraOn]);

  // ─── AGORA RTC ENGINE INITIALIZATION ───
  useEffect(() => {
    if (!joined) return;

    let active = true;
    const agoraAppId = import.meta.env.VITE_AGORA_APP_ID || (import.meta as any).env?.VITE_AGORA_APP_ID;
    let client: IAgoraRTCClient | null = null;

    async function initAgoraRTC() {
      if (agoraAppId && typeof agoraAppId === "string" && agoraAppId.trim() && !agoraAppId.includes("your_agora_app_id")) {
        try {
          const AgoraRTCModule = await import("agora-rtc-sdk-ng");
          if (!active) return;
          const AgoraRTC = AgoraRTCModule.default || AgoraRTCModule;
          AgoraRTC.setLogLevel(2);
          agoraRtcRef.current = AgoraRTC;

          client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
          agoraClientRef.current = client;

          // Helper to subscribe to remote user audio and video tracks
          const subscribeToUser = async (remoteUser: IAgoraRTCRemoteUser, mediaType?: "audio" | "video" | "datachannel") => {
            if (!client) return;
            try {
              if (mediaType === "audio" || mediaType === "video") {
                await client.subscribe(remoteUser, mediaType);
                if (mediaType === "audio") remoteUser.audioTrack?.play();
              } else if (!mediaType) {
                if (remoteUser.hasAudio) {
                  await client.subscribe(remoteUser, "audio");
                  remoteUser.audioTrack?.play();
                }
                if (remoteUser.hasVideo) {
                  await client.subscribe(remoteUser, "video");
                }
              }
              setRemoteUsers([...client.remoteUsers]);
            } catch (subErr) {
              console.error("[AgoraRTC] Subscription error for user", remoteUser.uid, subErr);
            }
          };

          // Function to announce local user details over Agora Data Stream & BroadcastChannel
          const broadcastLocalUserInfo = (isReply = false) => {
            if (client && client.uid) {
              try {
                const user = getLoggedInUser();
                const userId = user?.id || userName || "";
                const infoPayload = {
                  uid: client.uid,
                  userId,
                  name: userName,
                  avatar: userAvatar,
                  isReply,
                  isScreenSharing: screenSharing,
                  isHandRaised: handRaised,
                  isHost: isOwnerOrAdmin,
                };
                const payload = JSON.stringify({
                  type: "USER_INFO",
                  payload: infoPayload,
                });
                const uint8Array = new TextEncoder().encode(payload);
                (client as any).sendStreamMessage(uint8Array).catch(() => {});
                broadcastChannelRef.current?.postMessage({
                  type: "USER_INFO",
                  payload: infoPayload,
                });
              } catch {}
            }
          };

          // Register ALL event listeners BEFORE joining channel (Agora SDK requirement)
          client.on("stream-message", (senderUid, data) => {
            try {
              const text = new TextDecoder().decode(data);
              const parsed = JSON.parse(text);
              if (parsed.type === "CHAT_MSG") {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === parsed.payload.id)) return prev;
                  return [...prev, parsed.payload];
                });
              } else if (parsed.type === "REACTION") {
                const newRx: FloatingReaction = {
                  id: `rx_${Date.now()}_${Math.random()}`,
                  emoji: parsed.payload.emoji,
                  left: 20 + Math.random() * 60,
                };
                setReactions((prev) => [...prev, newRx]);
                setTimeout(() => {
                  setReactions((prev) => prev.filter((r) => r.id !== newRx.id));
                }, 2500);
              } else if (parsed.type === "HAND_RAISE") {
                const incomingUid = parsed.payload.uid;
                const raised = parsed.payload.raised;
                setRaisedHandsUids((prev) => {
                  const next = new Set(prev);
                  if (raised) next.add(incomingUid);
                  else next.delete(incomingUid);
                  return next;
                });
              } else if (parsed.type === "USER_INFO") {
                const incomingUid = parsed.payload.uid;
                const incomingUserId = parsed.payload.userId;

                if (parsed.payload.isHandRaised) {
                  setRaisedHandsUids((prev) => new Set(prev).add(incomingUid));
                } else {
                  setRaisedHandsUids((prev) => {
                    const next = new Set(prev);
                    next.delete(incomingUid);
                    return next;
                  });
                }

                if (incomingUserId) {
                  setUserInfoMap((prev) => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach((uidKey) => {
                      if (String(uidKey) !== String(incomingUid) && updated[uidKey]?.userId === incomingUserId) {
                        delete updated[uidKey];
                        zombieUidsRef.current.add(uidKey);
                        setRemoteUsers((prevUsers) => prevUsers.filter((u) => String(u.uid) !== String(uidKey)));
                        if (remotePresenterUid === uidKey) {
                          setRemotePresenterUid(null);
                        }
                      }
                    });
                    return updated;
                  });
                }

                setUserInfoMap((prev) => ({
                  ...prev,
                  [incomingUid]: {
                    userId: incomingUserId,
                    name: parsed.payload.name,
                    avatar: parsed.payload.avatar,
                    isHost: parsed.payload.isHost,
                  },
                }));

                if (parsed.payload.isScreenSharing) {
                  setRemotePresenterUid(incomingUid);
                  setLayoutMode("sidebar");
                }
                if (!parsed.payload.isReply) {
                  broadcastLocalUserInfo(true);
                }
              } else if (parsed.type === "SCREEN_SHARE_STATE") {
                if (parsed.payload.active) {
                  setRemotePresenterUid(parsed.payload.uid);
                  setLayoutMode("sidebar");
                  const displayName = userInfoMap[parsed.payload.uid]?.name || `Member (${parsed.payload.uid})`;
                  toast.info(`${displayName} is presenting their screen`);
                } else {
                  setRemotePresenterUid((prev) => (String(prev) === String(parsed.payload.uid) ? null : prev));
                  setLayoutMode("tiled");
                }
              } else if (parsed.type === "HOST_ACTION") {
                if (String(parsed.payload.targetUid) === String(client?.uid)) {
                  if (parsed.payload.action === "MUTE_MIC") {
                    setMicOn(false);
                    localAudioTrackRef.current?.setEnabled(false).catch(() => {});
                    toast.warning("Host muted your microphone");
                  } else if (parsed.payload.action === "TURN_OFF_CAM") {
                    setCameraOn(false);
                    localVideoTrackRef.current?.setEnabled(false).catch(() => {});
                    toast.warning("Host turned off your camera");
                  } else if (parsed.payload.action === "KICK") {
                    toast.error("You were removed from the meeting by the host");
                    handleLeaveCall();
                  }
                }
              }
            } catch (err) {
              console.warn("[AgoraRTC] Error parsing stream message:", err);
            }
          });

          client.on("user-published", async (user, mediaType) => {
            console.log("[AgoraRTC] Remote user published track:", user.uid, mediaType);
            await subscribeToUser(user, mediaType);
            broadcastLocalUserInfo(false);
          });

          client.on("user-unpublished", (user, mediaType) => {
            console.log("[AgoraRTC] Remote user unpublished track:", user.uid, mediaType);
            if (mediaType === "video") {
              user.videoTrack?.stop();
              setRemotePresenterUid((prev) => (String(prev) === String(user.uid) ? null : prev));
              setLayoutMode("tiled");
            }
            if (mediaType === "audio") user.audioTrack?.stop();
            setRemoteUsers([...client!.remoteUsers]);
          });

          client.on("user-joined", (user) => {
            console.log("[AgoraRTC] Remote user joined channel:", user.uid);
            setRemoteUsers([...client!.remoteUsers]);
            broadcastLocalUserInfo(false);
          });

          client.on("user-left", (user, reason) => {
            console.log("[AgoraRTC] Remote user left channel:", user.uid, reason);
            setRemoteUsers([...client!.remoteUsers]);
            setUserInfoMap((prev) => {
              const next = { ...prev };
              delete next[user.uid];
              return next;
            });
            setRemotePresenterUid((prev) => (String(prev) === String(user.uid) ? null : prev));
            setLayoutMode("tiled");
          });

          client.on("user-mute-audio", (user: IAgoraRTCRemoteUser) => {
            setMutedRemoteAudioUids((prev) => new Set(prev).add(user.uid).add(String(user.uid)));
          });

          client.on("user-unmute-audio", (user: IAgoraRTCRemoteUser) => {
            setMutedRemoteAudioUids((prev) => {
              const next = new Set(prev);
              next.delete(user.uid);
              next.delete(String(user.uid));
              return next;
            });
          });

          client.on("user-mute-video", (user: IAgoraRTCRemoteUser) => {
            setMutedRemoteVideoUids((prev) => new Set(prev).add(user.uid).add(String(user.uid)));
          });

          client.on("user-unmute-video", (user: IAgoraRTCRemoteUser) => {
            setMutedRemoteVideoUids((prev) => {
              const next = new Set(prev);
              next.delete(user.uid);
              next.delete(String(user.uid));
              return next;
            });
          });

          // Standardized ASCII Channel Name for Agora Cloud - identical for all members in room
          let channelNameToUse = (meetingCode || roomId || "hackord_meeting").toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
          let appIdToUse = agoraAppId.trim();
          let tokenToUse: string | null = null;

          try {
            const tokenData = await getAgoraToken(roomId);
            if (!active) return;
            if (tokenData && tokenData.appId) {
              appIdToUse = tokenData.appId.trim();
            }
            if (tokenData && tokenData.channelName) {
              channelNameToUse = tokenData.channelName;
            }
            if (tokenData && tokenData.token) {
              tokenToUse = tokenData.token;
            }
          } catch (tokenErr) {
            console.warn("[AgoraRTC] Error fetching meeting token from backend:", tokenErr);
          }

          if (!active) return;

          let uid: string | number;
          try {
            uid = await client.join(appIdToUse, channelNameToUse, tokenToUse, null);
            console.log("[AgoraRTC] Successfully joined channel:", channelNameToUse, "UID:", uid);
          } catch (joinErr) {
            console.warn("[AgoraRTC] Dynamic token join error, falling back to static App ID join:", joinErr);
            uid = await client.join(appIdToUse, channelNameToUse, null, null);
            console.log("[AgoraRTC] Successfully joined channel with static App ID:", channelNameToUse, "UID:", uid);
          }

          if (!active) {
            client.leave().catch(() => {});
            return;
          }

          // Enforce capacity limit: (roomMembersCount + 1)
          const capacityLimit = (roomMembersCount ?? 6) + 1;
          if (client.remoteUsers.length + 1 > capacityLimit) {
            toast.error(`Meeting is full! Maximum capacity is ${capacityLimit} participants.`);
            await client.leave().catch(() => {});
            setJoined(false);
            return;
          }

          toast.success("Connected to live Video Network!");

          // Subscribe to all remote users already present in the channel
          if (client.remoteUsers.length > 0) {
            for (const u of client.remoteUsers) {
              await subscribeToUser(u);
            }
            setRemoteUsers([...client.remoteUsers]);
          }

          // Broadcast local user info to room members
          broadcastLocalUserInfo(false);

          // Create & publish local microphone and camera tracks
          const tracksToPublish = [];

          try {
            if (micOn) {
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              localAudioTrackRef.current = audioTrack;
              tracksToPublish.push(audioTrack);
            }
          } catch (e) {
            console.warn("[AgoraRTC] Microphone track error:", e);
          }

          try {
            if (cameraOn) {
              const videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "720p_1" });
              localVideoTrackRef.current = videoTrack;
              tracksToPublish.push(videoTrack);
              if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
              }
            }
          } catch (e) {
            console.warn("[AgoraRTC] Camera track error:", e);
          }

          const presenceInterval = setInterval(() => {
            if (active && client && client.uid) {
              broadcastLocalUserInfo(true);
            }
          }, 3500);

          (client as any)._presenceInterval = presenceInterval;
        } catch (err: any) {
          console.warn("[AgoraRTC] Fallback to WebRTC local media stream:", err);
          initLocalWebRTCFallback();
        }
      } else {
        initLocalWebRTCFallback();
      }
    }

    async function initLocalWebRTCFallback() {
      try {
        if (cameraOn || micOn) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: cameraOn ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
            audio: micOn,
          });
          mediaStreamRef.current = stream;
          if (localVideoRef.current && cameraOn) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("[WebRTC] Local media stream fallback warning:", err);
      }
    }

    initAgoraRTC();

    return () => {
      active = false;
      dataStreamIdRef.current = null;
      if (agoraClientRef.current && (agoraClientRef.current as any)._presenceInterval) {
        clearInterval((agoraClientRef.current as any)._presenceInterval);
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (localScreenTrackRef.current) {
        let videoTrack: any;
        let audioTrack: any;
        if (Array.isArray(localScreenTrackRef.current)) {
          videoTrack = localScreenTrackRef.current[0];
          audioTrack = localScreenTrackRef.current[1];
        } else {
          videoTrack = localScreenTrackRef.current;
        }
        try {
          videoTrack.close();
          if (audioTrack) audioTrack.close();
        } catch {}
        localScreenTrackRef.current = null;
      }
      if (agoraClientRef.current) {
        agoraClientRef.current.leave().catch(() => {});
        agoraClientRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [joined, roomId]);

  // Toggle Mic
  const toggleMic = async () => {
    const next = !micOn;
    setMicOn(next);

    try {
      if (next) {
        if (!localAudioTrackRef.current && agoraRtcRef.current) {
          const audioTrack = await agoraRtcRef.current.createMicrophoneAudioTrack();
          localAudioTrackRef.current = audioTrack;
          if (agoraClientRef.current) {
            await agoraClientRef.current.publish([audioTrack]);
          }
        } else if (localAudioTrackRef.current) {
          await localAudioTrackRef.current.setEnabled(true);
        } else if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true));
        }
        toast.info("Microphone Unmuted");
      } else {
        if (localAudioTrackRef.current) {
          await localAudioTrackRef.current.setEnabled(false);
        } else if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        toast.info("Microphone Muted");
      }
    } catch (err) {
      console.warn("[AgoraRTC] Error toggling mic:", err);
      toast.error("Could not access microphone");
      setMicOn(false);
    }
  };

  // Toggle Camera
  const toggleCamera = async () => {
    const next = !cameraOn;
    setCameraOn(next);

    try {
      if (next) {
        if (!localVideoTrackRef.current && agoraRtcRef.current) {
          const videoTrack = await agoraRtcRef.current.createCameraVideoTrack({ encoderConfig: "720p_1" });
          localVideoTrackRef.current = videoTrack;
          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current);
          }
          if (agoraClientRef.current) {
            await agoraClientRef.current.publish([videoTrack]);
          }
        } else if (localVideoTrackRef.current) {
          await localVideoTrackRef.current.setEnabled(true);
          if (localVideoRef.current) {
            localVideoTrackRef.current.play(localVideoRef.current);
          }
        } else if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = true));
        }
        toast.info("Camera Turned ON");
      } else {
        if (localVideoTrackRef.current) {
          await localVideoTrackRef.current.setEnabled(false);
        } else if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = false));
        }
        toast.info("Camera Turned OFF");
      }
    } catch (err) {
      console.warn("[AgoraRTC] Error toggling camera:", err);
      toast.error("Could not access camera");
      setCameraOn(false);
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextVal = !handRaised;
    setHandRaised(nextVal);
    toast.info(nextVal ? "You raised your hand ✋" : "Lowered hand");

    if (agoraClientRef.current) {
      try {
        const payload = JSON.stringify({
          type: "HAND_RAISE",
          payload: { uid: agoraClientRef.current.uid, raised: nextVal },
        });
        const uint8Array = new TextEncoder().encode(payload);
        (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch(() => {});
      } catch {}
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "HAND_RAISE",
        payload: { uid: agoraClientRef.current?.uid || "me", raised: nextVal },
      });
    }
  };

  // Helper to stop screen sharing
  const stopScreenSharingInternal = async () => {
    if (localScreenTrackRef.current) {
      let videoTrack: any;
      let audioTrack: any;
      if (Array.isArray(localScreenTrackRef.current)) {
        videoTrack = localScreenTrackRef.current[0];
        audioTrack = localScreenTrackRef.current[1];
      } else {
        videoTrack = localScreenTrackRef.current;
      }

      if (agoraClientRef.current) {
        try {
          const tracks = [videoTrack];
          if (audioTrack) tracks.push(audioTrack);
          await agoraClientRef.current.unpublish(tracks);
        } catch {}
      }

      videoTrack.close();
      if (audioTrack) audioTrack.close();
      localScreenTrackRef.current = null;
    }

    if (cameraOn && localVideoTrackRef.current && agoraClientRef.current) {
      try {
        await agoraClientRef.current.publish(localVideoTrackRef.current);
        if (localVideoRef.current) {
          localVideoTrackRef.current.play(localVideoRef.current);
        }
      } catch (err) {
        console.warn("[AgoraRTC] Error republishing camera track:", err);
      }
    }

    setScreenSharing(false);
    setRemotePresenterUid(null);
    setLayoutMode("tiled");
    toast.info("Screen Sharing Stopped");

    if (agoraClientRef.current) {
      try {
        const payload = JSON.stringify({ type: "SCREEN_SHARE_STATE", payload: { uid: agoraClientRef.current.uid, active: false } });
        const uint8Array = new TextEncoder().encode(payload);
        (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch(() => {});
      } catch {}
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (remotePresenterUid && remotePresenterUid !== "me") {
      toast.error("Someone else is already sharing their screen. Please ask them to stop sharing before you present.");
      return;
    }

    if (screenSharing) {
      await stopScreenSharingInternal();
    } else {
      try {
        const AgoraRTC = agoraRtcRef.current;
        if (!AgoraRTC) {
          toast.error("Agora RTC is not fully initialized.");
          return;
        }

        const screenTrack = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "720p_1" }, "auto");
        localScreenTrackRef.current = screenTrack;

        let videoTrack: any;
        let audioTrack: any;
        if (Array.isArray(screenTrack)) {
          videoTrack = screenTrack[0];
          audioTrack = screenTrack[1];
        } else {
          videoTrack = screenTrack;
        }

        if (cameraOn && localVideoTrackRef.current && agoraClientRef.current) {
          try {
            await agoraClientRef.current.unpublish(localVideoTrackRef.current);
          } catch {}
        }

        const tracksToPublish = [videoTrack];
        if (audioTrack) tracksToPublish.push(audioTrack);

        if (agoraClientRef.current) {
          await agoraClientRef.current.publish(tracksToPublish);
        }

        setScreenSharing(true);
        setRemotePresenterUid("me");
        setLayoutMode("sidebar");
        toast.success("You are presenting your screen");

        setTimeout(() => {
          if (screenVideoRef.current && videoTrack) {
            try {
              videoTrack.play(screenVideoRef.current);
            } catch (e) {
              console.warn("[AgoraRTC] Error playing local screen track:", e);
            }
          }
        }, 50);

        const mediaStreamTrack = videoTrack.getMediaStreamTrack();
        if (mediaStreamTrack) {
          mediaStreamTrack.onended = () => {
            stopScreenSharingInternal();
          };
        }

        if (agoraClientRef.current) {
          try {
            const payload = JSON.stringify({ type: "SCREEN_SHARE_STATE", payload: { uid: agoraClientRef.current.uid, active: true } });
            const uint8Array = new TextEncoder().encode(payload);
            (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch(() => {});
          } catch {}
        }
      } catch (err) {
        console.error("[AgoraRTC] Screen sharing start error:", err);
        toast.error("Screen sharing permission denied or cancelled");
      }
    }
  };

  // Send Emoji Reaction (Broadcasts to all members via Agora Data Stream + BroadcastChannel)
  const sendReaction = (emoji: string) => {
    const newRx: FloatingReaction = {
      id: `rx_${Date.now()}_${Math.random()}`,
      emoji,
      left: 20 + Math.random() * 60,
    };
    setReactions((prev) => [...prev, newRx]);
    setShowReactionsMenu(false);

    if (agoraClientRef.current) {
      try {
        const payload = JSON.stringify({ type: "REACTION", payload: { emoji } });
        const uint8Array = new TextEncoder().encode(payload);
        (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch(() => {});
      } catch {}
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: "REACTION", payload: { emoji } });
    }

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newRx.id));
    }, 2500);
  };

  // Full Screen Toggle
  const toggleFullscreenMode = async () => {
    if (!meetingContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await meetingContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Fullscreen toggle failed");
    }
  };

  // Picture-in-Picture
  const togglePiP = async () => {
    if (!localVideoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (cameraOn) {
        await localVideoRef.current.requestPictureInPicture();
      } else {
        toast.error("Turn on camera first to enable Picture-in-Picture");
      }
    } catch {
      toast.error("Picture-in-Picture is not supported in this browser");
    }
  };

  // Host Mute Remote Mic
  const handleHostMuteMic = (uid: string | number) => {
    if (!isOwnerOrAdmin) return;
    setMutedRemoteAudioUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
        toast.info(`Unmuted mic for Member ${uid}`);
      } else {
        next.add(uid);
        toast.warning(`Host muted microphone for Member ${uid}`);
      }
      return next;
    });

    if (agoraClientRef.current) {
      try {
        const payload = JSON.stringify({
          type: "HOST_ACTION",
          payload: { targetUid: uid, action: "MUTE_MIC" },
        });
        const uint8Array = new TextEncoder().encode(payload);
        (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch(() => {});
      } catch {}
    }
  };

  // Host Turn Off Remote Camera
  const handleHostTurnOffCamera = (uid: string | number) => {
    if (!isOwnerOrAdmin) return;
    setMutedRemoteVideoUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
        toast.info(`Re-enabled camera for Member ${uid}`);
      } else {
        next.add(uid);
        toast.warning(`Host turned off camera for Member ${uid}`);
      }
      return next;
    });

    if (agoraClientRef.current) {
      try {
        const payload = JSON.stringify({
          type: "HOST_ACTION",
          payload: { targetUid: uid, action: "TURN_OFF_CAM" },
        });
        const uint8Array = new TextEncoder().encode(payload);
        (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch(() => {});
      } catch {}
    }
  };

  // Host Kick Member
  const handleHostKickUser = (uid: string | number) => {
    if (!isOwnerOrAdmin) return;
    zombieUidsRef.current.add(uid);
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== uid));
    toast.error(`Host removed Member ${uid} from the meeting`);

    if (agoraClientRef.current) {
      try {
        const payload = JSON.stringify({
          type: "HOST_ACTION",
          payload: { targetUid: uid, action: "KICK" },
        });
        const uint8Array = new TextEncoder().encode(payload);
        (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch(() => {});
      } catch {}
    }
  };

  // Copy Meeting Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(meetingCode);
    toast.success("Meeting code copied to clipboard!");
  };

  // Send In-Meeting Chat Message (Broadcasts to all members via Agora Data Stream + BroadcastChannel)
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const msg: MeetingMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      sender: userName || "Me",
      avatar: userAvatar,
      text: chatText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);

    if (agoraClientRef.current) {
      try {
        const payload = JSON.stringify({ type: "CHAT_MSG", payload: msg });
        const uint8Array = new TextEncoder().encode(payload);
        (agoraClientRef.current as any).sendStreamMessage(uint8Array).catch((err: any) => {
          console.warn("[AgoraRTC] Stream message send failed:", err);
        });
      } catch (err) {
        console.warn("[AgoraRTC] Stream message serialize failed:", err);
      }
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: "CHAT_MSG", payload: msg });
    }
    setChatText("");
  };

  // End Call / Leave Meeting
  const handleLeaveCall = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(sessionKey);
    }
    if (agoraClientRef.current) {
      agoraClientRef.current.leave().catch(() => {});
      agoraClientRef.current = null;
    }
    if (localScreenTrackRef.current) {
      let videoTrack: any;
      let audioTrack: any;
      if (Array.isArray(localScreenTrackRef.current)) {
        videoTrack = localScreenTrackRef.current[0];
        audioTrack = localScreenTrackRef.current[1];
      } else {
        videoTrack = localScreenTrackRef.current;
      }
      try {
        videoTrack.close();
        if (audioTrack) audioTrack.close();
      } catch {}
      localScreenTrackRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setJoined(false);
    toast.info("Left meeting call");
    if (onLeave) onLeave();
  };

  // Authorization Check
  if (!isMemberOrAdmin) {
    return (
      <div className="glass rounded-2xl p-10 text-center shadow-card space-y-4 max-w-lg mx-auto my-8 border border-destructive/20">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold">Restricted Access</h3>
        <p className="text-sm text-muted-foreground">
          Only registered team members, Room Owner, or Platform Admins are authorized to join meeting calls for <strong>{roomName}</strong>.
        </p>
      </div>
    );
  }

  // Pre-join Lobby State
  if (!joined) {
    return (
      <div className="glass rounded-2xl p-6 sm:p-10 shadow-card max-w-2xl mx-auto space-y-6 border border-border/80 bg-card text-card-foreground">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-brand-soft border border-primary/20 shadow-glow mb-1">
            <VideoIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{roomName} Meeting Lobby</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Check your audio and video settings before joining your team.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3.5 py-1.5 text-xs font-mono text-foreground border border-border shadow-sm">
              <span>Code: {meetingCode}</span>
              <button onClick={handleCopyCode} className="hover:text-primary transition" title="Copy Meeting Code">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            {syncTimer > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 border border-amber-500/30 animate-pulse shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>Syncing with Database... ({syncTimer}s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Lobby Camera Preview Box */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted/40 border border-border flex items-center justify-center shadow-inner">
          {cameraOn ? (
            <video
              ref={lobbyVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-2xl transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className={cn("relative rounded-full transition-all duration-300", audioLevel > 15 && "ring-4 ring-primary ring-offset-4 ring-offset-card animate-pulse")}>
                <Avatar className="h-20 w-20 border-2 border-border shadow-lg">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="text-xl font-bold bg-gradient-brand text-white">{userName[0]}</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{userName}</p>
            </div>
          )}

          <div className="absolute bottom-3 left-3 rounded-lg bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium border border-border text-foreground">
            {userName} (You)
          </div>

          {micOn && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur border border-border px-2.5 py-1.5 rounded-full">
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 rounded bg-primary transition-all duration-75" style={{ height: `${Math.max(20, audioLevel * 0.8)}%` }} />
                <span className="w-1 rounded bg-primary transition-all duration-75" style={{ height: `${Math.max(30, audioLevel * 1.0)}%` }} />
                <span className="w-1 rounded bg-primary transition-all duration-75" style={{ height: `${Math.max(15, audioLevel * 0.6)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Lobby Controls Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border border-border">
            <Button
              type="button"
              variant={micOn ? "secondary" : "destructive"}
              onClick={() => setMicOn(!micOn)}
              className="rounded-full h-11 w-11 p-0"
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            {micOn && (
              <div className="flex items-end gap-0.5 h-4 px-2">
                <span className="w-1 rounded bg-emerald-400 transition-all duration-75" style={{ height: `${Math.max(20, audioLevel * 0.8)}%` }} />
                <span className="w-1 rounded bg-emerald-400 transition-all duration-75" style={{ height: `${Math.max(30, audioLevel * 1.0)}%` }} />
                <span className="w-1 rounded bg-emerald-400 transition-all duration-75" style={{ height: `${Math.max(15, audioLevel * 0.6)}%` }} />
              </div>
            )}
          </div>

          <Button
            type="button"
            variant={cameraOn ? "outline" : "destructive"}
            onClick={() => setCameraOn(!cameraOn)}
            className="rounded-full h-11 w-11 p-0"
            title={cameraOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {cameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            onClick={() => {
              if (syncTimer > 0) return;
              setJoined(true);
              toast.success("Joined meeting video call!");
            }}
            disabled={syncTimer > 0}
            className={cn(
              "bg-gradient-brand text-white shadow-glow px-6 h-11 rounded-full font-medium transition-all",
              syncTimer > 0 && "opacity-60 cursor-not-allowed bg-muted text-muted-foreground shadow-none border border-border"
            )}
          >
            {syncTimer > 0 ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Syncing Code ({syncTimer}s)...
              </span>
            ) : (
              "Join Meeting Now"
            )}
          </Button>

          {isOwnerOrAdmin && (
            <Button
              type="button"
              onClick={handleCreateInstantMeeting}
              disabled={syncTimer > 0}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 px-6 h-11 rounded-full font-medium gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" /> Create Instant Meeting
            </Button>
          )}
        </div>
      </div>
    );
  }

  const totalParticipantsCount = 1 + remoteUsers.length;

  return (
    <div
      ref={meetingContainerRef}
      className={cn(
        "relative flex flex-col justify-between overflow-hidden transition-all duration-300",
        "rounded-2xl border border-border/80 shadow-2xl bg-card text-card-foreground",
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none p-4 sm:p-6 bg-card" : "min-h-[580px] w-full p-4 sm:p-6",
      )}
    >
      {/* ─── Top Bar Header (Google Meet Style) ─── */}
      <div className="z-20 flex items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-foreground">{currentTime}</span>
          <span className="text-border text-sm">|</span>
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-mono border border-border/60">
            <span className="truncate max-w-[140px] sm:max-w-none text-foreground">{meetingCode}</span>
            <button onClick={handleCopyCode} className="text-muted-foreground hover:text-primary transition">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Agora RTC Active
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Top Right Participants Button */}
          <Button
            size="sm"
            variant={showParticipants ? "secondary" : "outline"}
            onClick={() => {
              setShowParticipants(!showParticipants);
              if (showChat) setShowChat(false);
            }}
            className="gap-1.5 h-8 sm:h-9 text-xs rounded-full"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="font-semibold">{totalParticipantsCount}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreenMode}
            className="h-8 sm:h-9 w-8 sm:w-9 p-0 rounded-full text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ─── Main Meeting Workspace Body (Video Grid + View Modes) ─── */}
      <div className="relative my-4 flex-1 flex gap-4 min-h-[380px] overflow-hidden">
        {/* Video Canvas Container */}
        <div className="relative flex-1 rounded-2xl bg-muted/20 border border-border/80 overflow-hidden flex items-center justify-center p-3">
          {/* Floating Emoji Reaction Overlay */}
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute text-4xl animate-bounce transition-all duration-1000"
                style={{ left: `${r.left}%`, bottom: "20%" }}
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Dynamic Video View Modes (Tiled, Spotlight, Google Meet Sidebar View) */}
          {(() => {
            const isScreenSharingActive = Boolean(screenSharing || (remotePresenterUid && remotePresenterUid !== "me"));
            const isSidebarActive = layoutMode === "sidebar" || isScreenSharingActive || pinnedUid !== null;

            if (isSidebarActive) {
              const leftSideUid = isScreenSharingActive
                ? null
                : (pinnedUid || (remoteUsers.length > 0 ? remoteUsers[0].uid : "me"));
              const isLocalUserInFocus = leftSideUid === "me";

              return (
                <div className="w-full h-full flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
                  {/* Left Side Focus Area: Screen presentation OR Pinned / Main User */}
                  <div className="flex-1 min-h-[300px] h-full rounded-xl overflow-hidden bg-black flex items-center justify-center relative border border-border/80 shadow-lg">
                    {isScreenSharingActive ? (
                      screenSharing ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-black">
                          <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                          <div className="absolute top-3 left-3 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur border border-border">
                            🖥️ You are presenting your screen
                          </div>
                        </div>
                      ) : (
                        <RemotePresenterPlayer
                          remoteUsers={remoteUsers}
                          presenterUid={remotePresenterUid!}
                          userInfo={userInfoMap[remotePresenterUid!]}
                        />
                      )
                    ) : leftSideUid === "me" ? (
                      <div className="relative w-full h-full min-h-[260px] rounded-xl overflow-hidden bg-card border border-border/80 flex items-center justify-center shadow-md">
                        {cameraOn ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-xl transform -scale-x-100"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-card">
                              <AvatarImage src={userAvatar} />
                              <AvatarFallback className="text-xl font-bold bg-gradient-brand text-white">
                                {userName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-foreground">{userName}</p>
                              {isOwnerOrAdmin && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-background/80 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-foreground border border-border/80 shadow-md">
                          <span>{userName} (You)</span>
                          {isOwnerOrAdmin && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
                          {handRaised && <span className="text-base animate-pulse">✋</span>}
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            onClick={() => setPinnedUid(pinnedUid === "me" ? null : "me")}
                            className="p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border text-foreground hover:text-primary transition"
                          >
                            {pinnedUid === "me" ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5" />}
                          </button>
                          <div className={cn("p-1.5 rounded-full backdrop-blur-md border", micOn ? "bg-background/80 border-border text-foreground" : "bg-destructive/80 border-destructive text-white")}>
                            {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const targetUser = remoteUsers.find((u) => u.uid === leftSideUid);
                        if (!targetUser) return null;
                        const isPresenting = String(remotePresenterUid) === String(targetUser.uid);
                        return (
                          <RemoteUserTile
                            key={targetUser.uid}
                            user={targetUser}
                            userInfo={userInfoMap[targetUser.uid]}
                            isPinned={pinnedUid === targetUser.uid}
                            isOwnerOrAdmin={isOwnerOrAdmin}
                            isAudioMuted={mutedRemoteAudioUids.has(targetUser.uid)}
                            isVideoMuted={isPresenting || mutedRemoteVideoUids.has(targetUser.uid)}
                            isHandRaised={raisedHandsUids.has(targetUser.uid) || raisedHandsUids.has(String(targetUser.uid))}
                            isHost={userInfoMap[targetUser.uid]?.isHost}
                            onTogglePin={() => setPinnedUid(pinnedUid === targetUser.uid ? null : targetUser.uid)}
                            onMuteMic={() => handleHostMuteMic(targetUser.uid)}
                            onTurnOffCamera={() => handleHostTurnOffCamera(targetUser.uid)}
                            onKick={() => handleHostKickUser(targetUser.uid)}
                          />
                        );
                      })()
                    )}
                  </div>

                  {/* Right Side Sidebar Gallery of all other user tiles */}
                  <div className="w-full lg:w-80 shrink-0 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-full max-h-48 pr-1 pb-1 lg:pb-0 custom-scrollbar">
                    {/* Local user tile if not in focus */}
                    {!isLocalUserInFocus && (
                      <div className="w-56 lg:w-full min-h-[160px] aspect-video shrink-0 rounded-xl overflow-hidden bg-card border border-border/80 flex items-center justify-center relative group shadow-md">
                        {cameraOn ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform -scale-x-100"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 p-2">
                            <Avatar className="h-10 w-10 border border-primary/30 shadow-card">
                              <AvatarImage src={userAvatar} />
                              <AvatarFallback className="text-sm font-bold bg-gradient-brand text-white">
                                {userName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1">
                              <p className="text-[11px] font-semibold text-foreground truncate max-w-[100px]">{userName}</p>
                              {isOwnerOrAdmin && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[9px] py-0 px-1 font-semibold">Host</Badge>}
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-background/85 backdrop-blur px-2 py-1 text-[11px] font-medium text-foreground border border-border/60 shadow">
                          <span className="truncate max-w-[80px]">{userName}</span>
                          {isOwnerOrAdmin && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[9px] py-0 px-1 font-semibold">Host</Badge>}
                          {handRaised && <span className="text-[12px] animate-pulse">✋</span>}
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            onClick={() => setPinnedUid("me")}
                            className="p-1 rounded-full bg-background/80 backdrop-blur border border-border text-foreground hover:text-primary transition"
                          >
                            <Pin className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Remote users tiles excluding leftSideUid */}
                    {remoteUsers.map((user) => {
                      if (user.uid === leftSideUid) return null;
                      const isPresenting = String(remotePresenterUid) === String(user.uid);
                      return (
                        <div key={user.uid} className="w-56 lg:w-full min-h-[160px] aspect-video shrink-0">
                          <RemoteUserTile
                            user={user}
                            userInfo={userInfoMap[user.uid]}
                            isPinned={pinnedUid === user.uid}
                            isOwnerOrAdmin={isOwnerOrAdmin}
                            isAudioMuted={mutedRemoteAudioUids.has(user.uid)}
                            isVideoMuted={isPresenting || mutedRemoteVideoUids.has(user.uid)}
                            isHandRaised={raisedHandsUids.has(user.uid) || raisedHandsUids.has(String(user.uid))}
                            isHost={userInfoMap[user.uid]?.isHost}
                            onTogglePin={() => setPinnedUid(pinnedUid === user.uid ? null : user.uid)}
                            onMuteMic={() => handleHostMuteMic(user.uid)}
                            onTurnOffCamera={() => handleHostTurnOffCamera(user.uid)}
                            onKick={() => handleHostKickUser(user.uid)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Normal Tiled / Spotlight Layout Mode
            return (
              <div
                className={cn(
                  "w-full h-full gap-3 transition-all duration-300",
                  layoutMode === "spotlight"
                    ? "grid grid-cols-1"
                    : remoteUsers.length === 0
                    ? "grid grid-cols-1"
                    : remoteUsers.length === 1
                    ? "grid grid-cols-1 sm:grid-cols-2"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}
              >
                {/* Local User Video Tile */}
                <div
                  className={cn(
                    "relative w-full h-full min-h-[260px] rounded-xl overflow-hidden bg-card border border-border/80 flex items-center justify-center group shadow-md",
                    pinnedUid === "me" && "border-2 border-primary shadow-glow"
                  )}
                >
                  {cameraOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-xl transform -scale-x-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className={cn("relative rounded-full transition-all duration-300", audioLevel > 15 && "ring-4 ring-primary ring-offset-4 ring-offset-card animate-pulse")}>
                        <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-card">
                          <AvatarImage src={userAvatar} />
                          <AvatarFallback className="text-xl font-bold bg-gradient-brand text-white">
                            {userName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground">{userName}</p>
                        {isOwnerOrAdmin && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-background/80 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-foreground border border-border/80 shadow-md">
                    <span>{userName} (You)</span>
                    {isOwnerOrAdmin && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
                    {handRaised && <span className="text-base animate-pulse">✋</span>}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => setPinnedUid(pinnedUid === "me" ? null : "me")}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border text-foreground hover:text-primary transition"
                    >
                      {pinnedUid === "me" ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <div className={cn("p-1.5 rounded-full backdrop-blur-md border", micOn ? "bg-background/80 border-border text-foreground" : "bg-destructive/80 border-destructive text-white")}>
                      {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Remote Users Video Tiles */}
                {remoteUsers.map((user) => {
                  const isPresenting = String(remotePresenterUid) === String(user.uid);
                  return (
                    <RemoteUserTile
                      key={user.uid}
                      user={user}
                      userInfo={userInfoMap[user.uid]}
                      isPinned={pinnedUid === user.uid}
                      isOwnerOrAdmin={isOwnerOrAdmin}
                      isAudioMuted={mutedRemoteAudioUids.has(user.uid)}
                      isVideoMuted={isPresenting || mutedRemoteVideoUids.has(user.uid)}
                      isHandRaised={raisedHandsUids.has(user.uid) || raisedHandsUids.has(String(user.uid))}
                      isHost={userInfoMap[user.uid]?.isHost}
                      onTogglePin={() => setPinnedUid(pinnedUid === user.uid ? null : user.uid)}
                      onMuteMic={() => handleHostMuteMic(user.uid)}
                      onTurnOffCamera={() => handleHostTurnOffCamera(user.uid)}
                      onKick={() => handleHostKickUser(user.uid)}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ─── Side Drawer: Participants ─── */}
        {showParticipants && (
          <div className="w-72 sm:w-80 shrink-0 rounded-2xl bg-card border border-border p-4 flex flex-col justify-between shadow-card animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> People ({totalParticipantsCount})
                </h3>
                <button onClick={() => setShowParticipants(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-2.5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback>{userName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{userName} (You)</span>
                    {isOwnerOrAdmin && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {handRaised && <span>✋</span>}
                    {micOn ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                </div>

                {remoteUsers.map((u) => {
                  const uInfo = userInfoMap[u.uid];
                  const uName = uInfo?.name || `Member (${u.uid})`;
                  const uHand = raisedHandsUids.has(u.uid) || raisedHandsUids.has(String(u.uid));
                  const uHost = uInfo?.isHost;
                  return (
                    <div key={u.uid} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-2.5 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          {uInfo?.avatar && <AvatarImage src={uInfo.avatar} />}
                          <AvatarFallback>{uName[0]?.toUpperCase() || "M"}</AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{uName}</span>
                        {uHost && <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-1 font-semibold">Host</Badge>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {uHand && <span>✋</span>}
                        {isOwnerOrAdmin ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleHostMuteMic(u.uid)}
                              className="p-1 text-muted-foreground hover:text-destructive transition"
                              title="Mute Mic"
                            >
                              <VolumeX className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleHostTurnOffCamera(u.uid)}
                              className="p-1 text-muted-foreground hover:text-destructive transition"
                              title="Turn Off Camera"
                            >
                              <CameraOff className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleHostKickUser(u.uid)}
                              className="p-1 text-destructive hover:scale-110 transition"
                              title="Kick Member"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Member</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-3 border-t border-border text-[11px] text-muted-foreground text-center">
              Room Code: <code className="text-foreground font-mono">{meetingCode}</code>
            </div>
          </div>
        )}

        {/* ─── Side Drawer: In-Meeting Chat ─── */}
        {showChat && (
          <div className="w-72 sm:w-80 shrink-0 rounded-2xl bg-card border border-border p-4 flex flex-col justify-between shadow-card animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> In-meeting messages
              </h3>
              <button onClick={() => setShowChat(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-[300px] pr-1">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-xs">
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback>{m.sender[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold text-foreground">{m.sender}</span>
                      <span className="text-[10px] text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground leading-relaxed break-words">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                placeholder="Send message to everyone"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" disabled={!chatText.trim()} className="h-8 px-2.5 bg-gradient-brand text-white">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* ─── Bottom Toolbar Controls ─── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>{roomName}</span>
        </div>

        {/* Inline Floating Reaction Bar Card */}
        {showReactionsMenu && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/95 backdrop-blur border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            {["👏", "👍", "❤️", "😂", "🎉", "😮"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-2xl hover:scale-130 transition-transform p-1.5 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Inline Floating Three-Dots Menu Card */}
        {showThreeDotsMenu && (
          <div className="absolute bottom-20 right-8 sm:right-100 z-50 w-56 rounded-2xl bg-card/95 backdrop-blur border border-border p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs">
            <button
              onClick={() => { setLayoutMode("tiled"); setShowThreeDotsMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-foreground transition text-left"
            >
              <LayoutGrid className="h-4 w-4 text-primary" /> Tiled view
            </button>
            <button
              onClick={() => { setLayoutMode("spotlight"); setShowThreeDotsMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-foreground transition text-left"
            >
              <Sparkles className="h-4 w-4 text-amber-400" /> Spotlight view
            </button>
            <button
              onClick={() => { setLayoutMode("sidebar"); setShowThreeDotsMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-foreground transition text-left"
            >
              <LayoutGrid className="h-4 w-4 text-emerald-400" /> Sidebar view
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => { toggleFullscreenMode(); setShowThreeDotsMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-foreground transition text-left"
            >
              <Maximize2 className="h-4 w-4" /> Toggle Full screen
            </button>
            <button
              onClick={() => { togglePiP(); setShowThreeDotsMenu(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-foreground transition text-left"
            >
              <PictureInPicture className="h-4 w-4" /> Picture-in-Picture
            </button>
          </div>
        )}

        {/* Center Control Buttons */}
        <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
          {/* Mic Button & Beat Meter */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-full border border-border">
            <Button
              type="button"
              variant={micOn ? "secondary" : "destructive"}
              onClick={toggleMic}
              className="rounded-full h-10 w-10 sm:h-11 sm:w-11 p-0 transition-transform active:scale-95 shadow-md"
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            {micOn && (
              <div className="hidden sm:flex items-end gap-0.5 h-4 px-2">
                <span className="w-1 rounded bg-emerald-400 transition-all duration-75" style={{ height: `${Math.max(20, audioLevel * 0.8)}%` }} />
                <span className="w-1 rounded bg-emerald-400 transition-all duration-75" style={{ height: `${Math.max(30, audioLevel * 1.0)}%` }} />
                <span className="w-1 rounded bg-emerald-400 transition-all duration-75" style={{ height: `${Math.max(15, audioLevel * 0.6)}%` }} />
              </div>
            )}
          </div>

          {/* Camera */}
          <Button
            type="button"
            variant={cameraOn ? "secondary" : "destructive"}
            onClick={toggleCamera}
            className="rounded-full h-10 w-10 sm:h-11 sm:w-11 p-0 transition-transform active:scale-95 shadow-md"
            title={cameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {cameraOn ? <VideoIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            type="button"
            variant={screenSharing ? "default" : "secondary"}
            onClick={toggleScreenShare}
            className="rounded-full h-10 w-10 sm:h-11 sm:w-11 p-0 transition-transform active:scale-95 shadow-md"
            title="Present screen"
          >
            <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Reaction Emoji Picker Button */}
          <Button
            type="button"
            variant={showReactionsMenu ? "default" : "secondary"}
            onClick={() => {
              setShowReactionsMenu(!showReactionsMenu);
              if (showThreeDotsMenu) setShowThreeDotsMenu(false);
            }}
            className="rounded-full h-10 w-10 sm:h-11 sm:w-11 p-0 shadow-md"
            title="Send reaction"
          >
            <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Raise Hand */}
          <Button
            type="button"
            variant={handRaised ? "default" : "secondary"}
            onClick={toggleHandRaise}
            className="rounded-full h-10 w-10 sm:h-11 sm:w-11 p-0 shadow-md"
            title="Raise hand"
          >
            <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Three Dots Button (...) */}
          <Button
            type="button"
            variant={showThreeDotsMenu ? "default" : "secondary"}
            onClick={() => {
              setShowThreeDotsMenu(!showThreeDotsMenu);
              if (showReactionsMenu) setShowReactionsMenu(false);
            }}
            className="rounded-full h-10 w-10 sm:h-11 sm:w-11 p-0 shadow-md"
            title="More options"
          >
            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* End Call */}
          <Button
            type="button"
            variant="destructive"
            onClick={handleLeaveCall}
            className="rounded-full h-10 w-14 sm:h-11 sm:w-16 p-0 bg-red-600 hover:bg-red-700 shadow-lg text-white font-medium"
            title="Leave call"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>

        {/* Bottom Right: Chat Drawer Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showChat ? "secondary" : "outline"}
            onClick={() => {
              setShowChat(!showChat);
              if (showParticipants) setShowParticipants(false);
            }}
            className="gap-1.5 h-9 rounded-full text-xs"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
  