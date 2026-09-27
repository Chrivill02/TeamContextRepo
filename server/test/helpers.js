import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const MIGRATION = readFileSync(
  new URL('../../supabase/migrations/20260926000000_teamcontext.sql', import.meta.url),
  'utf8',
);

// Fresh in-memory Postgres with the real migration applied.
export async function testDb() {
  const db = new PGlite();
  await db.exec(MIGRATION);
  return db;
}
