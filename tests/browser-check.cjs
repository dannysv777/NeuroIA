// Comprobación manual automatizada: node tests/browser-check.cjs.
// PLAYWRIGHT_PATH puede apuntar a una instalación externa de Playwright.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:3000/#laboratorio');
    await page.locator('#free-tab').click();
    await page.locator('#train').click();
    await page.waitForFunction(() => document.getElementById('phase').textContent === 'Modelo entrenado', null, { timeout: 60000 });
    assert.equal(await page.locator('#accuracy').textContent(), '100.0%');
    await page.locator('[data-mode="test"]').click();
    await page.locator('#plane').click({ position: { x: 100, y: 100 } });
    await page.waitForFunction(() => document.getElementById('prediction').textContent.includes('P(A)'));
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
    await page.locator('#reset').click();
    assert.equal(await page.locator('#loss').textContent(), '—');
    await page.locator('#epochs').fill('1000');
    await page.locator('#train').click();
    await page.locator('#stop').click();
    await page.waitForFunction(() => document.getElementById('phase').textContent === 'Detenido');
    await page.locator('#clear').click(); await page.locator('#train').click();
    assert.match(await page.locator('#message').textContent(), /entre 4 y 500/);
    await page.locator('#load').click();
    await page.locator('[data-mode="1"]').click();
    await page.locator('#plane').click({ position: { x: 80, y: 80 } });
    assert.equal(await page.locator('#point-count').textContent(), '81');
    await page.locator('[data-mode="erase"]').click();
    await page.locator('#plane').click({ position: { x: 80, y: 80 } });
    assert.equal(await page.locator('#point-count').textContent(), '80');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('Browser OK: entrenamiento, predicción, reinicio, parada, validación, edición y móvil.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
