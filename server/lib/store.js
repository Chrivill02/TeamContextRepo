// `db` is anything with query(sql, params) → { rows }: a pg.Pool in production, PGlite in tests.
const toIso = (value) => (value == null ? null : new Date(value).toISOString());

const lockRow = (l) => ({
  lock_id: l.lock_id,
  developer_id: l.developer_id,
  file_path: l.file_path,
  repo: l.repo,
  acquired_at: toIso(l.acquired_at),
});

const activityRow = (e) => ({
  developer_id: e.developer_id,
  repo: e.repo,
  file_path: e.file_path,
  event: e.event,
  summary: e.summary,
  created_at: toIso(e.created_at),
});

export function createStore(db, { ttlMinutes = 30, now = () => new Date() } = {}) {
  async function acquire({ developerId, filePath, repo }) {
    const { rows } = await db.query('SELECT teamcontext.acquire($1, $2, $3, $4, $5) AS result', [
      developerId, filePath, repo, ttlMinutes, now().toISOString(),
    ]);
    const { status, lock } = rows[0].result;
    return { status, lock: lockRow(lock) };
  }

  async function release({ developerId, filePath, repo, summary }) {
    const { rows } = await db.query(
      `WITH d AS (
         DELETE FROM teamcontext.locks WHERE developer_id = $1 AND file_path = $2 AND repo = $3 RETURNING 1
       )
       INSERT INTO teamcontext.activity (developer_id, repo, file_path, event, summary, created_at)
       SELECT $1, $3, $2, 'unlock', $4::text, $5::timestamptz WHERE EXISTS (SELECT 1 FROM d)
       RETURNING id`,
      [developerId, filePath, repo, summary ?? null, now().toISOString()],
    );
    return rows.length > 0;
  }

  async function releaseAll({ developerId, repo, summary }) {
    const { rows } = await db.query(
      `WITH d AS (
         DELETE FROM teamcontext.locks WHERE developer_id = $1 AND repo = $2 RETURNING 1
       ), logged AS (
         INSERT INTO teamcontext.activity (developer_id, repo, event, summary, created_at)
         VALUES ($1, $2, 'release_all', $3::text, $4::timestamptz)
       )
       SELECT count(*)::int AS count FROM d`,
      [developerId, repo, summary ?? null, now().toISOString()],
    );
    return rows[0].count;
  }

  async function activeLocks(repo) {
    const { rows } = await db.query(
      `SELECT lock_id, developer_id, file_path, repo, acquired_at FROM teamcontext.locks
       WHERE acquired_at >= $1::timestamptz - $2::float8 * interval '1 minute'
         AND ($3::text IS NULL OR repo = $3::text)
       ORDER BY acquired_at DESC`,
      [now().toISOString(), ttlMinutes, repo ?? null],
    );
    return rows.map(lockRow);
  }

  async function activity(repo, limit = 50) {
    const { rows } = await db.query(
      `SELECT developer_id, repo, file_path, event, summary, created_at FROM teamcontext.activity
       WHERE ($1::text IS NULL OR repo = $1::text)
       ORDER BY created_at DESC, id DESC
       LIMIT $2::int`,
      [repo ?? null, limit],
    );
    return rows.map(activityRow);
  }

  async function deleteStale(olderThanMinutes) {
    const { rows } = await db.query(
      `DELETE FROM teamcontext.locks
       WHERE acquired_at <= $1::timestamptz - $2::float8 * interval '1 minute'
       RETURNING 1`,
      [now().toISOString(), olderThanMinutes],
    );
    return rows.length;
  }

  return { acquire, release, releaseAll, activeLocks, activity, deleteStale };
}
