#!/usr/bin/env node
/**
 * Sunrise Sunset — Wallet Assets Generator  ("Sunrise Glow" design)
 *
 * Generates Apple Wallet (.pkpass) and Google Wallet (LoyaltyObject) image
 * assets from SVG primitives. Run from project root:
 *
 *   node scripts/build-wallet-assets.mjs
 *
 * Outputs:
 *   server/wallet-assets/strip.png   (1x/2x/3x)   Apple sunrise-glow hero band
 *   server/wallet-assets/icon.png    (1x/2x/3x)   Apple icon (sun tile)
 *   server/wallet-assets/logo.png    (1x/2x/3x)   Apple logo (coral wordmark)
 *   public/wallet/sunset-hero.png                 Google heroImage (3:1)
 *   public/wallet/sunrise-logo.png                Google programLogo (square)
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const APPLE_ASSETS = path.join(ROOT, 'server/wallet-assets');
const GOOGLE_ASSETS = path.join(ROOT, 'public/wallet');

// ---------------------------------------------------------------------------
// Strip / hero — "Sunrise Glow": a warm dawn wash with a rising sun disc on the
// right, a concentric morning-light halo, a coral horizon line, a faint wine
// sky-bloom top-right, and a left→center cream "leftguard" so the member's name
// (rendered over the strip in chocolate) stays legible. Designed in a fixed
// 1125x369 space; preserveAspectRatio="none" fills the requested w×h (all
// targets are ~3:1 so the sun disc stays visually round).
// ---------------------------------------------------------------------------
function sunriseGlowSvg(w, h) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1125 369" preserveAspectRatio="none">
  <defs>
    <linearGradient id="dawn" x1="0" y1="0.3" x2="1" y2="0.75">
      <stop offset="0" stop-color="#FBEAD0"/>
      <stop offset="0.5" stop-color="#F8DDAE"/>
      <stop offset="1" stop-color="#F4C277"/>
    </linearGradient>
    <radialGradient id="sky" cx="0.96" cy="0.04" r="0.85">
      <stop offset="0" stop-color="#7B0000" stop-opacity="0.14"/>
      <stop offset="0.6" stop-color="#7B0000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFE7B2"/>
      <stop offset="0.45" stop-color="#FAD089"/>
      <stop offset="1" stop-color="#E36F4C"/>
    </radialGradient>
    <radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FAD089" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#FAD089" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="horizon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#E36F4C" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#E36F4C" stop-opacity="0"/>
      <stop offset="0.72" stop-color="#E36F4C" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#E36F4C" stop-opacity="0.18"/>
    </linearGradient>
    <linearGradient id="leftguard" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FBEAD0" stop-opacity="0.65"/>
      <stop offset="0.45" stop-color="#FBEAD0" stop-opacity="0.15"/>
      <stop offset="0.62" stop-color="#FBEAD0" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1125" height="369" fill="url(#dawn)"/>
  <rect width="1125" height="369" fill="url(#sky)"/>
  <g fill="none" stroke="#F2A766">
    <circle cx="872" cy="300" r="205" stroke-opacity="0.13" stroke-width="3"/>
    <circle cx="872" cy="300" r="180" stroke-opacity="0.26" stroke-width="3"/>
    <circle cx="872" cy="300" r="160" stroke-opacity="0.46" stroke-width="2.5"/>
  </g>
  <circle cx="872" cy="300" r="222" fill="url(#bloom)"/>
  <circle cx="872" cy="300" r="150" fill="url(#sun)"/>
  <rect x="0" y="298" width="1125" height="3.5" fill="url(#horizon)"/>
  <rect width="1125" height="369" fill="url(#leftguard)"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Icon — filled rising-sun tile: amber→coral rounded square, cream half-sun disc
// + rays + horizon line. Filled reads far better than a thin stroke at 29px.
// ---------------------------------------------------------------------------
function iconSvg(size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 29 29">
  <defs>
    <linearGradient id="ibg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F6B069"/>
      <stop offset="1" stop-color="#E36F4C"/>
    </linearGradient>
    <clipPath id="cut"><rect width="29" height="29" rx="6.4"/></clipPath>
  </defs>
  <rect width="29" height="29" rx="6.4" fill="url(#ibg)"/>
  <g clip-path="url(#cut)">
    <path d="M 8.7 19.1 A 5.8 5.8 0 0 1 20.3 19.1 Z" fill="#FBEBD2"/>
    <line x1="14.5" y1="6.4" x2="14.5" y2="9.2" stroke="#FBEBD2" stroke-width="1.7" stroke-linecap="round"/>
    <line x1="5.2" y1="11.5" x2="7.2" y2="13.0" stroke="#FBEBD2" stroke-width="1.7" stroke-linecap="round" opacity="0.85"/>
    <line x1="23.8" y1="11.5" x2="21.8" y2="13.0" stroke="#FBEBD2" stroke-width="1.7" stroke-linecap="round" opacity="0.85"/>
    <line x1="4.3" y1="19.1" x2="24.7" y2="19.1" stroke="#FBEBD2" stroke-width="1.9" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Apple logo — wide coral serif wordmark on transparent, for the pass top bar.
// (public/logo-wordmark.svg is now a square baked raster, so we draw the
// wordmark inline; the local serif font is baked into the PNG at build time.)
// ---------------------------------------------------------------------------
async function logoBuffer(w, h) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="104" viewBox="0 0 300 104">
  <g fill="#E36F4C" text-anchor="middle" font-family="Didot, 'Bodoni 72', 'Hoefler Text', 'Times New Roman', serif" font-weight="400" letter-spacing="1.5">
    <text x="150" y="46" font-size="42">SUNRISE</text>
    <text x="150" y="94" font-size="42">SUNSET</text>
  </g>
</svg>`;
    return await sharp(Buffer.from(svg))
        .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
}

// Square version for Google Wallet programLogo (cream wordmark on coral tile —
// echoes the icon). Uses the official baked wordmark on a coral background.
async function logoSquareBuffer(size) {
    const svgPath = path.join(ROOT, 'public/logo-wordmark.svg');
    const svg = await fs.readFile(svgPath, 'utf8');
    return await sharp(Buffer.from(svg))
        .resize(size, size, { fit: 'contain', background: { r: 233, g: 109, b: 75, alpha: 1 } })
        .png()
        .toBuffer();
}

// ---------------------------------------------------------------------------
async function writePng(svg, outPath) {
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    await fs.writeFile(outPath, buf);
    console.log(`  ${path.relative(ROOT, outPath)}`);
}

async function writeBuffer(buf, outPath) {
    await fs.writeFile(outPath, buf);
    console.log(`  ${path.relative(ROOT, outPath)}`);
}

await fs.mkdir(APPLE_ASSETS, { recursive: true });
await fs.mkdir(GOOGLE_ASSETS, { recursive: true });

console.log('\nApple Wallet — strip (sunrise glow):');
await writePng(sunriseGlowSvg(375, 123), path.join(APPLE_ASSETS, 'strip.png'));
await writePng(sunriseGlowSvg(750, 246), path.join(APPLE_ASSETS, 'strip@2x.png'));
await writePng(sunriseGlowSvg(1125, 369), path.join(APPLE_ASSETS, 'strip@3x.png'));

console.log('\nApple Wallet — icon (sun tile):');
await writePng(iconSvg(29), path.join(APPLE_ASSETS, 'icon.png'));
await writePng(iconSvg(58), path.join(APPLE_ASSETS, 'icon@2x.png'));
await writePng(iconSvg(87), path.join(APPLE_ASSETS, 'icon@3x.png'));

console.log('\nApple Wallet — logo (coral wordmark, transparent):');
await writeBuffer(await logoBuffer(160, 50), path.join(APPLE_ASSETS, 'logo.png'));
await writeBuffer(await logoBuffer(320, 100), path.join(APPLE_ASSETS, 'logo@2x.png'));
await writeBuffer(await logoBuffer(480, 150), path.join(APPLE_ASSETS, 'logo@3x.png'));

console.log('\nGoogle Wallet — heroImage (3:1) + programLogo (square):');
await writePng(sunriseGlowSvg(1032, 336), path.join(GOOGLE_ASSETS, 'sunset-hero.png'));
await writeBuffer(await logoSquareBuffer(660), path.join(GOOGLE_ASSETS, 'sunrise-logo.png'));

console.log('\nDone.\n');
