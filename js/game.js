(function () {
  'use strict';
  const D = MassData, C = MassCore, $ = id => document.getElementById(id);
  const stages = ['prepare','load','fuel','taxi','fly','land'];
  const names = {crew:'Crew',items:'Operating items',passengers:'Passengers',bags:'Bags',cargo:'Cargo',takeoffFuel:'Takeoff fuel',taxiFuel:'Start and taxi fuel'};
  const details = {crew:'100 kg each · 2 seats',items:'200 kg per set',passengers:'80 kg each · no bags',bags:'20 kg each · 12 spaces',cargo:'100 kg per box · 10 boxes',takeoffFuel:'100 kg per click · max 1,200',taxiFuel:'50 kg · separate from takeoff fuel'};
  const format = n => Math.round(n).toLocaleString('en-US');
  const kg = n => format(n) + ' kg';
  let state=C.create(), previous={}, animation=0, message='Welcome aboard. Add 2 crew and one set of operating items.', error=false;
  const htmlCache = new Map();
  function html(id, value) { if (htmlCache.get(id) !== value) { $(id).innerHTML=value; htmlCache.set(id,value); } }
  function tell(text, bad=false) { message=text; error=bad; }
  function reset(mode=state.mode, missionIndex=state.missionIndex) {
    cancelAnimationFrame(animation); state=C.create(mode, missionIndex); previous={};
    tell(mode==='mission' ? 'Check the load, fuel, and every mass limit.' : mode==='practice' ? 'No timer. Think it through and try an answer.' : 'Welcome aboard. Add 2 crew and one set of operating items.');
    render();
  }
  function isHidden(key) { return state.mode==='practice' && !state.solved && D.questions[state.question].hide.includes(key); }
  function phaseLabel(key) {
    if(key==='taxiMass') return stages.indexOf(state.stage)<3 ? 'Planned' : 'At taxi start';
    if(key==='tom') return stages.indexOf(state.stage)<4 ? 'Planned' : 'At takeoff';
    if(key==='lm') return state.stage==='land' ? 'At landing' : 'Planned';
    return '';
  }
  function renderMass() {
    const a=C.calculate(state), validLanding=state.loads.takeoffFuel>=state.tripFuel;
    $('score').textContent=state.score;
    $('current-mass').innerHTML=isHidden('current')?'? <small>kg</small>':format(a.current)+' <small>kg</small>';
    $('fuel-onboard').textContent=kg(a.fuel); $('fuel-fill').style.width=(a.fuel/1250*100)+'%';
    $('seat-count').textContent=state.loads.passengers+' / 12';
    html('mass-board',Object.entries(D.labels).map(([k,v])=>{
      const changed=previous[k]!==undefined && previous[k]!==a[k];
      const value=isHidden(k)?'?':k==='lm'&&!validLanding?'—':format(a[k]);
      return '<div class="mass-row '+(['zfm','tom','lm'].includes(k)?'major ':'')+(changed?'changed':'')+'"><span class="abbr">'+v[0]+'<span class="status">'+phaseLabel(k)+'</span></span><span class="mass-value">'+value+'</span><small>'+v[1]+'</small><small>'+v[2]+(k==='lm'&&!validLanding?' · Add trip fuel first.':'')+'</small></div>';
    }).join(''));
    previous=a;
    html('fuel-plan',pair('Ramp fuel loaded',kg(a.rampFuel))+pair('Start and taxi fuel',kg(state.loads.taxiFuel))+pair('Takeoff fuel loaded',kg(state.loads.takeoffFuel))+pair('Trip fuel planned',kg(state.tripFuel))+pair('Fuel at landing'+(state.stage==='land'?'':' · planned'),validLanding?kg(a.landingFuel):'Need fuel')+pair('Fuel used so far',kg(a.taxiBurn+a.tripBurn)));
    const running=(state.stage==='taxi'&&state.taxiProgress<1)||(state.stage==='fly'&&state.flightProgress<1);
    $('scene').className='scene '+state.stage+(running?' running':'');
    $('stage-badge').textContent=state.stage.toUpperCase();
    $('scene-title').textContent={prepare:'At the stand',load:'Make room for the load',fuel:'Fill up for the flight',taxi:state.taxiProgress<1?'Taxi to the runway':'Ready for takeoff',fly:state.flightProgress<1?'On the way':'Ready to land',land:'Welcome to your destination'}[state.stage];
    if(state.mode==='mission') renderLimits(a);
  }
  function pair(label,value) { return '<div class="pair"><span>'+label+'</span><b>'+value+'</b></div>'; }
  function person(x,y,color) { return '<g class="person"><circle cx="'+x+'" cy="'+y+'" r="6" fill="'+color+'"/><path d="M'+(x-7)+' '+(y+11)+'q7-6 14 0v13h-14z" fill="'+color+'"/></g>'; }
  function renderAircraft() {
    let seats='';
    for(let i=0;i<12;i++) { const x=299+i*34; seats+='<path d="M'+x+' 170v25h22" fill="none" stroke="'+(i<state.loads.passengers?'#8db9b0':'#9db4c1')+'" stroke-width="5" stroke-linecap="round"/>'; if(i<state.loads.passengers) seats+=person(x+13,166,'#087e6c'); }
    html('seats',seats);
    html('crew',Array.from({length:state.loads.crew},(_,i)=>person(734+i*28,166,'#234b71')).join(''));
    html('bags',Array.from({length:state.loads.bags},(_,i)=>'<g class="cargo-box"><rect x="'+(314+i*12)+'" y="228" width="10" height="17" rx="2" fill="#c6883e"/><path d="M'+(317+i*12)+' 228v-3h4v3" fill="none" stroke="#966933"/></g>').join(''));
    html('cargo',Array.from({length:state.loads.cargo/100},(_,i)=>'<g class="cargo-box"><rect x="'+(482+i*15)+'" y="225" width="13" height="20" rx="2" fill="#7797b3"/><path d="M'+(488+i*15)+' 225v20" stroke="#b9cad8"/></g>').join(''));
    html('operating-items',state.loads.items?'<rect x="250" y="165" width="19" height="31" rx="3" fill="#516b83"/><path d="M253 181h13m-6-6v12" stroke="#fff" stroke-width="2"/>':'');
  }
  function renderLimits(a) {
    const labels={zfm:'MZFM',tom:'Maximum TOM',taxiMass:'Maximum Taxi Mass',lm:'Maximum LM'};
    html('limits',Object.entries(D.missions[state.missionIndex].limits).map(([k,v])=>'<div class="limit '+(a[k]>v?'over':'')+'"><div><b>'+labels[k]+'</b><span>'+kg(v)+'</span></div><small>'+D.labels[k][0]+': '+kg(a[k])+(a[k]>v?' · TOO HIGH':' · Within limit')+'</small><div class="bar"><i style="width:'+Math.min(a[k]/v*100,100)+'%"></i></div></div>').join('')+'<p class="small muted">Each limit must pass. These limits are invented for this game.</p>');
  }
  function target(label,met) { return '<span class="target '+(met?'met':'')+'">'+(met?'✓ ':'○ ')+label+'</span>'; }
  function renderTask() {
    const a=C.calculate(state), l=state.loads, stage=state.stage, mission=state.mode==='mission', practice=state.mode==='practice', m=D.missions[state.missionIndex];
    $('mission-select-wrap').hidden=!mission; $('mission-select').value=state.missionIndex;
    $('limits-card').hidden=!mission;
    $('controls-card').hidden=practice;
    $('task-label').textContent=practice?'PRACTICE / NO TIMER':mission?'FLIGHT MISSION':'FLIGHT GUIDE';
    $('task-count').textContent=practice?('0'+(state.question+1)+' / 06'):('0'+(stages.indexOf(stage)+1)+' / 06');
    $('next').hidden=practice; $('try-again').hidden=!(practice||stage==='land');
    $('try-again').textContent=practice?'Try Again':'Fly Again';
    html('checks',''); html('quiz','');
    if(practice) { renderQuestion(); return; }
    const task={
      prepare:['Build your Dry Operating Mass','Add 2 crew (200 kg) and operating items (200 kg). BEM + 400 kg = DOM.','Next: Load'],
      load:['Load passengers, bags, and cargo',mission?m.text:'Add 8 passengers (640 kg), 8 bags (160 kg), and 2 cargo boxes (200 kg). Traffic Load = 1,000 kg.','Next: Fuel'],
      fuel:['Check fuel. Check mass.',mission?'Keep the required fuel. All mass limits must pass before taxi.':'Add 600 kg of takeoff fuel and 50 kg of start and taxi fuel. Ramp fuel = 650 kg.','Start taxi'],
      taxi:['Taxi to the runway',state.taxiProgress<1?'The engines use start and taxi fuel. Watch current mass fall.':'Taxi is complete. All 50 kg of taxi fuel is used. The aircraft is now at its takeoff mass.','Take off'],
      fly:['Follow the flight',state.flightProgress<1?'Trip fuel is being used. ZFM stays the same.':'Trip fuel is used. The aircraft is ready to land.','Land aircraft'],
      land:['Flight complete!','Good work. Compare the masses below. Fuel changed current mass. Your Traffic Load and ZFM stayed the same.','Flight complete']
    }[stage];
    $('task-title').textContent=task[0]; $('task-text').textContent=task[1]; $('next').textContent=task[2];
    $('next').disabled=stage==='land'||(stage==='taxi'&&state.taxiProgress<1)||(stage==='fly'&&state.flightProgress<1);
    let targets=target('Crew 2 / items 200 kg',C.preparation(state));
    if(mission) targets+=target(m.minPassengers+'+ passengers',l.passengers>=m.minPassengers)+target('1 bag per passenger',l.bags>=Math.max(l.passengers,m.minBags))+target(m.minCargo+'+ kg cargo',l.cargo>=m.minCargo)+target(m.requiredFuel+'+ kg takeoff fuel',l.takeoffFuel>=m.requiredFuel)+target('Taxi fuel 50 kg',l.taxiFuel===50);
    else targets+=target('8 passengers',l.passengers===8)+target('8 bags',l.bags===8)+target('Cargo 200 kg',l.cargo===200)+target('Takeoff fuel 600 kg',l.takeoffFuel===600)+target('Taxi fuel 50 kg',l.taxiFuel===50);
    html('targets',targets);
    if(mission && ['prepare','load','fuel'].includes(stage)) html('checks','<ul>'+C.violations(state).map(e=>'<li>'+e+'</li>').join('')+'</ul>');
    $('action-help').textContent=stage==='fuel'?'Loading locks when taxi starts.':stage==='land'?'120 / 120 flight points':mission?m.name:'Each task earns points once.';
    $('summary').hidden=stage!=='land';
    if(stage==='land') html('summary','<p class="eyebrow">FLIGHT DEBRIEF</p><h2 class="result-title">A lighter aircraft at landing.</h2><div class="summary-grid"><div>Taxi Mass<b>'+kg(a.taxiMass)+'</b>Before start and taxi</div><div>Takeoff Mass<b>'+kg(a.tom)+'</b>− '+kg(l.taxiFuel)+' taxi fuel</div><div>Landing Mass<b>'+kg(a.lm)+'</b>− '+kg(state.tripFuel)+' trip fuel</div></div><p>Fuel remaining: <b>'+kg(a.landingFuel)+'</b>. ZFM: <b>'+kg(a.zfm)+'</b> throughout taxi and flight.</p><p class="small muted">DOM '+kg(a.dom)+' · OM '+kg(a.om)+' · Traffic Load '+kg(a.traffic)+' · Useful Load '+kg(a.useful)+'</p>');
  }
  function renderQuestion() {
    const q=D.questions[state.question];
    $('summary').hidden=true;
    $('task-title').textContent=q.title; $('task-text').textContent=q.note;
    html('targets',target('Question '+(state.question+1)+' of '+D.questions.length,state.solved));
    $('action-help').textContent=state.solved?'Correct. +20 points, once.':'Wrong answers cost no points.';
    if(state.solved) {
      html('quiz','<p>'+q.explanation+'</p>'+(state.question<D.questions.length-1?'<button class="primary" id="next-question">Next question →</button>':'<h3 class="result-title">Practice complete · '+state.score+' / 120 points</h3>'));
    } else if(q.choices) {
      html('quiz','<div class="choices">'+q.choices.map((v,i)=>'<button data-answer="'+i+'">'+v+'</button>').join('')+'</div>');
    } else {
      html('quiz','<form id="answer-form"><label for="answer-input">Your answer</label><input id="answer-input" type="number" min="0" step="1" inputmode="numeric" required placeholder="Mass in kg"><span>kg</span><button class="primary" type="submit">Check answer</button></form>');
    }
  }
  function render() {
    renderMass(); renderAircraft(); renderTask();
    $('feedback').textContent=message; $('feedback').className='feedback'+(error?' error':'');
    document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',b.dataset.mode===state.mode);});
    html('stages',stages.map((v,i)=>'<li class="'+(v===state.stage?'active':i<stages.indexOf(state.stage)?'done':'')+'" '+(v===state.stage?'aria-current="step"':'')+'><i>'+(i<stages.indexOf(state.stage)?'✓':i+1)+'</i>'+v[0].toUpperCase()+v.slice(1)+'</li>').join(''));
    const locked=['taxi','fly','land'].includes(state.stage)||state.mode==='practice';
    $('load-lock').textContent=locked?'LOAD LOCKED':'AT THE STAND';
    document.querySelectorAll('[data-load]').forEach(b=>{const k=b.dataset.load,dir=Number(b.dataset.dir); b.disabled=locked||(dir<0?state.loads[k]===0:state.loads[k]===D.capacity[k]);});
    Object.keys(names).forEach(k=>$('value-'+k).textContent=state.loads[k]);
  }
  function animate() {
    const snapshot=state, stage=state.stage, start=performance.now(), duration=stage==='taxi'?3200:5500;
    let last=0;
    function tick(now) {
      if(state!==snapshot || state.stage!==stage) return;
      const f=Math.min(1,(now-start)/duration); C.progress(state,f);
      if(now-last>65) { renderMass(); last=now; }
      if(f<1) animation=requestAnimationFrame(tick);
      else { tell(stage==='taxi'?'Taxi complete. Current mass equals TOM.':'Trip complete. Click Land aircraft.'); render(); }
    }
    animation=requestAnimationFrame(tick);
  }
  html('controls',Object.keys(names).map(k=>'<div class="control '+(k.includes('Fuel')?'fuel-control':'')+'"><div class="label"><b>'+names[k]+'</b><small>'+details[k]+'</small></div><button data-load="'+k+'" data-dir="-1" aria-label="Remove '+names[k].toLowerCase()+'">−</button><strong id="value-'+k+'">0</strong><button data-load="'+k+'" data-dir="1" aria-label="Add '+names[k].toLowerCase()+'">+</button></div>').join(''));
  $('controls').addEventListener('click',e=>{
    const b=e.target.closest('[data-load]'); if(!b) return;
    const k=b.dataset.load;
    if(C.change(state,k,Number(b.dataset.dir))) {
      tell(k.includes('Fuel')?'Fuel changes total mass. It does not change ZFM.':k==='crew'||k==='items'?'Crew and operating items build DOM. They are not Traffic Load.':'Passengers, bags, and cargo are Traffic Load. They change ZFM and total mass.');
      render();
    }
  });
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode!==state.mode)reset(b.dataset.mode,0);}));
  $('restart').addEventListener('click',()=>reset());
  $('try-again').addEventListener('click',()=>{
    if(state.mode==='practice' && !state.solved) { tell('Try again. Use the formula on the mass board.'); render(); $('answer-input')?.focus(); }
    else reset();
  });
  $('mission-select').addEventListener('change',e=>reset('mission',Number(e.target.value)));
  $('next').addEventListener('click',()=>{
    const before=state.stage;
    if(!C.advance(state)) {
      const msg=before==='prepare'?'Add 2 crew and 200 kg of operating items.':before==='load'?'Match the passenger, bag, and cargo targets first.':C.violations(state).join(' ');
      tell(msg||'Wait for this stage to finish.',true); render(); return;
    }
    tell(state.stage==='land'?'Safe arrival! You earned 120 flight points.':'Task complete. Follow the next step.'); render();
    if(['taxi','fly'].includes(state.stage)) animate();
  });
  function submitAnswer(value) {
    if(state.solved)return;
    if(C.answer(state,value))tell('Correct! '+D.questions[state.question].explanation);
    else tell('Not yet. '+({0:'Fuel is separate from Traffic Load.',1:'Subtract start and taxi fuel from Taxi Mass.',2:'Think about the people and items needed to operate the aircraft.',3:'Subtract trip fuel from TOM.',4:'Add Traffic Load and takeoff fuel.',5:'Cargo is part of Traffic Load.'}[state.question]),true);
    render();
  }
  $('quiz').addEventListener('click',e=>{
    const b=e.target.closest('[data-answer]'); if(b)submitAnswer(D.questions[state.question].choices[Number(b.dataset.answer)]);
    if(e.target.closest('#next-question') && state.solved && state.question<D.questions.length-1) {
      state.question++; C.setupQuestion(state); previous={}; tell('Read the next question.'); render();
    }
  });
  $('quiz').addEventListener('submit',e=>{e.preventDefault();submitAnswer($('answer-input').value);});
  render();
})();
