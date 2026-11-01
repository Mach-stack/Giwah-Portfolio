import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Trash2, Upload, Download } from 'lucide-react';
import { api } from './api';
import { useImg } from './img';

export type Project = { id: string; title: string; desc: string; tools: string; imageId: string; problem: string; results: string; gallery: string[] };
type Experience = { title: string; org: string; period: string; desc: string };
type Testimonial = { quote: string; author: string };
type GalleryItem = { id: string; imageId: string; caption: string };
type Video = { id: string; title: string; url: string };
export type Extras = {
  skills: string; experience: Experience[]; testimonials: Testimonial[]; brands: string;
  gallery: GalleryItem[]; galleryTitle: string; videos: Video[]; videosTitle: string;
  hasCv: boolean; contactTitle: string; contactText: string;
};
type Cfg = Extras & { name: string; accent: string; email: string; projects: Project[] };

export const BLANK_PROJECT: Project = { id: '', title: '', desc: '', tools: '', imageId: '', problem: '', results: '', gallery: [] };

export const DEFAULT_EXTRAS: Extras = {
  skills: 'SolidWorks, AutoCAD, MATLAB, 3D Printing, Thermodynamics, Public Speaking',
  experience: [], testimonials: [], brands: '',
  gallery: [], galleryTitle: 'Gallery', videos: [], videosTitle: 'Showreel',
  hasCv: false,
  contactTitle: "Let's work together",
  contactText: 'Brands, casting directors, recruiters and collaborators: send me a message and I will reply as soon as I can.',
};

export function trackVisit() {
  try {
    if (sessionStorage.getItem('gw_seen')) return;
    sessionStorage.setItem('gw_seen', '1');
  } catch { /* ignore */ }
  api.post('/api/visit', {}).catch(() => undefined);
}

const errText = (e: unknown) => (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Something went wrong';

function ytEmbed(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m ? 'https://www.youtube.com/embed/' + m[1] : null;
}

function Pic({ id, alt, className }: { id: string; alt: string; className?: string }) {
  const src = useImg(id);
  return src ? <img src={src} alt={alt} className={className} /> : <div className={className + ' bg-[#111c3a]'} />;
}

function Lightbox({ id, onClose }: { id: string; onClose: () => void }) {
  const src = useImg(id);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={onClose}>
      {src && <img src={src} alt="" className="max-h-full max-w-full rounded-xl object-contain" />}
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="text-3xl font-extrabold md:text-4xl">{children}</h2>;
}

function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', message: '', website: '' });
  const [state, setState] = useState('');
  async function send() {
    setState('sending');
    try {
      await api.post('/api/contact', f);
      setState('sent');
      setF({ name: '', email: '', message: '', website: '' });
    } catch (e) { setState(errText(e)); }
  }
  if (state === 'sent') return <p className="rounded-2xl bg-[#13224a] p-5 font-semibold">Thank you! Your message has been sent.</p>;
  return (
    <div className="grid gap-3">
      <input className="inp" placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className="inp" placeholder="Your email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <textarea className="inp" rows={5} placeholder="Your message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} aria-hidden="true" />
      <button className="btn" onClick={send} disabled={state === 'sending'}>{state === 'sending' ? 'Sending...' : 'Send message'}</button>
      {state && state !== 'sending' && <p className="text-sm text-red-300">{state}</p>}
    </div>
  );
}

