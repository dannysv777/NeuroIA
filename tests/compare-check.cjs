const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3000/#laboratorio');await page.locator('#compare-tab').click();
  assert.ok(await page.locator('#comparison').isVisible());assert.equal(await page.locator('#guided').isVisible(),false);
  await page.locator('#compare-start').click();
  await page.waitForFunction(()=>document.getElementById('compare-start').disabled===false);
  for(const id of ['a','b'])assert.equal(await page.locator(`#compare-epoch-${id}`).textContent(),'120 / 120 épocas');
  const scores=await Promise.all(['a','b'].map(id=>page.locator(`#compare-score-${id}`).textContent()));
  const success=Math.max(...scores.map(s=>Number(s.split('/')[0])))>=72;
  assert.equal((await page.locator('#compare-status').textContent()).startsWith('Reto logrado.'),success);
  await page.screenshot({path:'artifacts/compare-desktop.png',fullPage:true});
  await page.locator('#compare-task').selectOption('rings');assert.equal(await page.locator('#compare-score-a').textContent(),'— / 80');
  await page.locator('#compare-start').click();await page.locator('#free-tab').click();
  await page.waitForFunction(()=>document.getElementById('compare-status').textContent.startsWith('Comparación detenida'));
  assert.ok(await page.locator('.lab-layout').isVisible());assert.equal(await page.locator('#comparison').isVisible(),false);
  await page.locator('#compare-tab').click();await page.locator('#compare-start').click();
  await page.locator('header nav a[href="#inicio"]').click();
  await page.locator('.home-about-link a').click();
  await page.waitForFunction(()=>document.getElementById('compare-status').textContent.startsWith('Comparación detenida'));
  assert.equal(await page.locator('main > section:visible').count(),1);
  assert.match(await page.locator('#acerca-de-mi').textContent(),/Dany S/);
  assert.match(await page.locator('#acerca-de-mi').textContent(),/0904-24-17049/);
  assert.equal(await page.locator('.instagram-link').getAttribute('href'),'https://www.instagram.com/danny_sv7');
  await page.screenshot({path:'artifacts/about-desktop.png',fullPage:true});
  await page.reload();assert.ok(await page.locator('#acerca-de-mi').isVisible());
  for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);for(const link of await page.locator('header nav a').all())assert.ok(await link.isVisible());}
  await page.screenshot({path:'artifacts/about-mobile.png',fullPage:true});
  await page.locator('header a[href="#laboratorio"]').click();await page.locator('#compare-tab').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log('Comparison and About OK:',scores);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
