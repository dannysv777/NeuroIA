const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const visible = async id => {
      assert.equal(await page.locator('main > section:visible').count(), 1);
      assert.ok(await page.locator(`#${id}`).isVisible());
      assert.equal(await page.locator('header nav [aria-current="page"]').getAttribute('href'), `#${id}`);
    };
    await page.goto('http://localhost:3000'); await visible('inicio');
    await page.locator('.destination-card[href="#laboratorio"]').click(); await visible('laboratorio');
    await page.locator('#free-tab').click();
    await page.locator('#plane').click({ position: { x: 70, y: 70 } });
    assert.equal(await page.locator('#point-count').textContent(), '81');
    await page.locator('header nav a[href="#dentro"]').click(); await visible('dentro');
    assert.ok(await page.locator('#neuron-lesson').isVisible());
    assert.equal(await page.locator('#addition-lesson').isVisible(), false);
    await page.locator('#addition-tab').click();
    await page.locator('#sum-train').click();
    await page.waitForFunction(() => document.getElementById('sum-epoch').textContent !== 'Época 0 / 180');
    await page.locator('header nav a[href="#inicio"]').click(); await visible('inicio');
    await page.waitForFunction(() => document.getElementById('sum-state').textContent.startsWith('Entrenamiento detenido'));
    await page.goBack(); await visible('dentro');
    assert.ok(await page.locator('#addition-lesson').isVisible());
    assert.notEqual(await page.locator('#sum-prediction').textContent(), '—');
    await page.locator('header nav a[href="#laboratorio"]').click(); await visible('laboratorio');
    assert.equal(await page.locator('#point-count').textContent(), '81');
    await page.locator('#guided-tab').click(); await page.locator('#guide-train').click();
    await page.locator('header nav a[href="#como-funciona"]').click(); await visible('como-funciona');
    await page.waitForFunction(() => document.getElementById('guide-state').textContent.startsWith('Detenido'));
    await page.reload(); await visible('como-funciona');
    await page.locator('header nav a[href="#inicio"]').click();
    await page.screenshot({ path: 'artifacts/routes-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('header nav a[href="#dentro"]').click(); await visible('dentro');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'artifacts/routes-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('Routes OK: one view, direct links, history, preserved data and automatic stop.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
