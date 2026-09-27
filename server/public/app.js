import { renderLocks, renderActivity, countConflicts, renderStandup, repoList, renderRepoPicker } from './view.js';

const params = new URLSearchParams(location.search);
const repo = params.get('repo');
const repoQuery = repo ? `repo=${encodeURIComponent(repo)}` : '';
const WINDOWS = [8, 24, 72];
let hours = WINDOWS.includes(Number(params.get('hours'))) ? Number(params.get('hours')) : 24;
let newestKey = null;
const $ = (id) => document.getElementById(id);

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const eventKey = (e) => `${e.created_at}|${e.developer_id}|${e.event}|${e.file_path ?? ''}`;

// How many events at the top of the feed are new since the previous refresh (0 on first load).
function countFresh(events) {
  if (newestKey === null) return 0;
  const i = events.findIndex((e) => eventKey(e) === newestKey);
  return i === -1 ? events.length : i;
}

function activeDevelopers(events, now) {
  const since = now - 24 * 3_600_000;
  return new Set(events.filter((e) => new Date(e.created_at) >= since).map((e) => e.developer_id)).size;
}

// Re-rendering every few seconds must not collapse timelines the viewer opened.
function renderSessions(developers, now) {
  const open = new Set([...document.querySelectorAll('article.session details[open]')].map((d) => d.closest('article').dataset.dev));
  $('sessions').innerHTML = renderStandup(developers, now, { hours });
  for (const article of document.querySelectorAll('article.session')) {
    if (open.has(article.dataset.dev)) article.querySelector('details')?.setAttribute('open', '');
  }
}

async function refresh() {
  try {
    const [status, activity, standup] = await Promise.all([
      getJson(`/api/locks/status?${repoQuery}`),
      getJson(`/api/activity?${repoQuery}&limit=50`),
      repo ? getJson(`/api/standup?${repoQuery}&hours=${hours}`) : null,
    ]);
    const now = new Date();
    const fresh = countFresh(activity.events);
    newestKey = activity.events[0] ? eventKey(activity.events[0]) : newestKey;

    $('locks').innerHTML = renderLocks(status.active_locks, now, { ttlMinutes: status.ttl_minutes ?? 30, showRepo: !repo });
    $('activity').innerHTML = renderActivity(activity.events, now, { fresh });
    $('lock-count').textContent = status.count;
    $('conflicts').textContent = status.conflicts_avoided ?? countConflicts(activity.events);
    $('devs').textContent = standup ? standup.developers.length : activeDevelopers(activity.events, now);
    if (standup) renderSessions(standup.developers, now);
    else $('sessions').innerHTML = renderRepoPicker(repoList(activity.events));

    $('live').className = 'live ok';
    $('live-text').textContent = `Live · updated ${now.toLocaleTimeString()}`;
  } catch (err) {
    $('live').className = 'live error';
    $('live-text').textContent = `Server unreachable — retrying… (${err.message})`;
  }
}

function selectWindow(h) {
  hours = h;
  for (const b of document.querySelectorAll('[data-hours]')) b.setAttribute('aria-pressed', String(Number(b.dataset.hours) === h));
  $('devs-label').textContent = `developers active (${repo ? `${h}h` : '24h'})`;
  if (repo) {
    params.set('hours', h);
    history.replaceState(null, '', `?${params}`);
  }
}

$('repo').textContent = repo ?? 'all repos';
for (const b of document.querySelectorAll('[data-hours]')) {
  b.addEventListener('click', () => { selectWindow(Number(b.dataset.hours)); refresh(); });
}
$('window-picker').hidden = !repo;
selectWindow(hours);
refresh();
setInterval(refresh, 4000);
