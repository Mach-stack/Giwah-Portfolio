import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, Plus, Trash2, Upload, LogOut } from 'lucide-react';
import { api } from './api';

type Project = { id: string; title: string; desc: string; tools: string; imageId: string };
type Social = { label: string; url: string };
type Config = {
  name: string; greeting: string; tagline: string; blurb: string; points: string[]; strip: string;
  aboutKicker: string; aboutTitle: string; aboutText: string; projectsTitle: string; email: string;
  accent: string; blend: boolean; heroImageId: string; socials: Social[]; projects: Project[];
};

const HERO = '/resources/giwah-hero.jpg';

const DEFAULT: Config = {
  name: 'Giwah Ayisha',
  greeting: 'Hey, I am',
  tagline: 'Mechanical Engineering Student',
  blurb: 'Engineer by training, creator by passion. I design, build and tell stories on screen, on camera and on the runway.',
  points: ['Mechanical Engineering', 'Content Creation', 'Acting', 'Modelling'],
  strip: 'Content Creator, Actress, Model, Mechanical Engineer, Problem Solver',
  aboutKicker: 'Behind the Engineer',
  aboutTitle: 'Building Things That Make Life Simpler',
  aboutText: 'I am a mechanical engineering student who loves turning ideas into working machines. Outside the workshop I create content, act and model, because great engineering and great storytelling both start with curiosity.',
  projectsTitle: 'Engineering Projects',
  email: 'hello@example.com',
  accent: '#2f6bff',
  blend: false,
  heroImageId: '',
  socials: [{ label: 'Instagram', url: 'https://instagram.com' }, { label: 'LinkedIn', url: 'https://linkedin.com' }],
  projects: [],
};

const cache = new Map<string, string>();

function useImg(id: string): string {
  const [src, setSrc] = useState(cache.get(id) || '');
  useEffect(() => {
    if (!id) { setSrc(''); return; }
    const hit = cache.get(id);
    if (hit) { setSrc(hit); return; }
    api.get('/api/image/' + id)
      .then((r) => { cache.set(id, r.data.data); setSrc(r.data.data); })
      .catch(() => setSrc(''));
  }, [id]);
  return src;
}

function shrink(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      let q = 0.88;
      let d = c.toDataURL('image/jpeg', q);
      while (d.length > 1000000 && q > 0.3) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
      URL.revokeObjectURL(url);
      resolve(d);
    };
    im.onerror = () => reject(new Error('Could not read image'));
    im.src = url;
  });
}

function ProjectCard({ p }: { p: Project }) {
  const src = useImg(p.imageId);
  return (
    <article className="overflow-hidden rounded-3xl border border-[#1c2a52] bg-[#0e1527]">
      <div className="aspect-[4/3] bg-[#111c3a]">{src && <img src={src} alt={p.title} className="h-full w-full object-cover" />}</div>
      <div className="p-5">
        <h3 className="text-lg font-bold">{p.title}</h3>
        <p className="mt-2 text-sm text-slate-300">{p.desc}</p>
        {p.tools && <p className="mt-3 text-xs font-semibold" style={{ color: 'var(--a)' }}>{p.tools}</p>}
      </div>
    </article>
  );
}

