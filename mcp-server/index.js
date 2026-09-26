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
