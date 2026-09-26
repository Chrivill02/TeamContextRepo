# TeamContext MVP — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un "semáforo" para equipos que programan con agentes de IA. Bob pide un lock sobre cada archivo antes de editarlo, un servidor central detecta los conflictos y un dashboard muestra en vivo quién edita qué, junto con las notas de handoff.

**Architecture:** Un servidor central (Express desplegado en **Vercel**, datos en **Supabase Postgres**) expone una API REST de locks y actividad; Vercel sirve el dashboard estático desde su CDN. Cada developer corre un servidor MCP local (stdio) con 4 tools (`file_lock`, `file_unlock`, `release_all`, `team_status`) que llaman a esa API. Un custom mode de Bob, "TeamContext", hace que Bob invoque esas tools solo, sin que nadie se lo pida. Así Bob pasa a ser el núcleo del producto.

**Tech Stack:** Node.js ≥ 20 (ESM), Express 5, `pg`, cors, dotenv, Supabase Postgres (schema `teamcontext` + función plpgsql), `@electric-sql/pglite` (Postgres en memoria para los tests), `@modelcontextprotocol/sdk` v1 + zod v3, `node:test`, HTML/JS vanilla para el dashboard y Vercel para el deploy.

**Fuente de verdad:** [TEAMCONTEXT_CONTEXT.md](../../../TEAMCONTEXT_CONTEXT.md) (reglas de la hackathon y contrato de la API). Este plan es el único plan vigente.

## Global Constraints

- Deadline: **domingo 27 sep 2026, 09:00 hora Guatemala (15:00 UTC)**. El envío tiene que estar hecho **antes de las 08:30**, para tener margen.
- IBM Bob IDE **v2.0.2+** es un componente central obligatorio. Bob es el agente principal; la compatibilidad con otros clientes MCP se menciona en una sola línea, nunca como titular.
- Cada persona tiene **40 Bobcoins** y no hay recargas. Hay que usar la instancia de la hackathon, trabajar primero en Plan mode y luego en Code mode, y darle a Bob tareas bien acotadas (este plan ya trae el código, así que Bob solo lo aplica y verifica).
- **`bob_sessions/`**: guardar un PNG del resumen de consumo de **cada** tarea de Bob **justo al terminarla**. Nombre: `teamcontext_taskNN_descripcion_corta.png`. Rangos para no chocar: **Christian 01–19, Eswin 20–39**.
- Datos: solo repos de ejemplo y `developer_id` sintéticos (`alice`, `bob`, `eswin-demo`, `christian-demo`). Nada de datos personales, de clientes ni confidenciales.
- **Nada de secretos en el repo.** `.env`, `.env.local`, `.vercel/`, `.bob/mcp.json` van en `.gitignore` (y `.bobignore`). `TEAM_TOKEN` y `POSTGRES_URL` solo van en las env vars de Vercel (y en `.env.local` / `.bob/mcp.json` locales).
- Los endpoints de lectura (`/health`, `GET /api/locks/status`, `GET /api/activity`) son públicos. Los de escritura exigen `Authorization: Bearer <TEAM_TOKEN>`. CORS habilitado.
- Rutas de archivo **normalizadas**: relativas al repo, con `/` y sin `./` inicial. Tanto `./src/A.ts` como `src\A.ts` quedan como `src/A.ts`.
- `LOCK_TTL_MINUTES` (default 30): un lock más viejo que eso se considera expirado.
- El dashboard hace polling cada **4 s**, sin WebSockets y **sin token en el HTML**.
- El MCP server hace timeout a los **10 s** y **nunca se cae**: devuelve un warning.
- Licencia **MIT**. Repo público.
- Fuera de alcance: Onboarding Assistant, WebSockets, auth por usuario e interceptar las tools internas de Bob.

---

## Reparto del trabajo (2 personas)
![alt text](image.png)
La división sigue las fronteras del sistema. El **contrato de la API** (sección 5 del contexto) es la interfaz entre las dos personas, así que pueden trabajar en paralelo desde el minuto 0 sin bloquearse.

| | **Christian — "Supabase + API en Vercel + Dashboard + Video"** | **Eswin — "MCP + Bob + Textos"** |
|---|---|---|
| Código | Task 1 (**ahora**), 2, 3, 6, repo demo (Task 7 Step 4), (10 stretch) | Task 0 y 4 (**ahora**), 5, 7 |
| Integración | Task 8 (los dos) | Task 8 (los dos) |
| Entrega | Task 9A: video, README, URL, deploy final | Task 9B: statements, slides, cover, DATA_SOURCES, pregunta a mentores |
| Directorios que toca | `server/`, `supabase/`, proyecto Vercel/Supabase, repo demo aparte | raíz (`package.json`, `.gitignore`, `LICENSE`), `mcp-server/`, `bob/`, `.bob/` (local) |

**Disponibilidad:** Eswin estudia el sábado en la mañana y tiene exámenes en la tarde, así que su trabajo se concentra **esta noche** y **desde las 18:00 del sábado**. Christian trabaja esta noche y cubre todo el sábado de día. *(Supuesto: Eswin vuelve a estar disponible a las 18:00; si es más tarde, correr el bloque de E2E en la misma medida.)*

**Arrancan los dos YA y en paralelo:** la Task 1 (Christian) prueba contra PGlite y la Task 4 (Eswin) contra un `fetch` falso. **Ninguna de las dos necesita cuentas, deploy ni el trabajo del otro.**

Como los directorios no se cruzan, **no hay conflictos de merge** entre ustedes (irónicamente, el problema que resuelve el producto).

### Flujo de git

- `main` es lo que se entrega y `develop` es la integración.
- Cada task va en una rama `feat/<task>` que sale de `develop`, se abre un PR hacia `develop` y se hace merge apenas pasan los tests (no esperen review largo, basta un vistazo del otro).
- El domingo a las 07:30 se hace merge de `develop` en `main` y se congela.

### Cronograma (hora Guatemala)

| Bloque | Christian | Eswin | Sync |
|---|---|---|---|
| **Vie→Sáb ~01:00–03:30 (AHORA)** | Task 1: migración Postgres + store (tests con PGlite) → PR. Si sobra: crear cuentas de Vercel y Supabase | Task 0 (scaffolding, 15 min) → merge a `develop`. Task 4 (MCP libs con tests) → PR. Preguntar a mentores en Discord (Task 9B Step 1) | 03:30: cada quien hace merge de su PR a `develop` |
| **Sáb 08:00–12:30** | Instalar Bob v2.0.2+. Task 2 (API + entrypoint de Vercel), Task 3 (Supabase + deploy en Vercel) → **dejarle a Eswin URL + token por DM** | 📚 Estudio | |
| **Sáb 12:30–13:30** | Almuerzo | 📝 Exámenes | |
| **Sáb 13:30–18:00** | Task 6 (dashboard) + `vercel --prod`. Repo demo `teamcontext-demo` (Task 7 Step 4). Si sobra: cover + esqueleto de slides | 📝 Exámenes | 18:00: sync corto (15 min) |
| **Sáb 18:00–20:00** | Apoyo: arreglar lo que salga del server. Task 10 si todo va bien | Task 5 (MCP index + conexión en Bob, contra Vercel), Task 7 (custom mode, verificación, `/init`) | 20:00: demo interno |
| **Sáb 20:00–22:30** | Task 8: E2E en 2 máquinas + grabar antes/después | Task 8 | 22:30: "MVP congelado" |
| **Sáb 22:30–01:00** | Task 9A: editar video, README | Task 9B: statements (con Bob), DATA_SOURCES, slides | |
| **Dom 06:30–08:30** | Revisar el video, deploy final, `/health`, merge a `main` | Subir todo al form de lablab, revisar `bob_sessions/` | **08:30 enviado** |

**Plan B si esta noche Eswin no alcanza a hacer la Task 4:** Eswin hace solo la Task 0 y la pregunta a mentores. Christian toma la Task 4 el sábado de 12:30 a 14:00 (ya trae el código completo) y la Task 6 se corre a después.

**Regla de corte:** si a las **22:30 del sábado** el E2E no pasa, se deja la Task 10 y todo lo "nice-to-have" y se graba con lo que funcione.

### Presupuesto de Bobcoins (40 c/u)

| Christian | ~coins | Eswin | ~coins |
|---|---|---|---|
| Task 1 (Plan + Code) | 6 | Task 4 (Plan + Code) | 7 |
| Task 2 | 6 | Task 5 | 5 |
| Task 6 | 6 | Task 7 (mode + `/init` AGENTS.md) | 6 |
| Task 8 (demo real con custom mode) | 8 | Task 8 (demo real) | 8 |
| Task 10 stretch | 5 | Task 9B statements (document understanding) | 4 |
| **Reserva** | 9 | **Reserva** | 10 |

Cómo usar Bob en cada task: abrir Bob en **Plan mode** con "Implementa la Task N de `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md`. Sigue los pasos TDD exactamente.", revisar el plan, pasar a **Code mode**, verificar que los tests pasen y **tomar el screenshot del resumen de la tarea en ese momento**.

---

## Mapa de archivos

```
TeamContextRepo/
├── package.json                 # [T0] raíz: solo script "test" que corre ambos paquetes
├── .gitignore / .bobignore      # [T0]
├── LICENSE                      # [T0] MIT
├── DATA_SOURCES.md              # [T0]
├── bob_sessions/.gitkeep        # [T0]
├── supabase/
│   └── migrations/20260926000000_teamcontext.sql  # [T1] schema `teamcontext` + función atómica acquire()
├── server/                      # ← Root Directory del proyecto en Vercel
│   ├── package.json             # [T1] "type":"module", express 5, pg, cors, dotenv; dev: @electric-sql/pglite
│   ├── .env.example             # [T1]
│   ├── server.js                # [T2] entrypoint de Vercel: `export default app` (+ listen local)
│   ├── lib/
│   │   ├── db.js                # [T1] createPool(url): Pool de pg hacia Supabase
│   │   ├── store.js             # [T1] createStore(): TODA la lógica de locks/actividad (sin HTTP)
│   │   ├── auth.js              # [T2] requireToken(token)
│   │   ├── routes.js            # [T2] createApiRouter(store, auth): HTTP delgado sobre store
│   │   └── app.js               # [T2] createApp({store, token}): express + cors + errores
│   ├── public/                  # [T6] dashboard; Vercel lo sirve desde su CDN
│   │   ├── index.html
│   │   ├── view.js              # funciones puras de render (testeables)
│   │   └── app.js               # polling + DOM
│   └── test/
│       ├── helpers.js           # [T1] testDb(): PGlite en memoria + migración
│       ├── store.test.js        # [T1]
│       ├── api.test.js          # [T2]
│       └── dashboard-view.test.js # [T6]
├── mcp-server/
│   ├── package.json             # [T4]
│   ├── index.js                 # [T5] registra las 4 tools, stdio
│   ├── lib/paths.js             # [T4] normalizePath()
│   ├── lib/repo.js              # [T4] detectRepo(), repoNameFromRemote()
│   ├── lib/client.js            # [T4] createClient(): HTTP + timeout, nunca lanza
│   ├── lib/messages.js          # [T4] textos que ve Bob
│   └── test/*.test.js           # [T4]
└── bob/
    ├── custom_modes.yaml        # [T7] definición del modo TeamContext (fuente)
    ├── rules-teamcontext/01-coordination.md # [T7]
    └── mcp.example.json         # [T5] plantilla SIN secretos
```

