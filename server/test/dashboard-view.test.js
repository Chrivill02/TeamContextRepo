import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, timeAgo, renderLocks, renderActivity, countConflicts, renderStandup,
  devColor, timeLeft, repoList, renderRepoPicker,
} from '../public/view.js';

const now = new Date('2026-09-26T10:10:00.000Z');

test('escapeHtml neutralizes markup from summaries', () =>
  assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;'));

test('timeAgo formats seconds, minutes, hours', () => {
  assert.equal(timeAgo('2026-09-26T10:09:30.000Z', now), '30s');
  assert.equal(timeAgo('2026-09-26T10:00:00.000Z', now), '10m');
  assert.equal(timeAgo('2026-09-26T08:05:00.000Z', now), '2h 5m');
});

test('renderLocks shows all clear when empty', () =>
  assert.match(renderLocks([], now), /All clear/));

test('renderLocks renders one red row per lock', () => {
  const html = renderLocks([{ developer_id: 'alice', file_path: 'src/header.js', repo: 'demo', acquired_at: '2026-09-26T10:00:00.000Z' }], now);
  assert.match(html, /<tr class="locked">/);
  assert.match(html, /alice/);
  assert.match(html, /src\/header\.js/);
  assert.match(html, /10m/);
});

test('renderActivity highlights conflicts and shows handoff summaries escaped', () => {
  const html = renderActivity([
    { developer_id: 'bob', event: 'conflict', file_path: 'src/header.js', summary: 'blocked by alice', created_at: '2026-09-26T10:09:00.000Z' },
    { developer_id: 'alice', event: 'unlock', file_path: 'src/header.js', summary: '<b>Added</b> toggle', created_at: '2026-09-26T10:08:00.000Z' },
  ], now);
  assert.match(html, /class="event conflict"/);
  assert.match(html, /&lt;b&gt;Added&lt;\/b&gt; toggle/);
});

test('countConflicts', () =>
  assert.equal(countConflicts([{ event: 'conflict' }, { event: 'lock' }, { event: 'conflict' }]), 2));

test('renderStandup lists each developer with files and notes', () => {
  const html = renderStandup([{ developer_id: 'alice', files: ['src/header.js'], handoffs: ['Added toggle'], conflicts: 1 }]);
  assert.match(html, /alice/);
  assert.match(html, /src\/header\.js/);
  assert.match(html, /Added toggle/);
  assert.match(html, /1 conflict avoided/);
});

test('devColor is stable per developer and differs between developers', () => {
  assert.equal(devColor('alice'), devColor('alice'));
  assert.notEqual(devColor('alice'), devColor('bob'));
  assert.match(devColor('alice'), /^hsl\(\d+ /);
});

test('timeLeft counts down to lock expiry', () => {
  assert.equal(timeLeft('2026-09-26T10:00:00.000Z', 30, now), '20m');
  assert.equal(timeLeft('2026-09-26T09:30:00.000Z', 30, now), 'expiring');
});

test('renderLocks shows time left and hides the repo column when filtered', () => {
  const locks = [{ developer_id: 'alice', file_path: 'src/header.js', repo: 'demo', acquired_at: '2026-09-26T10:00:00.000Z' }];
  const html = renderLocks(locks, now, { ttlMinutes: 30, showRepo: false });
  assert.match(html, /20m/);
  assert.doesNotMatch(html, /<th>Repo<\/th>/);
  assert.match(renderLocks(locks, now), /<th>Repo<\/th>/);
});

test('renderActivity marks the newest events as fresh', () => {
  const events = [
    { developer_id: 'bob', event: 'lock', file_path: 'a.js', created_at: '2026-09-26T10:09:00.000Z' },
    { developer_id: 'bob', event: 'lock', file_path: 'b.js', created_at: '2026-09-26T10:08:00.000Z' },
  ];
  assert.equal((renderActivity(events, now, { fresh: 1 }).match(/data-fresh/g) ?? []).length, 1);
  assert.doesNotMatch(renderActivity(events, now), /data-fresh/);
});

test('renderStandup shows a session summary and the full timeline', () => {
  const html = renderStandup([{
    developer_id: 'alice', files: ['src/header.js', 'index.html'], handoffs: ['Header done'], conflicts: 0, tasks_completed: 1,
    first_at: '2026-09-26T09:00:00.000Z', last_at: '2026-09-26T09:45:00.000Z',
    timeline: [
      { event: 'lock', file_path: 'src/header.js', summary: null, created_at: '2026-09-26T09:00:00.000Z' },
      { event: 'release_all', file_path: null, summary: '<i>Header done</i>', created_at: '2026-09-26T09:45:00.000Z' },
    ],
  }], now);
  assert.match(html, /2 files/);
  assert.match(html, /1 task done/);
  assert.match(html, /45m/);
  assert.match(html, /<details/);
  assert.match(html, /&lt;i&gt;Header done&lt;\/i&gt;/);
  assert.doesNotMatch(html, /conflict/);
});

test('renderStandup explains an empty window', () =>
  assert.match(renderStandup([], now, { hours: 24 }), /last 24h/));

test('repoList returns distinct repos, most recent first', () =>
  assert.deepEqual(repoList([{ repo: 'b' }, { repo: 'a' }, { repo: 'b' }]), ['b', 'a']));

test('renderRepoPicker links to each repo, escaped', () => {
  const html = renderRepoPicker(['teamcontext-demo', 'x"y']);
  assert.match(html, /href="\?repo=teamcontext-demo"/);
  assert.match(html, /x%22y/);
});

test('renderStandup keeps only the latest 3 handoff notes on the card', () => {
  const html = renderStandup([{
    developer_id: 'alice', files: [], handoffs: ['n1', 'n2', 'n3', 'n4', 'n5'], conflicts: 0, tasks_completed: 0, timeline: [],
  }], now);
  assert.doesNotMatch(html, /<li>n2<\/li>/);
  assert.match(html, /<li>n3<\/li><li>n4<\/li><li>n5<\/li>/);
  assert.match(html, /\+2 earlier notes/);
});
