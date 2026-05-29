// Compact "SS" monogram for the small brand surfaces where the two-line
// wordmark is too tight: the browser-tab favicon and the navbar/sidebar/footer
// square mark (logo.svg, ~32-48px). Larger surfaces (logo-wordmark.svg, PWA
// icons, apple-touch) keep the full wordmark — see apply-official-logo.mjs.
//
// The monogram is rasterized once (with the elegant high-contrast serif) and
// embedded as a base64 PNG so it renders identically regardless of the device's
// available fonts, matching the wordmark approach.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, '..', 'public');

const CORAL = '#EA6E4A';
const CREAM = '#EFE7D9';
const SERIF = "Didot, 'Bodoni 72', 'Hoefler Text', 'Times New Roman', serif";

const monogramSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${CORAL}"/>
  <text x="32" y="47" text-anchor="middle" font-family="${SERIF}" font-size="46" letter-spacing="-4" fill="${CREAM}">SS</text>
</svg>`;

const png256 = await sharp(Buffer.from(monogramSvg)).resize(256, 256).png().toBuffer();
// expose a raster for favicon.ico generation downstream
writeFileSync(join(pub, '_monogram-256.png'), png256);

function embed(file, b64) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">` +
    `<image width="256" height="256" href="data:image/png;base64,${b64}"/></svg>\n`;
  writeFileSync(join(pub, file), svg);
  console.log(`${file} ← monogram`);
}

const b64 = png256.toString('base64');
embed('logo.svg', b64);     // navbar / sidebars / footer
embed('favicon.svg', b64);  // browser tab

console.log('Done (monogram). _monogram-256.png written for favicon.ico.');
