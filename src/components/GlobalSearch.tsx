import { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Users2,
  Compass,
  LayoutDashboard,
  Hash,
  GraduationCap,
  Github,
  Linkedin,
  Globe,
  UserCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getRooms, type DbRoom } from "@/lib/rooms-api";
import { searchUsers, type DbUser } from "@/lib/users-api";
import { UserProfileModal } from "./UserProfileModal";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useAuth } from "@/lib/auth";

type PageResult = {
  id: string;
  label: string;
  sub: string;
  href: string;
  type: "page";
};

type RoomResult = {
  id: string;
  label: string;
  sub: string;
  href: string;
  type: "room";
};

const PAGES: PageResult[] = [
  { id: "p1", label: "Dashboard", sub: "Home overview", href: "/dashboard", type: "page" },
  { id: "p2", label: "Explore", sub: "Find hackathons", href: "/explore", type: "page" },
  { id: "p3", label: "My Rooms", sub: "Your hackathon rooms", href: "/rooms", type: "page" },
];

export function GlobalSearch({ isMobileTop = false }: { isMobileTop?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState<DbUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([]);

  useEffect(() => {
    getRooms({ all: true }).then((res) => setDbRooms(res || [])).catch(() => setDbRooms([]));
  }, []);

  const { user: currentUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Click / Touch outside handler to deactivate search
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  // Live database user search with debounce
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setUserResults([]);
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    const timer = setTimeout(() => {
      searchUsers(q, {
        excludeId: currentUser?._id,
        excludeEmail: currentUser?.email,
      })
        .then((users) => {
          // Filter out current user's profile and admin profiles
          const filtered = users.filter(
            (u) =>
              u.role !== "admin" &&
              u._id !== currentUser?._id &&
              (currentUser?.email ? u.email?.toLowerCase() !== currentUser.email.toLowerCase() : true) &&
              (currentUser?.username ? u.username?.toLowerCase() !== currentUser.username.toLowerCase() : true)
          );
          setUserResults(filtered);
        })
        .finally(() => setLoadingUsers(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, currentUser]);

  const q = query.toLowerCase().trim();

  const roomResults: RoomResult[] = dbRooms
    .filter(
      (r) => (r.name || "").toLowerCase().includes(q) || (r.hackathon || "").toLowerCase().includes(q)
    )
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      label: r.name,
      sub: r.hackathon ?? "Room",
      href: `/rooms/${r.id}`,
      type: "room",
    }));

  const pageResults: PageResult[] = PAGES.filter((p) =>
    p.label.toLowerCase().includes(q)
  );

  const showResults = q.length > 0;

  const handleOpenUserProfile = (user: DbUser) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
    setOpen(false);
  };

  return (
    <>
      {/* Search trigger */}
      {isMobileTop ? (
        /* Mobile Top Search Bar (Appears at top of page content for mobile only) */
        <div className="mb-4 md:hidden sticky top-18 z-40">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center gap-3 rounded-xl border border-border/80 bg-sidebar-accent/60 px-4 py-2.5 text-sm text-muted-foreground shadow-sm hover:border-primary/50 transition"
          >
            <Search className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 text-left truncate">Search members, skills, college…</span>
          </button>
        </div>
      ) : (
        /* Desktop Top Header Trigger */
        <button
          id="global-search-trigger"
          onClick={() => setOpen(true)}
          className="relative hidden md:flex max-w-xs flex-1 items-center gap-2 rounded-lg border border-border bg-sidebar-accent/50 px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left truncate">Search name, skill, college…</span>
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono sm:block">
            Ctrl K
          </kbd>
        </button>
      )}

      {/* Modal overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />
          <div className="fixed left-1/2 top-[5%] sm:top-[10%] z-50 w-full max-w-2xl -translate-x-1/2 px-3 sm:px-4">
            <div
              ref={containerRef}
              className="overflow-hidden rounded-2xl border border-border bg-sidebar/95 shadow-2xl backdrop-blur-xl"
            >
              {/* Input */}
              <div className="flex items-center gap-2 sm:gap-3 border-b border-border px-3 py-3 sm:px-4 sm:py-3.5">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, skill, github, linkedin, college or portfolio…"
                  className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {/* Tap-friendly close button for mobile & desktop */}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="rounded-lg bg-muted/70 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition flex items-center gap-1 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Close</span>
                </button>
              </div>

              {/* Results Container */}
              <div className="max-h-[60vh] sm:max-h-[440px] overflow-y-auto p-2 space-y-4">
                {!showResults && (
                  <div className="space-y-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick navigation
                    </p>
                    {PAGES.map((p) => (
                      <Link
                        key={p.id}
                        to={p.href as any}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-sidebar-accent transition"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand-soft">
                          {p.id === "p1" && <LayoutDashboard className="h-4 w-4 text-primary" />}
                          {p.id === "p2" && <Compass className="h-4 w-4 text-primary" />}
                          {p.id === "p3" && <Users2 className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className="font-medium">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.sub}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {showResults && loadingUsers && (
                  <div className="py-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
                    Searching database user profiles...
                  </div>
                )}

                {/* USER RESULTS SECTION (LinkedIn Style Cards) */}
                {showResults && !loadingUsers && userResults.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        User Profiles ({userResults.length})
                      </p>
                      <span className="text-[10px] text-muted-foreground">Click to view full profile</span>
                    </div>

                    <div className="space-y-2 mt-1">
                      {userResults.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleOpenUserProfile(user)}
                          className="group cursor-pointer rounded-xl border border-border/60 bg-card/40 p-3 hover:border-primary/50 hover:bg-sidebar-accent/80 transition shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-11 w-11 border border-border shrink-0">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-gradient-brand text-white font-bold">
                                {user.name[0]}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm group-hover:text-primary transition">
                                  {user.name}
                                </span>
                                {user.username && (
                                  <span className="text-xs text-muted-foreground">
                                    @{user.username}
                                  </span>
                                )}
                                {user.experience && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                    {user.experience}
                                  </Badge>
                                )}
                              </div>

                              {/* College / Location */}
                              {user.college && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                  <GraduationCap className="h-3 w-3 shrink-0 text-primary/80" />
                                  {user.college} {user.city ? `· ${user.city}` : ""}
                                </p>
                              )}

                              {/* Skills */}
                              {user.skills && user.skills.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {user.skills.slice(0, 4).map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="secondary"
                                      className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-transparent"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                  {user.skills.length > 4 && (
                                    <span className="text-[10px] text-muted-foreground self-center">
                                      +{user.skills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Social Handles snippet */}
                              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                                {user.github && (
                                  <span className="flex items-center gap-1 hover:text-foreground">
                                    <Github className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">{user.github}</span>
                                  </span>
                                )}
                                {user.linkedin && (
                                  <span className="flex items-center gap-1 text-blue-400">
                                    <Linkedin className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">{user.linkedin}</span>
                                  </span>
                                )}
                                {user.portfolio && (
                                  <span className="flex items-center gap-1 text-emerald-400">
                                    <Globe className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">{user.portfolio}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <button className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary group-hover:bg-gradient-brand group-hover:text-white transition shadow-sm">
                              View Profile
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ROOM & PAGE RESULTS */}
                {showResults && !loadingUsers && (pageResults.length > 0 || roomResults.length > 0) && (
                  <div className="space-y-2 border-t border-border/50 pt-2">
                    {roomResults.map((r) => (
                      <Link
                        key={r.id}
                        to={r.href as any}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-sidebar-accent transition"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-brand-soft">
                          <Hash className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.label}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.sub}</p>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                          room
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {showResults && !loadingUsers && userResults.length === 0 && roomResults.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No matching user profiles or rooms found for "<span className="font-medium text-foreground">{query}</span>"
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Full Profile Details Modal */}
      <UserProfileModal
        user={selectedUser}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