function Site({ cfg }: { cfg: Config }) {
  const custom = useImg(cfg.heroImageId);
  const photo = custom || HERO;
  const parts = cfg.name.trim().split(' ');
  const first = parts[0] || '';
  const rest = parts.slice(1).join(' ');
  const strip = cfg.strip.split(',').map((s) => s.trim()).filter(Boolean);
  const mask = 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent), linear-gradient(to bottom, transparent, #000 8%)';
  return (
    <div style={{ '--a': cfg.accent } as CSSProperties}>
      <section className="mx-auto max-w-[1280px] p-3 md:p-6">
        <div className="hero relative min-h-[760px] overflow-hidden rounded-[36px] md:min-h-[720px]">
          <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10">
            <b className="text-lg">{cfg.name}</b>
            <div className="flex items-center gap-6 text-sm">
              <a href="#about" className="hidden md:block">About</a>
              <a href="#projects" className="hidden md:block">Projects</a>
              <a href={'mailto:' + cfg.email} className="pill">Get in touch<span><ArrowRight size={16} /></span></a>
            </div>
          </nav>
          <div
            className="absolute bottom-0 left-1/2 h-[78%] w-[min(700px,98%)] -translate-x-1/2 md:h-[92%]"
            style={{ maskImage: mask, maskComposite: 'intersect', WebkitMaskImage: mask, WebkitMaskComposite: 'source-in' }}
          >
            <img src={photo} alt={cfg.name} className="h-full w-full object-contain" style={{ objectPosition: '50% 100%', mixBlendMode: custom && cfg.blend ? 'multiply' : 'normal' }} />
          </div>
          <div className="relative z-10 px-6 pt-10 md:absolute md:left-10 md:top-[26%] md:px-0 md:pt-0">
            <p className="text-lg font-semibold">{cfg.greeting}</p>
            <h1 className="text-6xl font-extrabold leading-[0.95] md:text-8xl">{first}<br />{rest}</h1>
            <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-blue-100">{cfg.tagline}</p>
          </div>
          <div className="relative z-10 mt-[330px] max-w-[300px] px-6 md:absolute md:right-10 md:top-[32%] md:mt-0 md:px-0">
            <h2 className="text-xl font-bold leading-snug">About {parts[0]}</h2>
            <p className="mt-2 text-sm text-blue-100">{cfg.blurb}</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 hidden grid-cols-4 gap-4 px-10 pb-8 text-sm md:grid">
            {cfg.points.map((t, i) => (<div key={i}><b style={{ color: '#9ec2ff' }}>#0{i + 1}</b><div className="mt-1">{t}</div></div>))}
          </div>
        </div>
        <div className="-mt-10 flex items-center gap-6 overflow-x-auto rounded-b-[36px] bg-[#101624] px-6 pb-8 pt-16 text-sm">
          <span className="shrink-0 text-xs font-bold text-slate-400">Known as</span>
          {strip.map((s) => <span key={s} className="shrink-0 text-base font-bold">{s}</span>)}
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-[1180px] gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="font-bold" style={{ color: 'var(--a)' }}>{cfg.aboutKicker}</p>
          <h2 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">{cfg.aboutTitle}</h2>
        </div>
        <div>
          <p className="text-lg font-semibold leading-relaxed">{cfg.aboutText}</p>
          <a href={'mailto:' + cfg.email} className="pill mt-8" style={{ background: 'var(--a)', color: '#fff' }}>Get in touch<span style={{ background: '#fff', color: 'var(--a)' }}><ArrowRight size={16} /></span></a>
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-[1180px] px-6 pb-20">
        <h2 className="text-3xl font-extrabold md:text-4xl">{cfg.projectsTitle}</h2>
        {cfg.projects.length === 0 && <p className="mt-4 text-slate-400">Projects coming soon.</p>}
        <div className="mt-8 grid gap-6 md:grid-cols-3">{cfg.projects.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      </section>

      <footer className="border-t border-[#1c2a52] px-6 py-10 text-center text-sm text-slate-400">
        <div className="mb-3 flex justify-center gap-5">
          {cfg.socials.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-white">{s.label}</a>)}
        </div>
        <p>{cfg.name} - {new Date().getFullYear()}</p>
        <a href="#/admin" className="mt-2 inline-block text-xs opacity-60">Admin</a>
      </footer>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-xs font-semibold text-blue-200">{label}</span>{children}</label>);
}

function Admin({ cfg, claimed, onSaved }: { cfg: Config; claimed: boolean; onSaved: (c: Config) => void }) {
  const [token, setToken] = useState(() => { try { return localStorage.getItem('gw_token') || ''; } catch { return ''; } });
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState<Config>(cfg);
  const [isClaimed, setIsClaimed] = useState(claimed);
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const heroPreview = useImg(draft.heroImageId);

  useEffect(() => setDraft(cfg), [cfg]);
  useEffect(() => setIsClaimed(claimed), [claimed]);
  useEffect(() => {
    if (!token) return;
    api.post('/api/admin/check', { token }).then((r) => { if (!r.data.ok) logout(); }).catch(() => undefined);
  }, []);

  function logout() {
    try { localStorage.removeItem('gw_token'); } catch { /* ignore */ }
    setToken('');
  }
  function errText(e: unknown): string {
    const r = e as { response?: { data?: { error?: string } } };
    return r.response?.data?.error || 'Something went wrong';
  }
  async function enter() {
    setMsg('');
    try {
      const r = await api.post(isClaimed ? '/api/admin/login' : '/api/admin/claim', { password: pw });
      try { localStorage.setItem('gw_token', r.data.token); } catch { /* ignore */ }
      setToken(r.data.token);
      setIsClaimed(true);
      setPw('');
    } catch (e) { setMsg(errText(e)); }
  }
  async function save() {
    try {
      await api.post('/api/admin/save', { token, config: draft });
      onSaved(draft);
      setMsg('Saved. Your site is updated.');
    } catch (e) { setMsg(errText(e)); }
  }
  async function upload(file: File, max: number): Promise<string> {
    const data = await shrink(file, max);
    const r = await api.post('/api/admin/image', { token, data });
    cache.set(r.data.id, data);
    return r.data.id;
  }
  async function changePw() {
    try {
      await api.post('/api/admin/password', { token, current: pwOld, next: pwNew });
      setMsg('Password changed.'); setPwOld(''); setPwNew('');
    } catch (e) { setMsg(errText(e)); }
  }

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setDraft({ ...draft, [k]: v });
  const setProj = (i: number, patch: Partial<Project>) => set('projects', draft.projects.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  if (!token) {
    return (
      <div className="mx-auto mt-24 max-w-sm rounded-3xl border border-[#22325f] bg-[#0b1226] p-8">
        <h1 className="text-2xl font-extrabold">{isClaimed ? 'Admin login' : 'Claim this site'}</h1>
        <p className="mt-2 text-sm text-slate-400">{isClaimed ? 'Enter your password to edit the portfolio.' : 'No admin yet. Create a password (6+ characters) to become the owner of this site.'}</p>
        <input className="inp mt-5" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enter()} />
        <button className="btn mt-4 w-full" onClick={enter}>{isClaimed ? 'Log in' : 'Create password and claim'}</button>
        {msg && <p className="mt-3 text-sm text-red-300">{msg}</p>}
        <a href="#/" className="mt-5 block text-center text-xs text-slate-400">Back to site</a>
      </div>
    );
  }

  const fileBtn = (label: string, onFile: (f: File) => Promise<void>) => (
    <label className="btn ghost cursor-pointer"><Upload size={14} className="mr-1 inline" />{label}
      <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { await onFile(f); } catch (er) { setMsg(errText(er)); } } }} />
    </label>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Edit portfolio</h1>
        <div className="flex gap-2">
          <a href="#/" className="btn ghost">View site</a>
          <button className="btn ghost" onClick={logout}><LogOut size={14} className="inline" /> Log out</button>
        </div>
      </div>
      {msg && <p className="rounded-xl bg-[#13224a] p-3 text-sm">{msg}</p>}

      <div className="grid gap-4 rounded-3xl border border-[#22325f] bg-[#0b1226] p-5 md:grid-cols-2">
        <Row label="Name"><input className="inp" value={draft.name} onChange={(e) => set('name', e.target.value)} /></Row>
        <Row label="Greeting"><input className="inp" value={draft.greeting} onChange={(e) => set('greeting', e.target.value)} /></Row>
        <Row label="Title under name"><input className="inp" value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} /></Row>
        <Row label="Contact email"><input className="inp" value={draft.email} onChange={(e) => set('email', e.target.value)} /></Row>
        <div className="md:col-span-2"><Row label="About her (hero, right side)"><textarea className="inp" rows={3} value={draft.blurb} onChange={(e) => set('blurb', e.target.value)} /></Row></div>
        <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-4">
          {draft.points.map((t, i) => (<Row key={i} label={'Highlight #' + (i + 1)}><input className="inp" value={t} onChange={(e) => set('points', draft.points.map((x, j) => (j === i ? e.target.value : x)))} /></Row>))}
        </div>
        <div className="md:col-span-2"><Row label="Known-as strip (comma separated)"><input className="inp" value={draft.strip} onChange={(e) => set('strip', e.target.value)} /></Row></div>
        <Row label="Theme blue"><input className="inp h-11" type="color" value={draft.accent} onChange={(e) => set('accent', e.target.value)} /></Row>
        <Row label="Uploaded photo style">
          <select className="inp" value={draft.blend ? 'blue' : 'original'} onChange={(e) => set('blend', e.target.value === 'blue')}>
            <option value="original">Original colours</option>
            <option value="blue">Blend into blue (for white backgrounds)</option>
          </select>
        </Row>
        <div className="flex items-center gap-4 md:col-span-2">
          <img src={heroPreview || HERO} alt="Hero" className="h-20 w-16 rounded-lg object-cover object-top" />
          {fileBtn('Replace hero photo', async (f) => set('heroImageId', await upload(f, 1400)))}
          {draft.heroImageId && <button className="text-xs underline" onClick={() => set('heroImageId', '')}>Use original photo</button>}
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-[#22325f] bg-[#0b1226] p-5">
        <Row label="About section label"><input className="inp" value={draft.aboutKicker} onChange={(e) => set('aboutKicker', e.target.value)} /></Row>
        <Row label="About section heading"><input className="inp" value={draft.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} /></Row>
        <Row label="About section text"><textarea className="inp" rows={4} value={draft.aboutText} onChange={(e) => set('aboutText', e.target.value)} /></Row>
        <Row label="Projects heading"><input className="inp" value={draft.projectsTitle} onChange={(e) => set('projectsTitle', e.target.value)} /></Row>
      </div>

      <div className="space-y-4 rounded-3xl border border-[#22325f] bg-[#0b1226] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Engineering projects</h2>
          <button className="btn" onClick={() => set('projects', [...draft.projects, { id: String(Date.now()), title: 'New project', desc: '', tools: '', imageId: '' }])}><Plus size={14} className="inline" /> Add project</button>
        </div>
        {draft.projects.map((p, i) => (
          <div key={p.id} className="grid gap-3 rounded-2xl border border-[#22325f] p-4">
            <Row label="Title"><input className="inp" value={p.title} onChange={(e) => setProj(i, { title: e.target.value })} /></Row>
            <Row label="Description"><textarea className="inp" rows={3} value={p.desc} onChange={(e) => setProj(i, { desc: e.target.value })} /></Row>
            <Row label="Tools / skills"><input className="inp" value={p.tools} onChange={(e) => setProj(i, { tools: e.target.value })} /></Row>
            <div className="flex items-center gap-3">
              {fileBtn(p.imageId ? 'Replace image' : 'Upload image', async (f) => setProj(i, { imageId: await upload(f, 1200) }))}
              {p.imageId && <span className="text-xs text-green-300">Image attached</span>}
              <button className="ml-auto text-red-300" aria-label="Delete project" onClick={() => {
                if (window.confirm('Delete this project?')) {
                  if (p.imageId) api.post('/api/admin/image-delete', { token, id: p.imageId }).catch(() => undefined);
                  set('projects', draft.projects.filter((_, j) => j !== i));
                }
              }}><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-3xl border border-[#22325f] bg-[#0b1226] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Social links</h2>
          <button className="btn ghost" onClick={() => set('socials', [...draft.socials, { label: 'Link', url: 'https://' }])}>Add link</button>
        </div>
        {draft.socials.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input className="inp w-32" value={s.label} onChange={(e) => set('socials', draft.socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input className="inp" value={s.url} onChange={(e) => set('socials', draft.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <button className="text-red-300" aria-label="Remove link" onClick={() => set('socials', draft.socials.filter((_, j) => j !== i))}><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-3xl border border-[#22325f] bg-[#0b1226] p-5 md:grid-cols-3">
        <Row label="Current password"><input className="inp" type="password" value={pwOld} onChange={(e) => setPwOld(e.target.value)} /></Row>
        <Row label="New password"><input className="inp" type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} /></Row>
        <div className="flex items-end"><button className="btn ghost w-full" onClick={changePw}>Change password</button></div>
      </div>

      <div className="sticky bottom-4"><button className="btn w-full py-4 text-base shadow-xl" onClick={save}>Save all changes</button></div>
    </div>
  );
}

export default function App() {
  const [cfg, setCfg] = useState<Config>(DEFAULT);
  const [claimed, setClaimed] = useState(false);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const h = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  useEffect(() => {
    api.get('/api/site')
      .then((r) => { if (r.data.config) setCfg({ ...DEFAULT, ...r.data.config }); setClaimed(!!r.data.claimed); })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <div className="grid min-h-screen place-items-center text-slate-400">Loading...</div>;
  if (route.startsWith('#/admin')) return <div style={{ '--a': cfg.accent } as CSSProperties}><Admin cfg={cfg} claimed={claimed} onSaved={setCfg} /></div>;
  return <Site cfg={cfg} />;
}
