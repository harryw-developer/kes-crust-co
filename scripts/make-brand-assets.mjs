// Builds web-sized copies of the ORIGINAL logo (pixels untouched, only trimmed/resized).
import sharp from 'sharp';
const src = 'public/brand/kes-logo.png';
const out = 'public/brand';
const trimmed = await sharp(src).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
console.log('trimmed', trimmed.info.width, trimmed.info.height, 'offset', trimmed.info.trimOffsetLeft, trimmed.info.trimOffsetTop);
const t = sharp(trimmed.data);
await t.clone().png().toFile(`${out}/kes-logo-trim.png`);
for (const w of [160, 320, 582]) {
  await sharp(trimmed.data).resize({ width: w }).webp({ lossless: true }).toFile(`${out}/kes-logo-${w}.webp`);
}
const cream = { r: 255, g: 246, b: 232, alpha: 1 };
const square = async (size, pad, file) => {
  const inner = Math.round(size * (1 - pad * 2));
  const logo = await sharp(trimmed.data).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: cream } }).composite([{ input: logo, gravity: 'center' }]).png().toFile(file);
};
await square(180, 0.08, 'public/apple-touch-icon.png');
await square(192, 0.08, 'public/icon-192.png');
await square(512, 0.08, 'public/icon-512.png');
await square(32, 0.02, 'public/favicon-32.png');
await square(48, 0.02, 'public/favicon-48.png');
const ogLogo = await sharp(trimmed.data).resize({ height: 470 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: cream } }).composite([{ input: ogLogo, gravity: 'center' }]).png().toFile('public/og.png');
console.log('done');
