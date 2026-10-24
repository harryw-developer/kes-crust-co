// Flip cards (dates and menu): both faces stay in the DOM, the hidden one is inert.
import { motionOK } from './ui';

export function initFlips(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-flip]:not([data-flip-ready])').forEach((flip) => {
    flip.dataset.flipReady = '';
    const front = flip.querySelector<HTMLElement>('.front')!;
    const back = flip.querySelector<HTMLElement>('.back')!;
    back.inert = true;
    const toggles = flip.querySelectorAll<HTMLButtonElement>('[data-flip-toggle]');
    const set = (on: boolean) => {
      flip.classList.toggle('is-flipped', on);
      back.inert = !on;
      front.inert = on;
      toggles.forEach((t) => t.setAttribute('aria-expanded', String(on)));
      const focusTarget = on ? back.querySelector<HTMLElement>('a, button') : front.querySelector<HTMLElement>('[data-flip-toggle]');
      setTimeout(() => focusTarget?.focus({ preventScroll: true }), motionOK() ? 300 : 0);
    };
    toggles.forEach((t) => t.addEventListener('click', () => set(!flip.classList.contains('is-flipped'))));
  });
}
