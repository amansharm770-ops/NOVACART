// Small fetch wrapper: cookies (HttpOnly) + CSRF header + one automatic token refresh on 401.
const BASE = import.meta.env.VITE_API_URL || '/api';
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/admin/login'];

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let csrfToken = null;
let refreshing = null;

async function ensureCsrf(force = false) {
  if (!csrfToken || force) {
    const res = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
    csrfToken = (await res.json()).csrfToken;
  }
  return csrfToken;
}

async function send(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = await ensureCsrf();
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const readJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

function refreshSession() {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api(path, opts = {}) {
  let res = await send(path, opts);

  if (res.status === 403 && opts.method && opts.method !== 'GET') {
    const data = await readJson(res.clone());
    if (data?.message === 'Invalid CSRF token') {
      await ensureCsrf(true);
      res = await send(path, opts);
    }
  }
  if (res.status === 401 && !NO_REFRESH.includes(path) && (await refreshSession())) {
    res = await send(path, opts);
  }

  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, data?.message || 'Something went wrong', data?.errors);
  return data;
}

export const money = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const FREE_SHIPPING_ABOVE = 499;
export const SHIPPING_FEE = 49;

export const errorText = (err) =>
  err?.errors?.length ? err.errors.map((e) => e.message).join(' · ') : err?.message || 'Something went wrong';
