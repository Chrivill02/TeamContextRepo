import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { testDb } from './helpers.js';
import { createStore } from '../lib/store.js';
import { createApp } from '../lib/app.js';

const TOKEN = 'test-token';

async function start(t) {
  const db = await testDb();
  const server = createApp({ store: createStore(db), token: TOKEN }).listen(0);
  await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); server.close(); await db.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (method, path, body, { auth = true } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(auth ? { authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  };
}

const lock = { developer_id: 'alice', file_path: 'src/header.js', repo: 'demo-repo' };

test('GET /health is public', async (t) => {
  const call = await start(t);
  assert.deepEqual(await call('GET', '/health', null, { auth: false }), { status: 200, body: { ok: true } });
});

test('write endpoints reject missing or wrong token', async (t) => {
  const call = await start(t);
  assert.equal((await call('POST', '/api/locks/acquire', lock, { auth: false })).status, 401);
  assert.equal((await call('POST', '/api/locks/release_all', { developer_id: 'a', repo: 'r' }, { auth: false })).status, 401);
  assert.equal((await call('DELETE', '/api/locks/stale', { older_than_minutes: 1 }, { auth: false })).status, 401);
});

test('acquire validates required fields', async (t) => {
  const call = await start(t);
  const r = await call('POST', '/api/locks/acquire', { developer_id: 'alice' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /file_path/);
});

test('acquire → granted, then 409 conflict for another developer', async (t) => {
  const call = await start(t);
  const granted = await call('POST', '/api/locks/acquire', lock);
  assert.equal(granted.status, 200);
  assert.equal(granted.body.status, 'granted');
  assert.equal(granted.body.developer_id, 'alice');
  assert.equal(granted.body.file_path, 'src/header.js');
  assert.ok(granted.body.lock_id);

  const again = await call('POST', '/api/locks/acquire', lock);
  assert.equal(again.status, 200, 'same developer is idempotent');

  const conflict = await call('POST', '/api/locks/acquire', { ...lock, developer_id: 'bob' });
  assert.equal(conflict.status, 409);
  assert.deepEqual(Object.keys(conflict.body).sort(), ['acquired_at', 'conflict_with', 'file_path', 'status']);
  assert.equal(conflict.body.conflict_with, 'alice');
});

test('status and activity are public and filter by repo', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  await call('POST', '/api/locks/acquire', { ...lock, repo: 'other' });

  const status = await call('GET', '/api/locks/status?repo=demo-repo', null, { auth: false });
  assert.equal(status.status, 200);
  assert.equal(status.body.count, 1);
  assert.equal(status.body.active_locks[0].file_path, 'src/header.js');
  assert.equal(status.body.ttl_minutes, 30);
  assert.equal(status.body.conflicts_avoided, 0);

  const activity = await call('GET', '/api/activity?repo=demo-repo&limit=5', null, { auth: false });
  assert.equal(activity.status, 200);
  assert.equal(activity.body.events.length, 1);
  assert.equal(activity.body.events[0].event, 'lock');

  await call('POST', '/api/locks/acquire', { ...lock, developer_id: 'bob' });
  assert.equal((await call('GET', '/api/locks/status?repo=demo-repo', null, { auth: false })).body.conflicts_avoided, 1);
});

test('release returns 200 with summary logged, 404 when not held', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  const notMine = await call('POST', '/api/locks/release', { ...lock, developer_id: 'bob' });
  assert.deepEqual(notMine, { status: 404, body: { status: 'not_found' } });

  const released = await call('POST', '/api/locks/release', { ...lock, summary: 'Added toggle' });
  assert.deepEqual(released, { status: 200, body: { status: 'released', file_path: 'src/header.js' } });

  const activity = await call('GET', '/api/activity?repo=demo-repo', null, { auth: false });
  assert.equal(activity.body.events[0].summary, 'Added toggle');
});

test('release_all returns count', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  await call('POST', '/api/locks/acquire', { ...lock, file_path: 'src/footer.js' });
  const r = await call('POST', '/api/locks/release_all', { developer_id: 'alice', repo: 'demo-repo', summary: 'done' });
  assert.deepEqual(r, { status: 200, body: { status: 'released', count: 2 } });
});

test('DELETE /api/locks/stale validates and returns deleted count', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  assert.equal((await call('DELETE', '/api/locks/stale', { older_than_minutes: 'x' })).status, 400);
  assert.deepEqual(await call('DELETE', '/api/locks/stale', { older_than_minutes: 0 }), { status: 200, body: { deleted: 1 } });
});

test('standup is public, needs a repo and returns developer sessions', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  assert.equal((await call('GET', '/api/standup', null, { auth: false })).status, 400);
  const r = await call('GET', '/api/standup?repo=demo-repo', null, { auth: false });
  assert.equal(r.status, 200);
  assert.equal(r.body.hours, 24);
  assert.equal(r.body.developers[0].developer_id, 'alice');
  assert.equal(r.body.developers[0].timeline[0].event, 'lock');
});
