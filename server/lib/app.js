import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireToken } from './auth.js';
import { createApiRouter } from './routes.js';

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

export function createApp({ store, token }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/api', createApiRouter(store, requireToken(token)));
  // Local runs only: on Vercel, public/ is served by the CDN before reaching the function.
  app.use(express.static(PUBLIC_DIR));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
