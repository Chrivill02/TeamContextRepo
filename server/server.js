import express from 'express';
import dotenv from 'dotenv';
import { createPool } from './lib/db.js';
import { createStore } from './lib/store.js';
import { createApp } from './lib/app.js';

dotenv.config({ path: ['.env.local', '.env'] });

const { POSTGRES_URL, SUPABASE_CA_CERT, TEAM_TOKEN, LOCK_TTL_MINUTES = '30', PORT = '3000' } = process.env;

const store = createStore(createPool(POSTGRES_URL, SUPABASE_CA_CERT), { ttlMinutes: Number(LOCK_TTL_MINUTES) });
const app = express();
app.use(createApp({ store, token: TEAM_TOKEN }));

export default app;

if (!process.env.VERCEL) {
  app.listen(Number(PORT), () => console.log(`TeamContext server on :${PORT} (TTL ${LOCK_TTL_MINUTES} min)`));
}