**Por qué PGlite en los tests:** es Postgres real compilado a WASM y corre dentro de Node. Los tests ejecutan **la misma migración SQL** que va a Supabase, sin Docker y sin red. Tanto `pg.Pool` como `PGlite` exponen `query(sql, params) → { rows }`, así que `createStore(db)` recibe cualquiera de los dos sin cambios.

**Por qué una función SQL para `acquire`:** en Vercel puede haber varias instancias atendiendo requests a la vez. La función hace delete-expirados → insert (con `ON CONFLICT DO NOTHING`) → refresh o conflicto en **una sola transacción**, y el `UNIQUE (file_path, repo)` garantiza que dos agentes nunca obtengan el mismo lock.

**Por qué el schema `teamcontext` y no `public`:** la Data API de Supabase (PostgREST) solo expone `public`, así que la clave anon no puede ver ni tocar los locks. El único acceso es el del servidor, vía `POSTGRES_URL`.

---

### Task 0: Scaffolding del repo — **Eswin, AHORA** (sin Bob, 15 min)

**Files:**
- Create: `package.json`, `.gitignore`, `.bobignore`, `LICENSE`, `DATA_SOURCES.md`, `bob_sessions/.gitkeep`

**Interfaces:**
- Produces: script `npm test` en la raíz, y los ignores de secretos que el resto necesita.

- [ ] **Step 1: Crear la rama**

```bash
git checkout develop && git pull
git checkout -b feat/scaffolding
```

- [ ] **Step 2: Crear `package.json` (raíz)**

```json
{
  "name": "teamcontext",
  "private": true,
  "scripts": {
    "test": "npm --prefix server test && npm --prefix mcp-server test"
  }
}
```

- [ ] **Step 3: Crear `.gitignore` y `.bobignore`**

`.gitignore`:
```
node_modules/
.env
.env.local
.env*.local
.vercel/
.bob/mcp.json
.DS_Store
```

`.bobignore`:
```
.env
.env.local
.bob/mcp.json
.vercel/
node_modules/
```

- [ ] **Step 4: Crear `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Eswin Poroj, Christian Villegas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Crear `DATA_SOURCES.md` y `bob_sessions/.gitkeep`**

```markdown
# Data Sources

TeamContext uses **no external, personal, confidential, client or social-media data**.

| Data | Origin | Notes |
|---|---|---|
| Lock / activity records | Generated at runtime by our own tools, stored in our Supabase project | Synthetic developer IDs only (`alice`, `bob`, `eswin-demo`, `christian-demo`) |
| Demo repository (`teamcontext-demo`) | Written by the team for this hackathon | Tiny static site, MIT licensed, no third-party code |
| Handoff summaries | Written by IBM Bob during the demo | Describe edits to the demo repo only |

No public datasets were used.
```

```bash
mkdir -p bob_sessions && touch bob_sessions/.gitkeep
```

- [ ] **Step 6: Commit, push, merge y avisar a Christian**

```bash
git add package.json .gitignore .bobignore LICENSE DATA_SOURCES.md bob_sessions/.gitkeep
git commit -m "chore: scaffold repo (license, gitignore, data sources, bob_sessions)"
git push -u origin feat/scaffolding
gh pr create --base develop --fill && gh pr merge --merge
```

(Christian puede empezar la Task 1 **antes** de este merge: toca `server/` y `supabase/`, así que no hay conflicto.)

---

### Task 1: Migración Postgres + lógica de locks (`store`) — **Christian, AHORA** (Bob task01)

No necesita cuentas: los tests corren contra PGlite. Supabase se crea recién en la Task 3.

**Files:**
- Create: `supabase/migrations/20260926000000_teamcontext.sql`, `server/package.json`, `server/.env.example`, `server/lib/db.js`, `server/lib/store.js`, `server/test/helpers.js`
- Test: `server/test/store.test.js`

**Interfaces:**
- Produces:
  - Schema SQL `teamcontext` con las tablas `locks` y `activity` y la función `teamcontext.acquire(p_developer text, p_file text, p_repo text, p_ttl_minutes float8, p_now timestamptz) → jsonb { status, lock }`
  - `createPool(connectionString, caCert) → pg.Pool` (verifica TLS contra la CA de Supabase)
  - `testDb() → Promise<PGlite>` (solo tests)
  - `createStore(db, { ttlMinutes = 30, now = () => new Date() }) → store`, **todos los métodos async**:
    - `acquire({ developerId, filePath, repo }) → Promise<{ status: 'granted' | 'conflict', lock: LockRow }>`
    - `release({ developerId, filePath, repo, summary? }) → Promise<boolean>`
    - `releaseAll({ developerId, repo, summary? }) → Promise<number>`
    - `activeLocks(repo?) → Promise<LockRow[]>` (excluye los expirados, el más nuevo primero)
    - `activity(repo?, limit = 50) → Promise<ActivityRow[]>` (el más nuevo primero)
    - `deleteStale(olderThanMinutes) → Promise<number>`
  - `LockRow = { lock_id, developer_id, file_path, repo, acquired_at }` y `ActivityRow = { developer_id, repo, file_path, event, summary, created_at }`. Las fechas salen **siempre** como strings ISO con `Z` (`2026-09-26T10:00:00.000Z`).

- [ ] **Step 1: Crear el paquete e instalar dependencias**

```bash
git fetch && git checkout -b feat/server-store origin/develop
mkdir -p server/lib server/test supabase/migrations && cd server
npm init -y
npm pkg set type=module scripts.start="node server.js" scripts.test="node --test" engines.node=">=20"
npm install express@5 pg cors dotenv
npm install -D @electric-sql/pglite
cd ..
```

`server/.env.example`:
```
# Local dev: `vercel env pull .env.local` fills these in from the Vercel project
TEAM_TOKEN=changeme-long-random-string
POSTGRES_URL=postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
# PEM text of Supabase's root CA (public, not a secret) — Database settings → SSL → Download certificate
SUPABASE_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
LOCK_TTL_MINUTES=30
PORT=3000
```

- [ ] **Step 2: Escribir la migración — `supabase/migrations/20260926000000_teamcontext.sql`**

```sql
-- TeamContext schema. Lives outside `public` so the Supabase Data API never exposes it;
-- only the server (direct Postgres connection) can read or write.
create schema if not exists teamcontext;

create table if not exists teamcontext.locks (
  lock_id      uuid primary key default gen_random_uuid(),
  developer_id text not null,
  file_path    text not null,          -- normalized, repo-relative, forward slashes
  repo         text not null,
  acquired_at  timestamptz not null,
  unique (file_path, repo)
);

create table if not exists teamcontext.activity (
  id           bigint generated always as identity primary key,
  developer_id text not null,
  repo         text not null,
  file_path    text,                   -- null for task-level entries
  event        text not null check (event in ('lock', 'unlock', 'conflict', 'release_all')),
  summary      text,                   -- optional handoff note
  created_at   timestamptz not null
);

create index if not exists activity_repo_created_idx on teamcontext.activity (repo, created_at desc);

alter table teamcontext.locks enable row level security;
alter table teamcontext.activity enable row level security;

-- Atomic acquire: expire → try insert → refresh own lock or report conflict, in one transaction.
-- UNIQUE (file_path, repo) guarantees two agents can never both get the same lock.
create or replace function teamcontext.acquire(
  p_developer   text,
  p_file        text,
  p_repo        text,
  p_ttl_minutes double precision,
  p_now         timestamptz
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_lock teamcontext.locks;
begin
  delete from teamcontext.locks
   where file_path = p_file and repo = p_repo
     and acquired_at < p_now - p_ttl_minutes * interval '1 minute';

  insert into teamcontext.locks (developer_id, file_path, repo, acquired_at)
  values (p_developer, p_file, p_repo, p_now)
  on conflict (file_path, repo) do nothing
  returning * into v_lock;

  if found then
    insert into teamcontext.activity (developer_id, repo, file_path, event, created_at)
    values (p_developer, p_repo, p_file, 'lock', p_now);
    return jsonb_build_object('status', 'granted', 'lock', to_jsonb(v_lock));
  end if;

  select * into v_lock from teamcontext.locks
   where file_path = p_file and repo = p_repo
   for update;

  if v_lock.developer_id = p_developer then
    update teamcontext.locks set acquired_at = p_now
     where lock_id = v_lock.lock_id
    returning * into v_lock;
    return jsonb_build_object('status', 'granted', 'lock', to_jsonb(v_lock));
  end if;

  insert into teamcontext.activity (developer_id, repo, file_path, event, summary, created_at)
  values (p_developer, p_repo, p_file, 'conflict', 'blocked by ' || v_lock.developer_id, p_now);
  return jsonb_build_object('status', 'conflict', 'lock', to_jsonb(v_lock));
end;
$$;
```

- [ ] **Step 3: Helper de tests — `server/test/helpers.js`**

```js
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const MIGRATION = readFileSync(
  new URL('../../supabase/migrations/20260926000000_teamcontext.sql', import.meta.url),
  'utf8',
);

// Fresh in-memory Postgres with the real migration applied.
export async function testDb() {
  const db = new PGlite();
  await db.exec(MIGRATION);
  return db;
}
```

- [ ] **Step 4: Escribir los tests que fallan — `server/test/store.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './helpers.js';
import { createStore } from '../lib/store.js';

async function setup(t, ttlMinutes = 30) {
  let current = new Date('2026-09-26T10:00:00.000Z');
  const clock = {
    now: () => current,
    advance: (minutes) => { current = new Date(current.getTime() + minutes * 60_000); },
  };
  const db = await testDb();
  t.after(() => db.close());
  return { store: createStore(db, { ttlMinutes, now: clock.now }), clock };
}

const A = { developerId: 'alice', filePath: 'src/header.js', repo: 'demo-repo' };
const B = { ...A, developerId: 'bob' };

test('grants a free file', async (t) => {
  const { store } = await setup(t);
  const r = await store.acquire(A);
  assert.equal(r.status, 'granted');
  assert.equal(r.lock.developer_id, 'alice');
  assert.equal(r.lock.acquired_at, '2026-09-26T10:00:00.000Z');
  assert.equal((await store.activeLocks('demo-repo')).length, 1);
  assert.equal((await store.activity('demo-repo'))[0].event, 'lock');
});

test('re-acquiring your own lock is idempotent and refreshes acquired_at', async (t) => {
  const { store, clock } = await setup(t);
  const first = await store.acquire(A);
  clock.advance(5);
  const second = await store.acquire(A);
  assert.equal(second.status, 'granted');
  assert.equal(second.lock.lock_id, first.lock.lock_id);
  assert.equal(second.lock.acquired_at, '2026-09-26T10:05:00.000Z');
  assert.equal((await store.activeLocks('demo-repo')).length, 1);
});

test('another developer gets a conflict, and the conflict is logged', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  const r = await store.acquire(B);
  assert.equal(r.status, 'conflict');
  assert.equal(r.lock.developer_id, 'alice');
  const [latest] = await store.activity('demo-repo');
  assert.equal(latest.event, 'conflict');
  assert.equal(latest.developer_id, 'bob');
  assert.equal(latest.file_path, 'src/header.js');
});

