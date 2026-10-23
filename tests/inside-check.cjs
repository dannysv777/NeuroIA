const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3000/#dentro');
  await page.locator('[data-step="1"]').click();assert.match(await page.locator('#neuron-result').textContent(),/= 1.7/);
  await page.locator('[data-step="2"]').click();assert.match(await page.locator('#neuron-result').textContent(),/0.9354/);
  await page.locator('#n-a').fill('');assert.match(await page.locator('#neuron-result').textContent(),/Introduce/);await page.locator('#n-a').fill('2');
  await page.locator('#sum-slow').uncheck();await page.locator('#sum-train').click();
  await page.waitForFunction(()=>document.getElementById('sum-state').textContent.startsWith('Entrenamiento terminado'));
  assert.ok(Number(await page.locator('#sum-error').textContent())<.05);
  await page.locator('#sum-a').fill('-5');await page.locator('#sum-b').fill('8');assert.equal(await page.locator('#sum-exact').textContent(),'3');assert.ok(Number(await page.locator('#sum-error').textContent())<.05);
  await page.locator('[data-code="predict"]').click();assert.match(await page.locator('#sum-code').textContent(),/peso1/);
  await page.locator('#source-details summary').click();await page.waitForFunction(()=>document.getElementById('source-code').textContent.includes('export function neuron'));
  await page.locator('#source-details summary').click();
  await page.locator('#addition-lesson').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/inside-desktop.png'});
  await page.locator('#sum-slow').check();await page.locator('#sum-train').click();await page.locator('#sum-stop').click();await page.waitForFunction(()=>document.getElementById('sum-state').textContent.startsWith('Entrenamiento detenido'));
  await page.locator('#sum-reset').click();assert.equal(await page.locator('#sum-prediction').textContent(),'—');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#addition-lesson').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/inside-mobile.png'});
  assert.deepEqual(errors,[]);console.log('Inside OK: neuron, addition, source, stop/reset, mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
