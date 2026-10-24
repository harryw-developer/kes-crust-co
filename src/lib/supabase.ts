// Tiny Supabase REST client (no SDK, keeps the page light). Used at build time
// for the instant snapshot and in the browser for live data.
// The publishable key is meant to be public; the database rules decide what it can do.
import type { Pitch } from './dates';

export const SUPABASE_URL = 'https://hscrebmqjapqxdhaylod.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_YnJ_7_xPLACDanPkk6pyVg_IV37K55s';

const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };

async function request(path: string, init: RequestInit = {}, timeout = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(`${SUPABASE_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) }, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function select<T>(path: string): Promise<T> {
  const res = await request(`/rest/v1/${path}`);
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

/** Insert a row the public is allowed to send. Duplicates (e.g. same email twice) count as success. */
export async function insert(table: string, row: Record<string, unknown>) {
  const res = await request(`/rest/v1/${table}`, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!res.ok && res.status !== 409) throw new Error(`Supabase ${res.status}`);
}

export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }, 15000);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Something went wrong (${res.status})`);
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') throw new Error(data.error);
  return data as T;
}

// ---------- Shapes ----------
export type EventRow = {
  id: string; date: string; start_time: string; end_time: string; name: string;
  area: string; address: string; note: string; published?: boolean;
};
export type MenuItem = {
  id: string; category: 'pizza' | 'drink' | 'side' | 'sweet'; name: string; price: number; description: string;
  ingredients: string[]; tags: string[]; contains: string[]; mayContain: string[]; available: boolean; sort?: number;
  art: Record<string, any>;
};
type MenuRow = Omit<MenuItem, 'mayContain' | 'price'> & { may_contain: string[]; price: number | string };

export const toPitch = (r: EventRow): Pitch => ({
  id: r.id, date: r.date, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5),
  name: r.name, area: r.area || '', address: r.address || '', note: r.note || '',
});
export const toItem = (r: MenuRow): MenuItem => ({
  id: r.id, category: r.category, name: r.name, price: Number(r.price), description: r.description || '',
  ingredients: r.ingredients || [], tags: r.tags || [], contains: r.contains || [], mayContain: r.may_contain || [],
  available: r.available !== false, sort: r.sort, art: r.art || {},
});

export async function loadPitches(): Promise<Pitch[]> {
  const since = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const rows = await select<EventRow[]>(`events?select=id,date,start_time,end_time,name,area,address,note&date=gte.${since}&order=date.asc,start_time.asc`);
  return rows.map(toPitch);
}

export async function loadMenu(): Promise<MenuItem[]> {
  const rows = await select<MenuRow[]>('menu_items?select=*&order=sort.asc,name.asc');
  return rows.map(toItem);
}
