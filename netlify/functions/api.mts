import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

type Body = { token?: string; password?: string; current?: string; next?: string; config?: unknown; data?: string; id?: string };
type Auth = { salt: string; hash: string };

const store = () => getStore({ name: 'portfolio', consistency: 'strong' });
const out = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (error: string, status: number) => out({ error }, status);
const WEEK = 7 * 24 * 3600 * 1000;

const hashPw = (pw: string, salt: string) => scryptSync(pw, salt, 32).toString('hex');
const matches = (pw: string, a: Auth) => {
  const x = Buffer.from(hashPw(pw, a.salt), 'hex');
  const y = Buffer.from(a.hash, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
};

async function newSession(): Promise<string> {
  const token = randomBytes(24).toString('hex');
  await store().setJSON('session-' + token, { exp: Date.now() + WEEK });
  return token;
}

async function valid(token?: string): Promise<boolean> {
  if (!token || !/^[a-f0-9]{48}$/.test(token)) return false;
  const s = (await store().get('session-' + token, { type: 'json' })) as { exp: number } | null;
  return !!s && s.exp > Date.now();
}

const getAuth = async () => (await store().get('auth', { type: 'json' })) as Auth | null;

export default async (req: Request) => {
  const path = new URL(req.url).pathname.replace(/\/$/, '');
  const s = store();

  if (req.method === 'GET' && path === '/api/site') {
    const config = await s.get('config', { type: 'json' });
    return out({ config, claimed: !!(await getAuth()) });
  }
  if (req.method === 'GET' && path.startsWith('/api/image/')) {
    const id = path.split('/').pop() || '';
    if (!/^[a-f0-9-]{36}$/.test(id)) return fail('Not found', 404);
    const data = await s.get('img-' + id);
    return data ? out({ data }) : fail('Not found', 404);
  }
  if (req.method !== 'POST') return fail('Not found', 404);

  const body = (await req.json().catch(() => ({}))) as Body;

  if (path === '/api/admin/claim') {
    if (!body.password || body.password.length < 6) return fail('Password must be at least 6 characters', 400);
    const salt = randomBytes(16).toString('hex');
    const res = await s.setJSON('auth', { salt, hash: hashPw(body.password, salt) }, { onlyIfNew: true });
    if (!res.modified) return fail('Admin already claimed', 409);
    return out({ token: await newSession() });
  }
  if (path === '/api/admin/login') {
    const a = await getAuth();
    if (!a || !body.password || !matches(body.password, a)) return fail('Wrong password', 401);
    return out({ token: await newSession() });
  }
  if (path === '/api/admin/check') return out({ ok: await valid(body.token) });

  if (!(await valid(body.token))) return fail('Unauthorized', 401);

  if (path === '/api/admin/save') {
    if (!body.config || JSON.stringify(body.config).length > 500000) return fail('Invalid config', 400);
    await s.setJSON('config', body.config);
    return out({ saved: true });
  }
  if (path === '/api/admin/image') {
    if (!body.data || !body.data.startsWith('data:image/') || body.data.length > 1500000) return fail('Image too large', 400);
    const id = randomUUID();
    await s.set('img-' + id, body.data);
    return out({ id });
  }
  if (path === '/api/admin/image-delete') {
    if (body.id && /^[a-f0-9-]{36}$/.test(body.id)) await s.delete('img-' + body.id);
    return out({ deleted: true });
  }
  if (path === '/api/admin/password') {
    const a = await getAuth();
    if (!a || !body.current || !matches(body.current, a)) return fail('Current password is wrong', 403);
    if (!body.next || body.next.length < 6) return fail('New password must be at least 6 characters', 400);
    const salt = randomBytes(16).toString('hex');
    await s.setJSON('auth', { salt, hash: hashPw(body.next, salt) });
    return out({ changed: true });
  }
  return fail('Not found', 404);
};

export const config: Config = { path: '/api/*' };
