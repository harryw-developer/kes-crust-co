// Tiny canvas confetti: colourful bursts, or a basil-leaf storm for the Easter egg.
type Opts = { x?: number; y?: number; count?: number; basil?: boolean };
type P = { x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; shape: number; life: number; sway: number };

const COLOURS = ['#930037', '#FF6B1A', '#FFD23F', '#2BB673', '#FF4F9A', '#FFF6E8'];

let canvas: HTMLCanvasElement | null = null;
let parts: P[] = [];
let running = false;

function ensureCanvas() {
  if (canvas) return canvas;
  canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1300' });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  return canvas;
}

export function burst({ x = innerWidth / 2, y = innerHeight / 2, count = 120, basil = false }: Opts = {}) {
  ensureCanvas();
  for (let i = 0; i < count; i++) {
    if (basil) {
      parts.push({
        x: Math.random() * innerWidth, y: -40 - Math.random() * innerHeight * 0.9,
        vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.12, s: 14 + Math.random() * 16,
        c: Math.random() < 0.85 ? '#2BB673' : '#1E8C55', shape: 2, life: 1, sway: Math.random() * 6,
      });
    } else {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, s: 7 + Math.random() * 8,
        c: COLOURS[(Math.random() * COLOURS.length) | 0], shape: Math.random() < 0.5 ? 0 : 1, life: 1, sway: 0,
      });
    }
  }
  if (!running) { running = true; requestAnimationFrame(tick); }
}

function leaf(ctx: CanvasRenderingContext2D, s: number, c: string) {
  ctx.beginPath();
  ctx.moveTo(-s / 2, s / 3);
  ctx.bezierCurveTo(-s / 2.4, -s / 4, 0, -s / 2, s / 2, -s / 2);
  ctx.bezierCurveTo(s / 2, 0, s / 8, s / 2, -s / 2, s / 3);
  ctx.fillStyle = c; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#111'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s / 2.4, s / 3.4); ctx.lineTo(s / 2.6, -s / 2.6);
  ctx.strokeStyle = '#14653F'; ctx.lineWidth = 1.2; ctx.stroke();
}

function tick() {
  const c = canvas!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (c.width !== innerWidth * dpr) { c.width = innerWidth * dpr; c.height = innerHeight * dpr; }
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.y < innerHeight + 60 && p.life > 0);
  for (const p of parts) {
    if (p.shape === 2) {
      p.sway += 0.04;
      p.x += p.vx + Math.sin(p.sway) * 1.4;
      p.y += p.vy;
    } else {
      p.vy += 0.32; p.vx *= 0.985;
      p.x += p.vx; p.y += p.vy;
      p.life -= 0.004;
    }
    p.r += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    if (p.shape === 2) leaf(ctx, p.s, p.c);
    else if (p.shape === 1) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(0, 0, p.s / 2.4, 0, 7); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#111'; ctx.stroke(); }
    else { ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.lineWidth = 1.5; ctx.strokeStyle = '#111'; ctx.strokeRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
    ctx.restore();
  }
  if (parts.length) requestAnimationFrame(tick);
  else { running = false; c.remove(); canvas = null; }
}
