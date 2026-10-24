const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:3000/#laboratorio');
    assert.equal(await page.locator('.lab-layout').isVisible(), false);
    await page.locator('#guide-speed').selectOption('0');
    await page.locator('#guide-train').click();
    await page.waitForFunction(() => document.getElementById('guide-state').textContent === 'Entrenamiento terminado');
    assert.equal(await page.locator('#guide-score').textContent(), 'Aciertos: 4 / 4');
    for (const a of ['0','1']) for (const b of ['0','1']) {
      await page.locator('#switch-a').selectOption(a); await page.locator('#switch-b').selectOption(b);
      assert.equal(await page.locator('#model-answer').textContent(), a !== b ? 'Encendida' : 'Apagada');
    }
    await page.screenshot({ path: 'artifacts/guided-desktop.png', fullPage: false });
    await page.locator('#guide-speed').selectOption('60'); await page.locator('#guide-train').click();
    await page.locator('#guide-stop').click();
    await page.waitForFunction(() => document.getElementById('guide-state').textContent.startsWith('Detenido'));
    await page.locator('#guide-reset').click();
    assert.equal(await page.locator('#model-answer').textContent(), 'Sin entrenar');
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#live-lesson').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'artifacts/guided-mobile.png' });
    assert.deepEqual(errors, []);
    console.log('Guided OK: four XOR cases, live trace, stopping, reset, mobile.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
