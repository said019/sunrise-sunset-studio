import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out = join(root, 'public', 'icons');
mkdirSync(out, { recursive: true });

const SOURCE = readFileSync(join(root, 'public', 'logo.svg'), 'utf8');

// Standard PWA + iOS sizes (square, no padding — used as "any")
const standardSizes = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];

// Maskable variant — add 20% safe-area padding so Android adaptive icons
// don't clip the sun/horizon when masked to a circle or squircle.
const MASK_PAD = 0.2;

async function renderAny(size) {
  const png = await sharp(Buffer.from(SOURCE)).resize(size, size).png().toBuffer();
  writeFileSync(join(out, `icon-${size}.png`), png);
  console.log(`  any  ${size}×${size} → icon-${size}.png`);
}

async function renderMaskable(size) {
  const inner = Math.round(size * (1 - MASK_PAD * 2));
  const rendered = await sharp(Buffer.from(SOURCE)).resize(inner, inner).png().toBuffer();
  const png = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      // Brand coral so the bleed matches the logo background — no edge halo.
      background: { r: 227, g: 111, b: 76, alpha: 1 },
    },
  })
    .composite([{ input: rendered, gravity: 'center' }])
    .png()
    .toBuffer();
  writeFileSync(join(out, `maskable-${size}.png`), png);
  console.log(`  mask ${size}×${size} → maskable-${size}.png`);
}

console.log('Generating standard icons…');
for (const s of standardSizes) await renderAny(s);

console.log('\nGenerating maskable icons…');
for (const s of [192, 256, 384, 512]) await renderMaskable(s);

// Apple touch icon — single source of truth at 180×180
const apple = await sharp(Buffer.from(SOURCE)).resize(180, 180).png().toBuffer();
writeFileSync(join(root, 'public', 'apple-touch-icon.png'), apple);
console.log('\napple-touch-icon.png written (180×180)');

console.log('\nDone.');
