async function wrap(r: Response) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw { response: { data } };
  return { data };
}

export const api = {
  get: async (url: string) => wrap(await fetch(url)),
  post: async (url: string, body: unknown) =>
    wrap(await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })),
};
