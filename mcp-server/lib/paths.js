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