test('expired locks do not block and are hidden from activeLocks', async (t) => {
  const { store, clock } = await setup(t, 30);
  await store.acquire(A);
  clock.advance(31);
  assert.equal((await store.activeLocks('demo-repo')).length, 0);
  const r = await store.acquire(B);
  assert.equal(r.status, 'granted');
  assert.equal(r.lock.developer_id, 'bob');
});

test('release only works for the holder and records the handoff summary', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  assert.equal(await store.release({ ...B, summary: 'nope' }), false);
  assert.equal(await store.release({ ...A, summary: 'Added dark mode toggle' }), true);
  assert.equal((await store.activeLocks('demo-repo')).length, 0);
  const [latest] = await store.activity('demo-repo');
  assert.equal(latest.event, 'unlock');
  assert.equal(latest.summary, 'Added dark mode toggle');
});

test('releaseAll frees every lock of that developer in that repo only', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  await store.acquire({ ...A, filePath: 'src/footer.js' });
  await store.acquire({ ...A, repo: 'other-repo' });
  await store.acquire({ ...B, filePath: 'src/api.js' });
  assert.equal(await store.releaseAll({ developerId: 'alice', repo: 'demo-repo', summary: 'Header done' }), 2);
  assert.deepEqual((await store.activeLocks('demo-repo')).map((l) => l.developer_id), ['bob']);
  assert.equal((await store.activeLocks('other-repo')).length, 1);
  const [latest] = await store.activity('demo-repo');
  assert.equal(latest.event, 'release_all');
  assert.equal(latest.file_path, null);
  assert.equal(latest.summary, 'Header done');
});

test('activity is newest first and respects limit', async (t) => {
  const { store, clock } = await setup(t);
  await store.acquire(A);
  clock.advance(1);
  await store.release(A);
  clock.advance(1);
  await store.acquire(B);
  const events = await store.activity('demo-repo', 2);
  assert.deepEqual(events.map((e) => e.event), ['lock', 'unlock']);
  assert.equal(events[0].developer_id, 'bob');
  assert.equal(events[0].created_at, '2026-09-26T10:02:00.000Z');
});

test('activeLocks without repo returns every repo', async (t) => {
  const { store } = await setup(t);
  await store.acquire(A);
  await store.acquire({ ...B, repo: 'other-repo' });
  assert.equal((await store.activeLocks()).length, 2);
});

test('deleteStale removes locks older than N minutes (0 clears everything)', async (t) => {
  const { store, clock } = await setup(t, 120);
  await store.acquire(A);
  clock.advance(61);
  await store.acquire({ ...B, filePath: 'src/api.js' });
  assert.equal(await store.deleteStale(60), 1);
  assert.deepEqual((await store.activeLocks('demo-repo')).map((l) => l.developer_id), ['bob']);
  assert.equal(await store.deleteStale(0), 1);
});
```

- [ ] **Step 5: Correr los tests y verificar que fallan**

Run: `cd server && npm test`
Expected: FAIL con `Cannot find module '.../server/lib/store.js'`

- [ ] **Step 6: Implementar `server/lib/db.js`**

```js
import pg from 'pg';

// Supabase pooler (port 6543, transaction mode) is the right choice for serverless.
// Supabase signs its server certs with its own root CA, so we verify against that CA
// (SUPABASE_CA_CERT, PEM text) instead of disabling verification. The URL's `sslmode`
// would override our ssl options in node-pg, so we drop it.
export function createPool(connectionString, caCert) {
  if (!connectionString) throw new Error('POSTGRES_URL is required');
  if (!caCert) throw new Error('SUPABASE_CA_CERT is required (Supabase → Database settings → SSL → Download certificate)');
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  return new pg.Pool({ connectionString: url.toString(), ssl: { ca: caCert, rejectUnauthorized: true }, max: 3 });
}
```

- [ ] **Step 7: Implementar `server/lib/store.js`**

```js
// `db` is anything with query(sql, params) → { rows }: a pg.Pool in production, PGlite in tests.
const toIso = (value) => (value == null ? null : new Date(value).toISOString());

const lockRow = (l) => ({
  lock_id: l.lock_id,
  developer_id: l.developer_id,
  file_path: l.file_path,
  repo: l.repo,
  acquired_at: toIso(l.acquired_at),
});

const activityRow = (e) => ({
  developer_id: e.developer_id,
  repo: e.repo,
  file_path: e.file_path,
  event: e.event,
  summary: e.summary,
  created_at: toIso(e.created_at),
});

export function createStore(db, { ttlMinutes = 30, now = () => new Date() } = {}) {
  async function acquire({ developerId, filePath, repo }) {
    const { rows } = await db.query('SELECT teamcontext.acquire($1, $2, $3, $4, $5) AS result', [
      developerId, filePath, repo, ttlMinutes, now(),
    ]);
    const { status, lock } = rows[0].result;
    return { status, lock: lockRow(lock) };
  }

  async function release({ developerId, filePath, repo, summary }) {
    const { rows } = await db.query(
      `WITH d AS (
         DELETE FROM teamcontext.locks WHERE developer_id = $1 AND file_path = $2 AND repo = $3 RETURNING 1
       )
       INSERT INTO teamcontext.activity (developer_id, repo, file_path, event, summary, created_at)
       SELECT $1, $3, $2, 'unlock', $4::text, $5::timestamptz WHERE EXISTS (SELECT 1 FROM d)
       RETURNING id`,
      [developerId, filePath, repo, summary ?? null, now()],
    );
    return rows.length > 0;
  }

  async function releaseAll({ developerId, repo, summary }) {
    const { rows } = await db.query(
      `WITH d AS (
         DELETE FROM teamcontext.locks WHERE developer_id = $1 AND repo = $2 RETURNING 1
       ), logged AS (
         INSERT INTO teamcontext.activity (developer_id, repo, event, summary, created_at)
         VALUES ($1, $2, 'release_all', $3::text, $4::timestamptz)
       )
       SELECT count(*)::int AS count FROM d`,
      [developerId, repo, summary ?? null, now()],
    );
    return rows[0].count;
  }

  async function activeLocks(repo) {
    const { rows } = await db.query(
      `SELECT lock_id, developer_id, file_path, repo, acquired_at FROM teamcontext.locks
       WHERE acquired_at >= $1::timestamptz - $2::float8 * interval '1 minute'
         AND ($3::text IS NULL OR repo = $3::text)
       ORDER BY acquired_at DESC`,
      [now(), ttlMinutes, repo ?? null],
    );
    return rows.map(lockRow);
  }

  async function activity(repo, limit = 50) {
    const { rows } = await db.query(
      `SELECT developer_id, repo, file_path, event, summary, created_at FROM teamcontext.activity
       WHERE ($1::text IS NULL OR repo = $1::text)
       ORDER BY created_at DESC, id DESC
       LIMIT $2::int`,
      [repo ?? null, limit],
    );
    return rows.map(activityRow);
  }

  async function deleteStale(olderThanMinutes) {
    const { rows } = await db.query(
      `DELETE FROM teamcontext.locks
       WHERE acquired_at <= $1::timestamptz - $2::float8 * interval '1 minute'
       RETURNING 1`,
      [now(), olderThanMinutes],
    );
    return rows.length;
  }

  return { acquire, release, releaseAll, activeLocks, activity, deleteStale };
}
```

- [ ] **Step 8: Correr los tests y verificar que pasan**

Run: `cd server && npm test`
Expected: PASS, `# pass 10`, `# fail 0` (9 tests + `helpers.js`, que `node --test` también cuenta por estar en `test/`)

Si PGlite falla al pasar un `Date` como parámetro, cambiar `now()` por `now().toISOString()` en las 6 llamadas (el SQL ya castea con `::timestamptz`).

- [ ] **Step 9: Screenshot + commit + PR**

Guardar `bob_sessions/teamcontext_task01_server_store.png`.

```bash
git add supabase server/package.json server/package-lock.json server/.env.example server/lib/db.js server/lib/store.js server/test/helpers.js server/test/store.test.js bob_sessions/teamcontext_task01_server_store.png
git commit -m "feat(server): postgres schema, atomic acquire function and lock store"
git push -u origin feat/server-store
gh pr create --base develop --title "Server: Postgres schema + store" --fill
```

---

### Task 2: API HTTP (auth, rutas, app, entrypoint de Vercel) — **Christian** (Bob task02)

**Files:**
- Create: `server/lib/auth.js`, `server/lib/routes.js`, `server/lib/app.js`, `server/server.js`
- Test: `server/test/api.test.js`

**Interfaces:**
- Consumes: `createStore`, `testDb`, `createPool` (Task 1)
- Produces:
  - `requireToken(token) → express middleware` (401 `{ error: 'unauthorized' }`)
  - `createApiRouter(store, auth) → express.Router`, montado en `/api`
  - `createApp({ store, token }) → express app`
  - `server/server.js` hace `export default app`, que es lo que Vercel detecta.
  - Contrato HTTP exacto de la sección 5 del contexto. **Este contrato es la interfaz con el MCP server de Eswin (Task 4).**

