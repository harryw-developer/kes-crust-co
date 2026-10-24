// Site-wide behaviour: motion toggle, scroll reveals, oven-door menu, brick-wipe
// page transitions, slice cursor, rose Easter egg, favourites badge and form posting.
import { u } from '../lib/paths';
import { confetti, downloadIcs, motionOK, observeReveals, postForm, reducedMotion, renderFaveCount, toast } from './ui';

const root = document.documentElement;

/* ---------- Pause / play animations ---------- */
function syncMotionButtons() {
  const calm = root.hasAttribute('data-calm');
  document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(calm));
    const label = b.querySelector('span');
    if (label) label.textContent = calm ? 'Play animations' : 'Pause animations';
    const use = b.querySelector('use');
    use?.setAttribute('href', calm ? '#i-play' : '#i-pause');
  });
}
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest('[data-motion-toggle]');
  if (!btn) return;
  const calm = !root.hasAttribute('data-calm');
  root.toggleAttribute('data-calm', calm);
  try { calm ? localStorage.setItem('kes-calm', '1') : localStorage.removeItem('kes-calm'); } catch {}
  syncMotionButtons();
  document.dispatchEvent(new CustomEvent('motion:change', { detail: { calm } }));
  calm ? stopCursor() : startCursor();
});
syncMotionButtons();

/* ---------- Scroll reveals ---------- */
observeReveals();

/* ---------- Oven-door mobile menu ---------- */
const burger = document.querySelector<HTMLButtonElement>('.nav__burger');
const door = document.getElementById('oven-door');
function setDoor(open: boolean) {
  if (!burger || !door) return;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) {
    door.hidden = false;
    door.classList.remove('is-closing');
    door.classList.add('is-opening');
    door.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  } else if (!door.hidden) {
    door.classList.remove('is-opening');
    door.classList.add('is-closing');
    const done = () => { door.hidden = true; door.classList.remove('is-closing'); };
    reducedMotion() ? done() : setTimeout(done, 240);
  }
}
burger?.addEventListener('click', () => setDoor(burger.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && burger?.getAttribute('aria-expanded') === 'true') { setDoor(false); burger.focus(); }
});
document.addEventListener('click', (e) => {
  if (!door || door.hidden) return;
  const t = e.target as Element;
  if (!t.closest('#oven-door') && !t.closest('.nav__burger')) setDoor(false);
});

/* ---------- Brick-wipe page transitions ---------- */
const wipe = document.querySelector<HTMLElement>('.brick-wipe');
const ease = 'cubic-bezier(.65,0,.35,1)';
if (wipe && root.classList.contains('wipe-in')) {
  wipe.animate([{ clipPath: 'circle(150% at 50% 0%)' }, { clipPath: 'circle(0% at 50% 0%)' }], { duration: 520, easing: ease, fill: 'forwards' })
    .finished.then(() => root.classList.remove('wipe-in'));
}
addEventListener('pageshow', (e) => {
  if ((e as PageTransitionEvent).persisted && wipe) {
    wipe.getAnimations().forEach((a) => a.cancel());
    root.classList.remove('wipe-in');
  }
});
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
  if (!a || !wipe || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.dataset.noWipe !== undefined) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || /\.(ics|png|pdf|xml)$/.test(url.pathname) || url.pathname.startsWith(u('/admin'))) return;
  if (url.pathname === location.pathname) return; // same page / hash links
  if (!motionOK()) return;
  e.preventDefault();
  try { sessionStorage.setItem('kes-wipe', '1'); } catch {}
  wipe.animate([{ clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)' }], { duration: 480, easing: ease, fill: 'forwards' })
    .finished.then(() => location.assign(url.href));
});

