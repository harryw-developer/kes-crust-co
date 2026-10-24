// Live data in the browser. Cached for a minute per tab so hopping between pages is instant.
import { loadMenu, loadPitches, type MenuItem } from '../lib/supabase';
import { upcoming, type Pitch } from '../lib/dates';

async function cached<T>(key: string, load: () => Promise<T>): Promise<T | null> {
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (hit && Date.now() - hit.t < 60_000) return hit.v as T;
  } catch {}
  try {
    const v = await load();
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch {}
    return v;
  } catch {
    return null; // offline or database down: keep showing the built-in snapshot
  }
}

export const livePitches = async () => {
  const v = await cached<Pitch[]>('kes-live-dates', loadPitches);
  return v ? upcoming(v) : null;
};
export const liveMenu = () => cached<MenuItem[]>('kes-live-menu', loadMenu);

/** Read the snapshot JSON the build embedded in the page. */
export const snapshot = <T>(id: string): T => JSON.parse(document.getElementById(id)?.textContent || 'null');
export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Replace FoodEvent structured data with the live list (Google reads JSON-LD added by script). */
export function updateEventSchema(schema: object[]) {
  let el = document.getElementById('live-events-ld');
  if (!el) {
    el = document.createElement('script');
    el.id = 'live-events-ld';
    (el as HTMLScriptElement).type = 'application/ld+json';
    document.head.append(el);
  }
  el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': schema });
}
