import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

type Body = { name?: string; email?: string; message?: string; website?: string; file?: string; fileName?: string; key?: string; token?: string; password?: string; current?: string; next?: string; config?: unknown; data?: string; id?: string };
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
    return out({ config, claimed: !!(await getAuth()), hasCv: !!(await s.get('cvmeta')) });
  }
  if (req.method === 'GET' && path.startsWith('/api/image/')) {
    const id = path.split('/').pop() || '';
    if (!/^[a-f0-9-]{36}$/.test(id)) return fail('Not found', 404);
    const data = await s.get('img-' + id);
    return data ? out({ data }) : fail('Not found', 404);
  }
  if (req.method === 'GET' && path === '/api/cv') {
    const b64 = await s.get('cv');
    const meta = (await s.get('cvmeta', { type: 'json' })) as { name?: string } | null;
    if (!b64) return fail('Not found', 404);
    const name = (meta?.name || 'CV.pdf').replace(/[^A-Za-z0-9._-]/g, '_');
    return new Response(Buffer.from(b64, 'base64'), { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${name}"` } });
  }
  if (req.method !== 'POST') return fail('Not found', 404);

  const body = (await req.json().catch(() => ({}))) as Body;

  if (path === '/api/visit') {
    const st = ((await s.get('stats', { type: 'json' })) as { total: number; days: Record<string, number> } | null) || { total: 0, days: {} };
    const day = new Date().toISOString().slice(0, 10);
    st.total += 1;
    st.days[day] = (st.days[day] || 0) + 1;
    const keep = Object.keys(st.days).sort().slice(-30);
    st.days = Object.fromEntries(keep.map((k) => [k, st.days[k]]));
    await s.setJSON('stats', st);
    return out({ ok: true });
  }
  if (path === '/api/contact') {
    if (body.website) return out({ ok: true });
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const message = (body.message || '').trim();
    if (!name || name.length > 100) return fail('Please enter your name', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return fail('Please enter a valid email', 400);
    if (message.length < 5 || message.length > 3000) return fail('Message must be 5 to 3000 characters', 400);
    const { blobs } = await s.list({ prefix: 'msg-' });
    if (blobs.length >= 200) return fail('Inbox is full, please try again later', 429);
    await s.setJSON('msg-' + Date.now() + '-' + randomBytes(3).toString('hex'), { name, email, message, at: Date.now() });
    return out({ ok: true });
  }
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
  if (path === '/api/admin/inbox') {
    const { blobs } = await s.list({ prefix: 'msg-' });
    const keys = blobs.map((b) => b.key).sort().reverse();
    const messages = await Promise.all(keys.map(async (key) => ({ key, ...((await s.get(key, { type: 'json' })) as object) })));
    const st = ((await s.get('stats', { type: 'json' })) as { total: number; days: Record<string, number> } | null) || { total: 0, days: {} };
    return out({ messages, stats: { total: st.total, today: st.days[new Date().toISOString().slice(0, 10)] || 0 } });
  }
  if (path === '/api/admin/message-delete') {
    if (body.key && /^msg-\d+-[a-f0-9]+$/.test(body.key)) await s.delete(body.key);
    return out({ deleted: true });
  }
  if (path === '/api/admin/cv') {
    const pre = 'data:application/pdf;base64,';
    if (!body.file || !body.file.startsWith(pre) || body.file.length > 5000000) return fail('CV must be a PDF under 3.5 MB', 400);
    await s.set('cv', body.file.slice(pre.length));
    await s.setJSON('cvmeta', { name: (body.fileName || 'CV.pdf').slice(0, 80) });
    return out({ saved: true });
  }
  if (path === '/api/admin/cv-delete') {
    await s.delete('cv');
    await s.delete('cvmeta');
    return out({ deleted: true });
  }
  return fail('Not found', 404);
};

export const config: Config = { path: '/api/*' };
