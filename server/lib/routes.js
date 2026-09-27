import { Router } from 'express';

function missingFields(body, fields) {
  const missing = fields.filter((f) => typeof body?.[f] !== 'string' || body[f].trim() === '');
  return missing.length ? `missing fields: ${missing.join(', ')}` : null;
}

const summaryOf = (body) => (typeof body?.summary === 'string' ? body.summary.slice(0, 500) : null);
const repoOf = (query) => (typeof query.repo === 'string' && query.repo ? query.repo : undefined);

export function createApiRouter(store, auth) {
  const router = Router();

  router.post('/locks/acquire', auth, async (req, res) => {
    const error = missingFields(req.body, ['developer_id', 'file_path', 'repo']);
    if (error) return res.status(400).json({ error });
    const { developer_id, file_path, repo } = req.body;

    const result = await store.acquire({ developerId: developer_id, filePath: file_path, repo });
    if (result.status === 'conflict') {
      return res.status(409).json({
        status: 'conflict',
        conflict_with: result.lock.developer_id,
        acquired_at: result.lock.acquired_at,
        file_path,
      });
    }
    res.json({ status: 'granted', lock_id: result.lock.lock_id, file_path, developer_id, acquired_at: result.lock.acquired_at });
  });

  router.post('/locks/release', auth, async (req, res) => {
    const error = missingFields(req.body, ['developer_id', 'file_path', 'repo']);
    if (error) return res.status(400).json({ error });
    const { developer_id, file_path, repo } = req.body;

    const released = await store.release({ developerId: developer_id, filePath: file_path, repo, summary: summaryOf(req.body) });
    if (!released) return res.status(404).json({ status: 'not_found' });
    res.json({ status: 'released', file_path });
  });

  router.post('/locks/release_all', auth, async (req, res) => {
    const error = missingFields(req.body, ['developer_id', 'repo']);
    if (error) return res.status(400).json({ error });
    const count = await store.releaseAll({ developerId: req.body.developer_id, repo: req.body.repo, summary: summaryOf(req.body) });
    res.json({ status: 'released', count });
  });

  router.get('/locks/status', async (req, res) => {
    const repo = repoOf(req.query);
    const [active_locks, conflicts_avoided] = await Promise.all([store.activeLocks(repo), store.conflictCount(repo)]);
    res.json({ active_locks, count: active_locks.length, conflicts_avoided, ttl_minutes: store.ttlMinutes });
  });

  router.get('/activity', async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    res.json({ events: await store.activity(repoOf(req.query), limit) });
  });

  router.delete('/locks/stale', auth, async (req, res) => {
    const minutes = req.body?.older_than_minutes;
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) {
      return res.status(400).json({ error: 'older_than_minutes must be a non-negative number' });
    }
    res.json({ deleted: await store.deleteStale(minutes) });
  });

  router.get('/standup', async (req, res) => {
    const repo = repoOf(req.query);
    if (!repo) return res.status(400).json({ error: 'repo is required' });
    const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 72);
    res.json({ hours, developers: await store.standup(repo, hours) });
  });

  return router;
}
