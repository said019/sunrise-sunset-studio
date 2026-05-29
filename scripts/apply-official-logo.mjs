// Apply the official Sunrise Sunset logo across every brand surface.
// Source: the official square logo (coral bg + cream "SUNRISE SUNSET" wordmark).
// Regenerates the PWA/iOS icon set + apple-touch, and rewrites the three brand
// SVGs (logo, wordmark, favicon) as self-contained wrappers that embed a PNG of
// the logo as a base64 data URI — so every existing <img src="/logo.svg"> etc.
// keeps working with ZERO component/index.html changes.
//
// Usage: node scripts/apply-official-logo.mjs ["path/to/source.(jpg|png)"]
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pub = join(root, 'public');
const iconsDir = join(pub, 'icons');
mkdirSync(iconsDir, { recursive: true });

const SRC = process.argv[2] || join(root, 'logo sunrise.jpeg');
const src = readFileSync(SRC);

// The logo is already a full-bleed square (coral background, wordmark centered
// with generous internal margin), so a plain resize works for "any", maskable
// and apple-touch alike — no padding/compositing needed.
const standardSizes = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];
const maskableSizes = [192, 256, 384, 512];

const square = (size) => sharp(src).resize(size, size, { fit: 'cover' }).png().toBuffer();

console.log('Standard icons…');
for (const s of standardSizes) {
  writeFileSync(join(iconsDir, `icon-${s}.png`), await square(s));
  console.log(`  any  ${s}×${s} → icon-${s}.png`);
}

console.log('Maskable icons…');
for (const s of maskableSizes) {
  writeFileSync(join(iconsDir, `maskable-${s}.png`), await square(s));
  console.log(`  mask ${s}×${s} → maskable-${s}.png`);
}

writeFileSync(join(pub, 'apple-touch-icon.png'), await square(180));
console.log('apple-touch-icon.png (180×180)');

// Brand SVGs: embed a PNG of the logo as a base64 data URI. data: URIs render
// fine in the <img>-loaded "secure static" SVG mode (only network refs are blocked).
async function embedSvg(file, px) {
  const b64 = (await square(px)).toString('base64');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">` +
    `<image width="${px}" height="${px}" href="data:image/png;base64,${b64}"/></svg>\n`;
  writeFileSync(join(pub, file), svg);
  console.log(`${file} (embeds ${px}×${px} PNG)`);
}

await embedSvg('logo.svg', 256);          // navbar / sidebars / footer
await embedSvg('logo-wordmark.svg', 512); // auth + client header
await embedSvg('favicon.svg', 64);        // browser tab

console.log('\nDone.');
