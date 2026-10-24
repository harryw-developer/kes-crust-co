// Build-a-Pizza: drag or fling toppings onto a dough base with light physics
// (Matter.js, loaded only on this page). The base wobbles, cheese melts in,
// and the finished pizza gets a silly name and can be saved as an image.
// With reduced motion (or if physics fails to load) toppings simply drop into place.
import { TOPPINGS, toppingSvg, SAUCES } from '../lib/toppings';
import { seeded } from '../lib/random';
import { confetti, motionOK, toast } from './ui';
import { u } from '../lib/paths';

const root = document.querySelector<HTMLElement>('[data-builder]');
if (root) init(root);

type Item = { kind: string; x: number; y: number; a: number; r: number; body?: any };

async function init(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const ctx = canvas.getContext('2d')!;
  const nameEl = root.querySelector<HTMLElement>('[data-name]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const loader = root.querySelector<HTMLElement>('[data-loader]')!;
  const S = 600, C = S / 2, DOUGH = 250, SAUCE_R = 214, MAX = 70;

  // ---- Canvas sizing (crisp on retina) ----
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = S * dpr;
  canvas.height = S * dpr;

  // ---- Topping images from the same drawings used across the site ----
  const imgs: Record<string, HTMLImageElement> = {};
  await Promise.all(Object.keys(TOPPINGS).map((k) => new Promise<void>((res) => {
    const im = new Image();
    im.onload = () => res();
    im.onerror = () => res();
    im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toppingSvg(k, 120))}`;
    imgs[k] = im;
  })));

  // ---- Physics (optional) ----
  let M: any = null, engine: any = null;
  if (motionOK()) {
    const slow = setTimeout(() => (loader.hidden = false), 400); // loader only if it's slow
    try {
      const mod: any = await import('matter-js');
      M = mod.default ?? mod;
      engine = M.Engine.create({ gravity: { x: 0, y: 0 } });
      const wall = (x: number, y: number, w: number, h: number) => M.Bodies.rectangle(x, y, w, h, { isStatic: true });
      M.Composite.add(engine.world, [wall(C, -30, S, 60), wall(C, S + 30, S, 60), wall(-30, C, 60, S), wall(S + 30, C, 60, S)]);
    } catch {
      M = null;
    }
    clearTimeout(slow);
    loader.hidden = true;
  }

  // ---- State ----
  let items: Item[] = [];
  let sauce = '';
  let sauceT = 1, cheese = false, cheeseT = 1;
  let wobbleStart = -1e9;
  let seed = 1;
  const blobs = Array.from({ length: 34 }, (_, i) => {
    const r = seeded(`cheese${i}`);
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 180;
    return { x: C + Math.cos(a) * d, y: C + Math.sin(a) * d, s: 26 + r() * 22, delay: r() * 0.5 };
  });
  const spots = Array.from({ length: 18 }, (_, i) => {
    const r = seeded(`spot${i}`);
    const a = (i / 18) * Math.PI * 2 + r() * 0.3;
    return { x: C + Math.cos(a) * (DOUGH - 14 - r() * 8), y: C + Math.sin(a) * (DOUGH - 14 - r() * 8), s: 3 + r() * 6 };
  });

  const onBase = (it: Item) => Math.hypot(it.x - C, it.y - C) < SAUCE_R + 10;
  const wobble = () => (wobbleStart = performance.now());
  const say = (msg: string) => (status.textContent = msg);

  function addItem(kind: string, x: number, y: number, fling?: { vx: number; vy: number }) {
    if (items.length >= MAX) { toast("Whoa, that's a lot of toppings. Even for us."); return null; }
    const it: Item = { kind, x, y, a: Math.random() * Math.PI * 2, r: 26 };
    if (M) {
      it.body = M.Bodies.circle(x, y, it.r, { frictionAir: 0.09, restitution: 0.45, friction: 0.2, density: 0.002 });
      M.Body.setAngle(it.body, it.a);
      if (fling) M.Body.setVelocity(it.body, { x: fling.vx, y: fling.vy });
      M.Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.3);
      M.Composite.add(engine.world, it.body);
    }
    items.push(it);
    return it;
  }

  function fling(kind: string) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * (SAUCE_R - 30);
    const tx = C + Math.cos(a) * d, ty = C + Math.sin(a) * d;
    if (M) {
      const sx = C + (Math.random() - 0.5) * 200, sy = S - 30;
      // tuned so a flung topping glides to roughly where it was aimed before air friction stops it
      addItem(kind, sx, sy, { vx: (tx - sx) / 5.2, vy: (ty - sy) / 5.2 });
      setTimeout(wobble, 380);
    } else {
      addItem(kind, tx, ty);
      draw();
    }
    say(`Added ${TOPPINGS[kind].label}. ${countOnBase() + (M ? 1 : 0)} toppings on your pizza.`);
  }

  const countOnBase = () => items.filter(onBase).length;

  // ---- Dragging (pointer) ----
  let drag: { it: Item; c?: any; px: number; py: number } | null = null;
  const toCanvas = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: Math.max(20, Math.min(S - 20, ((e.clientX - r.left) / r.width) * S)), y: Math.max(20, Math.min(S - 20, ((e.clientY - r.top) / r.height) * S)) };
  };
  const startDrag = (it: Item, p: { x: number; y: number }) => {
    drag = { it, px: p.x, py: p.y };
    if (M && it.body) {
      drag.c = M.Constraint.create({ pointA: { ...p }, bodyB: it.body, pointB: { x: 0, y: 0 }, stiffness: 0.2, damping: 0.1, length: 0 });
      M.Composite.add(engine.world, drag.c);
    }
  };
  const moveDrag = (p: { x: number; y: number }) => {
    if (!drag) return;
    if (drag.c) drag.c.pointA = p;
    else { drag.it.x = p.x; drag.it.y = p.y; draw(); }
    drag.px = p.x; drag.py = p.y;
  };
  const endDrag = () => {
    if (!drag) return;
    if (drag.c) M.Composite.remove(engine.world, drag.c);
    const it = drag.it;
    drag = null;
    if (onBase(it)) { wobble(); say(`${TOPPINGS[it.kind].label} landed. ${countOnBase()} toppings on your pizza.`); }
  };

  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const hit = [...items].reverse().find((it) => Math.hypot(it.x - p.x, it.y - p.y) < it.r + 6);
    if (!hit) return;
    canvas.setPointerCapture(e.pointerId);
    startDrag(hit, p);
  });
  canvas.addEventListener('pointermove', (e) => drag && moveDrag(toCanvas(e)));
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // Drag straight from the tray onto the pizza; a plain tap flings one on instead
  root.querySelectorAll<HTMLButtonElement>('[data-topping]').forEach((btn) => {
    let down: { x: number; y: number; id: number } | null = null;
    let dragged = false;
    btn.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, id: e.pointerId }; dragged = false; });
    btn.addEventListener('pointermove', (e) => {
      if (!down || dragged || Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) return;
      dragged = true;
      btn.setPointerCapture(down.id);
      const it = addItem(btn.dataset.topping!, toCanvas(e).x, toCanvas(e).y);
      if (it) startDrag(it, toCanvas(e));
    });
    btn.addEventListener('pointermove', (e) => dragged && drag && moveDrag(toCanvas(e)));
    const up = () => { if (dragged) endDrag(); down = null; };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('click', (e) => {
      if (dragged) { e.preventDefault(); dragged = false; return; }
      fling(btn.dataset.topping!);
      btn.animate([{ rotate: '0deg' }, { rotate: '-8deg', scale: 1.1 }, { rotate: '0deg', scale: 1 }], { duration: 300 });
    });
  });

  // ---- Sauce + cheese ----
  root.querySelectorAll<HTMLButtonElement>('[data-sauce]').forEach((btn) =>
    btn.addEventListener('click', () => {
      sauce = sauce === btn.dataset.sauce ? '' : btn.dataset.sauce!;
      sauceT = motionOK() ? 0 : 1;
      root.querySelectorAll('[data-sauce]').forEach((b) => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.sauce === sauce)));
      wobble();
      say(sauce ? `${btn.textContent?.trim()} sauce spread.` : 'Sauce scraped off.');
      draw();
    }),
  );
  const cheeseBtn = root.querySelector<HTMLButtonElement>('[data-cheese]')!;
  cheeseBtn.addEventListener('click', () => {
    cheese = !cheese;
    cheeseT = motionOK() ? 0 : 1;
    cheeseBtn.setAttribute('aria-pressed', String(cheese));
    say(cheese ? 'Mozzarella melting in.' : 'Cheese removed.');
    draw();
  });

  // ---- Names ----
  const ADJ: Record<string, string[]> = {
    pepperoni: ['Pepperoni Party', 'Cup-and-Char', 'Meaty'], basil: ['Leafy', 'Garden-Fresh', 'Very Green'], mushroom: ['Fun Guy', 'Mushy', 'Forest Floor'],
    chilli: ['Fire-Breathing', 'Sweaty', 'Volcanic'], olive: ['Olive Garden', 'Mediterranean', 'Briny'], onion: ['Teary-Eyed', 'Oniony', 'Purple'],
    pepper: ['Rainbow', 'Peppy', 'Sunny'], tomato: ['Cherry-Bomb', 'Juicy', 'Sun-Kissed'], sausage: ["Nonna's", 'Hearty', 'Butcher’s'],
    nduja: ['Spicy', 'Calabrian', 'Smoky'], pineapple: ['Controversial', 'Tropical', 'Forbidden'],
  };
  const NOUN = ['Volcano', 'Frisbee', 'Disco', 'Wobbler', 'Thunderdome', 'Flying Saucer', 'Moonpie', 'Masterpiece', 'Situation', 'Supreme', 'Dream', 'Rocket', 'Beast'];
  function newName(announce = true) {
    const r = seeded(String(seed++));
    const onIt = items.filter(onBase);
    const counts: Record<string, number> = {};
    onIt.forEach((i) => (counts[i.kind] = (counts[i.kind] || 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
    let name: string;
    if (!onIt.length) name = cheese ? 'The Cheesy Frisbee' : sauce ? 'The Saucy Frisbee' : 'The Naked Frisbee';
    else if (onIt.length > 40) name = `The Absolutely ${pick(['Overloaded', 'Ridiculous', 'Unhinged'])} ${pick(NOUN)}`;
    else if (top.length >= 5) name = `The Kitchen-Sink ${pick(NOUN)}`;
    else name = `The ${pick(ADJ[top[0][0]] ?? ['Mystery'])}${top[1] ? ` ${pick(ADJ[top[1][0]] ?? [''])}` : ''} ${pick(NOUN)}`.replace(/\s+/g, ' ');
    nameEl.textContent = name;
    nameEl.classList.remove('is-new'); void nameEl.offsetWidth; nameEl.classList.add('is-new');
    if (announce) say(`Your pizza is called ${name}.`);
    return name;
  }

  // ---- Drawing ----
  function drawPizza(c: CanvasRenderingContext2D, t: number) {
    // wobble: damped spring on the whole pizza
    const dt = (t - wobbleStart) / 1000;
    const w = motionOK() && dt < 1.2 ? Math.exp(-dt * 4) * Math.sin(dt * 28) * 0.04 : 0;
    c.save();
    c.translate(C, C);
    c.scale(1 + w, 1 - w);
    c.translate(-C, -C);
    // dough
    c.beginPath(); c.arc(C, C, DOUGH, 0, Math.PI * 2);
    c.fillStyle = '#E9B36A'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#111'; c.stroke();
    c.fillStyle = 'rgba(59,28,12,.72)';
    spots.forEach((s) => { c.beginPath(); c.arc(s.x, s.y, s.s, 0, Math.PI * 2); c.fill(); });
    c.beginPath(); c.arc(C, C, SAUCE_R + 6, 0, Math.PI * 2); c.fillStyle = '#F3CF8E'; c.fill();
    // sauce spreads out from the middle
    if (sauce) {
      sauceT = Math.min(1, sauceT + 0.05);
      const r = SAUCE_R * (0.2 + 0.8 * easeOut(sauceT));
      c.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const rr = r * (1 + Math.sin(a * 7 + 1) * 0.02 * (1 - sauceT * 0.5));
        i ? c.lineTo(C + Math.cos(a) * rr, C + Math.sin(a) * rr) : c.moveTo(C + rr, C);
      }
      c.fillStyle = SAUCES[sauce]; c.fill();
    }
    // cheese melts: blobs grow, merge, then a few golden bubbles appear
    if (cheese) {
      cheeseT = Math.min(1, cheeseT + 0.016);
      c.fillStyle = '#FFE7A0';
      blobs.forEach((b) => {
        const k = Math.max(0, Math.min(1, (cheeseT - b.delay * 0.6) / 0.6));
        if (!k) return;
        c.beginPath(); c.arc(b.x, b.y, b.s * easeOut(k) * (1 + cheeseT * 0.25), 0, Math.PI * 2); c.fill();
      });
      if (cheeseT > 0.8) {
        c.fillStyle = `rgba(226,160,60,${(cheeseT - 0.8) * 2.5})`;
        blobs.slice(0, 10).forEach((b) => { c.beginPath(); c.arc(b.x + 8, b.y - 6, 5, 0, Math.PI * 2); c.fill(); });
      }
    }
    // toppings
    items.forEach((it) => {
      if (it.body) { it.x = it.body.position.x; it.y = it.body.position.y; it.a = it.body.angle; }
      const im = imgs[it.kind];
      if (!im?.complete) return;
      c.save(); c.translate(it.x, it.y); c.rotate(it.a);
      c.drawImage(im, -it.r * 1.25, -it.r * 1.25, it.r * 2.5, it.r * 2.5);
      c.restore();
    });
    c.restore();
  }
  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

  function draw(t = performance.now()) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#F3E1C2';
    ctx.fillRect(0, 0, S, S);
    // flour dusting
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 60; i++) { const r = seeded(`f${i}`); ctx.fillRect(r() * S, r() * S, 2, 2); }
    drawPizza(ctx, t);
  }

  let last = performance.now();
  function loop(t: number) {
    if (M) M.Engine.update(engine, Math.min(32, t - last));
    last = t;
    draw(t);
    requestAnimationFrame(loop);
  }
  if (M) requestAnimationFrame(loop);
  else {
    draw();
    // no physics: still animate sauce/cheese briefly when toggled
    const tick = () => { draw(); if (sauceT < 1 || cheeseT < 1) requestAnimationFrame(tick); };
    root.addEventListener('click', () => requestAnimationFrame(tick));
  }

  // ---- Controls ----
  root.querySelector('[data-action="name"]')!.addEventListener('click', () => newName());
  root.querySelector('[data-action="shake"]')!.addEventListener('click', () => {
    wobble();
    if (M) items.forEach((it) => it.body && M.Body.setVelocity(it.body, { x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 14 }));
    else { items.forEach((it) => { it.x += (Math.random() - 0.5) * 30; it.y += (Math.random() - 0.5) * 30; }); draw(); }
    say('Shaken, not stirred.');
  });
  root.querySelector('[data-action="clear"]')!.addEventListener('click', () => {
    items.forEach((it) => it.body && M.Composite.remove(engine.world, it.body));
    items = []; sauce = ''; cheese = false;
    root.querySelectorAll('[aria-pressed]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    nameEl.textContent = 'The Naked Frisbee';
    say('Fresh dough. Start again!');
    draw();
  });

  async function makeImage(): Promise<Blob | null> {
    const out = document.createElement('canvas');
    out.width = out.height = 1080;
    const o = out.getContext('2d')!;
    o.fillStyle = '#FFF6E8'; o.fillRect(0, 0, 1080, 1080);
    o.fillStyle = '#FFD23F'; o.fillRect(0, 0, 1080, 170);
    o.fillStyle = '#930037';
    o.textAlign = 'center';
    o.font = '800 64px "Bricolage Grotesque Variable", system-ui, sans-serif';
    const name = nameEl.textContent || 'My pizza';
    o.fillText(name.length > 28 ? name.slice(0, 27) + '…' : name, 540, 110);
    o.save(); o.translate(140, 200); o.scale(800 / S, 800 / S); drawPizza(o, 1e12); o.restore();
    try {
      const logo = new Image();
      logo.src = u('/brand/kes-logo-160.webp');
      await logo.decode();
      o.drawImage(logo, 900, 935, 140, 137);
    } catch {}
    o.fillStyle = '#111'; o.textAlign = 'left';
    o.font = '600 30px "Outfit Variable", system-ui, sans-serif';
    o.fillText('Built at KES Crust Co.', 40, 1040);
    return new Promise((res) => out.toBlob(res, 'image/png'));
  }
  const fileName = () => `${(nameEl.textContent || 'pizza').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

  root.querySelector('[data-action="save"]')!.addEventListener('click', async () => {
    const blob = await makeImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName() });
    a.dataset.noWipe = '';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    confetti({ count: 80 });
    toast('Saved! Now show it off.');
  });
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-action="share"]')!;
  if (navigator.canShare?.({ files: [new File([''], 'x.png', { type: 'image/png' })] })) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', async () => {
      const blob = await makeImage();
      if (!blob) return;
      try { await navigator.share({ files: [new File([blob], fileName(), { type: 'image/png' })], title: nameEl.textContent || 'My pizza', text: 'I built this at KES Crust Co. 🍕' }); } catch {}
    });
  }

  draw();
}
