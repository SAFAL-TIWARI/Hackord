import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, bootstrapSchema } from "./db";

/** Ensure schema exists before any DB operation. No-op after first success. */
async function ensureSchema() {
  await bootstrapSchema();
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type DbRoom = {
  id: string;
  hackathon: string;
  name: string;
  problem: string;
  description: string;
  max_size: number;
  status: "Active" | "Planning" | "Submission";
  progress: number;
  deadline_registration: string;
  deadline_ppt: string;
  deadline_prototype: string;
  deadline_final: string;
  deadline_result: string;
  created_at: string;
  member_count?: number;
  members?: DbMember[];
};

export type DbMember = {
  user_id: string;
  user_name: string;
  user_avatar: string;
  role: string;
};

export type DbMessage = {
  id: string;
  room_id: string;
  author_name: string;
  author_avatar: string;
  text: string;
  pinned: boolean;
  created_at: string;
};

// ─── Server Functions ───────────────────────────────────────────────────────

export const getRooms = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const rooms = await query<DbRoom>(`
    SELECT r.*,
           COUNT(rm.user_id)::int AS member_count
    FROM rooms r
    LEFT JOIN room_members rm ON rm.room_id = r.id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `);

  // Attach members
  const members = await query<DbMember & { room_id: string }>(`
    SELECT * FROM room_members
  `);

  return rooms.map((r) => ({
    ...r,
    members: members.filter((m) => m.room_id === r.id),
  }));
});

export const getRoom = createServerFn({ method: "GET" })
  .validator(z.object({ roomId: z.string() }))
  .handler(async ({ data }) => {
    await ensureSchema();
    const [room] = await query<DbRoom>(
      `SELECT * FROM rooms WHERE id = $1`,
      [data.roomId],
    );
    if (!room) return null;

    const members = await query<DbMember>(
      `SELECT * FROM room_members WHERE room_id = $1`,
      [data.roomId],
    );

    return { ...room, members };
  });

export const createRoom = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      hackathon: z.string(),
      name: z.string(),
      problem: z.string().optional().default(""),
      description: z.string().optional().default(""),
      maxSize: z.number().optional().default(6),
      deadlineRegistration: z.string().optional().default(""),
      deadlinePpt: z.string().optional().default(""),
      deadlinePrototype: z.string().optional().default(""),
      deadlineFinal: z.string().optional().default(""),
      deadlineResult: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    await ensureSchema();
    const [room] = await query<DbRoom>(
      `INSERT INTO rooms
         (id, hackathon, name, problem, description, max_size, status, progress,
          deadline_registration, deadline_ppt, deadline_prototype,
          deadline_final, deadline_result)
       VALUES ($1,$2,$3,$4,$5,$6,'Planning',0,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        data.id,
        data.hackathon,
        data.name,
        data.problem,
        data.description,
        data.maxSize,
        data.deadlineRegistration,
        data.deadlinePpt,
        data.deadlinePrototype,
        data.deadlineFinal,
        data.deadlineResult,
      ],
    );

    // Add creator as owner
    await query(
      `INSERT INTO room_members (room_id, user_id, user_name, user_avatar, role)
       VALUES ($1,'u_me','Aarav Sharma','https://api.dicebear.com/9.x/glass/svg?seed=Aarav','Owner')
       ON CONFLICT DO NOTHING`,
      [data.id],
    );

    return room;
  });

export const getMessages = createServerFn({ method: "GET" })
  .validator(z.object({ roomId: z.string() }))
  .handler(async ({ data }) => {
    await ensureSchema();
    return query<DbMessage>(
      `SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC`,
      [data.roomId],
    );
  });

export const getMessagesSince = createServerFn({ method: "GET" })
  .validator(z.object({ roomId: z.string(), since: z.string() }))
  .handler(async ({ data }) => {
    await ensureSchema();
    return query<DbMessage>(
      `SELECT * FROM messages WHERE room_id = $1 AND created_at > $2::timestamptz ORDER BY created_at ASC`,
      [data.roomId, data.since],
    );
  });

export const sendMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      roomId: z.string(),
      text: z.string().min(1),
      authorName: z.string(),
      authorAvatar: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    await ensureSchema();
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const [msg] = await query<DbMessage>(
      `INSERT INTO messages (id, room_id, author_name, author_avatar, text)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, data.roomId, data.authorName, data.authorAvatar, data.text],
    );
    return msg;
  });
