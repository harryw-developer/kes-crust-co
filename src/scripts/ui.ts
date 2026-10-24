// Small shared helpers used by the page scripts.
import { ics, type Pitch } from '../lib/dates';
const root = document.documentElement;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isCalm = () => root.hasAttribute('data-calm');
export const motionOK = () => !reducedMotion() && !isCalm();

let toastTimer = 0;
export function toast(msg: string, ms = 2600) {
  const el = document.querySelector<HTMLElement>('.toast');
  if (!el) return;
  el.hidden = true;
  el.textContent = msg;
  // re-trigger the pop-in animation
  void el.offsetWidth;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), ms);
}

export function store<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

// ---- Favourites ----
const FAVES = 'kes-faves';
export const getFaves = () => store<string[]>(FAVES, []);
export function setFaves(ids: string[]) {
  save(FAVES, ids);
  renderFaveCount();
  document.dispatchEvent(new CustomEvent('faves:change', { detail: ids }));
}
export function renderFaveCount() {
  const n = getFaves().length;
  document.querySelectorAll<HTMLElement>('[data-fave-count]').forEach((el) => {
    el.textContent = String(n);
    el.toggleAttribute('data-empty', n === 0);
  });
  document.querySelectorAll<HTMLElement>('[data-fave-target]').forEach((el) =>
    el.setAttribute('aria-label', n ? `Your favourite pizzas (${n})` : 'Your favourite pizzas'),
  );
}

// "A slice flies into the icon, which bounces" (400ms)
export function flySlice(from: Element) {
  const target = [...document.querySelectorAll<HTMLElement>('[data-fave-target]')].find((t) => t.offsetParent !== null);
  if (!target) return;
  const bounce = () => {
    target.classList.remove('is-bounce');
    void target.offsetWidth;
    target.classList.add('is-bounce');
  };
  if (!motionOK()) return bounce();
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const slice = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  slice.setAttribute('viewBox', '0 0 32 32');
  slice.innerHTML = '<use href="#i-slice"/>';
  Object.assign(slice.style, { position: 'fixed', left: '0', top: '0', width: '34px', height: '34px', zIndex: '1100', pointerEvents: 'none' });
  document.body.append(slice);
  const x0 = a.left + a.width / 2 - 17, y0 = a.top + a.height / 2 - 17;
  const x1 = b.left + b.width / 2 - 17, y1 = b.top + b.height / 2 - 17;
  const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 120;
  slice
    .animate(
      [
        { transform: `translate(${x0}px,${y0}px) scale(1) rotate(0deg)` },
        { transform: `translate(${mx}px,${my}px) scale(1.5) rotate(200deg)`, offset: 0.5 },
        { transform: `translate(${x1}px,${y1}px) scale(0.4) rotate(380deg)` },
      ],
      { duration: 400, easing: 'cubic-bezier(.45,0,.55,1)' },
    )
    .finished.then(() => {
      slice.remove();
      bounce();
    });
}

export async function confetti(opts: Parameters<typeof import('./confetti').burst>[0] = {}) {
  if (!motionOK()) return;
  const m = await import('./confetti');
  m.burst(opts);
}

// Forms save straight into Supabase (the public can add rows, never read them).
export async function postForm(form: HTMLFormElement) {
  const d = new FormData(form);
  if (d.get('bot-field')) return; // honeypot filled in: quietly pretend it worked
  const s = (k: string) => String(d.get(k) ?? '').trim();
  const { insert } = await import('../lib/supabase');
  if (form.name === 'crust-club') {
    await insert('subscribers', { email: s('email'), source: 'footer' });
  } else if (form.name === 'enquiry') {
    await insert('enquiries', {
      occasion: s('occasion'), event_date: s('date') || null, guests: s('guests'), location: s('location'),
      details: s('details'), name: s('name'), email: s('email'), phone: s('phone'), crust_club: d.get('crust-club') === 'yes',
    });
    if (d.get('crust-club') === 'yes') await insert('subscribers', { email: s('email'), source: 'enquiry' }).catch(() => {});
  }
}

// Stickers and cards "slap" on as they scroll into view. Call again for freshly rendered markup.
let io: IntersectionObserver | undefined;
export function observeReveals(root: ParentNode = document) {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('is-in');
        io!.unobserve(en.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  root.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)').forEach((el) => {
    const group = el.closest('[data-reveal-group]');
    if (group) el.style.setProperty('--i', String([...group.querySelectorAll('[data-reveal]')].indexOf(el) % 8));
    if (!el.style.getPropertyValue('--rf')) el.style.setProperty('--rf', `${(Math.random() * 14 - 7).toFixed(1)}deg`);
    io!.observe(el);
  });
}

export function downloadIcs(p: Pitch) {
  const url = URL.createObjectURL(new Blob([ics(p)], { type: 'text/calendar;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `kes-crust-co-${p.date}.ics` });
  a.dataset.noWipe = '';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