- [ ] **Step 1: Escribir los tests que fallan — `server/test/api.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { testDb } from './helpers.js';
import { createStore } from '../lib/store.js';
import { createApp } from '../lib/app.js';

const TOKEN = 'test-token';

async function start(t) {
  const db = await testDb();
  const server = createApp({ store: createStore(db), token: TOKEN }).listen(0);
  await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); server.close(); await db.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (method, path, body, { auth = true } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(auth ? { authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  };
}

const lock = { developer_id: 'alice', file_path: 'src/header.js', repo: 'demo-repo' };

test('GET /health is public', async (t) => {
  const call = await start(t);
  assert.deepEqual(await call('GET', '/health', null, { auth: false }), { status: 200, body: { ok: true } });
});

test('write endpoints reject missing or wrong token', async (t) => {
  const call = await start(t);
  assert.equal((await call('POST', '/api/locks/acquire', lock, { auth: false })).status, 401);
  assert.equal((await call('POST', '/api/locks/release_all', { developer_id: 'a', repo: 'r' }, { auth: false })).status, 401);
  assert.equal((await call('DELETE', '/api/locks/stale', { older_than_minutes: 1 }, { auth: false })).status, 401);
});

test('acquire validates required fields', async (t) => {
  const call = await start(t);
  const r = await call('POST', '/api/locks/acquire', { developer_id: 'alice' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /file_path/);
});

test('acquire → granted, then 409 conflict for another developer', async (t) => {
  const call = await start(t);
  const granted = await call('POST', '/api/locks/acquire', lock);
  assert.equal(granted.status, 200);
  assert.equal(granted.body.status, 'granted');
  assert.equal(granted.body.developer_id, 'alice');
  assert.equal(granted.body.file_path, 'src/header.js');
  assert.ok(granted.body.lock_id);

  const again = await call('POST', '/api/locks/acquire', lock);
  assert.equal(again.status, 200, 'same developer is idempotent');

  const conflict = await call('POST', '/api/locks/acquire', { ...lock, developer_id: 'bob' });
  assert.equal(conflict.status, 409);
  assert.deepEqual(Object.keys(conflict.body).sort(), ['acquired_at', 'conflict_with', 'file_path', 'status']);
  assert.equal(conflict.body.conflict_with, 'alice');
});

test('status and activity are public and filter by repo', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  await call('POST', '/api/locks/acquire', { ...lock, repo: 'other' });

  const status = await call('GET', '/api/locks/status?repo=demo-repo', null, { auth: false });
  assert.equal(status.status, 200);
  assert.equal(status.body.count, 1);
  assert.equal(status.body.active_locks[0].file_path, 'src/header.js');

  const activity = await call('GET', '/api/activity?repo=demo-repo&limit=5', null, { auth: false });
  assert.equal(activity.status, 200);
  assert.equal(activity.body.events.length, 1);
  assert.equal(activity.body.events[0].event, 'lock');
});

test('release returns 200 with summary logged, 404 when not held', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  const notMine = await call('POST', '/api/locks/release', { ...lock, developer_id: 'bob' });
  assert.deepEqual(notMine, { status: 404, body: { status: 'not_found' } });

  const released = await call('POST', '/api/locks/release', { ...lock, summary: 'Added toggle' });
  assert.deepEqual(released, { status: 200, body: { status: 'released', file_path: 'src/header.js' } });

  const activity = await call('GET', '/api/activity?repo=demo-repo', null, { auth: false });
  assert.equal(activity.body.events[0].summary, 'Added toggle');
});

test('release_all returns count', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  await call('POST', '/api/locks/acquire', { ...lock, file_path: 'src/footer.js' });
  const r = await call('POST', '/api/locks/release_all', { developer_id: 'alice', repo: 'demo-repo', summary: 'done' });
  assert.deepEqual(r, { status: 200, body: { status: 'released', count: 2 } });
});

test('DELETE /api/locks/stale validates and returns deleted count', async (t) => {
  const call = await start(t);
  await call('POST', '/api/locks/acquire', lock);
  assert.equal((await call('DELETE', '/api/locks/stale', { older_than_minutes: 'x' })).status, 400);
  assert.deepEqual(await call('DELETE', '/api/locks/stale', { older_than_minutes: 0 }), { status: 200, body: { deleted: 1 } });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `cd server && npm test`
Expected: FAIL con `Cannot find module '.../server/lib/app.js'` (los tests de store siguen pasando)

- [ ] **Step 3: Implementar `server/lib/auth.js`**

```js
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
```

- [ ] **Step 4: Implementar `server/lib/routes.js`**

Express 5 manda automáticamente al error handler cualquier promesa rechazada en un handler async, así que no hace falta `try/catch` en cada ruta.

```js
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
    const active_locks = await store.activeLocks(repoOf(req.query));
    res.json({ active_locks, count: active_locks.length });
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

  return router;
}
```

- [ ] **Step 5: Implementar `server/lib/app.js` y `server/server.js`**

`server/lib/app.js`:
```js
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
```

`server/server.js` (Vercel busca `server.js`, importa el framework y usa el `export default`):
```js
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
```

- [ ] **Step 6: Correr los tests y verificar que pasan**

Run: `cd server && npm test`
Expected: PASS, `# pass 18`, `# fail 0`

- [ ] **Step 7: Screenshot + commit + PR**

Guardar `bob_sessions/teamcontext_task02_server_api.png`.

```bash
git add server/lib/auth.js server/lib/routes.js server/lib/app.js server/server.js server/test/api.test.js bob_sessions/teamcontext_task02_server_api.png
git commit -m "feat(server): REST API for locks, activity and stale cleanup, Vercel entrypoint"
git push && gh pr create --base develop --title "Server: API + Vercel entrypoint" --fill
```

---

### Task 3: Supabase + deploy en Vercel — **Christian** (sin Bob, 30–45 min)

**Files:** ninguno nuevo.

**Interfaces:**
- Produces: `CENTRAL_SERVER_URL` público (p. ej. `https://teamcontext.vercel.app`) y `TEAM_TOKEN`. **Dejárselos a Eswin por DM, nunca en el repo.**

- [ ] **Step 1: Crear y enlazar el proyecto de Vercel (Root Directory = `server/`)**

```bash
npm i -g vercel@latest
vercel login
cd server
vercel link            # crear proyecto nuevo "teamcontext"
vercel project inspect --non-interactive   # confirmar owner/proyecto correctos
```

En el dashboard de Vercel → Project → Settings → Build & Deployment, confirmar **Framework Preset: Express** y **Root Directory: `server`** (esto último importa si se conecta el repo de GitHub).

- [ ] **Step 2: Crear Supabase desde el Marketplace de Vercel**

Vercel → Project → **Storage** → Create Database → **Supabase** → región `iad1`/us-east (cerca de las functions) → Connect to project (Production + Preview + Development). Esto inyecta `POSTGRES_URL` (pooler, puerto 6543) y demás variables automáticamente.

Alternativa si el Marketplace da problemas: crear el proyecto en supabase.com → Connect → **Transaction pooler** → copiar la URI y `vercel env add POSTGRES_URL production`.

- [ ] **Step 3: Aplicar la migración**

Supabase dashboard → **SQL Editor** → pegar el contenido de `supabase/migrations/20260926000000_teamcontext.sql` → Run. Verificar:

```sql
select teamcontext.acquire('smoke', 'x.js', 'smoke-repo', 30, now());
-- → {"status": "granted", "lock": {...}}
delete from teamcontext.locks where repo = 'smoke-repo';
delete from teamcontext.activity where repo = 'smoke-repo';
```

- [ ] **Step 4: Variables de entorno**

```bash
openssl rand -hex 24            # → este es el TEAM_TOKEN
vercel env add TEAM_TOKEN production
vercel env add TEAM_TOKEN development
vercel env add LOCK_TTL_MINUTES production   # 30
# CA raíz de Supabase (pública): Supabase → Project Settings → Database → SSL Configuration → Download certificate
vercel env add SUPABASE_CA_CERT production < prod-ca-2021.crt
vercel env add SUPABASE_CA_CERT development < prod-ca-2021.crt
vercel env pull .env.local      # para correr local contra Supabase
```

- [ ] **Step 5: Probar local contra Supabase, luego deploy**

```bash
npm start &                     # usa .env.local
curl -s localhost:3000/health
kill %1
vercel --prod
```

- [ ] **Step 6: Verificar desde fuera**

```bash
export URL=https://<tu-proyecto>.vercel.app
curl -s $URL/health                                    # {"ok":true}
curl -s "$URL/api/locks/status"                        # {"active_locks":[],"count":0}
curl -s -o /dev/null -w '%{http_code}\n' -XPOST $URL/api/locks/acquire -H 'content-type: application/json' -d '{}'   # 401
curl -s -XPOST $URL/api/locks/acquire -H 'content-type: application/json' -H "authorization: Bearer $TEAM_TOKEN" \
  -d '{"developer_id":"smoke","file_path":"a.js","repo":"smoke-repo"}'                                             # granted
curl -s -XDELETE $URL/api/locks/stale -H 'content-type: application/json' -H "authorization: Bearer $TEAM_TOKEN" \
  -d '{"older_than_minutes":0}'                                                                                    # {"deleted":1}
```

Si falla: `vercel logs <deployment-url>`. Hay dos errores típicos:
- `self-signed certificate in certificate chain`: falta `SUPABASE_CA_CERT` o no es el PEM completo. **No** desactivar la verificación TLS.
- `TEAM_TOKEN is required`: falta la variable en ese entorno.

Si el dominio de producción pide login de Vercel, desactivar Deployment Protection **solo en Production** (las previews pueden quedar protegidas).

---

### Task 4: Librerías del MCP server (paths, repo, client, messages) — **Eswin** (Bob task20)

Se hace **en paralelo** con las Tasks 1 y 2. No necesita el servidor corriendo, porque el cliente se testea con un `fetch` falso.

**Files:**
- Create: `mcp-server/package.json`, `mcp-server/lib/paths.js`, `mcp-server/lib/repo.js`, `mcp-server/lib/client.js`, `mcp-server/lib/messages.js`
- Test: `mcp-server/test/paths.test.js`, `mcp-server/test/repo.test.js`, `mcp-server/test/client.test.js`, `mcp-server/test/messages.test.js`

**Interfaces:**
- Consumes: el contrato HTTP de la Task 2 (sección 5 del contexto)
- Produces:
  - `normalizePath(filePath: string, repoRoot?: string) → string`
  - `repoNameFromRemote(url: string) → string | null`
  - `detectRepo(cwd: string) → { root: string, name: string }`
  - `createClient({ baseUrl, token, developerId, repo, timeoutMs = 10000, fetchImpl = fetch })`, que devuelve `{ acquire(filePath), release(filePath, summary?), releaseAll(summary?), status(), activity(limit = 10) }`. **Cada método devuelve `Promise<{ ok, status, data?, error? }>` y nunca lanza** (`status: 0` indica error de red o timeout).
  - `lockMessage(res, filePath)`, `unlockMessage(res, filePath)`, `releaseAllMessage(res)` y `teamStatusMessage(statusRes, activityRes, me)`, todas devuelven `string`

- [ ] **Step 1: Crear el paquete**

```bash
git checkout develop && git pull && git checkout -b feat/mcp-server
mkdir -p mcp-server/lib mcp-server/test && cd mcp-server
npm init -y
npm pkg set type=module bin.teamcontext-mcp="index.js" scripts.test="node --test" engines.node=">=20"
npm install @modelcontextprotocol/sdk@^1 zod@^3
cd ..
```

- [ ] **Step 2: Escribir los tests que fallan**

