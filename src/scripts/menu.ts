// Menu: live items from Supabase, filter chips that bounce and re-sort the grid,
// flip cards, favourites, and an order tally to show at the van.
import { flySlice, getFaves, motionOK, observeReveals, save, setFaves, store, toast } from './ui';
import { initFlips } from './flip';
import { matrixRows, menuCard } from '../lib/render';
import { price } from '../lib/allergens';
import { liveMenu, same, snapshot } from './live';
import type { MenuItem } from '../lib/supabase';

const grid = document.querySelector<HTMLElement>('[data-menu-grid]')!;
const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
const status = document.querySelector<HTMLElement>('[data-filter-status]')!;
const empty = document.querySelector<HTMLElement>('[data-menu-empty]')!;
let items = snapshot<MenuItem[]>('snap-menu') || [];
let cards: HTMLElement[] = [];
let original: HTMLElement[] = [];
let current = 'all';

const matches = (card: HTMLElement, f: string) =>
  f === 'all' ? true
    : f === 'faves' ? getFaves().includes(card.dataset.id!)
    : f.startsWith('cat:') ? card.dataset.category === f.slice(4)
    : (card.dataset.tags || '').split(' ').includes(f);

function collect() {
  cards = [...grid.querySelectorAll<HTMLElement>('[data-item]')];
  original = [...cards];
}

function apply(filter: string, animate = true) {
  current = filter;
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));
  const first = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
  const sorted = [...original].sort((a, b) => Number(matches(b, filter)) - Number(matches(a, filter)));
  sorted.forEach((c) => grid.append(c));
  let shown = 0;
  cards.forEach((c) => {
    const ok = matches(c, filter);
    c.classList.toggle('is-hidden', !ok);
    if (ok) shown++;
  });
  empty.hidden = shown > 0;
  const msg = empty.querySelector('[data-empty-msg]');
  if (msg) msg.textContent = filter === 'faves' ? 'No faves yet. Tap the heart on something tasty to save it here.' : 'Nothing matches. Try another filter.';
  status.textContent = `${shown} item${shown === 1 ? '' : 's'} shown`;
  if (!animate || !motionOK()) return;
  cards.forEach((c, i) => {
    if (c.classList.contains('is-hidden')) return;
    const a = first.get(c)!, b = c.getBoundingClientRect();
    if (a.width === 0) {
      c.animate([{ opacity: 0, transform: 'scale(.7) rotate(-6deg)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * 30, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
    } else if (a.left !== b.left || a.top !== b.top) {
      c.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.34,1.4,.64,1)' });
    }
  });
}

chips.forEach((chip) =>
  chip.addEventListener('click', () => {
    chip.classList.remove('is-bounce');
    void chip.offsetWidth;
    chip.classList.add('is-bounce');
    apply(chip.dataset.filter!);
  }),
);

/* ---------- Favourites ---------- */
function syncFaveButtons() {
  const faves = getFaves();
  grid.querySelectorAll<HTMLButtonElement>('[data-fave]').forEach((b) => {
    const on = faves.includes(b.dataset.fave!);
    b.setAttribute('aria-pressed', String(on));
    const name = b.closest<HTMLElement>('[data-item]')?.dataset.name ?? 'this';
    b.setAttribute('aria-label', on ? `Remove ${name} from favourites` : `Add ${name} to favourites`);
  });
}

/* ---------- Order tally ---------- */
type Order = Record<string, number>;
let order = store<Order>('kes-order', {});
const bar = document.querySelector<HTMLElement>('[data-order-bar]')!;
const dialog = document.querySelector<HTMLDialogElement>('[data-order-dialog]')!;

function renderOrder(bump = false) {
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const id of Object.keys(order)) if (!byId.has(id) || order[id] <= 0) delete order[id];
  save('kes-order', order);
  let count = 0, total = 0;
  const lines: string[] = [];
  for (const [id, n] of Object.entries(order)) {
    const it = byId.get(id)!;
    count += n;
    total += n * it.price;
    lines.push(`${n} × ${it.name}`);
  }
  grid.querySelectorAll<HTMLElement>('[data-item]').forEach((card) => {
    const n = order[card.dataset.id!] || 0;
    const out = card.querySelector('[data-qty-n]')!;
    if (out.textContent !== String(n) && bump && motionOK()) {
      out.classList.remove('is-bump'); void (out as HTMLElement).offsetWidth; out.classList.add('is-bump');
    }
    out.textContent = String(n);
    card.classList.toggle('has-qty', n > 0);
  });
  bar.hidden = count === 0;
  bar.querySelector('[data-order-summary]')!.textContent = `${count} item${count === 1 ? '' : 's'}`;
  bar.setAttribute('aria-label', `Your order: ${lines.join(', ')}`);
  const totalEl = bar.querySelector<HTMLElement>('[data-order-total]')!;
  totalEl.textContent = price(Math.round(total * 100) / 100);
  if (bump && motionOK()) { totalEl.classList.remove('is-bump'); void totalEl.offsetWidth; totalEl.classList.add('is-bump'); }
  dialog.querySelector('[data-order-list]')!.innerHTML = Object.entries(order)
    .map(([id, n]) => `<li><span>${n} × ${byId.get(id)!.name.replace(/</g, '&lt;')}</span><span>${price(n * byId.get(id)!.price)}</span></li>`).join('');
  dialog.querySelector('[data-order-dialog-total]')!.textContent = totalEl.textContent;
}

grid.addEventListener('click', (e) => {
  const t = e.target as Element;
  const q = t.closest<HTMLButtonElement>('[data-qty]');
  if (q) {
    const id = q.closest<HTMLElement>('[data-item]')!.dataset.id!;
    order[id] = Math.max(0, Math.min(20, (order[id] || 0) + Number(q.dataset.qty)));
    renderOrder(true);
    return;
  }
  const fave = t.closest<HTMLButtonElement>('[data-fave]');
  if (fave) {
    const id = fave.dataset.fave!;
    const faves = getFaves();
    const on = !faves.includes(id);
    setFaves(on ? [...faves, id] : faves.filter((f) => f !== id));
    syncFaveButtons();
    if (on) { flySlice(fave); toast('Saved to your faves ♥', 1600); }
    if (current === 'faves') apply('faves');
  }
});
bar.querySelector('[data-order-clear]')!.addEventListener('click', () => { order = {}; renderOrder(); toast('Order cleared'); });
bar.querySelector('[data-order-show]')!.addEventListener('click', () => dialog.showModal());

/* ---------- Boot + live refresh ---------- */
function boot() {
  collect();
  initFlips(grid);
  syncFaveButtons();
  renderOrder();
}
boot();

liveMenu().then((fresh) => {
  if (!fresh || same(fresh, items)) return;
  items = fresh;
  grid.innerHTML = items.map(menuCard).join('');
  document.querySelector('[data-matrix]')!.innerHTML = matrixRows(items);
  boot();
  observeReveals(grid);
  apply(current, false);
});

// The nav heart links to /menu#faves
const fromHash = () => {
  if (location.hash === '#faves') apply('faves', false);
  else if (location.hash) {
    const card = document.getElementById(location.hash.slice(1));
    if (card?.matches('[data-item]') && motionOK()) setTimeout(() => card.animate([{ scale: 1 }, { scale: 1.05, rotate: '-2deg' }, { scale: 1 }], { duration: 500 }), 500);
  }
};
fromHash();
addEventListener('hashchange', fromHash);
