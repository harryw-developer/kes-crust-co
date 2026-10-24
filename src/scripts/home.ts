// Home: live menu + dates, and the pizza spins as you scroll while toppings rain onto it.
import { motionOK, observeReveals } from './ui';
import { featureCard, soonItem } from '../lib/render';
import { eventSchema } from '../lib/dates';
import { liveMenu, livePitches, same, snapshot, updateEventSchema } from './live';
import type { MenuItem } from '../lib/supabase';
import type { Pitch } from '../lib/dates';

/* ---------- Live menu + dates ---------- */
liveMenu().then((menu) => {
  const el = document.querySelector<HTMLElement>('[data-live-pizzas]');
  if (!menu || !el || same(menu, snapshot<MenuItem[]>('snap-menu'))) return;
  el.innerHTML = menu.filter((i) => i.category !== 'drink').map(featureCard).join('');
  observeReveals(el);
});
livePitches().then((pitches) => {
  const el = document.querySelector<HTMLElement>('[data-live-soon]');
  if (!pitches || !el) return;
  const now = Date.now();
  const list = pitches.filter((p) => new Date(`${p.date}T23:59:59`).getTime() > now);
  if (!same(list, snapshot<Pitch[]>('snap-dates'))) {
    el.innerHTML = list.slice(0, 3).map(soonItem).join('');
    observeReveals(el);
    updateEventSchema(list.map(eventSchema));
  }
  const empty = document.querySelector<HTMLElement>('[data-soon-empty]');
  if (empty) empty.hidden = list.length > 0;
});

const spin = document.querySelector<HTMLElement>('[data-spin]');
if (spin && motionOK()) initSpin(spin);

async function initSpin(spin: HTMLElement) {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  spin.classList.add('is-scrolly');
  const pizza = spin.querySelector('[data-spin-pizza]')!;
  const rain = gsap.utils.toArray<SVGElement>(spin.querySelectorAll('.rain'));
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: spin, start: 'top 75%', end: 'bottom bottom', scrub: 0.6 },
  });
  tl.fromTo(pizza, { rotate: -90, scale: 0.85 }, { rotate: 540, scale: 1, duration: 1 }, 0);
  rain.forEach((el, i) => {
    tl.fromTo(el,
      { scale: 4, opacity: 0, yPercent: -260 },
      { scale: 1, opacity: 1, yPercent: 0, duration: 0.14, ease: 'back.out(2.2)' },
      0.1 + (i / rain.length) * 0.72);
  });
  document.addEventListener('motion:change', () => ScrollTrigger.refresh());
}
