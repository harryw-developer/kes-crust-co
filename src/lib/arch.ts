// Geometry for the oven-arch bricks from the logo, reused for the logo,
// the oven timer and the loader. Angles run 0° (left) → 180° (right) over the top.
export const BRICKS: [number, number][] = [
  [0, 8], [12, 31], [35, 52], [56, 70], [74, 106], [110, 124], [128, 145], [149, 168], [172, 180],
];
export const KEYSTONE = 4;

type Opts = { cx: number; cy: number; rIn: number; rOut: number; keyOut?: number; round?: number };

const pt = (cx: number, cy: number, r: number, a: number) => {
  const t = (a * Math.PI) / 180;
  return `${(cx - r * Math.cos(t)).toFixed(2)} ${(cy - r * Math.sin(t)).toFixed(2)}`;
};

// Each brick is an annular sector, shrunk by `round` so a same-colour stroke
// with round joins gives the soft corners of the logo's bricks.
export function archBricks({ cx, cy, rIn, rOut, keyOut = rOut, round = 0 }: Opts) {
  return BRICKS.map(([a0, a1], i) => {
    const outer = (i === KEYSTONE ? keyOut : rOut) - round;
    const inner = rIn + round;
    const d0 = a0 + (round / inner) * (180 / Math.PI);
    const d1 = a1 - (round / inner) * (180 / Math.PI);
    const d = `M${pt(cx, cy, outer, d0)} A${outer} ${outer} 0 0 1 ${pt(cx, cy, outer, d1)} L${pt(cx, cy, inner, d1)} A${inner} ${inner} 0 0 0 ${pt(cx, cy, inner, d0)}Z`;
    return { d, i, key: i === KEYSTONE };
  });
}

// Order the bricks are laid when the arch "builds": both feet first, keystone last.
export const BUILD_ORDER = [0, 8, 1, 7, 2, 6, 3, 5, 4];
