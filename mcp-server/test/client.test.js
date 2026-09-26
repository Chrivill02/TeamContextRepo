import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../lib/client.js';

function fakeFetch(...responses) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body && JSON.parse(init.body) });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return { ok: next.status < 400, status: next.status, json: async () => next.body };
  };
  fn.calls = calls;
  return fn;
}

const base = { baseUrl: 'https://tc.example/', token: 'tok', developerId: 'alice', repo: 'demo-repo' };

test('acquire posts developer, repo and bearer token', async () => {
  const fetchImpl = fakeFetch({ status: 200, body: { status: 'granted' } });
  const client = createClient({ ...base, fetchImpl });
  const res = await client.acquire('src/header.js');
  assert.deepEqual(res, { ok: true, status: 200, data: { status: 'granted' } });
  const [call] = fetchImpl.calls;
  assert.equal(call.url, 'https://tc.example/api/locks/acquire');
  assert.equal(call.method, 'POST');
  assert.equal(call.headers.authorization, 'Bearer tok');
  assert.deepEqual(call.body, { developer_id: 'alice', file_path: 'src/header.js', repo: 'demo-repo' });
});

test('release sends the summary; status and activity use repo query', async () => {
  const fetchImpl = fakeFetch({ status: 200, body: {} }, { status: 200, body: {} }, { status: 200, body: {} });
  const client = createClient({ ...base, fetchImpl });
  await client.release('src/header.js', 'Added toggle');
  await client.status();
  await client.activity(5);
  assert.equal(fetchImpl.calls[0].body.summary, 'Added toggle');
  assert.equal(fetchImpl.calls[1].url, 'https://tc.example/api/locks/status?repo=demo-repo');
  assert.equal(fetchImpl.calls[2].url, 'https://tc.example/api/activity?repo=demo-repo&limit=5');
});

test('conflict (409) is returned, not thrown', async () => {
  const client = createClient({ ...base, fetchImpl: fakeFetch({ status: 409, body: { conflict_with: 'bob' } }) });
  const res = await client.acquire('src/header.js');
  assert.equal(res.ok, false);
  assert.equal(res.status, 409);
  assert.equal(res.data.conflict_with, 'bob');
});

test('network errors never throw', async () => {
  const client = createClient({ ...base, fetchImpl: fakeFetch(new Error('ECONNREFUSED')) });
  assert.deepEqual(await client.releaseAll('x'), { ok: false, status: 0, error: 'ECONNREFUSED' });
});

test('slow server times out with a clear error', async () => {
  const hang = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  const client = createClient({ ...base, timeoutMs: 20, fetchImpl: hang });
  assert.deepEqual(await client.status(), { ok: false, status: 0, error: 'timeout after 20ms' });
});
