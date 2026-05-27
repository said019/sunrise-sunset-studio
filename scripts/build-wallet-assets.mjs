#!/usr/bin/env node
/**
 * Sunrise Sunset — Wallet Assets Generator
 *
 * Generates Apple Wallet (.pkpass) and Google Wallet (LoyaltyObject) image
 * assets from SVG primitives. Run from project root:
 *
 *   node scripts/build-wallet-assets.mjs
 *
 * Outputs:
 *   server/wallet-assets/strip.png   (1x/2x/3x)   Apple sunset hero band
 *   server/wallet-assets/icon.png    (1x/2x/3x)   Apple icon (small)
 *   server/wallet-assets/logo.png    (1x/2x/3x)   Apple logo (top bar)
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
// Sunset gradient — matches `.bg-sunset` in src/index.css
//
// CSS reference:
//   radial-gradient(120% 90% at 0% 100%, hsl(33,91%,70%), transparent 55%),  // amber bottom-left
//   radial-gradient(95% 80% at 100% 0%, hsl(0,100%,24%), transparent 60%),   // wine top-right
//   radial-gradient(140% 110% at 50% 50%, hsl(14,72%,56%), hsl(14,72%,42%))  // coral base
// ---------------------------------------------------------------------------
function sunsetSvg(w, h) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
  <defs>
    <radialGradient id="base" cx="0.5" cy="0.5" r="1.4" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="hsl(14, 72%, 56%)"/>
      <stop offset="0.9" stop-color="hsl(14, 72%, 42%)"/>
    </radialGradient>
    <radialGradient id="amber" cx="0" cy="1" r="1.2" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="hsl(33, 91%, 70%)"/>
      <stop offset="0.55" stop-color="hsl(33, 91%, 70%)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="wine" cx="1" cy="0" r="0.95" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="hsl(0, 100%, 24%)"/>
      <stop offset="0.6" stop-color="hsl(0, 100%, 24%)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#base)"/>
  <rect width="${w}" height="${h}" fill="url(#amber)"/>
  <rect width="${w}" height="${h}" fill="url(#wine)"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Icon — Sunrise horizon glyph (half-sun + line) in cream on coral, rounded
// ---------------------------------------------------------------------------
function iconSvg(size) {
    const s = size;
    const radius = s * 0.20;
    const horY = s * 0.66;
    const sunR = s * 0.22;
    const sunCx = s * 0.5;
    const stroke = Math.max(1, s * 0.06);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="hsl(14, 72%, 56%)" rx="${radius}"/>
  <line x1="${s * 0.15}" y1="${horY}" x2="${s * 0.85}" y2="${horY}"
        stroke="hsl(36, 32%, 89%)" stroke-width="${stroke}" stroke-linecap="round"/>
  <path d="M ${sunCx - sunR} ${horY} A ${sunR} ${sunR} 0 0 1 ${sunCx + sunR} ${horY}"
        stroke="hsl(36, 32%, 89%)" stroke-width="${stroke}" fill="none" stroke-linecap="round"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Logo — wordmark rasterized from public/logo-wordmark.svg with coral text
// on a transparent background, sized for the Apple Wallet top bar (max 160x50)
// ---------------------------------------------------------------------------
async function logoBuffer(w, h) {
    const svgPath = path.join(ROOT, 'public/logo-wordmark.svg');
    let svg = await fs.readFile(svgPath, 'utf8');
    // Strip the coral background rect so the logo is transparent
    svg = svg.replace(/<rect width="1600" height="1000" fill="[^"]+"\s*\/>/, '');
    // Recolor cream text to coral so it reads on the cream pass background
    svg = svg.replace(/fill="#EFE7D9"/g, 'fill="hsl(14, 72%, 56%)"');
    return await sharp(Buffer.from(svg))
        .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
}

// Square version for Google Wallet programLogo (cream wordmark on coral)
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

await fs.mkdir(GOOGLE_ASSETS, { recursive: true });

console.log('\nApple Wallet — strip (sunset hero):');
await writePng(sunsetSvg(375, 123), path.join(APPLE_ASSETS, 'strip.png'));
await writePng(sunsetSvg(750, 246), path.join(APPLE_ASSETS, 'strip@2x.png'));
await writePng(sunsetSvg(1125, 369), path.join(APPLE_ASSETS, 'strip@3x.png'));

console.log('\nApple Wallet — icon (horizon glyph):');
await writePng(iconSvg(29), path.join(APPLE_ASSETS, 'icon.png'));
await writePng(iconSvg(58), path.join(APPLE_ASSETS, 'icon@2x.png'));
await writePng(iconSvg(87), path.join(APPLE_ASSETS, 'icon@3x.png'));

console.log('\nApple Wallet — logo (wordmark, transparent):');
await writeBuffer(await logoBuffer(160, 50), path.join(APPLE_ASSETS, 'logo.png'));
await writeBuffer(await logoBuffer(320, 100), path.join(APPLE_ASSETS, 'logo@2x.png'));
await writeBuffer(await logoBuffer(480, 150), path.join(APPLE_ASSETS, 'logo@3x.png'));

console.log('\nGoogle Wallet — heroImage (3:1) + programLogo (square):');
await writePng(sunsetSvg(1032, 336), path.join(GOOGLE_ASSETS, 'sunset-hero.png'));
await writeBuffer(await logoSquareBuffer(660), path.join(GOOGLE_ASSETS, 'sunrise-logo.png'));

console.log('\nDone.\n');
