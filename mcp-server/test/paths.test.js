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
