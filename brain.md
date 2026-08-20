# 🧠 Hackord Frontend — Project Brain & Architecture Knowledge Base

> **Location:** `Hackord-Frontend/brain.md`  
> **Last Updated:** August 2026  
> **Role & Purpose:** Master single-source-of-truth document for the Hackord Frontend Application. Antigravity and any AI assistant or developer should reference this file to understand the complete frontend routing, component hierarchy, state management, API services, UI libraries, and user flows without rescanning the entire repository.

---

## 📌 1. Project Overview & Architecture

**Hackord Frontend** is a modern, responsive web application built with **TanStack Start**, **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. It provides a real-time collaborative workspace for hackathon builders, featuring team management, direct & group chat, video conferencing (Agora RTC), GitHub integration, AI workspace tools (Gemini multimodal, Mermaid diagrams, interactive charts, slide presentation viewer), and hackathon discovery.

### Key Architectural Pillars:
- **Type-Safe File-Based Routing:** Powered by `@tanstack/react-router` and `@tanstack/react-start` with route loaders and automatic code splitting.
- **Unified Central API Client:** Centralized fetch wrapper (`src/lib/api.ts`) auto-injecting JWT tokens and normalizing responses.
- **Rich Multimodal AI Workspace:** Native rendering for Mermaid diagrams, Recharts-based interactive charts, slide deck presentation viewer (`PresentationViewer.tsx`), and file previews (audio, video, PDF, code).
- **Real-Time Video & Voice:** Agora WebRTC video rooms (`AgoraMeeting.tsx`) and WhatsApp-style audio voice note player (`WhatsAppVoicePlayer.tsx`).
- **Modern Dark UI Aesthetic:** Custom Tailwind CSS v4 styling, Radix UI primitives, glassmorphism cards, spotlight effects, and Three.js 3D hero background.

---

## 🛠️ 2. Tech Stack & Dependencies

| Category | Technology / Library | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework & Core** | React / React DOM | `^19.2.0` | UI rendering, modern hooks, concurrency |
| | TypeScript | `^5.8.3` | End-to-end type safety |
| | Vite | `^8.0.16` | Lightning-fast build tool & dev server |
| **Routing & Server** | `@tanstack/react-router` | `^1.170.16` | Type-safe client/SSR routing & loaders |
| | `@tanstack/react-start` | `^1.168.26` | Fullstack SSR runtime |
| **Styling & Design** | Tailwind CSS / `@tailwindcss/vite` | `^4.2.1` | Utility-first responsive CSS styling |
| | Lucide React (`lucide-react`) | `^0.575.0` | Consistent, beautiful SVG icons |
| | `clsx` & `tailwind-merge` | `^2.1.1` / `^3.5.0` | Dynamic class merging (`cn` utility) |
| **UI Component Primitives** | Radix UI (`@radix-ui/*`) | Full suite | Accessible dialogs, dropdowns, tooltips, tabs, etc. |
| | Sonner (`sonner`) | `^2.0.7` | Rich, non-intrusive toast notifications |
| | `cmdk` | `^1.1.1` | Global search & command palette |
| **Visualizations & Media** | Recharts (`recharts`) | `^2.15.4` | Interactive data charts (area, bar, radar, donut) |
| | Mermaid (`mermaid`) | `^11.16.1` | Flowcharts, architecture & sequence diagrams |
| | Three.js / `@react-three/fiber` | `^0.185.1` / `^9.6.1` | 3D interactive hero background |
| | Agora RTC SDK NG (`agora-rtc-sdk-ng`) | `^4.24.7` | WebRTC audio/video conferencing |
| | `pptxgenjs` | `^4.0.1` | Client-side PowerPoint slide generation |
| **Authentication** | `@react-oauth/google` | `^0.13.5` | Google One-Tap & OAuth button integration |

---

## ⚙️ 3. Environment Variables Reference (`.env`)

