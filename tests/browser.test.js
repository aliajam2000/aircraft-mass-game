/* Developer-only: node tests/browser.test.js (requires Playwright).
   No test dependency is needed to play the game. */
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:1100},offline:true});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const add=async(k,n)=>{for(let i=0;i<n;i++)await page.locator(`[data-load="${k}"][data-dir="1"]`).click();};
  const mass=async k=>page.locator('.mass-row').filter({has:page.locator('.abbr',{hasText:new RegExp('^'+k+'(?:Planned|At|$)')})}).locator('.mass-value').textContent();
  assert.equal(await page.title(),'Ready for Takeoff — Aircraft Mass Game');
  await page.locator('#next').click();assert.match(await page.locator('#feedback').textContent(),/Add 2 crew/);
  await add('crew',2);await add('items',1);await page.locator('#next').click();
  await add('passengers',8);await add('bags',8);await add('cargo',2);await page.locator('#next').click();
  await add('takeoffFuel',6);await add('taxiFuel',1);
  assert.equal(await page.locator('#current-mass').innerText(),'6,050 kg');
  assert.equal(await mass('ZFM'),'5,400');
  await page.screenshot({path:process.env.SHOT_PATH||'/tmp/ready-for-takeoff-desktop.png',fullPage:true});
  await page.locator('#next').click();assert(await page.locator('[data-load="cargo"][data-dir="1"]').isDisabled());
  await page.waitForFunction(()=>document.querySelector('#next').disabled===false);
  assert.equal(await page.locator('#current-mass').innerText(),'6,000 kg');
  await page.locator('#next').click();await page.waitForFunction(()=>document.querySelector('#next').disabled===false);
  await page.locator('#next').click();assert.match(await page.locator('#summary').textContent(),/5,600 kg/);
  assert.equal(await page.locator('#fuel-onboard').textContent(),'200 kg');assert.equal(await page.locator('#score').textContent(),'120');
  await page.locator('#restart').click();assert.equal(await page.locator('#score').textContent(),'0');assert.equal(await page.locator('#current-mass').innerText(),'4,000 kg');
  // Practice: hidden results, retries, one award per answer, full completion.
  await page.locator('[data-mode="practice"]').click();assert.equal(await mass('ZFM'),'?');
  await page.locator('[data-answer="1"]').click();assert.equal(await page.locator('#score').textContent(),'0');
  await page.locator('[data-answer="0"]').click();assert.equal(await page.locator('#score').textContent(),'20');assert.equal(await mass('ZFM'),'5,400');
  const answers=[6000,'crew',5600,1600,5500];
  for(const a of answers){await page.locator('#next-question').click();if(a==='crew')await page.locator('[data-answer="1"]').click();else{await page.locator('#answer-input').fill(String(a));await page.locator('#answer-form button').click();}}
  assert.equal(await page.locator('#score').textContent(),'120');assert.match(await page.locator('#quiz').textContent(),/Practice complete/);
  await page.locator('#try-again').click();assert.equal(await page.locator('#score').textContent(),'0');
  // Mission trap and minimum fuel gate.
  await page.locator('[data-mode="mission"]').click();assert.match(await page.locator('#checks').textContent(),/ZFM is too high/);
  await page.locator('[data-load="takeoffFuel"][data-dir="-1"]').click();assert.equal(await mass('ZFM'),'5,700');
  for(let i=0;i<2;i++)await page.locator('[data-load="cargo"][data-dir="-1"]').click();
  await page.locator('#next').click();await page.locator('#next').click();await page.locator('#next').click();assert.equal(await page.locator('#stage-badge').textContent(),'FUEL');
  await add('takeoffFuel',1);await page.locator('#next').click();await page.waitForFunction(()=>!document.querySelector('#next').disabled);
  await page.locator('#next').click();await page.waitForFunction(()=>!document.querySelector('#next').disabled);await page.locator('#next').click();assert.equal(await page.locator('#score').textContent(),'120');
  // Restart/switch during active burn cancels the old animation.
  await page.locator('#restart').click();await page.locator('#mission-select').selectOption('1');
  await add('crew',2);await add('items',1);await page.locator('#next').click();await add('cargo',7);await page.locator('#next').click();await add('takeoffFuel',8);await add('taxiFuel',1);await page.locator('#next').click();
  await page.locator('[data-mode="learn"]').click();await page.waitForTimeout(3500);assert.equal(await page.locator('#current-mass').innerText(),'4,000 kg');assert.equal(await page.locator('#score').textContent(),'0');
  // Capacities and mobile layout.
  await add('passengers',12);assert(await page.locator('[data-load="passengers"][data-dir="1"]').isDisabled());
  await add('takeoffFuel',12);assert(await page.locator('[data-load="takeoffFuel"][data-dir="1"]').isDisabled());
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'/tmp/ready-for-takeoff-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await browser.close();console.log('PASS browser: offline file://, full Learn flight, all quiz answers, both mission setups, ZFM trap, gates, caps, animation cancellation, score/reset, mobile width; no JS errors or external requests.');
})().catch(e=>{console.error(e);process.exit(1);});
