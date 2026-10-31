/* These are explicitly synthetic fixtures, NOT a Shopify storefront renderer.
 * Shopify's native Liquid/schema are validated separately with Theme Check.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { Liquid } = require('liquidjs');
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const root = path.resolve(__dirname, '../..');
const theme = path.join(root, 'theme');
const output = path.join(root, 'artifacts/gallery');
const source = fs.readFileSync(path.join(theme, 'sections/pp-gift-packs-gallery.liquid'), 'utf8');
const schema = JSON.parse(source.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
const defaults = Object.fromEntries(schema.settings.filter(s => 'default' in s).map(s => [s.id, s.default]));
const engine = new Liquid({ root: path.join(theme, 'snippets'), extname: '.liquid', strictFilters: true });
engine.registerTag('schema', {
  parse(_token, remaining) { while (remaining.length) { if (remaining.shift().name === 'endschema') break; } },
  render() { return ''; }
});
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
engine.registerFilter('asset_url', name => `/assets/${name}`);
engine.registerFilter('stylesheet_tag', url => `<link rel="stylesheet" href="${escape(url)}">`);
engine.registerFilter('image_url', (image, ...args) => {
  const width = args.find(arg => Array.isArray(arg) && arg[0] === 'width')?.[1] || 810;
  return `/fixture-image.svg?colour=${image.colour || 'blue'}&width=${width}`;
});
engine.registerFilter('image_tag', (url, ...args) => {
  const options = Object.fromEntries(args.filter(Array.isArray));
  const widths = String(options.widths || '810').split(',').map(w => w.trim());
  return `<img src="${escape(url)}" srcset="${widths.map(w => `${escape(url.replace(/width=\d+/, `width=${w}`))} ${w}w`).join(', ')}" sizes="${escape(options.sizes)}" width="1080" height="1350" alt="${escape(options.alt)}" loading="${escape(options.loading)}">`;
});
engine.registerFilter('money', v => `Rs. ${Number(v / 100).toLocaleString('en', { minimumFractionDigits: 2 })}`);
engine.registerFilter('money_with_currency', v => `LKR ${Number(v / 100).toLocaleString('en', { minimumFractionDigits: 2 })}`);
engine.registerFilter('t', key => ({ 'products.product.price.regular_price': 'Regular price', 'products.product.price.sale_price': 'Sale price', 'products.product.sold_out': 'Sold out' }[key] || key));

function products(group) {
  return Array.from({ length: 6 }, (_, i) => ({
    title: `${group === 'boys' ? ['Space Adventure', 'Car Fun', 'Dino Explorer'][i % 3] : ['Unicorn Dream', 'Cute & Cozy', 'Princess Style'][i % 3]} Gift Pack`,
    url: `/products/fixture-${group}-${i}`,
    featured_image: i === 4 ? null : { colour: group === 'boys' ? 'blue' : 'pink', alt: `${group} test fixture gift pack` },
    available: i !== 5,
    selected_or_first_available_variant: { price: 2000000 + i * 10000, compare_at_price: i === 0 ? 2200000 : null, sku: i === 2 ? '' : `SKU-${group}-${i}` },
    metafields: { custom: { gift_pack_code: { value: i === 0 ? `META-${group}` : '' } } }
  }));
}

async function render(variant) {
  const settings = { ...defaults, boys_collection: { products: products('boys'), url: '/collections/fixture-boys' }, girls_collection: { products: products('girls'), url: '/collections/fixture-girls' } };
  if (variant === 'empty') { settings.boys_collection = { products: [], url: '/collections/empty' }; settings.girls_collection = null; }
  if (variant === 'one') settings.boys_collection.products = settings.boys_collection.products.slice(0, 1);
  if (variant === 'disabled') settings.enabled = false;
  if (variant === 'single') settings.girls_enabled = false;
  if (variant === 'backgrounds') {
    settings.title_desktop = { colour: 'cream' }; settings.title_mobile = { colour: 'lavender' };
    settings.boys_background = { colour: 'blue' }; settings.girls_background = { colour: 'pink' };
  }
  const section = await engine.parseAndRender(source, { section: { id: 'fixture-gallery', settings } }, { globals: { settings: { currency_code_enabled: variant === 'currency' }, request: { design_mode: variant === 'empty' } } });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gift Gallery — isolated test fixture</title><link rel="stylesheet" href="/assets/base.css"><style>html{font-size:62.5%}body{margin:0;font-family:Arial,sans-serif;font-size:16px}body{--font-heading-family:Arial,sans-serif;--font-body-family:Arial,sans-serif}.fixture-note{margin:0;padding:10px 18px;background:#fff;color:#62556a;font:12px Arial,sans-serif;text-align:center}</style></head><body><p class="fixture-note">PIXIEPINKS · LOCAL DESIGN TEST · Illustrations and product data are test fixtures</p><main>${section}</main></body></html>`;
}

function illustration(colour) {
  const pink = colour === 'pink'; const base = pink ? '#f96ab3' : '#398bd9'; const light = pink ? '#ffe3f1' : '#e2f3ff';
  // Lightweight geometric fixture artwork so screenshots need no third-party assets.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${light}"/><circle cx="530" cy="650" r="430" fill="white" opacity=".6"/><ellipse cx="540" cy="1160" rx="400" ry="45" fill="${base}" opacity=".15"/><path d="M280 370Q280 280 390 280h140q110 0 110 90" fill="none" stroke="${base}" stroke-width="38"/><rect x="160" y="360" width="600" height="750" rx="130" fill="${base}"/><rect x="195" y="395" width="530" height="390" rx="100" fill="white" opacity=".2"/><path d="m460 465 38 80 90 12-65 64 15 90-78-42-80 42 15-90-65-64 90-12Z" fill="#ffe597"/><rect x="245" y="835" width="430" height="220" rx="65" fill="white" opacity=".3"/><path d="M290 855h340" stroke="white" stroke-width="14"/><rect x="760" y="670" width="170" height="440" rx="55" fill="${pink ? '#d08cde' : '#ffbf59'}"/><rect x="780" y="610" width="130" height="95" rx="26" fill="${base}"/><path d="M845 825v150m-70-75h140" stroke="white" stroke-width="16" opacity=".8"/><circle cx="230" cy="220" r="18" fill="#ffc04b"/><path d="m860 250 13 32 35 3-27 22 9 35-30-20-30 20 9-35-27-22 35-3Z" fill="#ffc04b"/></svg>`;
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  // Check settings are unique and have valid limits before rendering.
  const ids = schema.settings.filter(s => s.id).map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const setting of schema.settings.filter(s => s.type === 'range')) assert(setting.default >= setting.min && setting.default <= setting.max);
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/assets/')) {
        const file = path.join(theme, 'assets', path.basename(url.pathname));
        res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/css');
        res.end(fs.readFileSync(file));
      } else if (url.pathname === '/fixture-image.svg') {
        res.setHeader('Content-Type', 'image/svg+xml'); res.end(illustration(url.searchParams.get('colour')));
      } else { res.setHeader('Content-Type', 'text/html'); res.end(await render(url.searchParams.get('variant'))); }
    } catch (e) { res.statusCode = 500; res.end(String(e.stack)); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage(); const errors = []; const passed = [];
  page.on('pageerror', e => errors.push(e.message));
  const check = (name, value) => { assert(value, name); passed.push(name); console.log(`PASS ${name}`); };
  const load = async (variant = '') => { await page.goto(`${base}/?variant=${variant}`); await page.waitForTimeout(200); };
  try {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 }); await load();
      const metrics = await page.evaluate(() => {
        const panels = [...document.querySelectorAll('pp-gift-carousel')].map(el => el.getBoundingClientRect().toJSON());
        const track = document.querySelector('[data-track]'); const card = document.querySelector('[data-slide]');
        return { panels, overflow: document.documentElement.scrollWidth > innerWidth, ratio: track.clientWidth / card.getBoundingClientRect().width };
      });
      check(`${width}px no page overflow`, !metrics.overflow);
      check(`${width}px ${width >= 990 ? 'two columns' : 'stacked panels'}`, width >= 990 ? metrics.panels[0].y === metrics.panels[1].y : metrics.panels[1].y > metrics.panels[0].y + metrics.panels[0].height);
      if (width < 750) check(`${width}px 1.2–1.5 visible cards`, metrics.ratio >= 1.2 && metrics.ratio <= 1.5);
      if ([1440, 390].includes(width)) await page.screenshot({ path: path.join(output, `${width === 1440 ? 'desktop' : 'mobile'}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1100 }); await load();
    const boys = page.locator('pp-gift-carousel').nth(0); const girls = page.locator('pp-gift-carousel').nth(1);
    const offset = el => el.locator('[data-track]').evaluate(el => el.scrollLeft);
    check('Six unique products per panel, no clones', await boys.locator('[data-slide]').count() === 6 && await girls.locator('[data-slide]').count() === 6);
    check('Metafield preferred over SKU', (await boys.locator('.pp-gift__code').first().innerText()).includes('META-boys'));
    check('SKU fallback', (await boys.locator('.pp-gift__code').nth(1).innerText()).includes('SKU-boys-1'));
    check('No code label when both sources absent', await boys.locator('[data-slide]').nth(2).locator('.pp-gift__code').count() === 0);
    check('Discount compare-at and current price', (await boys.locator('.pp-gift__price').first().innerText()).includes('20,000.00') && await boys.locator('.pp-gift__price s').count() === 1);
    check('Real product route from fixture object', await boys.locator('.pp-gift__card').first().getAttribute('href') === '/products/fixture-boys-0');
    check('Collection route from selected object', await girls.locator('.pp-gift__explore').getAttribute('href') === '/collections/fixture-girls');
    check('Missing image handled', await boys.locator('.pp-gift__missing').count() === 1);
    check('Sold out label', await boys.locator('.pp-gift__sold-out').count() === 1);
    // Pause the other panel so autoplay cannot disguise coupling bugs.
    await girls.evaluate(el => el.pause());
    await boys.locator('[data-next]').click(); await page.waitForTimeout(650);
    check('Manual next independently moves Boys', await offset(boys) > 0 && await offset(girls) === 0);
    await boys.locator('[data-previous]').click(); await page.waitForTimeout(650);
    check('Manual previous returns to start', await offset(boys) === 0);
    await boys.locator('[data-dots] button').last().click(); await page.waitForTimeout(650);
    check('Pagination goes to last position', await offset(boys) > 0);
    await boys.locator('[data-next]').click(); await page.waitForTimeout(650);
    check('Last position loops to start without clones', await offset(boys) === 0);
    await boys.locator('[data-track]').focus(); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(650);
    check('Keyboard navigation', await offset(boys) > 0);
    check('Manual interaction persists pause', await boys.evaluate(el => el.userPaused));
    await load('currency');
    check('Currency code setting', (await page.locator('.pp-gift__price').first().innerText()).includes('LKR 20,000.00'));
    await load('empty');
    check('Empty and unselected collections', await page.locator('.pp-gift__empty').count() === 2 && await page.locator('[data-track]').count() === 0);
    check('Unselected collection has no fake URL', await page.locator('.pp-gift__explore').count() === 1);
    check('Editor-only collection guidance', await page.locator('.pp-gift__editor-note').count() === 1);
    await load('one');
    check('Single product has no unnecessary controls', await page.locator('pp-gift-carousel').first().locator('[data-controls]').isHidden());
    await load('single');
    check('One gallery can be disabled', await page.locator('pp-gift-carousel').count() === 1);
    await load('disabled'); check('Entire section can be disabled', await page.locator('.pp-gift').count() === 0);
    await load('backgrounds');
    check('Four independent backgrounds', await page.locator('picture source').count() === 1 && await page.locator('.pp-gift__panel-art img').count() === 2);
    await page.setViewportSize({ width: 390, height: 1100 }); await load('backgrounds');
    check('Mobile title selects independent image', await page.locator('.pp-gift__hero-art img').evaluate(img => img.currentSrc.includes('lavender')));
    check('Mobile backgrounds do not overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.setViewportSize({ width: 1440, height: 1100 }); await load();
    await boys.evaluate(el => { el.dataset.interval = '3000'; el.schedule(); });
    await girls.evaluate(el => el.pause()); await page.mouse.move(0, 0);
    await page.waitForTimeout(3800);
    check('Autoplay independently advances Boys', await offset(boys) > 0 && await offset(girls) === 0);
    await boys.hover(); const hoverOffset = await offset(boys); await page.waitForTimeout(3400);
    check('Hover pauses autoplay', Math.abs(await offset(boys) - hoverOffset) < 2);
    await page.mouse.move(0, 0); await boys.locator('[data-track]').focus(); const focusOffset = await offset(boys); await page.waitForTimeout(3400);
    check('Focus pauses autoplay', Math.abs(await offset(boys) - focusOffset) < 2);
    await boys.locator('[data-toggle]').click();
    check('Pause control updates accessible label', await boys.locator('[data-toggle]').getAttribute('aria-label') === defaults.play_label);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await load(); await page.waitForTimeout(3300);
    check('Reduced motion disables autoplay', await offset(boys) === 0 && await boys.locator('[data-toggle]').isHidden());
    await boys.locator('[data-next]').click();
    check('Reduced motion retains instant manual controls', await offset(boys) > 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await load();
    // Real custom-element disconnect/reconnect lifecycle used by Theme Editor reloads.
    check('Disconnected element releases timer and listeners', await boys.evaluate(el => { const parent = el.parentNode; el.remove(); const clean = el.timer === null && el.events === null; parent.prepend(el); return clean; }));
    await page.waitForTimeout(200);
    await page.addScriptTag({ path: path.join(theme, 'assets/pp-gift-packs-gallery.js') });
    await boys.locator('[data-next]').click(); await page.waitForTimeout(650);
    check('Editor reconnect and duplicate script are safe', await boys.evaluate(el => el.index === 1 && el.querySelectorAll('[data-slide]').length === 6));
    await load();
    const accessibility = await new AxeBuilder({ page }).include('.pp-gift').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    fs.writeFileSync(path.join(output, 'accessibility.json'), JSON.stringify(accessibility.violations, null, 2));
    check('Automated WCAG A/AA checks', accessibility.violations.length === 0);
    check('No browser JavaScript errors', errors.length === 0);
    // Mobile touch scroll using Chromium's actual gesture synthesizer.
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage(); await touchPage.goto(base); await touchPage.waitForTimeout(300);
    await touchPage.locator('pp-gift-carousel').evaluateAll(els => els.forEach(el => el.pause()));
    const box = await touchPage.locator('[data-track]').first().boundingBox();
    const cdp = await touchContext.newCDPSession(touchPage);
    const startX = Math.round(box.x + box.width * .85);
    const touchY = Math.round(box.y + 100);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: touchY }] });
    for (let step = 1; step <= 12; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX - step * 16, y: touchY }] });
      await touchPage.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touchPage.waitForTimeout(800);
    check('Native mobile touch swipe', await touchPage.locator('[data-track]').first().evaluate(el => el.scrollLeft) > 0);
    await touchContext.close();
    fs.writeFileSync(path.join(output, 'test-results.json'), JSON.stringify({ passed, errors, note: 'Synthetic Liquid/browser fixture. Not a live Shopify integration test.' }, null, 2));
    console.log(`Completed ${passed.length} checks.`);
  } finally { await context.close(); await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