| Variable Name | Required | Example / Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | **Yes** | `http://localhost:3000/api` | Base URL pointing to Hackord Backend API |
| `VITE_GOOGLE_CLIENT_ID` | Optional | `*.apps.googleusercontent.com` | Google OAuth Client ID for sign-in & sign-up |
| `VITE_GITHUB_CLIENT_ID` | Optional | `Ov23li...` | GitHub OAuth App Client ID for OAuth login |
| `VITE_AGORA_APP_ID` | Optional | `agora_app_id` | Agora RTC Project ID for video meetings |

---

## 🗺️ 4. File-Based Routing Map (`src/routes/`)

| Route Path | File Location | Auth Required | Description & Key Features |
| :--- | :--- | :---: | :--- |
| **Root Layout** | `src/routes/__root.tsx` | - | Global wrapper with HTML shell, meta tags, `GoogleOAuthProvider`, `AuthProvider`, and `Toaster`. |
| `/` | `src/routes/index.tsx` | No | **Landing Page:** Hero showcase with 3D Three.js canvas, Feature Bento, Featured Rooms carousel, About Hackord section, Navbar, Footer. |
| `/dashboard` | `src/routes/dashboard.tsx` | Yes (redirects) | **User Dashboard:** Active room cards, quick room creator, pending team invites, upcoming milestone deadlines, personal scratchpad notes, user stats. |
| `/explore` | `src/routes/explore.tsx` | No | **Hackathon Explorer:** Search & filter hackathons by Level (Global/National/State), Mode (Online/Offline/Hybrid), Platform (Devpost, Unstop, MLH, Devfolio, Luma, GDG). Includes "Host Your Hackathon" submission modal. |
| `/rooms` | `src/routes/rooms.tsx` | No / Yes | **Rooms Directory:** Searchable list of all public and user-participating rooms with view toggle (Grid / Table). |
| `/rooms/$roomId` | `src/routes/rooms.$roomId.tsx` | Yes | **Virtual Room Workspace (9 Tabs):**<br>1. **Overview:** Progress meter, milestones, room description, links, activity stream.<br>2. **Members:** Member list, role badges, user profile popup, invite modal, leave/remove member.<br>3. **Chat:** Room messaging, pins, reply threads, rich link detection.<br>4. **AI Workspace:** Gemini multimodal assistant, 12+ plugins, file attachment sidebar, Mermaid diagrams, interactive Recharts, PPT slide viewer.<br>5. **GitHub:** Live repo stats (stars, forks, open issues), branch list, recent commits, pull requests, clone snippet.<br>6. **Files:** Resource links, PDF/PPT attachments, quick preview.<br>7. **Timeline:** Step-by-step milestone roadmap.<br>8. **Tasks:** Task tracker (Todo/In Progress/Completed) with auto-recalculated room progress percentage.<br>9. **Meetings:** Agora video calling interface, join meet code, mic/camera controls. |
| `/chat` | `src/routes/chat.tsx` | Yes | **Global & Direct Messaging Suite:**<br>- **General Discussion:** Platform-wide global chat with pin broadcasts.<br>- **Direct Messages (1-on-1):** Real-time private chat, WhatsApp-style voice player, online presence indicator, unread counts, soft-delete conversation. |
| `/login` | `src/routes/login.tsx` | No | **Authentication Hub:** Email & Password, Google OAuth, GitHub OAuth, Passwordless Email OTP code, Forgot Password recovery. |
| `/signup` | `src/routes/signup.tsx` | No | **Registration Hub:** Email OTP verification flow, Google & GitHub OAuth. |
| `/profile` | `src/routes/profile.tsx` | Yes | **User Profile:** Developer portfolio card, avatar switcher (DiceBear SVG), experience level, skills list, socials, completed hackathons. |
| `/profile-setup` | `src/routes/profile-setup.tsx`| Yes | **Onboarding Wizard:** Post-signup profile builder. |
| `/settings` | `src/routes/settings.tsx` | Yes | **Account & Preferences:** Email notification toggles (Invites, Deadlines, Chat, Reminders), Privacy controls (Discoverable, Online Status, Direct Messages), Danger Zone (Permanent Account Deletion). |
| `/admin` | `src/routes/admin.tsx` | `Admin Role` | **Admin Dashboard:** Platform KPIs, paginated user management, Scraped Hackathons Staging & DB Ingestion, Host Submissions approval, Contact Messages inbox. |
| `/contact` | `src/routes/contact.tsx` | No | **Contact Form:** "Send us message" query submission. |
| `/notifications` | `src/routes/notifications.tsx`| Yes | **Notification Drawer & Center:** Room invitations & platform updates. |
| `/privacy`, `/terms`, `/cookie-policy` | `src/routes/*.tsx` | No | **Legal Pages:** Markdown/HTML policy documentation. |
| `/*` (404) | `src/routes/$.tsx` | No | **404 Not Found Page:** Animated fallback with redirect button. |

