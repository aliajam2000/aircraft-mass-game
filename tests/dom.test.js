/* Optional developer integration test: requires jsdom, not used by the game. */
const {JSDOM,VirtualConsole}=require(process.env.JSDOM_PATH || 'jsdom');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  let now=0,nextId=0,frames=new Map();
  const dom=await JSDOM.fromFile(path.resolve(__dirname,'../index.html'),{
    runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.requestAnimationFrame=f=>{frames.set(++nextId,f);return nextId;};w.cancelAnimationFrame=id=>frames.delete(id);Object.defineProperty(w.performance,'now',{value:()=>now});}
  });
  const w=dom.window;await new Promise(resolve=>w.addEventListener('load',resolve));
  const $=s=>w.document.querySelector(s),click=s=>{assert($(s),'Missing '+s);$(s).click();};
  const add=(key,n)=>{for(let i=0;i<n;i++)click(`[data-load="${key}"][data-dir="1"]`);};
  const finish=()=>{now+=10000;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(now));};
  const mass=k=>[...w.document.querySelectorAll('.mass-row')].find(r=>r.querySelector('.abbr').textContent.startsWith(k)).querySelector('.mass-value').textContent;
  assert.equal($('#current-mass').textContent,'4,000 kg');
  click('#next');assert.match($('#feedback').textContent,/Add 2 crew/);
  add('crew',2);add('items',1);click('#next');add('passengers',8);add('bags',8);add('cargo',2);click('#next');add('takeoffFuel',6);add('taxiFuel',1);
  assert.equal(mass('DOM'),'4,400');assert.equal(mass('ZFM'),'5,400');assert.equal(mass('OM'),'5,000');assert.equal(mass('Useful Load'),'1,600');assert.equal(mass('TOM'),'6,000');assert.equal(mass('LM'),'5,600');assert.equal($('#current-mass').textContent,'6,050 kg');
  click('#next');assert($('#next').disabled);assert($('[data-load="cargo"][data-dir="1"]').disabled);finish();assert.equal($('#current-mass').textContent,'6,000 kg');
  click('#next');finish();click('#next');assert.equal($('#fuel-onboard').textContent,'200 kg');assert.equal($('#score').textContent,'120');assert(!$('#summary').hidden);
  click('#next');assert.equal($('#score').textContent,'120');
  click('#restart');assert.equal($('#score').textContent,'0');assert.equal($('#current-mass').textContent,'4,000 kg');
  click('[data-mode="practice"]');assert.equal(mass('ZFM'),'?');click('[data-answer="1"]');assert.equal($('#score').textContent,'0');click('#try-again');assert.equal($('#score').textContent,'0');click('[data-answer="0"]');assert.equal(mass('ZFM'),'5,400');
  for(const a of [6000,'crew',5600,1600,5500]){click('#next-question');if(a==='crew')click('[data-answer="1"]');else{$('#answer-input').value=a;$('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}}
  assert.equal($('#score').textContent,'120');assert.match($('#quiz').textContent,/Practice complete/);click('#try-again');assert.equal($('#score').textContent,'0');
  click('[data-mode="mission"]');assert.match($('#checks').textContent,/ZFM is too high/);assert.equal(mass('TOM'),'6,300');
  click('[data-load="takeoffFuel"][data-dir="-1"]');assert.equal(mass('ZFM'),'5,700');
  click('[data-load="cargo"][data-dir="-1"]');click('[data-load="cargo"][data-dir="-1"]');click('#next');click('#next');click('#next');assert.equal($('#stage-badge').textContent,'FUEL');
  add('takeoffFuel',1);click('#next');finish();click('#next');finish();click('#next');assert.equal($('#score').textContent,'120');assert.equal($('#current-mass').textContent,'5,700 kg');
  $('#mission-select').value='1';$('#mission-select').dispatchEvent(new w.Event('change',{bubbles:true}));add('crew',2);add('items',1);click('#next');add('cargo',7);click('#next');add('takeoffFuel',8);add('taxiFuel',1);click('#next');finish();click('#next');finish();click('#next');assert.equal($('#current-mass').textContent,'5,300 kg');assert.equal($('#score').textContent,'120');
  click('#restart');assert.equal($('#current-mass').textContent,'4,000 kg');
  add('crew',2);add('items',1);click('#next');add('cargo',7);click('#next');add('takeoffFuel',8);add('taxiFuel',1);click('#next');click('[data-mode="learn"]');finish();assert.equal($('#current-mass').textContent,'4,000 kg');
  add('passengers',12);assert($('[data-load="passengers"][data-dir="1"]').disabled);assert.equal($('#seats').querySelectorAll('.person').length,12);add('takeoffFuel',12);assert($('[data-load="takeoffFuel"][data-dir="1"]').disabled);
  assert.deepEqual(errors,[]);w.close();console.log('PASS DOM: actual local HTML/scripts loaded; full Learn + both Mission flights; all 6 quiz questions; retries, input caps, source-driven render, ZFM trap, fuel gate, reset/mode switch during taxi, score locks. No script errors.');
})().catch(e=>{console.error(e);process.exit(1);});
