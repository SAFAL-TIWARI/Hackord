<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg" alt="Hackord Logo" width="72" height="72">
  <h1>Hackord — Frontend</h1>
  <p><strong>The Ultimate Collaboration Workspace for Hackathon Builders</strong></p>

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TanStack Router](https://img.shields.io/badge/TanStack_Router-1.170-FF4154?logo=react&logoColor=white)](https://tanstack.com/router)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ⚡ Overview

**Hackord Frontend** is a high-performance, modern web application crafted for hackathon participants and builders. It provides an intuitive platform to discover hackathons, assemble developer teams, manage dedicated project "Rooms", track live deadlines, and collaborate seamlessly.

Built with a futuristic glassmorphic UI, responsive navigation, dark/light theme options, and real-time state synchronization.

---

## ✨ Key Features

- 🎯 **Hackathon Countdown & Dashboard:** Real-time deadline clock, event cards, and live project activity feeds.
- 🚪 **Team Collaboration Rooms:** Dedicated room spaces featuring role management, quick links, and GitHub repository integration.
- 🔍 **User Discovery & Invitations:** Search builder profiles, filter by skills, and send interactive team invitations.
- 🔔 **Interactive Notification Hub:** Real-time updates for room invites, role promotions, and activity alerts.
- 📝 **Scratchpad & Quick Notes:** Built-in team note-taking and pitch deck brainstorming tools.
- 🎨 **Glassmorphism Aesthetic:** Fluid micro-animations, clean dark/light UI, custom icons, and Three.js 3D subtle interactions.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **[React 19](https://react.dev/)** | Core UI Framework |
| **[Vite](https://vitejs.dev/)** | Next-gen Frontend Tooling & Dev Server |
| **[TanStack Router](https://tanstack.com/router)** | Type-safe Client-side Routing |
| **[TanStack Query](https://tanstack.com/query)** | Async State & API Data Fetching |
| **[Tailwind CSS v4](https://tailwindcss.com/)** | Modern Utility-First Styling System |
| **[Radix UI](https://www.radix-ui.com/)** | Accessible Unstyled UI Primitives |
| **[Lucide React](https://lucide.dev/)** | Icon Set |
| **[Recharts](https://recharts.org/)** & **[Three.js](https://threejs.org/)** | Analytics & 3D Interactive Elements |

---

## 📁 Project Structure

```text
Hackord-Frontend/
├── src/
│   ├── components/      # Reusable UI components & layouts (AppShell, SpotlightCard, etc.)
│   ├── routes/          # File-based TanStack Router pages (__root, rooms, settings, etc.)
│   ├── lib/             # API clients, helpers, demo mock state, and utility functions
│   ├── hooks/           # Custom React hooks (theme context, auth hooks)
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global CSS & Tailwind design tokens
├── public/              # Static assets & icons
└── vite.config.ts       # Vite & plugin configurations
```

---

## 🚦 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SAFAL-TIWARI/Hackord.git
   cd Hackord-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (optional for local API endpoint customization):
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

- `npm run dev` — Launches local development server with HMR.
- `npm run build` — Builds production-ready static assets.
- `npm run preview` — Locally previews the built production output.
- `npm run lint` — Runs ESLint checks.

---

<div align="center">
  <sub>Built with ❤️ for hackers & builders everywhere.</sub>
</div>