`mcp-server/test/paths.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath } from '../lib/paths.js';

test('strips leading ./', () => assert.equal(normalizePath('./src/A.ts'), 'src/A.ts'));
test('converts backslashes', () => assert.equal(normalizePath('src\\A.ts'), 'src/A.ts'));
test('resolves ..', () => assert.equal(normalizePath('src/utils/../A.ts'), 'src/A.ts'));
test('trims whitespace', () => assert.equal(normalizePath('  src/A.ts '), 'src/A.ts'));
test('makes posix absolute paths repo-relative', () =>
  assert.equal(normalizePath('/home/dev/demo/src/A.ts', '/home/dev/demo'), 'src/A.ts'));
test('makes windows absolute paths repo-relative', () =>
  assert.equal(normalizePath('C:\\dev\\demo\\src\\A.ts', 'C:\\dev\\demo'), 'src/A.ts'));
test('./src/A.ts and src\\A.ts map to the same key', () =>
  assert.equal(normalizePath('./src/A.ts'), normalizePath('src\\A.ts')));
```

`mcp-server/test/repo.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoNameFromRemote, detectRepo } from '../lib/repo.js';

test('parses https remotes', () =>
  assert.equal(repoNameFromRemote('https://github.com/acme/demo-repo.git'), 'demo-repo'));
test('parses ssh remotes', () =>
  assert.equal(repoNameFromRemote('git@github.com:acme/demo-repo.git'), 'demo-repo'));
test('parses remotes without .git and with trailing slash', () =>
  assert.equal(repoNameFromRemote('https://github.com/acme/demo-repo/'), 'demo-repo'));

test('detectRepo uses the origin remote and the git toplevel', () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'tc-')));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['remote', 'add', 'origin', 'git@github.com:acme/demo-repo.git'], { cwd: dir });
  execFileSync('mkdir', ['-p', 'src'], { cwd: dir });
  assert.deepEqual(detectRepo(path.join(dir, 'src')), { root: dir, name: 'demo-repo' });
});

test('detectRepo falls back to the folder name outside git', () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'tc-plain-')));
  assert.deepEqual(detectRepo(dir), { root: dir, name: path.basename(dir) });
});
```

`mcp-server/test/client.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../lib/client.js';

function fakeFetch(...responses) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body && JSON.parse(init.body) });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return { ok: next.status < 400, status: next.status, json: async () => next.body };
  };
  fn.calls = calls;
  return fn;
}

const base = { baseUrl: 'https://tc.example/', token: 'tok', developerId: 'alice', repo: 'demo-repo' };

test('acquire posts developer, repo and bearer token', async () => {
  const fetchImpl = fakeFetch({ status: 200, body: { status: 'granted' } });
  const client = createClient({ ...base, fetchImpl });
  const res = await client.acquire('src/header.js');
  assert.deepEqual(res, { ok: true, status: 200, data: { status: 'granted' } });
  const [call] = fetchImpl.calls;
  assert.equal(call.url, 'https://tc.example/api/locks/acquire');
  assert.equal(call.method, 'POST');
  assert.equal(call.headers.authorization, 'Bearer tok');
  assert.deepEqual(call.body, { developer_id: 'alice', file_path: 'src/header.js', repo: 'demo-repo' });
});

test('release sends the summary; status and activity use repo query', async () => {
  const fetchImpl = fakeFetch({ status: 200, body: {} }, { status: 200, body: {} }, { status: 200, body: {} });
  const client = createClient({ ...base, fetchImpl });
  await client.release('src/header.js', 'Added toggle');
  await client.status();
  await client.activity(5);
  assert.equal(fetchImpl.calls[0].body.summary, 'Added toggle');
  assert.equal(fetchImpl.calls[1].url, 'https://tc.example/api/locks/status?repo=demo-repo');
  assert.equal(fetchImpl.calls[2].url, 'https://tc.example/api/activity?repo=demo-repo&limit=5');
});

test('conflict (409) is returned, not thrown', async () => {
  const client = createClient({ ...base, fetchImpl: fakeFetch({ status: 409, body: { conflict_with: 'bob' } }) });
  const res = await client.acquire('src/header.js');
  assert.equal(res.ok, false);
  assert.equal(res.status, 409);
  assert.equal(res.data.conflict_with, 'bob');
});

test('network errors never throw', async () => {
  const client = createClient({ ...base, fetchImpl: fakeFetch(new Error('ECONNREFUSED')) });
  assert.deepEqual(await client.releaseAll('x'), { ok: false, status: 0, error: 'ECONNREFUSED' });
});

test('slow server times out with a clear error', async () => {
  const hang = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  const client = createClient({ ...base, timeoutMs: 20, fetchImpl: hang });
  assert.deepEqual(await client.status(), { ok: false, status: 0, error: 'timeout after 20ms' });
});
```

`mcp-server/test/messages.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lockMessage, unlockMessage, releaseAllMessage, teamStatusMessage } from '../lib/messages.js';

const down = { ok: false, status: 0, error: 'timeout after 10000ms' };

test('lock granted', () =>
  assert.equal(lockMessage({ ok: true, status: 200, data: {} }, 'src/a.js'), '✅ Lock granted for src/a.js'));

test('lock conflict tells Bob not to edit', () =>
  assert.equal(
    lockMessage({ ok: false, status: 409, data: { conflict_with: 'bob', acquired_at: '2026-09-26T10:00:00.000Z' } }, 'src/a.js'),
    '⚠️ CONFLICT: bob has been editing src/a.js since 2026-09-26T10:00:00.000Z. Do not edit this file.',
  ));

test('server down is a warning, not a crash', () =>
  assert.match(lockMessage(down, 'src/a.js'), /^⚠️ TeamContext server unreachable \(timeout after 10000ms\)/));

test('bad token is explicit', () =>
  assert.match(lockMessage({ ok: false, status: 401, data: {} }, 'src/a.js'), /TEAM_TOKEN rejected/));

test('unlock', () => {
  assert.equal(unlockMessage({ ok: true, status: 200, data: {} }, 'src/a.js'), '🔓 Lock released for src/a.js');
  assert.equal(unlockMessage({ ok: false, status: 404, data: {} }, 'src/a.js'), '⚠️ No active lock found for src/a.js');
});

test('release all', () =>
  assert.equal(releaseAllMessage({ ok: true, status: 200, data: { count: 3 } }), '🔓 Released 3 locks'));

test('team status lists locks and activity, marking your own', () => {
  const status = { ok: true, status: 200, data: { active_locks: [
    { developer_id: 'alice', file_path: 'src/a.js', acquired_at: 'T1' },
    { developer_id: 'bob', file_path: 'src/b.js', acquired_at: 'T2' },
  ] } };
  const activity = { ok: true, status: 200, data: { events: [
    { developer_id: 'bob', event: 'unlock', file_path: 'src/c.js', summary: 'Fixed footer', created_at: 'T0' },
  ] } };
  const text = teamStatusMessage(status, activity, 'alice');
  assert.match(text, /- src\/a\.js — YOU since T1/);
  assert.match(text, /- src\/b\.js — bob since T2/);
  assert.match(text, /bob unlock src\/c\.js — "Fixed footer"/);
});

test('team status when nobody is working', () =>
  assert.match(
    teamStatusMessage({ ok: true, status: 200, data: { active_locks: [] } }, { ok: true, status: 200, data: { events: [] } }, 'alice'),
    /Active locks: none — all clear\./,
  ));
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `cd mcp-server && npm test`
Expected: FAIL con `Cannot find module '.../mcp-server/lib/paths.js'` (y equivalentes)

- [ ] **Step 4: Implementar `mcp-server/lib/paths.js`**

```js
import path from 'node:path';

const isAbsolute = (p) => p.startsWith('/') || /^[A-Za-z]:\//.test(p);