---

## 🔒 5. Authentication & State Management (`src/lib/auth.tsx`)

The `AuthProvider` context manages authenticated state across the application:
- **Token Management:** JWT is stored in `localStorage.getItem("hackord_token")`.
- **User Hydration:** On app load, `refreshUser()` calls `GET /api/auth/me` to hydrate the `AuthUser` object.
- **Exposed Methods:**
  - `login(email, password)`
  - `signup(name, email, password)`
  - `googleLogin(credential)`
  - `githubLogin(code)`
  - `requestOtp(email)` / `verifyOtp(email, otp)` (Passwordless Login)
  - `signupRequestOtp(...)` / `signupVerifyOtp(...)` (Verified Signup)
  - `forgotPasswordRequest(email)` / `resetPasswordVerify(...)`
  - `updateProfile(data)`
  - `logout()`: Clears token and user state.
- **Helper Hook:** `useAuth()` provides `{ user, loading, isAuthenticated, isAdmin, ... }`.

---

## 📡 6. Frontend API Client & Modules (`src/lib/`)

### 1. `api.ts` (Core Fetch Wrapper)
- Normalizes `VITE_API_URL` to ensure `/api` suffix.
- Automatically attaches `Authorization: Bearer <token>` when present.
- Throws standardized `ApiError(message, status)`.

### 2. Specialized API Service Modules:
| Module File | Purpose & Functions |
| :--- | :--- |
| `rooms-api.ts` | `getRooms()`, `getRoom()`, `createRoom()`, `updateRoom()`, `deleteRoom()`, `leaveRoom()`, `addMemberToRoom()`, `removeMemberFromRoom()`, `getMessages()`, `sendMessage()`, `updateMessage()`, `deleteMessage()`, `addTask()`, `updateTaskStatus()`, `addFileResource()`, `addProjectLink()`. |
| `ai-api.ts` | `fetchAiConversations()`, `createAiConversation()`, `updateAiConversation()`, `deleteAiConversation()`, `sendAiChatMessage()`, `streamAiChatMessage()`, `updateAiMessage()`, `uploadAiFile()`, `openFileInNewTab()`, file type helpers (`isAudioFile`, `isVideoFile`, `isPdfFile`, `isImageFile`). |
| `chat-api.ts` | `fetchChatConversations()`, `fetchChatMessages()`, `sendChatMessage()`, `updateChatMessage()`, `deleteChatMessage()`, `markChatAsRead()`, `deleteChatConversation()`. |
| `hackathons-api.ts` | `fetchHackathons()`, `submitHostRequest()`, `triggerHackathonScrape()`, `createHackathon()`, `deleteHackathon()`. |
| `users-api.ts` | `searchUsers()`, `getUserById()`, `updateUserHeartbeat()`, `fetchUserSettings()`, `updateUserSettings()`, `deleteUserAccount()`. |
| `notes-api.ts` | `fetchUserNotes()`, `createUserNote()`, `deleteUserNote()`. |
| `notifications-api.ts` | `sendRoomInvitation()`, `fetchUserInvitations()`, `acceptInvitation()`, `rejectInvitation()`. |
| `github-api.ts` | `fetchGithubWorkspaceData(repoUrl)` (fetches repo metadata, branches, commits, pull requests, and issues via GitHub Public REST API). |
| `document-exporter.ts` | Pure client-side document generator: `exportToPdf()`, `exportToDocx()`, `exportToCsv()`, `exportToMarkdown()`. |

