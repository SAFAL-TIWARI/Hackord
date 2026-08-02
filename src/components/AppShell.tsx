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
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo } from "./BrandLogo";
import { haptic } from "@/lib/haptic";
import { useState, useEffect, type ReactNode } from "react";
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
import { DEMO_AUTH_USER } from "@/lib/dummy-data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  useEffect(() => {
    fetchRealNotifications(user).then((res) => setRealNotifications(res || []));
  }, [user]);

  const unreadCount = realNotifications.filter((n) => n.unread).length;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem("hackord_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("hackord_theme") as "dark" | "light";
      if (saved) return saved;
    }
    return "dark";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") document.documentElement.classList.add("light");
      else document.documentElement.classList.remove("light");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hackord_theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("hackord_sidebar_collapsed", String(collapsed));
    }
  }, [collapsed]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const toggleSidebar = () => {
    haptic("light");
    setCollapsed((c) => !c);
  };

  const activeUser = user || DEMO_AUTH_USER;
  const displayName = activeUser.name;
  const displayUsername = activeUser.username || "aarav";
  const displayAvatar = activeUser.avatar || "";
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
      <div className="min-h-screen bg-background bg-mesh text-foreground pb-16 md:pb-0">
        <div className="flex">
          {/* ── Sidebar (Desktop) ── */}
          <aside
            className={cn(
              "sticky top-0 hidden h-screen shrink-0 border-r border-white/5 bg-sidebar/60 backdrop-blur-2xl shadow-lg md:flex flex-col transition-all duration-300 ease-in-out z-30",
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
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Topbar */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-background/80 px-4 backdrop-blur-2xl shadow-sm md:px-6">
              <div className="flex items-center gap-2 md:hidden">
                <BrandLogo iconOnly size="sm" />
              </div>

              {/* Global Search */}
              <GlobalSearch />

              {/* Right side: theme toggle, original top-right notifications dropdown, user avatar */}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />

                {/* Original Top-Right Notifications Menu */}
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
              </div>
            </header>

            <main className="min-w-0 flex-1 p-4 md:p-8">
              <GlobalSearch isMobileTop />
              {children}
            </main>
          </div>
        </div>

        {/* Floating Create Room */}
        <button
          onClick={() => {
            haptic("medium");
            setOpenCreate(true);
          }}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-medium text-white shadow-glow transition hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Room
        </button>


        {/* Mobile Bottom Navigation Bar (Dynamic elevated active link) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-5px_25px_rgba(0,0,0,0.15)]">
          <div className="relative flex items-center justify-around h-16 px-2 max-w-md mx-auto">
            {NAV.map((item) => {
              const active =
                pathname === item.to ||
                (item.to !== "/dashboard" && pathname.startsWith(item.to));

              const Icon = item.icon;

              return (
                <div key={item.to} className="relative flex items-center justify-center w-12">
                  <Link
                    to={item.to}
                    onClick={() => haptic(active ? "light" : "medium")}
                    className={cn(
                      "flex items-center justify-center transition-all duration-300 ease-out",
                      active
                        ? "-translate-y-5 h-13 w-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_8px_22px_rgba(37,99,235,0.45)] border-4 border-background scale-105"
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
                <div key="/admin" className="relative flex items-center justify-center w-12">
                  <Link
                    to="/admin"
                    onClick={() => haptic(active ? "light" : "medium")}
                    className={cn(
                      "flex items-center justify-center transition-all duration-300 ease-out",
                      active
                        ? "-translate-y-5 h-13 w-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_8px_22px_rgba(37,99,235,0.45)] border-4 border-background scale-105"
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
