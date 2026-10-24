// Find Us: live dates from Supabase, oven-timer countdown, flip cards,
// and hiding pitches that have finished.
import { motionOK, observeReveals } from './ui';
import { initFlips } from './flip';
import { dateLong, epoch, eventSchema, times, type Pitch } from '../lib/dates';
import { dateCard, esc } from '../lib/render';
import { livePitches, same, snapshot, updateEventSchema } from './live';

const grid = document.querySelector<HTMLElement>('[data-date-grid]');
const empty = document.querySelector<HTMLElement>('[data-dates-empty]');
let list = snapshot<Pitch[]>('snap-dates') || [];

/* ---------- Hide past dates, mark live ones ---------- */
function refreshCards() {
  const now = Date.now();
  const cards = [...document.querySelectorAll<HTMLElement>('.date-card')];
  cards.forEach((c) => {
    c.classList.toggle('is-past', Number(c.dataset.end) <= now);
    const live = c.querySelector<HTMLElement>('[data-live]');
    if (live) live.hidden = !(now >= Number(c.dataset.start) && now < Number(c.dataset.end));
  });
  if (empty) empty.hidden = cards.some((c) => !c.classList.contains('is-past'));
}

function render() {
  if (!grid) return;
  grid.innerHTML = list.map(dateCard).join('');
  initFlips(grid);
  observeReveals(grid);
  refreshCards();
}

initFlips();
refreshCards();

livePitches().then((fresh) => {
  if (!fresh || same(fresh, list)) return;
  list = fresh;
  render();
  updateEventSchema(list.map(eventSchema));
  lastMinute = -1;
  tick();
});

// Arriving from "Where's the oven?" on another page: give that card a nudge
function nudge() {
  if (!location.hash) return;
  const card = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (card?.classList.contains('date-card') && motionOK()) {
    setTimeout(() => card.animate([{ rotate: '0deg' }, { rotate: '-3deg', scale: 1.04 }, { rotate: '2deg' }, { rotate: '0deg', scale: 1 }], { duration: 600, easing: 'ease-out' }), 600);
  }
}
nudge();

/* ---------- Oven timer ---------- */
const timer = document.querySelector<HTMLElement>('[data-oven-timer]')!;
const bricks = [...timer.querySelectorAll<SVGPathElement>('.ot-brick')].sort((a, b) => Number(a.dataset.o) - Number(b.dataset.o));
const u = (k: string) => timer.querySelector<HTMLElement>(`[data-u="${k}"]`)!;
const label = timer.querySelector<HTMLElement>('[data-ot-label]')!;
const count = timer.querySelector<HTMLElement>('[data-ot-count]')!;
const cool = timer.querySelector<HTMLElement>('[data-ot-cool]')!;
const nextEl = timer.querySelector<HTMLElement>('[data-ot-next]')!;
const WEEK = 7 * 864e5;
let lastMinute = -1;

function tick() {
  const now = Date.now();
  const next = list.find((p) => epoch(p.date, p.end) > now);
  count.hidden = !next;
  cool.hidden = !!next;
  if (!next) {
    label.textContent = "Oven's cooling";
    nextEl.textContent = 'New dates are announced to the Crust Club first.';
    bricks.forEach((b) => b.classList.remove('is-lit'));
    timer.classList.remove('is-live');
    return;
  }
  const start = epoch(next.date, next.start), end = epoch(next.date, next.end);
  const live = now >= start;
  timer.classList.toggle('is-live', live);
  const left = Math.max(0, (live ? end : start) - now);
  const d = Math.floor(left / 864e5), h = Math.floor((left / 36e5) % 24), m = Math.floor((left / 6e4) % 60), s = Math.floor((left / 1e3) % 60);
  u('d').textContent = String(d);
  u('h').textContent = String(h).padStart(2, '0');
  u('m').textContent = String(m).padStart(2, '0');
  u('s').textContent = String(s).padStart(2, '0');
  if (m === lastMinute) return;
  lastMinute = m;
  label.textContent = live ? 'Oven is lit · closes in' : 'Oven timer · next bake in';
  nextEl.innerHTML = `${live ? 'Cooking now' : 'Next'}: ${dateLong(next.date)}, ${times(next)}<br><strong>${esc(next.name)}</strong>`;
  // Bricks light up one by one over the final week
  const lit = live ? bricks.length : Math.max(0, Math.min(bricks.length, Math.ceil(((WEEK - left) / WEEK) * bricks.length)));
  bricks.forEach((b, i) => b.classList.toggle('is-lit', i < lit));
  timer.setAttribute('aria-label', `${live ? 'Cooking now, closes' : 'Next bake'} in ${d} days ${h} hours ${m} minutes`);
  refreshCards();
}
tick();
setInterval(tick, 1000);
