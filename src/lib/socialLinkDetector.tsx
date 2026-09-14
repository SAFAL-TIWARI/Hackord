import React from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomSocialLink = {
  platform?: string;
  title?: string;
  url: string;
};

export interface PlatformInfo {
  platform: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  renderIcon: (extraClassName?: string) => React.ReactNode;
}

export function detectSocialPlatform(rawUrl: string): PlatformInfo {
  if (!rawUrl || typeof rawUrl !== "string") {
    return {
      platform: "website",
      title: "Website",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      renderIcon: (extraCls = "") => (
        <Globe className={cn("h-4 w-4 shrink-0 text-emerald-400", extraCls)} style={{ color: "#34D399" }} />
      ),
    };
  }

  const urlLower = rawUrl.toLowerCase().trim();

  // 1. YouTube
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
    return {
      platform: "youtube",
      title: "YouTube Channel",
      color: "text-[#FF0000]",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#FF0000]", extraCls)}
          style={{ color: "#FF0000" }}
          viewBox="0 0 24 24"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    };
  }

  // 2. Unstop (formerly Dare2Compete)
  if (urlLower.includes("unstop.com")) {
    return {
      platform: "unstop",
      title: "Unstop Profile",
      color: "text-[#0066FF] dark:text-[#2A85FF]",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#0066FF] dark:text-[#2A85FF]", extraCls)}
          style={{ color: "#0066FF" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15.6a5.6 5.6 0 0 1-5.6-5.6V6.8h2.6v5.2a3 3 0 0 0 6 0V6.8h2.6V12a5.6 5.6 0 0 1-5.6 5.6z" />
        </svg>
      ),
    };
  }

  // 3. HackerRank
  if (urlLower.includes("hackerrank.com")) {
    return {
      platform: "hackerrank",
      title: "HackerRank Profile",
      color: "text-[#00EA64]",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#00EA64]", extraCls)}
          style={{ color: "#00EA64" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 0a12 12 0 1 0 12 12A12.013 12.013 0 0 0 12 0zm4.2 16.8h-2.4v-3.6h-3.6v3.6H7.8V7.2h2.4v3.6h3.6V7.2h2.4v9.6z" />
        </svg>
      ),
    };
  }

  // 4. Luma (lu.ma)
  if (urlLower.includes("lu.ma") || urlLower.includes("luma.com")) {
    return {
      platform: "luma",
      title: "Luma Profile",
      color: "text-[#FF5C5C]",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#FF5C5C]", extraCls)}
          style={{ color: "#FF5C5C" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 0c.75 5.75 5.75 10.75 12 12-6.25 1.25-11.25 6.25-12 12-.75-5.75-5.75-10.75-12-12 6.25-1.25 11.25-6.25 12-12z" />
        </svg>
      ),
    };
  }

  // 5. Devpost
  if (urlLower.includes("devpost.com")) {
    return {
      platform: "devpost",
      title: "Devpost Profile",
      color: "text-[#0086BF] dark:text-[#00B4D8]",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#0086BF] dark:text-[#00B4D8]", extraCls)}
          style={{ color: "#0086BF" }}
          viewBox="0 0 24 24"
        >
          <path d="M6.002 1.61L0 12.014l6.002 10.374h7.525c5.317 0 10.473-3.644 10.473-10.374 0-6.73-5.156-10.404-10.473-10.404H6.002zm3.435 4.394h3.766c3.21 0 5.86 2.378 5.86 6.01 0 3.633-2.65 6.01-5.86 6.01H9.437V6.004z" />
        </svg>
      ),
    };
  }

  // 6. Devfolio
  if (urlLower.includes("devfolio.co")) {
    return {
      platform: "devfolio",
      title: "Devfolio Profile",
      color: "text-[#3770FF]",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#3770FF]", extraCls)}
          style={{ color: "#3770FF" }}
          viewBox="0 0 24 24"
        >
          <path d="M4 2h10.5a7.5 7.5 0 0 1 7.5 7.5v5a7.5 7.5 0 0 1-7.5 7.5H4V2zm4 4v12h6.5a3.5 3.5 0 0 0 3.5-3.5v-5A3.5 3.5 0 0 0 14.5 6H8z" />
        </svg>
      ),
    };
  }

  // 7. Instagram
  if (urlLower.includes("instagram.com")) {
    return {
      platform: "instagram",
      title: "Instagram Profile",
      color: "text-[#E1306C]",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#E1306C]", extraCls)}
          style={{ color: "#E1306C" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    };
  }

  // 8. X / Twitter
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) {
    return {
      platform: "x",
      title: "X (Twitter) Profile",
      color: "text-zinc-900 dark:text-zinc-100",
      bgColor: "bg-zinc-500/10",
      borderColor: "border-zinc-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-zinc-900 dark:text-zinc-100", extraCls)}
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    };
  }

  // 9. LeetCode
  if (urlLower.includes("leetcode.com")) {
    return {
      platform: "leetcode",
      title: "LeetCode Profile",
      color: "text-[#FFA116]",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#FFA116]", extraCls)}
          style={{ color: "#FFA116" }}
          viewBox="0 0 24 24"
        >
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.246 2.181 5.955 2.057 8.216-.277l3.878-3.998c.507-.52.793-1.22.793-1.95s-.286-1.43-.793-1.95a2.766 2.766 0 0 0-3.905 0l-3.878 3.998a1.696 1.696 0 0 1-2.422.083l-4.277-4.193a1.764 1.764 0 0 1-.377-.542 1.63 1.63 0 0 1-.1-.303 1.644 1.644 0 0 1-.02-.705 1.577 1.577 0 0 1 .36-1.077l3.854-4.126 5.406-5.788A1.374 1.374 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
        </svg>
      ),
    };
  }

  // 10. Discord
  if (urlLower.includes("discord.com") || urlLower.includes("discord.gg")) {
    return {
      platform: "discord",
      title: "Discord Profile",
      color: "text-[#5865F2]",
      bgColor: "bg-[#5865F2]/10",
      borderColor: "border-[#5865F2]/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#5865F2]", extraCls)}
          style={{ color: "#5865F2" }}
          viewBox="0 0 24 24"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    };
  }

  // 11. LinkedIn
  if (urlLower.includes("linkedin.com")) {
    return {
      platform: "linkedin",
      title: "LinkedIn Profile",
      color: "text-[#0A66C2]",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-600/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#0A66C2]", extraCls)}
          style={{ color: "#0A66C2" }}
          viewBox="0 0 24 24"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.34a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
        </svg>
      ),
    };
  }

  // 12. GitHub
  if (urlLower.includes("github.com")) {
    return {
      platform: "github",
      title: "GitHub Profile",
      color: "text-purple-400 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-purple-400 dark:text-purple-400", extraCls)}
          style={{ color: "#A855F7" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
        </svg>
      ),
    };
  }

  // 13. Twitch
  if (urlLower.includes("twitch.tv")) {
    return {
      platform: "twitch",
      title: "Twitch Channel",
      color: "text-[#9146FF]",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#9146FF]", extraCls)}
          style={{ color: "#9146FF" }}
          viewBox="0 0 24 24"
        >
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      ),
    };
  }

  // 14. Kaggle
  if (urlLower.includes("kaggle.com")) {
    return {
      platform: "kaggle",
      title: "Kaggle Profile",
      color: "text-[#20BEFF]",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#20BEFF]", extraCls)}
          style={{ color: "#20BEFF" }}
          viewBox="0 0 24 24"
        >
          <path d="M18.825 23.859c-.022.046-.07.08-.13.098l-7.79-7.054 6.848-8.243c.09-.108.134-.236.134-.374a.692.692 0 0 0-.215-.521.722.722 0 0 0-.528-.215.717.717 0 0 0-.472.176L8.854 14.568V.75c0-.207-.074-.384-.223-.532A.724.724 0 0 0 8.1 0a.724.724 0 0 0-.532.218.724.724 0 0 0-.218.532v22.5c0 .207.073.385.218.533a.724.724 0 0 0 .532.217c.208 0 .385-.072.532-.217.149-.148.223-.326.223-.533v-6.398l3.14-2.825 5.257 8.784a1.05 1.05 0 0 0 .438.487c.18.09.378.135.594.135.252 0 .463-.073.633-.22.17-.145.263-.332.28-.56a1.144 1.144 0 0 0-.13-.616z" />
        </svg>
      ),
    };
  }

  // 15. Spotify
  if (urlLower.includes("spotify.com")) {
    return {
      platform: "spotify",
      title: "Spotify Profile",
      color: "text-[#1DB954]",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#1DB954]", extraCls)}
          style={{ color: "#1DB954" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      ),
    };
  }

  // 16. GitLab
  if (urlLower.includes("gitlab.com")) {
    return {
      platform: "gitlab",
      title: "GitLab Profile",
      color: "text-[#FC6D26]",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#FC6D26]", extraCls)}
          style={{ color: "#FC6D26" }}
          viewBox="0 0 24 24"
        >
          <path d="m23.6 9.593-1.056-3.25a.87.87 0 0 0-.327-.432.89.89 0 0 0-.54-.156.88.88 0 0 0-.528.18.89.89 0 0 0-.294.417L18.76 12.9H5.24L3.145 6.352a.86.86 0 0 0-.294-.417.89.89 0 0 0-.528-.18.89.89 0 0 0-.54.156.87.87 0 0 0-.327.432L.4 9.593a.9.9 0 0 0 .323 1.007l10.74 7.828a.9.9 0 0 0 1.074 0l10.74-7.828a.9.9 0 0 0 .323-1.007" />
        </svg>
      ),
    };
  }

  // 17. Stack Overflow
  if (urlLower.includes("stackoverflow.com")) {
    return {
      platform: "stackoverflow",
      title: "Stack Overflow Profile",
      color: "text-[#F48024]",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#F48024]", extraCls)}
          style={{ color: "#F48024" }}
          viewBox="0 0 24 24"
        >
          <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H16.85v-2.137H6.111v2.137zm.259-4.852l10.48 2.189.451-2.07-10.478-2.187-.453 2.068zm1.359-5.056l9.705 4.83.99-1.904-9.7-4.827-.995 1.901zm3.181-4.912l7.714 7.502 1.48-1.534-7.713-7.505-1.481 1.537zm6.33-4.911l-1.923 1.071 5.378 9.24 1.923-1.071-5.378-9.24z" />
        </svg>
      ),
    };
  }

  // 18. Hashnode
  if (urlLower.includes("hashnode.com") || urlLower.includes("hashnode.dev")) {
    return {
      platform: "hashnode",
      title: "Hashnode Blog",
      color: "text-[#2962FF]",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#2962FF]", extraCls)}
          style={{ color: "#2962FF" }}
          viewBox="0 0 24 24"
        >
          <path d="M22.351 8.019l-6.37-6.37a5.63 5.63 0 0 0-7.962 0l-6.37 6.37a5.63 5.63 0 0 0 0 7.962l6.37 6.37a5.63 5.63 0 0 0 7.962 0l6.37-6.37a5.63 5.63 0 0 0 0-7.962zm-10.351 7.981a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
        </svg>
      ),
    };
  }

  // 19. Substack
  if (urlLower.includes("substack.com")) {
    return {
      platform: "substack",
      title: "Substack Newsletter",
      color: "text-[#FF6719]",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#FF6719]", extraCls)}
          style={{ color: "#FF6719" }}
          viewBox="0 0 24 24"
        >
          <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
        </svg>
      ),
    };
  }

  // 20. Medium
  if (urlLower.includes("medium.com")) {
    return {
      platform: "medium",
      title: "Medium Blog",
      color: "text-[#02B875]",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#02B875]", extraCls)}
          style={{ color: "#02B875" }}
          viewBox="0 0 24 24"
        >
          <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
        </svg>
      ),
    };
  }

  // 21. Dev.to
  if (urlLower.includes("dev.to")) {
    return {
      platform: "devto",
      title: "Dev.to Articles",
      color: "text-zinc-900 dark:text-zinc-100",
      bgColor: "bg-zinc-500/10",
      borderColor: "border-zinc-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-zinc-900 dark:text-zinc-100", extraCls)}
          viewBox="0 0 24 24"
        >
          <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H5.34v4.36h1.15c.4 0 .69-.08.86-.23.18-.16.27-.44.27-.85v-2.2c0-.41-.07-.69-.2-.85zm1.53 3.05c0 .66-.21 1.17-.63 1.52-.42.36-1.03.53-1.81.53H3.88V8.88h2.63c.79 0 1.39.18 1.81.53.42.35.63.86.63 1.52v2.17zm4.27-4.22h-3.3v7.12h3.3v-1.15h-2.05v-1.83h1.86v-1.15h-1.86V10h2.05V8.88zm3.03 5.48L17.7 8.88h-1.39l1.64 7.12h1.41l1.64-7.12h-1.39l-.98 5.48zM0 3v18h24V3H0zm22.5 16.5H1.5V4.5h21v15z" />
        </svg>
      ),
    };
  }

  // 22. Codeforces
  if (urlLower.includes("codeforces.com")) {
    return {
      platform: "codeforces",
      title: "Codeforces Profile",
      color: "text-[#1F8ACB]",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#1F8ACB]", extraCls)}
          style={{ color: "#1F8ACB" }}
          viewBox="0 0 24 24"
        >
          <path d="M4.5 7.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5V9a1.5 1.5 0 0 1 1.5-1.5zm9-4.5a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5V4.5a1.5 1.5 0 0 1 1.5-1.5zm9 9a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5z" />
        </svg>
      ),
    };
  }

  // 23. CodeChef
  if (urlLower.includes("codechef.com")) {
    return {
      platform: "codechef",
      title: "CodeChef Profile",
      color: "text-[#D97706]",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#D97706]", extraCls)}
          style={{ color: "#D97706" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
        </svg>
      ),
    };
  }

  // 24. Behance
  if (urlLower.includes("behance.net")) {
    return {
      platform: "behance",
      title: "Behance Portfolio",
      color: "text-[#0057FF]",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#0057FF]", extraCls)}
          style={{ color: "#0057FF" }}
          viewBox="0 0 24 24"
        >
          <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-4.976 3-3.401 0-5.75-2.289-5.75-5.75 0-3.388 2.298-5.75 5.568-5.75 3.391 0 5.432 2.378 5.432 5.75 0 .341-.033.649-.062.868h-8.832c.119 1.838 1.488 3.12 3.692 3.12 1.503 0 2.684-.668 3.188-1.238H23.726zm-7.65-4.25h5.808c-.149-1.528-1.246-2.583-2.904-2.583-1.657 0-2.755 1.055-2.904 2.583zM0 4h7.587c3.12 0 5.163 1.539 5.163 4.148 0 1.62-.84 2.925-2.193 3.602 1.764.708 2.693 2.25 2.693 4.095C13.25 18.739 10.978 20 7.74 20H0V4zm3.333 6.133h3.766c1.373 0 2.275-.688 2.275-1.849 0-1.217-.902-1.838-2.275-1.838H3.333v3.687zm0 6.643h4.088c1.55 0 2.551-.762 2.551-2.062 0-1.373-1.001-2.09-2.551-2.09H3.333v4.152z" />
        </svg>
      ),
    };
  }

  // 25. Dribbble
  if (urlLower.includes("dribbble.com")) {
    return {
      platform: "dribbble",
      title: "Dribbble Portfolio",
      color: "text-[#EA4C89]",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      renderIcon: (extraCls = "") => (
        <svg
          className={cn("h-4 w-4 shrink-0 fill-current text-[#EA4C89]", extraCls)}
          style={{ color: "#EA4C89" }}
          viewBox="0 0 24 24"
        >
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm10.193 11.026c-.053-.008-2.483-.418-4.992.355.882 2.42 1.258 4.698 1.341 5.253 2.148-1.42 3.52-3.86 3.651-5.608zm-5.068 6.721c-.08-.501-.444-2.656-1.304-5.023-.042.012-.084.025-.126.037-3.957 1.155-5.467 4.14-5.592 4.398 1.621 1.244 3.65 1.989 5.86 1.989.405 0 .802-.027 1.162-.101zm-8.813-1.077c.182-.349 1.776-3.267 5.753-4.471.076-.023.153-.046.23-.067-.272-.614-.568-1.229-.893-1.826-4.524 1.319-8.91 1.251-9.351 1.243.328 2.27 1.961 4.187 4.261 5.121zm-4.39-7.234c.489.006 4.305.042 8.529-1.161-.634-1.216-1.353-2.348-2.122-3.342-3.473 1.054-6.009 3.967-6.407 7.503zm8.397-8.318c.789.988 1.523 2.122 2.164 3.345 2.505-.939 3.545-2.316 3.645-2.457-1.574-1.393-3.619-2.241-5.809-2.241-2.19 0-4.235.848-5.809 2.241.1.141 1.14 1.518 3.645 2.457zm8.016 4.092c-.126.166-1.254 1.583-3.79 2.571.272.551.523 1.115.755 1.684 2.548-.718 4.792-.303 4.908-.281-.131-1.464-.783-2.787-1.873-3.974z" />
        </svg>
      ),
    };
  }

  // Generic / Custom Website Fallback:
  let host = "";
  try {
    const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    host = parsed.hostname.replace(/^www\./, "");
  } catch (e) {
    host = rawUrl.replace(/^https?:\/\//, "").split("/")[0];
  }

  const capitalizedHost = host
    ? host.charAt(0).toUpperCase() + host.slice(1)
    : "Website";

  return {
    platform: "website",
    title: `${capitalizedHost} Link`,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    renderIcon: (extraCls = "") => (
      <Globe className={cn("h-4 w-4 shrink-0 text-emerald-400", extraCls)} style={{ color: "#34D399" }} />
    ),
  };
}

export function SocialPlatformIcon({
  url,
  platform,
  className = "h-4 w-4",
}: {
  url?: string;
  platform?: string;
  className?: string;
}) {
  const info = detectSocialPlatform(url || platform || "");
  return <>{info.renderIcon(className)}</>;
}
