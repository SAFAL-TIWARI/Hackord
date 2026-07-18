# HackDiscord

A private collaboration workspace for hackathon teams — invite by skills, manage deadlines, chat, share files, and ship together.

## Stack

- **Frontend**: React 19 + TanStack Start (SSR) + TanStack Router
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Replit PostgreSQL (via `pg` npm package)
- **Server functions**: TanStack Start `createServerFn` for type-safe server/client calls
- **3D mascot**: Three.js (plain, no React Three Fiber) — draggable cartoon robot that follows the mouse
- **Package manager**: Bun

## How to run

```bash
bun run dev
```

Starts the Vite dev server on `http://0.0.0.0:5000`.

## Database

Replit's built-in PostgreSQL is used. Tables:

- `rooms` — hackathon workspaces (id, name, hackathon, deadlines, status, progress, …)
- `room_members` — members per room (room_id, user_id, user_name, user_avatar, role)
- `messages` — chat messages per room (id, room_id, author_name, author_avatar, text, pinned)

Server functions live in `src/lib/rooms-api.ts` and connect via `src/lib/db.ts` (singleton `pg.Pool`).

## Key files

- `src/lib/db.ts` — PostgreSQL pool singleton
- `src/lib/rooms-api.ts` — `createServerFn` CRUD for rooms and messages
- `src/components/Buddy3D.tsx` — Three.js 3D mascot, fixed-position, draggable
- `src/components/CreateRoomModal.tsx` — form that saves to DB via `createRoom` server fn
- `src/routes/rooms.tsx` — loads rooms from DB via `getRooms` loader
- `src/routes/rooms.$roomId.tsx` — loads room + messages from DB, real-time chat send

## User preferences

- Keep the dark theme (HackDiscord brand: purple/violet gradient).
- Preserve Lovable-generated file structure and stack — no migrations away from it.
