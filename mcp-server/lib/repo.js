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
