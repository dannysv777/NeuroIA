const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3000/#laboratorio');
  await page.locator('#guide-speed').selectOption('0');
  await page.locator('#laboratorio .presentation-enter').click();
  assert.equal(await page.locator('header').isVisible(),false);
  assert.ok(await page.locator('#presentation-exit').isVisible());
  assert.equal(await page.locator('#guide-speed').isVisible(),false);
  await page.locator('#presentation-settings').click();assert.ok(await page.locator('#guide-speed').isVisible());
  await page.locator('#presentation-settings').click();await page.locator('#guide-train').click();
  await page.waitForFunction(()=>document.getElementById('guide-state').textContent==='Entrenamiento terminado');
  assert.match(await page.locator('#guide-caption').textContent(),/Acertó 4 de 4 ejemplos de entrenamiento/);
  await page.screenshot({path:'artifacts/presentation-guided.png'});
  await page.keyboard.press('Escape');assert.ok(await page.locator('header').isVisible());
  assert.equal(await page.locator('#guide-state').textContent(),'Entrenamiento terminado');
  await page.locator('#free-tab').click();await page.locator('#train').click();
  await page.waitForFunction(()=>document.getElementById('phase').textContent==='Modelo entrenado');
  assert.match(await page.locator('#result-summary').textContent(),/Acertó 80 de 80/);
  await page.locator('#reset').click();assert.equal(await page.locator('#result-summary').isVisible(),false);
  await page.locator('header nav a[href="#dentro"]').click();await page.locator('#addition-tab').click();
  await page.locator('#sum-slow').uncheck();await page.locator('#dentro .presentation-enter').click();
  await page.locator('#sum-train').click();await page.waitForFunction(()=>document.getElementById('sum-state').textContent.startsWith('Entrenamiento terminado'));
  assert.match(await page.locator('#sum-summary').textContent(),/24 ejemplos nuevos/);
  await page.locator('#sum-a').fill('');assert.equal(await page.locator('#sum-summary').isVisible(),false);await page.locator('#sum-a').fill('4');assert.ok(await page.locator('#sum-summary').isVisible());
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#presentation-exit').click();assert.ok(await page.locator('header').isVisible());
  await page.locator('#dentro .presentation-enter').click();await page.evaluate(()=>{location.hash='#inicio';});
  await page.waitForFunction(()=>!document.body.classList.contains('presenting'));
  assert.ok(await page.locator('#inicio').isVisible());assert.deepEqual(errors,[]);
  console.log('Presentation and summaries OK; training, exit, preserved state, mobile and navigation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
