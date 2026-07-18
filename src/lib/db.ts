import pg from "pg";
import { SCHEMA_SQL } from "./schema";

// ─── Startup validation ──────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error(
    "[db] ERROR: DATABASE_URL is not set. " +
      "This project requires Replit's built-in PostgreSQL database. " +
      "Attach a database to this repl and restart the server.",
  );
}

// ─── Singleton pool ──────────────────────────────────────────────────────────

let _pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Attach a Replit PostgreSQL database to this project.",
      );
    }
    _pool = new pg.Pool({
      connectionString: url,
      ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 10,
    });
    _pool.on("error", (err) => {
      console.error("[db] Unexpected pool error:", err.message);
    });
  }
  return _pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

// ─── Schema bootstrap ────────────────────────────────────────────────────────

/**
 * Idempotently applies the full schema (CREATE TABLE IF NOT EXISTS) and seeds
 * demo data (ON CONFLICT DO NOTHING). The SQL is bundled inline — no filesystem
 * reads — so it works correctly in both dev and production builds.
 *
 * _bootstrapped is only set TRUE after a successful run. If the first attempt
 * fails (e.g. DB not yet reachable) the next server request will retry.
 */
let _bootstrapped = false;

export async function bootstrapSchema(): Promise<void> {
  if (_bootstrapped) return;

  try {
    const pool = getPool();
    await pool.query(SCHEMA_SQL);
    _bootstrapped = true; // only set on success so failures are retried
    console.log("[db] Schema bootstrap complete.");
  } catch (err) {
    // Log clearly but do not crash the process — non-DB pages still work,
    // and the next DB-touching request will re-attempt bootstrapSchema().
    console.error("[db] Schema bootstrap failed:", (err as Error).message);
  }
}
