import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'https://sunrise-web-production.up.railway.app';
const EMAIL = 'admin@sunrisesunset.mx';
const PASSWORD = 'TGaeu%TDNBuKnNj$';

mkdirSync('/tmp/sunrise-check', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
});

console.log('1) Visiting login page…');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/sunrise-check/01-login.png', fullPage: false });

console.log('2) Filling credentials…');
// Try common selectors
const emailSel = await page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
const pwSel = await page.locator('input[type="password"]').first();
await emailSel.fill(EMAIL);
await pwSel.fill(PASSWORD);

console.log('3) Submitting…');
const submit = page.locator('button[type="submit"]').first();
await Promise.all([
  page.waitForLoadState('networkidle').catch(() => {}),
  submit.click(),
]);

await page.waitForTimeout(2500);
console.log('   landed on:', page.url());
await page.screenshot({ path: '/tmp/sunrise-check/02-after-login.png', fullPage: false });

console.log('4) Navigating to /admin/calendar…');
await page.goto(`${BASE}/admin/calendar`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
console.log('   landed on:', page.url());
await page.screenshot({ path: '/tmp/sunrise-check/03-calendar.png', fullPage: false });
await page.screenshot({ path: '/tmp/sunrise-check/03-calendar-full.png', fullPage: true });

console.log('5) Snapshot DOM signals…');
const month = await page.locator('h1').first().textContent().catch(() => null);
const buttons = await page.locator('button:has-text("Nueva Clase"), button:has-text("Hoy"), button:has-text("Limpiar"), button:has-text("Generar")').count();
const dayHeaders = await page.locator('text=/Dom|Lun|Mar|Mie|Jue|Vie|Sab/').count();

console.log({ month, ctaButtons: buttons, dayHeaders, errors: consoleErrors.slice(0, 5) });

await browser.close();
console.log('Done. Screenshots in /tmp/sunrise-check/');
