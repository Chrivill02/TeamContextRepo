const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export function timeAgo(iso, now = new Date()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso)) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function timeLeft(acquiredIso, ttlMinutes, now = new Date()) {
  const expiresAt = new Date(new Date(acquiredIso).getTime() + ttlMinutes * 60_000);
  return expiresAt <= now ? 'expiring' : timeAgo(now, expiresAt);
}

const clock = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Same developer → same hue everywhere on the page.
export function devColor(id) {
  let hash = 0;
  for (const ch of String(id)) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return `hsl(${hash % 360} 70% 62%)`;
}

const dev = (id) => `<span class="dev" style="--dev:${devColor(id)}">${escapeHtml(id)}</span>`;

export function renderLocks(locks, now = new Date(), { ttlMinutes = 30, showRepo = true } = {}) {
  if (!locks.length) return '<div class="all-clear">🟢 All clear — nobody is editing files right now</div>';
  const rows = locks
    .map((l) => `<tr class="locked"><td>${dev(l.developer_id)}</td><td><code>${escapeHtml(l.file_path)}</code></td>` +
      `${showRepo ? `<td>${escapeHtml(l.repo)}</td>` : ''}<td>${timeAgo(l.acquired_at, now)}</td>` +
      `<td class="muted">${timeLeft(l.acquired_at, ttlMinutes, now)}</td></tr>`)
    .join('');
  return `<table><thead><tr><th>Developer</th><th>File</th>${showRepo ? '<th>Repo</th>' : ''}` +
    `<th>Held for</th><th>Expires in</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const ICONS = { lock: '🔒', unlock: '🔓', conflict: '⛔', release_all: '✅' };
const LABELS = { lock: 'locked', unlock: 'released', conflict: 'was blocked on', release_all: 'finished task' };

// `fresh`: how many of the newest events arrived since the last refresh (they get a highlight).
export function renderActivity(events, now = new Date(), { fresh = 0 } = {}) {
  if (!events.length) return '<p class="muted">No activity yet.</p>';
  const items = events
    .map((e, i) => `<li class="event ${escapeHtml(e.event)}"${i < fresh ? ' data-fresh' : ''}>${ICONS[e.event] ?? '•'} ${dev(e.developer_id)} ` +
      `${LABELS[e.event] ?? escapeHtml(e.event)}${e.file_path ? ` <code>${escapeHtml(e.file_path)}</code>` : ''} ` +
      `<span class="muted">${timeAgo(e.created_at, now)} ago</span>` +
      `${e.summary ? `<div class="summary">${escapeHtml(e.summary)}</div>` : ''}</li>`)
    .join('');
  return `<ul class="feed">${items}</ul>`;
}

export const countConflicts = (events) => events.filter((e) => e.event === 'conflict').length;

function sessionStats(d) {
  const parts = [plural(d.files.length, 'file'), `${plural(d.tasks_completed ?? 0, 'task')} done`];
  if (d.conflicts) parts.push(`${plural(d.conflicts, 'conflict')} avoided`);
  if (d.first_at && d.last_at) parts.push(`active ${clock(d.first_at)} → ${clock(d.last_at)} (${timeAgo(d.first_at, new Date(d.last_at))})`);
  return parts.join(' · ');
}

function renderTimeline(timeline) {
  const items = timeline
    .map((e) => `<li><span class="muted">${clock(e.created_at)}</span> ${ICONS[e.event] ?? '•'} ` +
      `${LABELS[e.event] ?? escapeHtml(e.event)}${e.file_path ? ` <code>${escapeHtml(e.file_path)}</code>` : ''}` +
      `${e.summary ? ` — <span class="summary-inline">${escapeHtml(e.summary)}</span>` : ''}</li>`)
    .join('');
  return `<details><summary>Full timeline (${plural(timeline.length, 'event')})</summary><ol class="timeline">${items}</ol></details>`;
}

const MAX_NOTES = 3;

function renderHandoffs(handoffs) {
  if (!handoffs.length) return '';
  const hidden = handoffs.length - MAX_NOTES;
  return `<ul class="handoffs">${handoffs.slice(-MAX_NOTES).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>` +
    `${hidden > 0 ? `<p class="muted">+${hidden} earlier notes in the timeline</p>` : ''}`;
}

// One card per developer: everything they did in the selected window.
export function renderStandup(developers, now = new Date(), { hours = 24 } = {}) {
  if (!developers.length) return `<p class="muted">No activity in the last ${hours}h.</p>`;
  return developers
    .map((d) => `<article class="session" data-dev="${escapeHtml(d.developer_id)}" style="--dev:${devColor(d.developer_id)}">` +
      `<header>${dev(d.developer_id)}<span class="muted">last seen ${timeAgo(d.last_at ?? now, now)} ago</span></header>` +
      `<p class="stats-line">${sessionStats(d)}</p>` +
      `${d.files.length ? `<p class="files">${d.files.map((f) => `<code>${escapeHtml(f)}</code>`).join(' ')}</p>` : ''}` +
      renderHandoffs(d.handoffs) +
      `${d.timeline?.length ? renderTimeline(d.timeline) : ''}</article>`)
    .join('');
}

export function repoList(events) {
  return [...new Set(events.map((e) => e.repo).filter(Boolean))];
}

export function renderRepoPicker(repos) {
  if (!repos.length) return '<p class="muted">No repos have reported activity yet.</p>';
  return `<p class="muted">Pick a repo to see its developer sessions:</p><div class="repo-picker">` +
    repos.map((r) => `<a class="repo-link" href="?repo=${encodeURIComponent(r)}">${escapeHtml(r)}</a>`).join('') + '</div>';
}