export function MoreSections({ cfg }: { cfg: Cfg }) {
  const [open, setOpen] = useState('');
  const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  const brands = list(cfg.brands);
  const skills = list(cfg.skills);
  return (
    <div>
      {brands.length > 0 && (
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-8 gap-y-3 px-6 pb-16">
          <span className="text-xs font-bold text-slate-400">Worked with</span>
          {brands.map((b) => <span key={b} className="text-lg font-extrabold">{b}</span>)}
        </div>
      )}

      {(skills.length > 0 || cfg.experience.length > 0) && (
        <section className="mx-auto grid max-w-[1180px] gap-10 px-6 pb-20 md:grid-cols-2">
          <div>
            <Title>Skills</Title>
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((s) => <span key={s} className="rounded-full border border-[#2b3f7d] px-4 py-2 text-sm font-semibold">{s}</span>)}
            </div>
          </div>
          <div>
            <Title>Experience</Title>
            <div className="mt-6 space-y-5">
              {cfg.experience.map((x, i) => (
                <div key={i} className="border-l-2 pl-4" style={{ borderColor: 'var(--a)' }}>
                  <p className="font-bold">{x.title}</p>
                  <p className="text-sm text-slate-400">{x.org} {x.period && '| ' + x.period}</p>
                  {x.desc && <p className="mt-1 text-sm text-slate-300">{x.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {cfg.gallery.length > 0 && (
        <section id="gallery" className="mx-auto max-w-[1180px] px-6 pb-20">
          <Title>{cfg.galleryTitle}</Title>
          <div className="mt-8 columns-2 gap-4 md:columns-3">
            {cfg.gallery.map((g) => (
              <button key={g.id} className="mb-4 block w-full overflow-hidden rounded-2xl text-left" onClick={() => setOpen(g.imageId)}>
                <Pic id={g.imageId} alt={g.caption} className="w-full object-cover" />
                {g.caption && <span className="block bg-[#0e1527] px-3 py-2 text-xs text-slate-300">{g.caption}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {cfg.videos.length > 0 && (
        <section id="showreel" className="mx-auto max-w-[1180px] px-6 pb-20">
          <Title>{cfg.videosTitle}</Title>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {cfg.videos.map((v) => {
              const e = ytEmbed(v.url);
              return (
                <div key={v.id} className="overflow-hidden rounded-3xl border border-[#1c2a52] bg-[#0e1527]">
                  {e ? <iframe className="aspect-video w-full" src={e} title={v.title} allowFullScreen loading="lazy" />
                    : <a href={v.url} target="_blank" rel="noreferrer" className="grid aspect-video place-items-center text-sm font-bold underline">Watch on the original site</a>}
                  <p className="p-4 font-bold">{v.title}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {cfg.testimonials.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-6 pb-20">
          <Title>Kind words</Title>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {cfg.testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-3xl border border-[#1c2a52] bg-[#0e1527] p-6">
                <p className="text-lg font-semibold leading-relaxed">"{t.quote}"</p>
                <footer className="mt-3 text-sm font-bold" style={{ color: 'var(--a)' }}>{t.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section id="contact" className="mx-auto grid max-w-[1180px] gap-10 px-6 pb-24 md:grid-cols-2">
        <div>
          <Title>{cfg.contactTitle}</Title>
          <p className="mt-4 text-slate-300">{cfg.contactText}</p>
          {cfg.hasCv && <a href="/api/cv" className="pill mt-6">Download CV<span><Download size={16} /></span></a>}
        </div>
        <ContactForm />
      </section>
      {open && <Lightbox id={open} onClose={() => setOpen('')} />}
    </div>
  );
}

export function ProjectPage({ cfg, id }: { cfg: Cfg; id: string }) {
  const p = cfg.projects.find((x) => x.id === id);
  const [open, setOpen] = useState('');
  useEffect(() => window.scrollTo(0, 0), [id]);
  return (
    <div style={{ '--a': cfg.accent } as CSSProperties} className="mx-auto max-w-[900px] px-6 py-10">
      <a href="#/" className="text-sm font-bold" style={{ color: 'var(--a)' }}>Back to portfolio</a>
      {!p ? <p className="mt-10 text-slate-400">Project not found.</p> : (
        <div className="mt-6 space-y-6">
          <h1 className="text-4xl font-extrabold md:text-5xl">{p.title}</h1>
          {p.tools && <p className="text-sm font-bold" style={{ color: 'var(--a)' }}>{p.tools}</p>}
          {p.imageId && <Pic id={p.imageId} alt={p.title} className="w-full rounded-3xl object-cover" />}
          {p.desc && <p className="text-lg leading-relaxed text-slate-200">{p.desc}</p>}
          {p.problem && <div><h2 className="text-xl font-bold">The problem</h2><p className="mt-2 text-slate-300">{p.problem}</p></div>}
          {p.results && <div><h2 className="text-xl font-bold">Results</h2><p className="mt-2 text-slate-300">{p.results}</p></div>}
          {(p.gallery || []).length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {p.gallery.map((g) => <button key={g} onClick={() => setOpen(g)}><Pic id={g} alt="" className="aspect-square w-full rounded-2xl object-cover" /></button>)}
            </div>
          )}
        </div>
      )}
      {open && <Lightbox id={open} onClose={() => setOpen('')} />}
    </div>
  );
}

function F({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-blue-200">{label}</span>{children}</label>;
}

function Pick({ label, onFile }: { label: string; onFile: (f: File) => Promise<void> }) {
  return (
    <label className="btn ghost cursor-pointer"><Upload size={14} className="mr-1 inline" />{label}
      <input type="file" accept="image/*" hidden multiple onChange={async (e) => { for (const f of Array.from(e.target.files || [])) await onFile(f); e.target.value = ''; }} />
    </label>
  );
}

export function ProjectExtraEditor({ p, onChange, upload, setMsg }: { p: Project; onChange: (patch: Partial<Project>) => void; upload: (f: File, max: number) => Promise<string>; setMsg: (m: string) => void }) {
  const gal = p.gallery || [];
  return (
    <div className="grid gap-3">
      <F label="The problem it solved"><textarea className="inp" rows={2} value={p.problem || ''} onChange={(e) => onChange({ problem: e.target.value })} /></F>
      <F label="Results"><textarea className="inp" rows={2} value={p.results || ''} onChange={(e) => onChange({ results: e.target.value })} /></F>
      <div className="flex flex-wrap items-center gap-2">
        <Pick label="Add more photos" onFile={async (f) => { try { const id = await upload(f, 1200); onChange({ gallery: [...gal, id] }); } catch (er) { setMsg(errText(er)); } }} />
        <span className="text-xs text-slate-400">{gal.length} extra photos</span>
        {gal.length > 0 && <button className="text-xs text-red-300 underline" onClick={() => onChange({ gallery: [] })}>Clear extra photos</button>}
      </div>
    </div>
  );
}

type Msg = { key: string; name: string; email: string; message: string; at: number };

export function AdminExtras({ draft, patch, token, upload, setMsg }: { draft: Cfg; patch: (p: Partial<Extras>) => void; token: string; upload: (f: File, max: number) => Promise<string>; setMsg: (m: string) => void }) {
  const [inbox, setInbox] = useState<Msg[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const box = 'space-y-4 rounded-3xl border border-[#22325f] bg-[#0b1226] p-5';
  const load = () => api.post('/api/admin/inbox', { token }).then((r) => { setInbox(r.data.messages); setStats(r.data.stats); }).catch(() => undefined);
  useEffect(() => { load(); }, []);

  async function uploadCv(file: File) {
    if (file.size > 3500000) { setMsg('CV is too large. Keep the PDF under 3.5 MB.'); return; }
    const data: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('read')); r.readAsDataURL(file); });
    try {
      await api.post('/api/admin/cv', { token, file: data, fileName: file.name });
      patch({ hasCv: true });
      setMsg('CV uploaded. It is live now.');
    } catch (e) { setMsg(errText(e)); }
  }

  const up = <T,>(arr: T[], i: number, v: Partial<T>) => arr.map((x, j) => (j === i ? { ...x, ...v } : x));

  return (
    <>
      <div className={box}>
        <h2 className="font-bold">Visitors and messages</h2>
        <p className="text-sm text-slate-300">Total visits: <b>{stats.total}</b> | Today: <b>{stats.today}</b></p>
        {inbox.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
        {inbox.map((m) => (
          <div key={m.key} className="rounded-2xl border border-[#22325f] p-4 text-sm">
            <div className="flex items-center justify-between"><b>{m.name}</b>
              <button aria-label="Delete message" className="text-red-300" onClick={async () => { await api.post('/api/admin/message-delete', { token, key: m.key }).catch(() => undefined); load(); }}><Trash2 size={16} /></button>
            </div>
            <a className="text-xs underline" style={{ color: '#9ec2ff' }} href={'mailto:' + m.email}>{m.email}</a>
            <p className="mt-2 whitespace-pre-wrap text-slate-200">{m.message}</p>
            <p className="mt-2 text-xs text-slate-500">{new Date(m.at).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className={box}>
        <h2 className="font-bold">CV (PDF)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn ghost cursor-pointer"><Upload size={14} className="mr-1 inline" />{draft.hasCv ? 'Replace CV' : 'Upload CV'}
            <input type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCv(f); }} />
          </label>
          {draft.hasCv && <button className="text-xs text-red-300 underline" onClick={async () => { await api.post('/api/admin/cv-delete', { token }).catch(() => undefined); patch({ hasCv: false }); }}>Remove CV</button>}
          <span className="text-xs text-slate-400">{draft.hasCv ? 'A Download CV button is showing on the site.' : 'No CV uploaded.'}</span>
        </div>
      </div>

      <div className={box}>
        <h2 className="font-bold">Gallery</h2>
        <F label="Gallery heading"><input className="inp" value={draft.galleryTitle} onChange={(e) => patch({ galleryTitle: e.target.value })} /></F>
        <Pick label="Add photos" onFile={async (f) => { try { const imageId = await upload(f, 1400); patch({ gallery: [...draft.gallery, { id: String(Date.now()) + Math.random().toString(16).slice(2, 6), imageId, caption: '' }] }); } catch (er) { setMsg(errText(er)); } }} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {draft.gallery.map((g, i) => (
            <div key={g.id} className="space-y-2">
              <Pic id={g.imageId} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <input className="inp" placeholder="Caption" value={g.caption} onChange={(e) => patch({ gallery: up(draft.gallery, i, { caption: e.target.value }) })} />
              <button className="text-xs text-red-300 underline" onClick={() => patch({ gallery: draft.gallery.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className={box}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Showreel videos</h2>
          <button className="btn ghost" onClick={() => patch({ videos: [...draft.videos, { id: String(Date.now()), title: 'New video', url: 'https://' }] })}>Add video</button>
        </div>
        <F label="Showreel heading"><input className="inp" value={draft.videosTitle} onChange={(e) => patch({ videosTitle: e.target.value })} /></F>
        <p className="text-xs text-slate-400">YouTube links play on the site. Other links (Instagram, TikTok) show as a link.</p>
        {draft.videos.map((v, i) => (
          <div key={v.id} className="flex gap-2">
            <input className="inp w-40" value={v.title} onChange={(e) => patch({ videos: up(draft.videos, i, { title: e.target.value }) })} />
            <input className="inp" value={v.url} onChange={(e) => patch({ videos: up(draft.videos, i, { url: e.target.value }) })} />
            <button className="text-red-300" aria-label="Remove video" onClick={() => patch({ videos: draft.videos.filter((_, j) => j !== i) })}><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      <div className={box}>
        <h2 className="font-bold">Skills, experience and brands</h2>
        <F label="Skills (comma separated)"><input className="inp" value={draft.skills} onChange={(e) => patch({ skills: e.target.value })} /></F>
        <F label="Brands or clients worked with (comma separated)"><input className="inp" value={draft.brands} onChange={(e) => patch({ brands: e.target.value })} /></F>
        <button className="btn ghost" onClick={() => patch({ experience: [...draft.experience, { title: 'Role or education', org: '', period: '', desc: '' }] })}>Add experience</button>
        {draft.experience.map((x, i) => (
          <div key={i} className="grid gap-2 rounded-2xl border border-[#22325f] p-3">
            <input className="inp" placeholder="Title" value={x.title} onChange={(e) => patch({ experience: up(draft.experience, i, { title: e.target.value }) })} />
            <div className="flex gap-2">
              <input className="inp" placeholder="Organisation" value={x.org} onChange={(e) => patch({ experience: up(draft.experience, i, { org: e.target.value }) })} />
              <input className="inp" placeholder="Period" value={x.period} onChange={(e) => patch({ experience: up(draft.experience, i, { period: e.target.value }) })} />
            </div>
            <textarea className="inp" rows={2} placeholder="Details" value={x.desc} onChange={(e) => patch({ experience: up(draft.experience, i, { desc: e.target.value }) })} />
            <button className="text-left text-xs text-red-300 underline" onClick={() => patch({ experience: draft.experience.filter((_, j) => j !== i) })}>Remove</button>
          </div>
        ))}
      </div>

      <div className={box}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Testimonials</h2>
          <button className="btn ghost" onClick={() => patch({ testimonials: [...draft.testimonials, { quote: '', author: '' }] })}>Add testimonial</button>
        </div>
        {draft.testimonials.map((t, i) => (
          <div key={i} className="grid gap-2 rounded-2xl border border-[#22325f] p-3">
            <textarea className="inp" rows={2} placeholder="What they said" value={t.quote} onChange={(e) => patch({ testimonials: up(draft.testimonials, i, { quote: e.target.value }) })} />
            <input className="inp" placeholder="Who said it" value={t.author} onChange={(e) => patch({ testimonials: up(draft.testimonials, i, { author: e.target.value }) })} />
            <button className="text-left text-xs text-red-300 underline" onClick={() => patch({ testimonials: draft.testimonials.filter((_, j) => j !== i) })}>Remove</button>
          </div>
        ))}
      </div>

      <div className={box}>
        <h2 className="font-bold">Contact section</h2>
        <F label="Heading"><input className="inp" value={draft.contactTitle} onChange={(e) => patch({ contactTitle: e.target.value })} /></F>
        <F label="Text"><textarea className="inp" rows={3} value={draft.contactText} onChange={(e) => patch({ contactText: e.target.value })} /></F>
      </div>
    </>
  );
}
