import { renderLocks, renderActivity, countConflicts } from './view.js';

const repo = new URLSearchParams(location.search).get('repo');
const repoQuery = repo ? `repo=${encodeURIComponent(repo)}` : '';
const $ = (id) => document.getElementById(id);

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function refresh() {
  try {
    const [status, activity] = await Promise.all([
      getJson(`/api/locks/status?${repoQuery}`),
      getJson(`/api/activity?${repoQuery}&limit=50`),
    ]);
    const now = new Date();
    $('locks').innerHTML = renderLocks(status.active_locks, now);
    $('lock-count').textContent = status.count;
    $('activity').innerHTML = renderActivity(activity.events, now);
    $('conflicts').textContent = countConflicts(activity.events);
    $('updated').textContent = `Last updated ${now.toLocaleTimeString()}`;
    $('updated').classList.remove('error');
  } catch (err) {
    $('updated').textContent = `Server unreachable — retrying… (${err.message})`;
    $('updated').classList.add('error');
  }
}

$('repo').textContent = repo ?? 'all repos';
refresh();
setInterval(refresh, 4000);