---

## 🧩 7. Component Hierarchy & Subsystems (`src/components/`)

### 🤖 AI Workspace Subsystem (`src/components/ai/` & `AITab`)
- `AiMessageRenderer.tsx`: Renders rich AI responses with markdown syntax highlighting, streaming cursor indicator (`isStreaming`), embedded Mermaid flowcharts, interactive Recharts JSON cards, presentation slide decks with quick export toolbar (PDF, Word, CSV, Marp MD, and voice audio readout).
- `AITab` in `rooms.$roomId.tsx`: Real-time SSE word-by-word/line-by-line streaming AI response generation, dynamic "Stop Response" button (replacing Send button during generation with square stop icon), Edit prompt button for user's latest and past messages with inline prompt regeneration, full MongoDB persistence, and multi-tab BroadcastChannel sync.
- `AiGeneratedImageViewer.tsx`: High-resolution visual output renderer for Google Imagen 3 image generation with one-click PNG download, aspect ratio support, fullscreen lightbox preview, and zero unwanted text clutter.
- `AiMultimodalStudio.tsx`: Free multimodal studio for Google Imagen 3 image generation with aspect ratio presets, Web Speech API audio voice synthesis (TTS), and Markdown-to-PPT/document converter.
- `AiFilesSidebar.tsx`: Drawer for viewing and managing attached files (PDF, images, audio, video) and downloading AI-generated artifacts (.pptx, .md, .svg).
- `InteractiveChart.tsx`: Dynamically renders Recharts (Area, Bar, Stacked Bar, Radar, Donut, Sparklines) from AI JSON code blocks.
- `InteractiveFlowchart.tsx` & `MermaidDiagram.tsx`: Parses and renders interactive SVG diagrams with draggable elements, smooth 2D canvas background panning (mouse & touch), zoom controls, and mobile-responsive container.
- `PresentationViewer.tsx`: Interactive slide deck and Marp presentation viewer with slide carousel, grid overview, live markdown editor, speaker notes, and instant exports to PowerPoint (`.pptx`), formatted PDF, and Marp Markdown (`.md`).
- `AiWorkspaceSkeleton.tsx`: Animated loading placeholder for AI sessions.

### 🎥 Real-Time & Media
- `AgoraMeeting.tsx`: Embeddable Agora WebRTC video meeting component with token fetching from backend, local/remote stream rendering, mic/camera toggles, and screen-sharing support.
- `WhatsAppVoicePlayer.tsx`: Audio wave visualization player for voice messages recorded in browser.

### 🧭 Navigation & Layouts
- `AppShell.tsx`: Standard authenticated dashboard layout with sidebar navigation, search trigger, notification badge, and user dropdown.
- `HomeNavbar.tsx` & `HomeFooter.tsx`: Public landing page navigation and footer.
- `NotificationsDrawer.tsx`: Slide-over drawer displaying pending room invites with instant Accept/Reject actions.
- `UserProfileModal.tsx`: Modal displaying a user's skills, experience, college, GitHub/LinkedIn links, and direct invite button.
- `CreateRoomModal.tsx` & `QuickCreateRoomModal.tsx`: Dialogs for creating new hackathon workspaces.

---

## 🔄 8. Guidelines for Updating `brain.md`

Whenever changes are made to the frontend codebase:
1. **New Route / Page:** Add route path, file, and description in Section 4.
2. **New Context / Hook / State:** Update Section 5.
3. **New API Service Function:** Record in Section 6.
4. **New Component / Feature:** Add to Component Subsystem in Section 7.
5. **Config / Env Changes:** Update environment variables in Section 3.
