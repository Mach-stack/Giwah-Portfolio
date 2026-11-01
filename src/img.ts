import { useEffect, useState } from 'react';
import { api } from './api';

export const cache = new Map<string, string>();

export function useImg(id: string): string {
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

export function shrink(file: File, max: number): Promise<string> {
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
