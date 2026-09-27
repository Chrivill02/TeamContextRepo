import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './helpers.js';
import { createStore } from '../lib/store.js';

async function setup(t, ttlMinutes = 30) {
  let current = new Date('2026-09-26T10:00:00.000Z');
  const clock = {
    now: () => current,
    advance: (minutes) => { current = new Date(current.getTime() + minutes * 60_000); },
  };
  const db = await testDb();
  t.after(() => db.close());
  return { store: createStore(db, { ttlMinutes, now: clock.now }), clock };
}

const A = { developerId: 'alice', filePath: 'src/header.js', repo: 'demo-repo' };
const B = { ...A, developerId: 'bob' };

test('grants a free file', async (t) => {
  const { store } = await setup(t);
  const r = await store.acquire(A);
  assert.equal(r.status, 'granted');
  assert.equal(r.lock.developer_id, 'alice');
  assert.equal(r.lock.acquired_at, '2026-09-26T10:00:00.000Z');
  assert.equal((await store.activeLocks('demo-repo')).length, 1);
  assert.equal((await store.activity('demo-repo'))[0].event, 'lock');
});

test('re-acquiring your own lock is idempotent and refreshes acquired_at', async (t) => {
  const { store, clock } = await setup(t);
  const first = await store.acquire(A);
  clock.advance(5);
  const second = await store.acquire(A);
  assert.equal(second.status, 'granted');
  assert.equal(second.lock.lock_id, first.lock.lock_id);
  assert.equal(second.lock.acquired_at, '2026-09-26T10:05:00.000Z');
  assert.equal((await store.activeLocks('demo-repo')).length, 1);
});

test('another developer gets a conflict, and the conflict is logged', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  const r = await store.acquire(B);
  assert.equal(r.status, 'conflict');
  assert.equal(r.lock.developer_id, 'alice');
  const [latest] = await store.activity('demo-repo');
  assert.equal(latest.event, 'conflict');
  assert.equal(latest.developer_id, 'bob');
  assert.equal(latest.file_path, 'src/header.js');
});

test('expired locks do not block and are hidden from activeLocks', async (t) => {
  const { store, clock } = await setup(t, 30);
  await store.acquire(A);
  clock.advance(31);
  assert.equal((await store.activeLocks('demo-repo')).length, 0);
  const r = await store.acquire(B);
  assert.equal(r.status, 'granted');
  assert.equal(r.lock.developer_id, 'bob');
});

test('release only works for the holder and records the handoff summary', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  assert.equal(await store.release({ ...B, summary: 'nope' }), false);
  assert.equal(await store.release({ ...A, summary: 'Added dark mode toggle' }), true);
  assert.equal((await store.activeLocks('demo-repo')).length, 0);
  const [latest] = await store.activity('demo-repo');
  assert.equal(latest.event, 'unlock');
  assert.equal(latest.summary, 'Added dark mode toggle');
});

test('releaseAll frees every lock of that developer in that repo only', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  await store.acquire({ ...A, filePath: 'src/footer.js' });
  await store.acquire({ ...A, repo: 'other-repo' });
  await store.acquire({ ...B, filePath: 'src/api.js' });
  assert.equal(await store.releaseAll({ developerId: 'alice', repo: 'demo-repo', summary: 'Header done' }), 2);
  assert.deepEqual((await store.activeLocks('demo-repo')).map((l) => l.developer_id), ['bob']);
  assert.equal((await store.activeLocks('other-repo')).length, 1);
  const [latest] = await store.activity('demo-repo');
  assert.equal(latest.event, 'release_all');
  assert.equal(latest.file_path, null);
  assert.equal(latest.summary, 'Header done');
});

test('activity is newest first and respects limit', async (t) => {
  const { store, clock } = await setup(t);
  await store.acquire(A);
  clock.advance(1);
  await store.release(A);
  clock.advance(1);
  await store.acquire(B);
  const events = await store.activity('demo-repo', 2);
  assert.deepEqual(events.map((e) => e.event), ['lock', 'unlock']);
  assert.equal(events[0].developer_id, 'bob');
  assert.equal(events[0].created_at, '2026-09-26T10:02:00.000Z');
});

test('activeLocks without repo returns every repo', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  await store.acquire({ ...B, repo: 'other-repo' });
  assert.equal((await store.activeLocks()).length, 2);
});

test('acquire racing a release is granted, never a null-holder conflict', async (t) => {
  const db = await testDb();
  t.after(() => db.close());
  const store = createStore(db, { now: () => new Date('2026-09-26T10:00:00.000Z') });
  await store.acquire(A);
  // Simulates alice's release committing between bob's INSERT ... ON CONFLICT DO NOTHING
  // and his SELECT ... FOR UPDATE (only reachable with concurrent connections in production).
  // Statement-level triggers fire even when ON CONFLICT DO NOTHING inserts no row.
  await db.exec(`
    create function teamcontext.sim_release() returns trigger language plpgsql as $$
    begin delete from teamcontext.locks where developer_id = 'alice'; return null; end $$;
    create trigger sim_release after insert on teamcontext.locks
      for each statement execute function teamcontext.sim_release();
  `);
  const r = await store.acquire(B);
  assert.equal(r.status, 'granted');
  assert.equal(r.lock.developer_id, 'bob');
});

test('deleteStale removes locks older than N minutes (0 clears everything)', async (t) => {
  const { store, clock } = await setup(t, 120);
  await store.acquire(A);
  clock.advance(61);
  await store.acquire({ ...B, filePath: 'src/api.js' });
  assert.equal(await store.deleteStale(60), 1);
  assert.deepEqual((await store.activeLocks('demo-repo')).map((l) => l.developer_id), ['bob']);
  assert.equal(await store.deleteStale(0), 1);
});

test('standup groups finished files, handoffs and conflicts per developer', async (t) => {
  const { store, clock } = await setup(t);
  await store.acquire(A);
  await store.acquire(B);                             // conflict for bob
  clock.advance(10);
  await store.release({ ...A, summary: 'Added dark mode toggle' });
  await store.releaseAll({ developerId: 'alice', repo: 'demo-repo', summary: 'Header done, tests pending' });
  assert.deepEqual(await store.standup('demo-repo', 8), [
    { developer_id: 'alice', files: ['src/header.js'], handoffs: ['Added dark mode toggle', 'Header done, tests pending'], conflicts: 0 },
    { developer_id: 'bob', files: [], handoffs: [], conflicts: 1 },
  ]);
});
