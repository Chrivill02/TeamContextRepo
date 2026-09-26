import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, timeAgo, renderLocks, renderActivity, countConflicts } from '../public/view.js';

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
