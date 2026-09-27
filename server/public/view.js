const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export function timeAgo(iso, now = new Date()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso)) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function renderLocks(locks, now = new Date()) {
  if (!locks.length) return '<div class="all-clear">🟢 All clear — nobody is editing files right now</div>';
  const rows = locks
    .map((l) => `<tr class="locked"><td>${escapeHtml(l.developer_id)}</td><td><code>${escapeHtml(l.file_path)}</code></td>` +
      `<td>${escapeHtml(l.repo)}</td><td>${timeAgo(l.acquired_at, now)}</td></tr>`)
    .join('');
  return `<table><thead><tr><th>Developer</th><th>File</th><th>Repo</th><th>Held for</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const ICONS = { lock: '🔒', unlock: '🔓', conflict: '⛔', release_all: '✅' };
const LABELS = { lock: 'locked', unlock: 'released', conflict: 'was blocked on', release_all: 'finished task' };

export function renderActivity(events, now = new Date()) {
  if (!events.length) return '<p class="muted">No activity yet.</p>';
  const items = events
    .map((e) => `<li class="event ${escapeHtml(e.event)}">${ICONS[e.event] ?? '•'} <strong>${escapeHtml(e.developer_id)}</strong> ` +
      `${LABELS[e.event] ?? escapeHtml(e.event)}${e.file_path ? ` <code>${escapeHtml(e.file_path)}</code>` : ''} ` +
      `<span class="muted">${timeAgo(e.created_at, now)} ago</span>` +
      `${e.summary ? `<div class="summary">${escapeHtml(e.summary)}</div>` : ''}</li>`)
    .join('');
  return `<ul class="feed">${items}</ul>`;
}

export const countConflicts = (events) => events.filter((e) => e.event === 'conflict').length;

export function renderStandup(developers) {
  if (!developers.length) return '<p class="muted">Nothing to report yet.</p>';
  return developers
    .map((d) => `<div class="standup"><strong>${escapeHtml(d.developer_id)}</strong>` +
      `${d.files.length ? `<div>Files: ${d.files.map((f) => `<code>${escapeHtml(f)}</code>`).join(', ')}</div>` : ''}` +
      `${d.handoffs.map((h) => `<div class="summary">${escapeHtml(h)}</div>`).join('')}` +
      `${d.conflicts ? `<div class="muted">${d.conflicts} conflict${d.conflicts > 1 ? 's' : ''} avoided</div>` : ''}</div>`)
    .join('');
}
