import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPool } from '../lib/db.js';

test('createPool handles idle-client errors instead of crashing the process', async () => {
  // pg.Pool connects lazily, so no database is needed here.
  const pool = createPool('postgres://u:p@localhost:6543/postgres?sslmode=require', 'dummy-ca');
  try {
    assert.ok(pool.listenerCount('error') > 0);
  } finally {
    await pool.end();
  }
});

test('createPool requires the connection string and the CA cert', () => {
  assert.throws(() => createPool('', 'ca'), /POSTGRES_URL/);
  assert.throws(() => createPool('postgres://u:p@localhost/db', ''), /SUPABASE_CA_CERT/);
});
