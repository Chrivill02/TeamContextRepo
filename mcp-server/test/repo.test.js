import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync } from 'node:fs';
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
  mkdirSync(path.join(dir, 'src'));
  assert.deepEqual(detectRepo(path.join(dir, 'src')), { root: dir, name: 'demo-repo' });
});

test('detectRepo falls back to the folder name outside git', () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'tc-plain-')));
  assert.deepEqual(detectRepo(dir), { root: dir, name: path.basename(dir) });
});