// Canonical lock key: repo-relative, forward slashes, no leading "./", ".." resolved.
export function normalizePath(filePath, repoRoot) {
  let p = String(filePath).trim().replace(/\\/g, '/');
  if (repoRoot && isAbsolute(p)) {
    p = path.posix.relative(repoRoot.replace(/\\/g, '/'), p);
  }
  p = path.posix.normalize(p).replace(/^(\.\/)+/, '');
  return p === '.' ? '' : p;
}
```

- [ ] **Step 5: Implementar `mcp-server/lib/repo.js`**

```js
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export function repoNameFromRemote(url) {
  const cleaned = url.trim().replace(/\/+$/, '').replace(/\.git$/, '');
  return cleaned.split(/[/:]/).pop() || null;
}

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function detectRepo(cwd) {
  const root = git(['rev-parse', '--show-toplevel'], cwd) ?? cwd;
  const remote = git(['remote', 'get-url', 'origin'], root);
  const name = (remote && repoNameFromRemote(remote)) || path.basename(root);
  return { root, name };
}
```

- [ ] **Step 6: Implementar `mcp-server/lib/client.js`**

```js
// Thin HTTP client for the central server. Never throws: callers always get { ok, status, data?, error? }.
export function createClient({ baseUrl, token, developerId, repo, timeoutMs = 10_000, fetchImpl = fetch }) {
  const base = baseUrl.replace(/\/+$/, '');
  const repoQuery = `?repo=${encodeURIComponent(repo)}`;

  async function call(method, path, body) {
    try {
      const res = await fetchImpl(base + path, {
        method,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      const error = err?.name === 'TimeoutError' ? `timeout after ${timeoutMs}ms` : err.message;
      return { ok: false, status: 0, error };
    }
  }

  return {
    acquire: (filePath) =>
      call('POST', '/api/locks/acquire', { developer_id: developerId, file_path: filePath, repo }),
    release: (filePath, summary) =>
      call('POST', '/api/locks/release', { developer_id: developerId, file_path: filePath, repo, summary }),
    releaseAll: (summary) =>
      call('POST', '/api/locks/release_all', { developer_id: developerId, repo, summary }),
    status: () => call('GET', `/api/locks/status${repoQuery}`),
    activity: (limit = 10) => call('GET', `/api/activity${repoQuery}&limit=${limit}`),
  };
}
```

- [ ] **Step 7: Implementar `mcp-server/lib/messages.js`**

```js
function problem(res) {
  if (res.status === 401) return '⚠️ TeamContext: TEAM_TOKEN rejected by the server. Tell the user to fix the MCP config.';
  const reason = res.error ?? `HTTP ${res.status}`;
  return `⚠️ TeamContext server unreachable (${reason}). Coordination is OFFLINE: tell the user before editing shared files.`;
}

export function lockMessage(res, filePath) {
  if (res.status === 200) return `✅ Lock granted for ${filePath}`;
  if (res.status === 409) {
    return `⚠️ CONFLICT: ${res.data.conflict_with} has been editing ${filePath} since ${res.data.acquired_at}. Do not edit this file.`;
  }
  return problem(res);
}

export function unlockMessage(res, filePath) {
  if (res.status === 200) return `🔓 Lock released for ${filePath}`;
  if (res.status === 404) return `⚠️ No active lock found for ${filePath}`;
  return problem(res);
}

export function releaseAllMessage(res) {
  return res.status === 200 ? `🔓 Released ${res.data.count} locks` : problem(res);
}

export function teamStatusMessage(statusRes, activityRes, me) {
  if (!statusRes.ok) return problem(statusRes);
  const locks = statusRes.data.active_locks;
  const lines = [`TeamContext status (you are "${me}")`, ''];

  lines.push(locks.length ? `Active locks (${locks.length}):` : 'Active locks: none — all clear.');
  for (const l of locks) {
    lines.push(`- ${l.file_path} — ${l.developer_id === me ? 'YOU' : l.developer_id} since ${l.acquired_at}`);
  }

  const events = activityRes.ok ? activityRes.data.events : [];
  if (events.length) {
    lines.push('', 'Recent activity (newest first):');
    for (const e of events) {
      const file = e.file_path ? ` ${e.file_path}` : '';
      const note = e.summary ? ` — "${e.summary}"` : '';
      lines.push(`- [${e.created_at}] ${e.developer_id} ${e.event}${file}${note}`);
    }
  }
  return lines.join('\n');
}
```

- [ ] **Step 8: Correr y verificar que pasan**

Run: `cd mcp-server && npm test`
Expected: PASS, `# pass 25`, `# fail 0`

- [ ] **Step 9: Screenshot + commit**

Guardar `bob_sessions/teamcontext_task20_mcp_libs.png`.

```bash
git add mcp-server/package.json mcp-server/package-lock.json mcp-server/lib mcp-server/test bob_sessions/teamcontext_task20_mcp_libs.png
git commit -m "feat(mcp): path normalization, repo detection, resilient client and tool messages"
```

---

### Task 5: Entrypoint del MCP server + conexión en Bob — **Eswin** (Bob task21)

**Files:**
- Create: `mcp-server/index.js`, `bob/mcp.example.json`
- Local (NO se commitea): `.bob/mcp.json` en el repo demo

**Interfaces:**
- Consumes: `normalizePath`, `detectRepo`, `createClient` y los 4 `*Message` (Task 4)
- Produces: el servidor MCP stdio `teamcontext` con las tools `file_lock(file_path)`, `file_unlock(file_path, summary?)`, `release_all(summary?)` y `team_status()`. Variables de entorno: `CENTRAL_SERVER_URL`, `TEAM_TOKEN`, `DEVELOPER_ID` y, opcional, `REPO_ROOT`.

- [ ] **Step 1: Implementar `mcp-server/index.js`**

> ⚠️ En stdio, **stdout es el canal del protocolo**. Nunca usar `console.log`, solo `console.error`.

```js
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { normalizePath } from './lib/paths.js';
import { detectRepo } from './lib/repo.js';
import { createClient } from './lib/client.js';
import { lockMessage, unlockMessage, releaseAllMessage, teamStatusMessage } from './lib/messages.js';

const { CENTRAL_SERVER_URL, TEAM_TOKEN, DEVELOPER_ID, REPO_ROOT } = process.env;
const missing = Object.entries({ CENTRAL_SERVER_URL, TEAM_TOKEN, DEVELOPER_ID }).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`teamcontext-mcp: missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const repo = detectRepo(REPO_ROOT || process.cwd());
const client = createClient({ baseUrl: CENTRAL_SERVER_URL, token: TEAM_TOKEN, developerId: DEVELOPER_ID, repo: repo.name });
const text = (t) => ({ content: [{ type: 'text', text: t }] });

const server = new McpServer({ name: 'teamcontext', version: '1.0.0' });

server.registerTool(
  'file_lock',
  {
    title: 'Lock a file before editing',
    description:
      'MUST be called BEFORE editing any file. Claims the file so teammates\' agents do not edit it at the same time. ' +
      'If the result says CONFLICT, do not edit the file.',
    inputSchema: { file_path: z.string().describe('File you are about to edit (repo-relative or absolute)') },
  },
  async ({ file_path }) => {
    const p = normalizePath(file_path, repo.root);
    return text(lockMessage(await client.acquire(p), p));
  },
);

server.registerTool(
  'file_unlock',
  {
    title: 'Release a file after editing',
    description: 'Call when you finish editing a file. Include a one-line summary of what changed (handoff note for teammates).',
    inputSchema: {
      file_path: z.string().describe('File you finished editing'),
      summary: z.string().optional().describe('One line: what changed in this file'),
    },
  },
  async ({ file_path, summary }) => {
    const p = normalizePath(file_path, repo.root);
    return text(unlockMessage(await client.release(p, summary), p));
  },
);

server.registerTool(
  'release_all',
  {
    title: 'Release all my locks (end of task)',
    description: 'Call when the task ends (success or abort). Summary = what was done, what failed, what is pending.',
    inputSchema: { summary: z.string().optional().describe('Task-level handoff note') },
  },
  async ({ summary }) => text(releaseAllMessage(await client.releaseAll(summary))),
);

server.registerTool(
  'team_status',
  {
    title: 'See what teammates are working on',
    description: 'Call at the start of every task. Lists files currently locked by teammates and recent handoff notes.',
    inputSchema: {},
  },
  async () => {
    const [status, activity] = await Promise.all([client.status(), client.activity(10)]);
    return text(teamStatusMessage(status, activity, DEVELOPER_ID));
  },
);

await server.connect(new StdioServerTransport());
console.error(`teamcontext-mcp ready: developer=${DEVELOPER_ID} repo=${repo.name} root=${repo.root}`);
```

- [ ] **Step 2: Smoke test con MCP Inspector (contra el server de Vercel que dejó Christian)**

```bash
cd mcp-server
CENTRAL_SERVER_URL=http://localhost:3000 TEAM_TOKEN=changeme-long-random-string DEVELOPER_ID=christian-demo \
  npx @modelcontextprotocol/inspector node index.js
```
En el Inspector: Tools → List. Deben aparecer 4 tools. Ejecutar `file_lock` con `./src/header.js` → `✅ Lock granted for src/header.js`. Ejecutar `team_status` → aparece `YOU`. Ejecutar `release_all` → `🔓 Released 1 locks`.

Prueba de resiliencia: apagar el server y ejecutar `file_lock`. Debe devolver `⚠️ TeamContext server unreachable (...)` y el proceso **no** debe morir.

- [ ] **Step 3: Crear la plantilla `bob/mcp.example.json` (sin secretos)**

Verificar en la doc de Bob (sección "MCP configuration") el nombre exacto del archivo y las claves. Con el formato `mcpServers` estándar queda así:

```json
{
  "mcpServers": {
    "teamcontext": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/TeamContextRepo/mcp-server/index.js"],
      "env": {
        "CENTRAL_SERVER_URL": "https://<your-project>.vercel.app",
        "TEAM_TOKEN": "<ask teammate via DM — never commit>",
        "DEVELOPER_ID": "christian-demo",
        "REPO_ROOT": "/ABSOLUTE/PATH/TO/teamcontext-demo"
      }
    }
  }
}
```

`REPO_ROOT` existe porque no sabemos con qué `cwd` lanza Bob el proceso MCP. Con esa variable, la detección del repo no depende de eso.

- [ ] **Step 4: Conectar en Bob y verificar**

Copiar la plantilla a `.bob/mcp.json` **del repo demo** (Task 7) con los valores reales. En Bob → MCP servers, `teamcontext` debe aparecer en verde con 4 tools. En el chat, decirle a Bob "call team_status" y comprobar que responde.

- [ ] **Step 5: Screenshot + commit + PR**

Guardar `bob_sessions/teamcontext_task21_mcp_entrypoint.png`.

```bash
git add mcp-server/index.js bob/mcp.example.json bob_sessions/teamcontext_task21_mcp_entrypoint.png
git commit -m "feat(mcp): stdio server exposing file_lock, file_unlock, release_all, team_status"
git push -u origin feat/mcp-server
gh pr create --base develop --title "MCP server" --fill
```

---

### Task 6: Dashboard — **Christian** (Bob task03)

**Files:**
- Create: `server/public/view.js`, `server/public/app.js`, `server/public/index.html`
- Test: `server/test/dashboard-view.test.js`

**Interfaces:**
- Consumes: `GET /api/locks/status` y `GET /api/activity` (Task 2), mismo origen y sin token. En Vercel, `server/public/` se sirve desde la CDN y `/api/*` va a la función Express.
- Produces: `escapeHtml(s)`, `timeAgo(iso, now)`, `renderLocks(locks, now) → string`, `renderActivity(events, now) → string` y `countConflicts(events) → number`

- [ ] **Step 1: Escribir los tests que fallan — `server/test/dashboard-view.test.js`**

```js
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
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `cd server && npm test`
Expected: FAIL con `Cannot find module '.../server/public/view.js'`

- [ ] **Step 3: Implementar `server/public/view.js`**

```js
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
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `cd server && npm test`
Expected: PASS, `# pass 24`, `# fail 0`

- [ ] **Step 5: Implementar `server/public/app.js`**

```js
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
```

- [ ] **Step 6: Implementar `server/public/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TeamContext</title>
  <style>
    :root { --bg:#0f1115; --card:#181b22; --text:#e6e8ee; --muted:#8a90a0; --red:#e5484d; --green:#30a46c; --amber:#f5a524; }
    * { box-sizing: border-box; }
    body { margin:0; font:15px/1.5 system-ui, sans-serif; background:var(--bg); color:var(--text); padding:24px 16px; }
    main { max-width:1100px; margin:0 auto; display:grid; gap:16px; grid-template-columns: 1fr 1fr; }
    header { max-width:1100px; margin:0 auto 16px; display:flex; flex-wrap:wrap; gap:16px; align-items:baseline; justify-content:space-between; }
    h1 { margin:0; font-size:22px; } h2 { margin:0 0 12px; font-size:16px; color:var(--muted); font-weight:600; }
    section { background:var(--card); border-radius:12px; padding:16px; overflow-x:auto; }
    .stats { display:flex; gap:12px; } .stat { background:var(--card); border-radius:10px; padding:8px 14px; }
    .stat b { font-size:20px; display:block; } .stat.conflicts b { color:var(--amber); }
    table { width:100%; border-collapse:collapse; } th, td { text-align:left; padding:8px; border-bottom:1px solid #262a33; }
    tr.locked td { background:color-mix(in srgb, var(--red) 18%, transparent); }
    .all-clear { padding:24px; text-align:center; border-radius:10px; background:color-mix(in srgb, var(--green) 20%, transparent); font-weight:600; }
    .feed { list-style:none; margin:0; padding:0; } .feed li { padding:8px; border-bottom:1px solid #262a33; }
    .event.conflict { background:color-mix(in srgb, var(--amber) 18%, transparent); border-radius:6px; }
    .summary { margin:4px 0 0 24px; color:var(--text); font-style:italic; }
    .muted { color:var(--muted); font-size:13px; } #updated.error { color:var(--red); }
    code { font-size:13px; }
    @media (max-width: 800px) { main { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>🚦 TeamContext <span class="muted">— <span id="repo"></span></span></h1>
    <div class="stats">
      <div class="stat"><b id="lock-count">0</b><span class="muted">files locked</span></div>
      <div class="stat conflicts"><b id="conflicts">0</b><span class="muted">conflicts avoided</span></div>
    </div>
    <span id="updated" class="muted">Loading…</span>
  </header>
  <main>
    <section><h2>Who is editing what</h2><div id="locks"></div></section>
    <section><h2>Activity &amp; handoff notes</h2><div id="activity"></div></section>
  </main>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 7: Verificación manual**

```bash
cd server && npm start
# (necesita .env.local de la Task 3; si aún no existe, correr esto después del deploy)
# abrir http://localhost:3000/?repo=demo-repo
# en otra terminal, adquirir un lock con curl (Task 2, Step 7): en ≤4 s aparece la fila roja
# un segundo acquire con otro developer_id sube "conflicts avoided" a 1 y aparece la fila ámbar
# release con summary: vuelve "All clear" y la nota se ve en el feed
```
Ver el código fuente de la página (view-source) y confirmar que **no hay ningún token**.

- [ ] **Step 8: Screenshot + commit + PR**

Guardar `bob_sessions/teamcontext_task03_dashboard.png`.

```bash
git checkout -b feat/dashboard
git add server/public server/test/dashboard-view.test.js bob_sessions/teamcontext_task03_dashboard.png
git commit -m "feat(dashboard): live lock table, conflict counter and handoff activity feed"
git push -u origin feat/dashboard && gh pr create --base develop --fill
```

---

### Task 7: Custom mode "TeamContext" en Bob + repo demo — **Eswin** (Bob task22 y task23)

**Files:**
- Create (en este repo): `bob/custom_modes.yaml`, `bob/rules-teamcontext/01-coordination.md`
- Create (repo nuevo, público): `teamcontext-demo` con `index.html`, `src/header.js`, `src/footer.js`, `src/api.js`, `README.md`, `LICENSE`, `.gitignore`
- Local: `.bob/` del repo demo (modo + reglas copiados; `mcp.json` ignorado)

**Interfaces:**
- Consumes: las 4 tools MCP (Task 5)
- Produces: el modo `teamcontext`, con el que Bob llama `team_status`, luego `file_lock` antes de cada edición, `file_unlock` al terminar un archivo y `release_all` al final, **sin que el usuario se lo pida**.

- [ ] **Step 1: Verificar el formato en la doc de Bob (5 min, sin gastar coins)**

Leer en la documentación de Bob: *Custom modes*, *Custom rules* y *MCP configuration*. Anotar (1) dónde viven los modos a nivel proyecto, (2) el nombre de las claves (`slug`, `name`, `roleDefinition`, `customInstructions`, `groups`/tool permissions) y (3) la carpeta de reglas específicas de un modo. **No inventar**: si las claves difieren de las de abajo, adaptar solo los nombres de las claves y conservar el texto de las instrucciones.

- [ ] **Step 2: Crear `bob/rules-teamcontext/01-coordination.md`**

```markdown
# TeamContext coordination rules (mandatory)

You work in a repository shared with teammates whose AI agents edit code at the same time.
The `teamcontext` MCP server is the source of truth for who is editing what.

1. **Start of every task:** call `team_status`. Read which files teammates hold and their latest handoff notes, and plan around them.
2. **Before editing ANY file** (create, modify, delete, rename): call `file_lock` with that file's path. Never edit a file without a `✅ Lock granted` response in this task.
3. **If `file_lock` returns `⚠️ CONFLICT`:** do NOT edit that file. Stop and tell the user exactly who holds it and since when, then offer options: (a) work on other files first, (b) wait and retry later, (c) coordinate with that teammate. Do not look for workarounds such as copying the file.
4. **If `file_lock` says the server is unreachable:** tell the user coordination is offline and ask whether to continue.
5. **When you finish a file:** call `file_unlock` with a one-line `summary` of what changed.
6. **When the task ends (success, failure or abort):** call `release_all` with a short handoff `summary`: what was done, what failed, what is pending.
7. Never write tokens, passwords or other secrets into any file.
```

- [ ] **Step 3: Crear `bob/custom_modes.yaml`**

```yaml
customModes:
  - slug: teamcontext
    name: 🚦 TeamContext
    roleDefinition: >-
      You are Bob, a senior software engineer on a team where every developer codes with their own AI agent.
      You coordinate through the TeamContext MCP server so that no two agents ever edit the same file at the same time,
      and you leave clear handoff notes for your teammates.
    whenToUse: Any coding task in a repository shared with teammates.
    groups:
      - read
      - edit
      - command
      - mcp
    customInstructions: |-
      Follow the TeamContext coordination rules strictly:
      1. At the start of the task call team_status.
      2. Call file_lock BEFORE editing any file; never edit without "✅ Lock granted".
      3. On "⚠️ CONFLICT": do not edit the file, tell the user who holds it and since when, propose alternatives.
      4. After finishing a file call file_unlock with a one-line summary.
      5. At the end of the task (success or abort) call release_all with a handoff summary: done / failed / pending.
      6. Never write secrets into files.
```

- [ ] **Step 4 (lo hace Christian el sábado en la tarde): Crear el repo demo `teamcontext-demo` (público, MIT, contenido 100 % propio)**

```bash
mkdir -p ~/teamcontext-demo/src && cd ~/teamcontext-demo && git init -q
```

`index.html`:
```html
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Demo Store</title></head>
<body>
  <header id="header"></header>
  <main id="products"></main>
  <footer id="footer"></footer>
  <script type="module" src="src/header.js"></script>
  <script type="module" src="src/footer.js"></script>
  <script type="module" src="src/api.js"></script>
</body>
</html>
```

`src/header.js`:
```js
const header = document.getElementById('header');
header.innerHTML = `
  <nav>
    <strong>Demo Store</strong>
    <a href="#products">Products</a>
    <a href="#footer">Contact</a>
  </nav>
`;
```

`src/footer.js`:
```js
document.getElementById('footer').textContent = '© 2026 Demo Store — sample project for TeamContext';
```

`src/api.js`:
```js
const PRODUCTS = [
  { id: 1, name: 'Blue Mug', price: 12 },
  { id: 2, name: 'Green Notebook', price: 8 },
];
document.getElementById('products').innerHTML = PRODUCTS.map((p) => `<p>${p.name} — $${p.price}</p>`).join('');
```

`.gitignore`:
```
.bob/mcp.json
.env
```

Agregar `README.md` ("Sample repo for the TeamContext demo. Synthetic content.") y el mismo `LICENSE` MIT, luego:

```bash
git add . && git commit -m "chore: demo store for TeamContext"
gh repo create teamcontext-demo --public --source . --push
```

- [ ] **Step 5: Instalar el modo en el repo demo**

Copiar `bob/custom_modes.yaml` y `bob/rules-teamcontext/` a las rutas que indica la doc (Step 1) dentro de `~/teamcontext-demo/.bob/`, y `.bob/mcp.json` desde la Task 5. Commitear el modo y las reglas en el repo demo (sin `mcp.json`) para que Christian solo tenga que hacer `git pull`.

- [ ] **Step 6: Verificar que Bob llama las tools SOLO (Bob task22)**

En Bob, con el modo 🚦 TeamContext y **sin mencionar locks**, pedir: *"Add a dark mode toggle button to the header."*

Tiene que pasar esto, en orden: `team_status` → `file_lock src/header.js` → edición → `file_unlock` con summary → `release_all`. El dashboard muestra la fila roja durante la edición y la nota de handoff al final.

Si Bob se salta el lock: reforzar la regla 2 poniéndola también al inicio de `roleDefinition`, recargar el modo y repetir.

Screenshot: `bob_sessions/teamcontext_task22_custom_mode_verification.png`.

- [ ] **Step 7: Generar AGENTS.md con `/init` (Bob task23)**

En el repo **TeamContextRepo**, ejecutar `/init` en Bob. Revisar que el `AGENTS.md` generado no contenga secretos y commitearlo. Screenshot: `bob_sessions/teamcontext_task23_init_agents_md.png`.

- [ ] **Step 8: Commit + PR**

```bash
git checkout -b feat/bob-mode
git add bob/custom_modes.yaml bob/rules-teamcontext AGENTS.md bob_sessions/teamcontext_task22_custom_mode_verification.png bob_sessions/teamcontext_task23_init_agents_md.png
git commit -m "feat(bob): TeamContext custom mode and coordination rules"
git push -u origin feat/bob-mode && gh pr create --base develop --fill
```

---

### Task 8: E2E en dos máquinas + grabación del antes/después — **Los dos** (Bob task04 y task24)

**Files:** ninguno (solo fixes si aparecen bugs, cada uno en su directorio).

- [ ] **Step 1: Preparación**

Los dos clonan `teamcontext-demo`, configuran `.bob/mcp.json` con **su propio** `DEVELOPER_ID` (`eswin-demo` / `christian-demo`) y la URL de Vercel, y confirman que MCP aparece en verde en Bob. Después se limpia el estado:

```bash
curl -s $URL/health
curl -s -XDELETE $URL/api/locks/stale -H "authorization: Bearer $TEAM_TOKEN" -H 'content-type: application/json' -d '{"older_than_minutes":0}'
```

- [ ] **Step 2: Escenario SIN TeamContext (grabar pantalla)**

Los dos en modo **Code** normal, sobre `main` del demo y en ramas distintas:
- Christian: *"Add a dark mode toggle button to the header."*
- Eswin: *"Add a search box to the header."*

Los dos hacen commit y push de su rama. Luego se hace merge de las dos en `main`. Resultado esperado: **CONFLICT en `src/header.js`**, y hay que grabar esa pantalla. Se anota cuántos minutos toma resolverlo, porque ese es el "antes".

- [ ] **Step 3: Escenario CON TeamContext (grabar pantalla + dashboard visible)**

Se resetea el demo (`git reset --hard origin/main` en ambas máquinas) y se cambia al modo 🚦 TeamContext.
1. Christian lanza la tarea del toggle. El dashboard muestra `christian-demo · src/header.js` en rojo.
2. Eswin lanza la tarea del search box. Su Bob recibe `⚠️ CONFLICT: christian-demo has been editing src/header.js since …`, se detiene y le propone alternativas. En el dashboard, "conflicts avoided" pasa a 1.
3. Christian termina: `file_unlock` + `release_all` con summary. El dashboard muestra la nota.
4. Eswin le dice a Bob "retry". `team_status` muestra la nota de Christian, `file_lock` responde ✅, Bob edita **sobre la versión ya actualizada** (antes de reintentar, `git pull`) y **no hay conflicto de merge**.

- [ ] **Step 4: Checklist de bugs típicos (arreglar si aparecen)**

| Síntoma | Causa probable | Fix |
|---|---|---|
| Eswin bloqueado por un lock "fantasma" | La ruta se normaliza distinto (absoluta vs relativa) | Revisar `REPO_ROOT` en `mcp.json`; el `root` del log de arranque (stderr) debe coincidir |
| Repos distintos en el dashboard para el mismo repo | Uno clonó por SSH y el otro por HTTPS con otro nombre | `repoNameFromRemote` ya los unifica; confirmar que los dos usan `origin` |
| Bob edita sin pedir lock | El modo no cargó o la regla quedó débil | Revisar que el modo activo sea 🚦 TeamContext y reforzar `roleDefinition` |
| Timeout o 500 en la primera llamada | Cold start de la función o proyecto de Supabase pausado (el plan free pausa tras días sin uso) | `curl $URL/health` y `curl $URL/api/locks/status` antes de grabar; revisar `vercel logs` |

- [ ] **Step 5: Screenshots**

Christian: `bob_sessions/teamcontext_task04_e2e_lock_holder.png`. Eswin: `bob_sessions/teamcontext_task24_e2e_conflict_received.png`. Commit en `develop`.

---

### Task 9A: Entrega — video, README y deploy final — **Christian**

- [ ] **Step 1: Editar el video (≤ 3 min)** con este guion:
  - 0:00–0:20 — Problema: "Cada dev tiene su agente. Los agentes no se hablan." Mostrar el conflicto de merge del Step 2.
  - 0:20–0:35 — Solución y arquitectura (1 diagrama): Bob + custom mode → MCP local → servidor central → dashboard.
  - 0:35–2:15 — **Demo en vivo (≥ 90 s)**, del Step 3 de la Task 8, con el dashboard siempre visible. Narrar explícitamente: "Bob, en el custom mode TeamContext, llama `file_lock` **por sí solo**".
  - 2:15–2:40 — Impacto: conflictos evitados (contador del dashboard) y minutos ahorrados (antes vs después).
  - 2:40–3:00 — Uso de Bob: custom mode, reglas, MCP, `/init`, construido con Bob, y un vistazo a `bob_sessions/`.
- [ ] **Step 2: Reescribir `README.md`**: qué es, GIF o captura del dashboard, arquitectura, setup en 3 pasos (server, MCP + `bob/mcp.example.json`, modo), URL de la demo, link al video, sección "Built with IBM Bob" y la frase "works with any MCP client" en **una línea** al final.
- [ ] **Step 3: Domingo 07:30**: merge de `develop` en `main`, `cd server && vercel --prod` desde `main`, `curl $URL/health`, abrir el dashboard público y revisar con view-source que no aparezca el token.

### Task 9B: Entrega — textos, slides y cover — **Eswin** (Bob task25)

- [ ] **Step 1 (sábado temprano, sin coins):** preguntar en el Discord de lablab la "Open question for mentors" (sección 12 del contexto) y ajustar el discurso según la respuesta.
- [ ] **Step 2: Statements con Bob (document understanding)**: en Bob, adjuntar `TEAMCONTEXT_CONTEXT.md` y `README.md` y pedir: *"Draft (1) a Problem & Solution statement ≤ 500 words and (2) an IBM Bob usage statement ≤ 500 words, in English, for hackathon judges. Use only facts from these files and from bob_sessions/."* Guardar el resultado en `docs/submission/problem_solution.md` y `docs/submission/bob_usage.md`, y revisar que las cifras de impacto coincidan con las medidas en la Task 8. Screenshot: `teamcontext_task25_submission_statements.png`.
  - El statement de Bob debe mencionar: custom mode + reglas, MCP, el uso automático de las tools, `/init`/AGENTS.md, Plan → Code mode, document understanding para estos textos y que el propio proyecto se construyó con Bob.
- [ ] **Step 3: Slides (6–8)**: Problema, Solución, Arquitectura, Demo (capturas), Impacto (antes/después), Bob como núcleo, Equipo. Cover 16:9 con el logo 🚦 y la frase "TeamContext — a traffic light for AI coding agents".
- [ ] **Step 4:** Revisar que `bob_sessions/` tenga un PNG por **cada** tarea de Bob usada (listar el directorio contra la tabla de presupuesto) y que `DATA_SOURCES.md` esté actualizado.
- [ ] **Step 5 (domingo ≤ 08:30):** Completar el formulario de lablab: repo, video, statements, slides, cover, URL de la demo. Verificar en el form si pide algo que no esté en esta lista.

---

### Task 10 (STRETCH, solo si hay tiempo libre antes de las 22:30): Standup determinístico — **Christian** (Bob task05)

**Files:**
- Modify: `server/lib/store.js` (agregar `standup`), `server/lib/routes.js` (agregar la ruta), `server/public/view.js`, `server/public/app.js`, `server/public/index.html`
- Test: `server/test/store.test.js`, `server/test/dashboard-view.test.js`

**Interfaces:**
- Produces: `store.standup(repo, hours = 8) → Promise<[{ developer_id, files: string[], handoffs: string[], conflicts: number }]>`; `GET /api/standup?repo=&hours=` (público) → `{ developers: [...] }`; `renderStandup(developers) → string`

- [ ] **Step 1: Tests que fallan**

Agregar al final de `server/test/store.test.js`:
```js
test('standup groups finished files, handoffs and conflicts per developer', async (t) => {
  const { store, clock } = await setup(t);
  await store.acquire(A);
  await store.acquire(B);                             // conflict for bob
  clock.advance(10);
  await store.release({ ...A, summary: 'Added dark mode toggle' });
  await store.releaseAll({ developerId: 'alice', repo: 'demo-repo', summary: 'Header done, tests pending' });
  assert.deepEqual(await store.standup('demo-repo', 8), [
    { developer_id: 'alice', files: ['src/header.js'], handoffs: ['Added dark mode toggle', 'Header done, tests pending'], conflicts: 0 },
    { developer_id: 'bob', files: [], handoffs: [], conflicts: 1 },
  ]);
});
```

Agregar al final de `server/test/dashboard-view.test.js` (y sumar `renderStandup` al import de la primera línea):
```js
test('renderStandup lists each developer with files and notes', () => {
  const html = renderStandup([{ developer_id: 'alice', files: ['src/header.js'], handoffs: ['Added toggle'], conflicts: 1 }]);
  assert.match(html, /alice/);
  assert.match(html, /src\/header\.js/);
  assert.match(html, /Added toggle/);
  assert.match(html, /1 conflict avoided/);
});
```

- [ ] **Step 2: Correr** `cd server && npm test`. Expected: FAIL con `store.standup is not a function` y `renderStandup` no exportado.

- [ ] **Step 3: Implementar.** En `server/lib/store.js`, antes del `return`:

```js
  async function standup(repo, hours = 8) {
    const { rows } = await db.query(
      `SELECT developer_id, file_path, event, summary FROM teamcontext.activity
       WHERE repo = $1::text AND created_at >= $2::timestamptz - $3::float8 * interval '1 hour'
       ORDER BY created_at ASC, id ASC`,
      [repo, now(), hours],
    );
    const byDev = new Map();
    for (const e of rows) {
      const d = byDev.get(e.developer_id) ?? { developer_id: e.developer_id, files: [], handoffs: [], conflicts: 0 };
      if (e.event === 'unlock' && e.file_path && !d.files.includes(e.file_path)) d.files.push(e.file_path);
      if ((e.event === 'unlock' || e.event === 'release_all') && e.summary) d.handoffs.push(e.summary);
      if (e.event === 'conflict') d.conflicts += 1;
      byDev.set(e.developer_id, d);
    }
    return [...byDev.values()];
  }
```

y cambiar el `return` a `return { acquire, release, releaseAll, activeLocks, activity, deleteStale, standup };`.

En `server/lib/routes.js`, antes de `return router;`:

```js
  router.get('/standup', async (req, res) => {
    const repo = repoOf(req.query);
    if (!repo) return res.status(400).json({ error: 'repo is required' });
    const hours = Math.min(Math.max(Number(req.query.hours) || 8, 1), 72);
    res.json({ developers: await store.standup(repo, hours) });
  });
```

En `server/public/view.js`:

```js
export function renderStandup(developers) {
  if (!developers.length) return '<p class="muted">Nothing to report yet.</p>';
  return developers
    .map((d) => `<div class="standup"><strong>${escapeHtml(d.developer_id)}</strong>` +
      `${d.files.length ? `<div>Files: ${d.files.map((f) => `<code>${escapeHtml(f)}</code>`).join(', ')}</div>` : ''}` +
      `${d.handoffs.map((h) => `<div class="summary">${escapeHtml(h)}</div>`).join('')}` +
      `${d.conflicts ? `<div class="muted">${d.conflicts} conflict${d.conflicts > 1 ? 's' : ''} avoided</div>` : ''}</div>`)
    .join('');
}
```

En `server/public/index.html`, dentro de `<main>` y después de la segunda `<section>`:

```html
    <section style="grid-column: 1 / -1"><h2>Standup (last 8h) <button id="standup-btn">Generate standup</button></h2><div id="standup"></div></section>
```

En `server/public/app.js`, cambiar el import a `import { renderLocks, renderActivity, countConflicts, renderStandup } from './view.js';` y agregar al final:

```js
$('standup-btn').addEventListener('click', async () => {
  if (!repo) { $('standup').textContent = 'Open the dashboard with ?repo=<name> to generate a standup.'; return; }
  const { developers } = await getJson(`/api/standup?repo=${encodeURIComponent(repo)}&hours=8`);
  $('standup').innerHTML = renderStandup(developers);
});
```

- [ ] **Step 4: Correr** `cd server && npm test`. Expected: PASS, `# pass 26`, `# fail 0`.
- [ ] **Step 5: Screenshot `teamcontext_task05_standup.png` + commit** `feat: deterministic standup summary from activity log` + `vercel --prod` desde `server/`.

---

## Contrato entre las dos mitades (para leer antes de empezar)

| Christian produce | Eswin consume |
|---|---|
| `POST /api/locks/acquire` → 200 `{status:"granted",...}` / 409 `{status:"conflict",conflict_with,acquired_at,file_path}` | `client.acquire` → `lockMessage` usa `status` 200/409 y `data.conflict_with`, `data.acquired_at` |
| `POST /api/locks/release` → 200 / 404 `{status:"not_found"}` | `unlockMessage` usa 200/404 |
| `POST /api/locks/release_all` → `{status:"released",count}` | `releaseAllMessage` usa `data.count` |
| `GET /api/locks/status?repo=` → `{active_locks:[{developer_id,file_path,acquired_at,...}],count}` | `teamStatusMessage` usa `data.active_locks` |
| `GET /api/activity?repo=&limit=` → `{events:[{developer_id,file_path,event,summary,created_at}]}` | `teamStatusMessage` usa `data.events` |
| 401 `{error:"unauthorized"}` sin token válido | mensaje "TEAM_TOKEN rejected" |

Si alguien necesita cambiar el contrato, **avisa antes en el chat** y actualiza esta tabla en el mismo PR.
