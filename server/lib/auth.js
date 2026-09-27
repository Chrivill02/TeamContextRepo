import { timingSafeEqual } from 'node:crypto';

export function requireToken(token) {
  if (!token) throw new Error('TEAM_TOKEN is required');
  const expected = Buffer.from(`Bearer ${token}`);

  return (req, res, next) => {
    const received = Buffer.from(req.get('authorization') ?? '');
    if (received.length === expected.length && timingSafeEqual(received, expected)) return next();
    res.status(401).json({ error: 'unauthorized' });
  };
}
