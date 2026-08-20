import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sparkles,
  LayoutDashboard,
  Users2,
  UserCircle2,
  Settings,
  Plus,
  Compass,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Tag,
  Trophy,
  Home,
  Music,
  User,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import { getConversations } from "@/lib/chat-api";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo } from "./BrandLogo";
import { haptic } from "@/lib/haptic";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CreateRoomModal } from "./CreateRoomModal";
import { useAuth } from "@/lib/auth";
import { GlobalSearch } from "./GlobalSearch";
import { fetchRealNotifications, type RealNotification } from "@/lib/notifications-api";
import { sendHeartbeat } from "@/lib/users-api";
import { sendNativeSystemNotification } from "@/lib/system-notifications";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "General Chat", icon: MessageSquare },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/rooms", label: "My Rooms", icon: Users2 },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openCreate, setOpenCreate] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [realNotifications, setRealNotifications] = useState<RealNotification[]>([]);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());

  // 1. Real-time Heartbeat Ping (updates lastActive status every 15s)
  useEffect(() => {
    if (!user?._id) return;
    sendHeartbeat(user._id);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        sendHeartbeat(user._id);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [user?._id]);

  // 2. Fetch Notifications & Trigger Native OS System Push Notifications
  useEffect(() => {
    if (!user) return;
    const loadNotifs = () => {
      fetchRealNotifications(user).then((res) => {
        const notifList = res || [];
        setRealNotifications(notifList);

        // Check for new unread notifications and trigger Native OS Notification Center alert
        notifList.forEach((n) => {
          if (n.unread && !prevNotifIdsRef.current.has(n.id)) {
            prevNotifIdsRef.current.add(n.id);
            if (typeof document !== "undefined" && document.hidden) {
              sendNativeSystemNotification(`Hackord: ${n.title}`, n.detail);
            }
          }
        });
      });
    };

    loadNotifs();
    const interval = setInterval(loadNotifs, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = realNotifications.filter((n) => n.unread).length;

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const savedCollapsed = localStorage.getItem("hackord_sidebar_collapsed") === "true";
      if (savedCollapsed) setCollapsed(true);

      const savedTheme = localStorage.getItem("hackord_theme") as "dark" | "light";
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== "undefined") {
      if (theme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      }
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hackord_theme", theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hackord_sidebar_collapsed", String(collapsed));
    }
  }, [collapsed, mounted]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const toggleSidebar = () => {
    haptic("light");
    setCollapsed((c) => !c);
  };

  const displayName = user?.name || "Guest";
  const displayUsername = user?.username || (user?.email ? user.email.split("@")[0] : "guest");
  const displayAvatar = user?.avatar || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const GradientAvatar = ({ size = "h-9 w-9" }: { size?: string }) => (
    <div
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-glow ring-2 ring-primary/30",
        "bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500"
      )}
      style={{ fontSize: size.includes("8") ? "0.65rem" : "0.75rem" }}
    >
      {initials}
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen md:h-screen md:overflow-hidden bg-background bg-mesh text-foreground flex flex-col pb-24 md:pb-0">
        <div className="flex flex-1 min-h-0">
          {/* ── Sidebar (Desktop) ── */}
          <aside
            className={cn(
              "hidden md:flex flex-col shrink-0 rounded-3xl border border-border bg-card/25 backdrop-blur-3xl shadow-xl transition-all duration-300 ease-in-out z-30 ml-4 my-4 mr-2 h-[calc(100vh-2rem)] sticky top-4",
              collapsed ? "w-[68px]" : "w-64"
            )}
          >
            {/* Logo + Toggle */}
            <div className="flex items-center justify-between px-3 py-4 min-h-[68px]">
              {!collapsed ? (
                <>
                  <BrandLogo size="md" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleSidebar}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
                        aria-label="Collapse sidebar"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Collapse sidebar</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 w-full">
                  <BrandLogo iconOnly size="md" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleSidebar}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
                        aria-label="Expand sidebar"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Expand sidebar</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 px-2 overflow-hidden">
              {NAV.map((item) => {
                const active =
                  pathname === item.to ||
                  (item.to !== "/dashboard" && pathname.startsWith(item.to));

                const linkEl = (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      collapsed ? "justify-center px-2" : "",
                      active
                        ? "bg-gradient-brand-soft text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </>
                    )}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  linkEl
                );
              })}

              {isAdmin &&
                (() => {
                  const active = pathname === "/admin";
                  const adminLink = (
                    <Link
                      to="/admin"
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                        collapsed ? "justify-center px-2" : "",
                        active
                          ? "bg-gradient-brand-soft text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <ShieldCheck className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                      {!collapsed && <span className="truncate">Admin Panel</span>}
                    </Link>
                  );
                  return collapsed ? (
                    <Tooltip key="/admin">
                      <TooltipTrigger asChild>{adminLink}</TooltipTrigger>
                      <TooltipContent side="right">Admin Panel</TooltipContent>
                    </Tooltip>
                  ) : (
                    adminLink
                  );
                })()}
            </nav>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex min-w-0 flex-1 flex-col md:my-4 md:mr-4 md:ml-2 md:gap-4 h-full">
            {/* Topbar */}
            <header className={cn(
              "z-30 flex h-16 shrink-0 items-center gap-3 px-4 md:px-6 backdrop-blur-2xl shadow-spatial",
              "rounded-2xl border border-border/80 bg-card/40 sticky top-2 mx-2 md:mx-0 md:relative transition-all duration-200"
            )}>
              <div className="flex items-center gap-2 md:hidden">
                <BrandLogo iconOnly size="sm" />
              </div>

              {/* Global Search */}
              <GlobalSearch />

              {/* Right side: theme toggle, original top-right notifications dropdown, user avatar */}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />

                {user ? (
                  <>
                    {/* Top-Right Notifications Menu */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gradient-brand shadow-glow" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 z-50">
                        <DropdownMenuLabel className="flex items-center justify-between">
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-medium text-white">
                              {unreadCount} new
                            </span>
                          )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {realNotifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            No recent notifications 🎉
                          </div>
                        ) : (
                          realNotifications.slice(0, 5).map((n) => (
                            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 p-2.5 cursor-pointer">
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium">{n.title}</span>
                                <span className="text-[10px] text-muted-foreground">{n.time}</span>
                              </div>
                              <span className="text-xs text-muted-foreground line-clamp-2">{n.detail}</span>
                            </DropdownMenuItem>
                          ))
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/notifications" className="w-full text-center text-sm font-medium text-primary cursor-pointer">
                            View all notifications
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User avatar dropdown */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-full outline-none ring-primary/60 focus-visible:ring-2 transition hover:scale-105">
                          {displayAvatar ? (
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={displayAvatar} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <GradientAvatar size="h-9 w-9" />
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 mt-1 z-50">
                        <DropdownMenuLabel>
                          <p className="font-medium">{displayName}</p>
                          <p className="text-xs font-normal text-muted-foreground">@{displayUsername}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to="/contact">Contact Us</Link></DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild><Link to="/admin">Admin Panel</Link></DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <LogOut className="mr-2 h-4 w-4" />Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="rounded-lg bg-gradient-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:opacity-90"
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            </header>

            <main className="min-w-0 flex-1 p-4 md:p-8 md:rounded-3xl md:border md:border-border md:bg-card/10 md:backdrop-blur-2xl md:shadow-lg md:overflow-y-auto custom-scrollbar">
              <GlobalSearch isMobileTop />
              {children}
            </main>
          </div>
        </div>

        {/* Floating Create Room - Only visible on Dashboard, Explore, and My Rooms */}
        {(() => {
          const isAllowedPage =
            pathname === "/dashboard" ||
            pathname === "/explore" ||
            pathname === "/rooms" ||
            pathname === "/rooms/";
          if (!isAllowedPage) return null;

          return (
            <button
              onClick={() => {
                if (!user) {
                  navigate({ to: "/signup" });
                  return;
                }
                haptic("medium");
                setOpenCreate(true);
              }}
              className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-medium text-white shadow-glow transition hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Create Room
            </button>
          );
        })()}


        {/* Mobile Bottom Navigation Bar (Dynamic elevated active link with liquid glass styling) */}
        <nav className="fixed bottom-4 left-4 right-4 z-40 md:hidden bg-card/60 backdrop-blur-2xl border border-border/80 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="relative flex items-center justify-around h-16 px-2 max-w-md mx-auto">
            {NAV.map((item) => {
              const active =
                pathname === item.to ||
                (item.to !== "/dashboard" && pathname.startsWith(item.to));

              const Icon = item.icon;

              return (
                <div key={item.to} className="relative flex items-center justify-center w-15">
                  <Link
                    to={item.to}
                    onClick={() => haptic(active ? "light" : "medium")}
                    className={cn(
                      "flex items-center justify-center transition-all duration-300 ease-out",
                      active
                        ? "-translate-y-3 h-13 w-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_8px_24px_rgba(139,92,246,0.55)] border-4 border-background scale-105"
                        : "h-10 w-10 text-muted-foreground hover:text-foreground active:scale-90"
                    )}
                  >
                    <Icon className={cn("transition-all duration-300", active ? "h-6 w-6 text-white" : "h-5 w-5")} />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </div>
              );
            })}

            {isAdmin && (() => {
              const active = pathname === "/admin";
              return (
                <div key="/admin" className="relative flex items-center justify-center w-15">
                  <Link
                    to="/admin"
                    onClick={() => haptic(active ? "light" : "medium")}
                    className={cn(
                      "flex items-center justify-center transition-all duration-300 ease-out",
                      active
                        ? "-translate-y-3 h-13 w-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_8px_24px_rgba(139,92,246,0.55)] border-4 border-background scale-105"
                        : "h-10 w-10 text-muted-foreground hover:text-foreground active:scale-90"
                    )}
                  >
                    <ShieldCheck className={cn("transition-all duration-300", active ? "h-6 w-6 text-white" : "h-5 w-5")} />
                    <span className="sr-only">Admin Panel</span>
                  </Link>
                </div>
              );
            })()}
          </div>
        </nav>

        <CreateRoomModal open={openCreate} onOpenChange={setOpenCreate} />
      </div>
    </TooltipProvider>
  );
}