/* ---------- Slice cursor with crumbs (desktop only) ---------- */
let cursorEl: HTMLDivElement | null = null;
let cursorCleanup: (() => void) | null = null;
function startCursor() {
  if (cursorEl || !matchMedia('(pointer: fine) and (hover: hover)').matches || !motionOK()) return;
  cursorEl = document.createElement('div');
  cursorEl.className = 'slice-cursor is-hidden';
  cursorEl.setAttribute('aria-hidden', 'true');
  cursorEl.innerHTML = '<svg viewBox="0 0 32 32"><use href="#i-slice"/></svg>';
  document.body.append(cursorEl);
  root.classList.add('has-cursor');
  const crumbs: HTMLElement[] = [];
  let lastX = 0, lastY = 0, lastT = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !cursorEl) return;
    cursorEl.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
    const t = e.target as Element;
    const typing = t.closest('input, textarea, select');
    cursorEl.classList.toggle('is-hidden', !!typing);
    cursorEl.classList.toggle('is-hover', !!t.closest('a, button, label, [role="button"]'));
    const now = performance.now();
    if (now - lastT > 45 && Math.hypot(e.clientX - lastX, e.clientY - lastY) > 14) {
      lastT = now; lastX = e.clientX; lastY = e.clientY;
      const c = crumbs.length < 14 ? document.createElement('span') : crumbs.shift()!;
      c.className = 'crumb';
      document.body.append(c);
      crumbs.push(c);
      const dx = (Math.random() - 0.5) * 24;
      c.animate(
        [
          { transform: `translate(${e.clientX + 10}px, ${e.clientY + 14}px) scale(1)`, opacity: 1 },
          { transform: `translate(${e.clientX + 10 + dx}px, ${e.clientY + 60}px) scale(0.4) rotate(140deg)`, opacity: 0 },
        ],
        { duration: 650, easing: 'cubic-bezier(.4,0,.9,.6)', fill: 'forwards' },
      );
    }
  };
  const onDown = () => cursorEl?.classList.add('is-down');
  const onUp = () => cursorEl?.classList.remove('is-down');
  const onLeave = () => cursorEl?.classList.add('is-hidden');
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onDown);
  addEventListener('pointerup', onUp);
  document.addEventListener('mouseleave', onLeave);
  cursorCleanup = () => {
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerdown', onDown);
    removeEventListener('pointerup', onUp);
    document.removeEventListener('mouseleave', onLeave);
    crumbs.forEach((c) => c.remove());
  };
}
function stopCursor() {
  cursorCleanup?.();
  cursorEl?.remove();
  cursorEl = null;
  root.classList.remove('has-cursor');
}
startCursor();

/* ---------- Easter egg: tap the rose five times ---------- */
let roseTaps = 0, roseTimer = 0;
document.addEventListener('click', (e) => {
  const rose = (e.target as Element).closest<HTMLElement>('[data-rose]');
  if (!rose) return;
  roseTaps++;
  clearTimeout(roseTimer);
  roseTimer = window.setTimeout(() => (roseTaps = 0), 1800);
  rose.animate([{ scale: 1 }, { scale: 0.82 }, { scale: 1.08 }, { scale: 1 }], { duration: 260, easing: 'ease-out' });
  if (roseTaps === 5) {
    roseTaps = 0;
    if (motionOK()) confetti({ basil: true, count: 170 });
    toast('🌿 Basil storm! You found the secret rose.');
  }
});

/* ---------- Add to calendar (.ics made on the fly, so new dates work too) ---------- */
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-ics]');
  if (!btn) return;
  try { downloadIcs(JSON.parse(btn.dataset.ics!)); toast('Saved to your calendar file 📅'); } catch { toast("Couldn't make the calendar file, sorry"); }
});

/* ---------- Favourites badge ---------- */
renderFaveCount();

/* ---------- Forms (Netlify Forms, posted in the background) ---------- */
document.querySelectorAll<HTMLFormElement>('form[data-ajax-form]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    if (form.dataset.custom !== undefined) return; // multi-step enquiry handles itself
    e.preventDefault();
    const ok = form.querySelector<HTMLElement>('.form-success');
    const err = form.querySelector<HTMLElement>('.error-msg');
    const btn = form.querySelector<HTMLButtonElement>('[type=submit]');
    if (err) err.hidden = true;
    btn?.setAttribute('disabled', '');
    try {
      await postForm(form);
      if (ok) ok.hidden = false;
      form.querySelectorAll('input:not([type=hidden])').forEach((i) => ((i as HTMLInputElement).value = ''));
      const r = btn?.getBoundingClientRect();
      confetti({ x: r ? r.left + r.width / 2 : undefined, y: r ? r.top : undefined, count: 90 });
    } catch {
      if (err) { err.hidden = false; err.textContent = "Oven's playing up. Try again in a minute, or drop us an email."; }
    } finally {
      btn?.removeAttribute('disabled');
    }
  });
});
