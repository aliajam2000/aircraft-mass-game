/* Optional developer tests. The game itself needs only index.html. */
const assert = require('node:assert/strict');
const D = require('../js/data.js');
const C = require('../js/core.js');
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS '+name); }
function example() { const s=C.create(); Object.assign(s.loads,D.guide); return s; }
test('Exact guided masses and fuel',()=>{
  const a=C.calculate(example());
  for(const [k,v] of Object.entries({bem:4000,dom:4400,traffic:1000,zfm:5400,om:5000,useful:1600,taxiMass:6050,tom:6000,lm:5600,landingFuel:200,rampFuel:650,current:6050}))assert.equal(a[k],v,k);
});
test('Fuel leaves ZFM unchanged; traffic changes mass',()=>{
  const s=example(); C.change(s,'takeoffFuel',1); C.change(s,'takeoffFuel',1);
  assert.equal(C.calculate(s).zfm,5400); assert.equal(C.calculate(s).tom,6200);
  C.change(s,'cargo',1); assert.equal(C.calculate(s).zfm,5500);assert.equal(C.calculate(s).current,6350);
});
test('Stage gates, partial burns, once-only burns and score',()=>{
  const s=example(); assert(C.advance(s));assert(C.advance(s));assert(C.advance(s));
  assert.equal(s.stage,'taxi'); assert(!C.advance(s)); assert(!C.change(s,'cargo',1));
  C.progress(s,.5);assert.equal(C.calculate(s).current,6025);assert.equal(C.calculate(s).fuel,625);
  C.progress(s,1);C.progress(s,1);C.progress(s,.2);assert.equal(C.calculate(s).current,6000);
  assert(C.advance(s));assert(!C.advance(s));C.progress(s,.5);assert.equal(C.calculate(s).current,5800);
  C.progress(s,1);C.progress(s,1);assert(C.advance(s));assert(!C.advance(s));
  assert.equal(C.calculate(s).current,5600);assert.equal(C.calculate(s).fuel,200);assert.equal(s.score,120);
  assert(!C.award(s,'land',40));assert.equal(s.score,120);
});
test('Missing preparation and loads block departure',()=>{
  const s=C.create();assert(!C.advance(s));s.loads.crew=2;s.loads.items=200;assert(C.advance(s));assert(!C.advance(s));
  Object.assign(s.loads,D.guide);assert(C.advance(s));s.loads.takeoffFuel=0;assert(!C.advance(s));
});
test('Every load is clamped; fuel and seat capacities',()=>{
  const s=C.create();
  for(const k of Object.keys(D.capacity)){for(let i=0;i<100;i++)C.change(s,k,1);assert.equal(s.loads[k],D.capacity[k]);for(let i=0;i<100;i++)C.change(s,k,-1);assert.equal(s.loads[k],0);}
  assert.equal(C.change(s,'bad',1),false);assert.equal(C.change(s,'crew',NaN),false);
});
test('ZFM trap is below TOM limit; fuel removal cannot fix it',()=>{
  const s=C.create('mission',0),m=D.missions[0];
  assert(C.calculate(s).tom<m.limits.tom);assert(C.calculate(s).zfm>m.limits.zfm);
  for(let i=0;i<6;i++)C.change(s,'takeoffFuel',-1);
  assert.equal(C.calculate(s).zfm,5700);assert(C.violations(s).some(e=>e.includes('ZFM')));assert(C.violations(s).some(e=>e.includes('600')));
  C.change(s,'cargo',-1);C.change(s,'cargo',-1);assert.equal(C.calculate(s).zfm,5500);
  C.advance(s);C.advance(s);assert(!C.advance(s));
  for(let i=0;i<6;i++)C.change(s,'takeoffFuel',1);assert.deepEqual(C.violations(s),[]);assert(C.advance(s));
});
test('Cargo mission is solvable with required fuel',()=>{
  const s=C.create('mission',1);Object.assign(s.loads,{crew:2,items:200,cargo:700,takeoffFuel:800,taxiFuel:50});
  assert.deepEqual(C.violations(s),[]);assert(C.advance(s));assert(C.advance(s));assert(C.advance(s));C.progress(s,1);assert(C.advance(s));C.progress(s,1);assert(C.advance(s));assert.equal(C.calculate(s).fuel,200);
});
test('Quiz retries and repeated correct clicks cannot farm points',()=>{
  const s=C.create('practice');assert(!C.answer(s,'Yes'));assert.equal(s.score,0);
  D.questions.forEach((q,i)=>{s.question=i;C.setupQuestion(s);assert(C.answer(s,q.answer));assert(!C.answer(s,q.answer));});assert.equal(s.score,120);
  s.question=1;C.setupQuestion(s);assert(!C.answer(s,''));assert(!C.answer(s,'6000abc'));assert(C.answer(s,6000));assert.equal(s.score,120);
});
test('Reset creates independent clean state and clears burns and points',()=>{
  const a=example();a.score=100;a.stage='fly';C.progress(a,1);const b=C.create();
  assert.equal(b.score,0);assert.equal(b.flightProgress,0);assert.equal(b.taxiProgress,0);assert.equal(b.loads.passengers,0);assert.equal(b.stage,'prepare');assert.notEqual(a.loads,b.loads);
  const p=C.create('practice');assert.equal(p.score,0);assert.equal(p.question,0);
});
console.log('\n'+count+' test groups passed.');
