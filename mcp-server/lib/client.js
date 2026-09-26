// Thin HTTP client for the central server. Never throws: callers always get { ok, status, data?, error? }.
export function createClient({ baseUrl, token, developerId, repo, timeoutMs = 10_000, fetchImpl = fetch }) {
  const base = baseUrl.replace(/\/+$/, '');
  const repoQuery = `?repo=${encodeURIComponent(repo)}`;

  async function call(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(Object.assign(new Error(`timeout after ${timeoutMs}ms`), { name: 'TimeoutError' })), timeoutMs);
    try {
      const res = await fetchImpl(base + path, {
        method,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      clearTimeout(timer);
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
