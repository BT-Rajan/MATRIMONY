const BASE = 'api';
let csrf = null;
let onUnauthorized = null;

export class ApiError extends Error {
  constructor(status, code, errors = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.errors = Array.isArray(errors) ? {} : errors;
  }
}

export const setCsrf = (t) => { csrf = t; };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function session() {
  let res;
  try {
    res = await fetch(`${BASE}/session`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(0, 'network');
  }
  if (!res.ok) throw new ApiError(res.status, 'server');
  const j = await res.json();
  csrf = j.csrf;
  return j;
}

async function raw(method, path, data) {
  const opt = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
  if (method !== 'GET') {
    if (!csrf) await session();
    opt.headers['Content-Type'] = 'application/json';
    opt.headers['X-CSRF-Token'] = csrf;
    opt.body = JSON.stringify(data ?? {});
  }
  let res;
  try {
    res = await fetch(`${BASE}/${path}`, opt);
  } catch {
    throw new ApiError(0, 'network');
  }
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  if (!res.ok) throw new ApiError(res.status, json?.error || 'server', json?.errors || {});
  return json;
}

async function call(method, path, data) {
  try {
    return await raw(method, path, data);
  } catch (e) {
    if (e.status === 419) {
      await session();
      return raw(method, path, data);
    }
    if (e.status === 401 && path !== 'auth/login' && onUnauthorized) onUnauthorized();
    throw e;
  }
}

export const api = {
  get: (p) => call('GET', p),
  post: (p, d) => call('POST', p, d),
  put: (p, d) => call('PUT', p, d),
  del: (p) => call('DELETE', p),
};
