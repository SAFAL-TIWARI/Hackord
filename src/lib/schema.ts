/**
 * Database schema SQL — inlined as a string so it is always bundled correctly
 * in both development (Vite dev server) and production (Nitro/SSR) builds.
 * All DDL uses IF NOT EXISTS / ON CONFLICT DO NOTHING — fully idempotent.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS rooms (
  id                    TEXT PRIMARY KEY,
  hackathon             TEXT NOT NULL,
  name                  TEXT NOT NULL,
  problem               TEXT NOT NULL DEFAULT '',
  description           TEXT NOT NULL DEFAULT '',
  max_size              INTEGER NOT NULL DEFAULT 6,
  status                TEXT NOT NULL DEFAULT 'Planning',
  progress              INTEGER NOT NULL DEFAULT 0,
  deadline_registration TEXT NOT NULL DEFAULT '',
  deadline_ppt          TEXT NOT NULL DEFAULT '',
  deadline_prototype    TEXT NOT NULL DEFAULT '',
  deadline_final        TEXT NOT NULL DEFAULT '',
  deadline_result       TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id     TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  user_avatar TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'Developer',
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY,
  room_id       TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_name   TEXT NOT NULL,
  author_avatar TEXT NOT NULL DEFAULT '',
  text          TEXT NOT NULL,
  pinned        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed demo data (skipped silently if already present)
INSERT INTO rooms
  (id, hackathon, name, problem, description, max_size, status, progress,
   deadline_registration, deadline_ppt, deadline_prototype, deadline_final, deadline_result)
VALUES
  (
    'smart-india-2026', 'Smart India Hackathon 2026', 'Team Nebula',
    'AI-driven crop yield prediction for smallholder farmers using satellite imagery and IoT soil sensors.',
    'Building an end-to-end platform that combines satellite data, on-ground IoT sensors, and an LLM-powered advisor to help smallholder farmers predict yields and optimize inputs.',
    6, 'Active', 62, '2026-08-01', '2026-08-15', '2026-09-01', '2026-09-20', '2026-10-05'
  ),
  (
    'eth-global-2026', 'ETHGlobal Delhi', 'ChainCraft',
    'Decentralized reputation system for open-source contributors.',
    'On-chain contribution graphs with sybil-resistant scoring.',
    4, 'Planning', 24, '2026-07-25', '2026-08-05', '2026-08-20', '2026-09-01', '2026-09-10'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO room_members (room_id, user_id, user_name, user_avatar, role) VALUES
  ('smart-india-2026','u_me','Aarav Sharma','https://api.dicebear.com/9.x/glass/svg?seed=Aarav','Owner'),
  ('smart-india-2026','u1',  'Priya Nair',  'https://api.dicebear.com/9.x/glass/svg?seed=Priya',  'Designer'),
  ('smart-india-2026','u2',  'Rohan Mehta', 'https://api.dicebear.com/9.x/glass/svg?seed=Rohan', 'Lead'),
  ('smart-india-2026','u3',  'Ishita Rao',  'https://api.dicebear.com/9.x/glass/svg?seed=Ishita','Developer'),
  ('eth-global-2026', 'u_me','Aarav Sharma','https://api.dicebear.com/9.x/glass/svg?seed=Aarav','Owner'),
  ('eth-global-2026', 'u1',  'Priya Nair',  'https://api.dicebear.com/9.x/glass/svg?seed=Priya',  'Designer'),
  ('eth-global-2026', 'u2',  'Rohan Mehta', 'https://api.dicebear.com/9.x/glass/svg?seed=Rohan', 'Lead')
ON CONFLICT (room_id, user_id) DO NOTHING;

INSERT INTO messages (id, room_id, author_name, author_avatar, text, pinned, created_at) VALUES
  ('seed-m1','smart-india-2026','Rohan Mehta', 'https://api.dicebear.com/9.x/glass/svg?seed=Rohan',
   'Kicked off the repo. Auth flow scaffolded 🚀', TRUE,  NOW() - INTERVAL '3 hours'),
  ('seed-m2','smart-india-2026','Aarav Sharma','https://api.dicebear.com/9.x/glass/svg?seed=Aarav',
   'Nice! I''ll take the dashboard components.',   FALSE, NOW() - INTERVAL '2 hours 46 minutes'),
  ('seed-m3','smart-india-2026','Priya Nair',  'https://api.dicebear.com/9.x/glass/svg?seed=Priya',
   'Uploaded the new mockups to Files.',           FALSE, NOW() - INTERVAL '2 hours 30 minutes')
ON CONFLICT (id) DO NOTHING;
`;
