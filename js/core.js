/* Pure calculations and state transitions. Used by the UI and tests. */
(function (root) {
  'use strict';
  const D = root.MassData || require('./data.js');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function create(mode = 'learn', missionIndex = 0) {
    const s = { mode, missionIndex, stage: 'prepare', loads: {}, tripFuel: 400,
      taxiProgress: 0, flightProgress: 0, awards: [], score: 0, question: 0, solved: false };
    Object.keys(D.capacity).forEach(k => s.loads[k] = 0);
    if (mode === 'mission') {
      Object.assign(s.loads, D.missions[missionIndex].initial);
      s.tripFuel = D.missions[missionIndex].tripFuel;
    }
    if (mode === 'practice') setupQuestion(s);
    return s;
  }
  // Planned stage masses depend on loaded fuel, not on fuel already burned.
  // Current mass alone follows the progress of taxi and flight.
  function calculate(s) {
    const l = s.loads, bem = D.bem, dom = bem + l.crew * D.unit.crew + l.items;
    const traffic = l.passengers * D.unit.passengers + l.bags * D.unit.bags + l.cargo;
    const zfm = dom + traffic, om = dom + l.takeoffFuel, useful = traffic + l.takeoffFuel;
    const tom = dom + useful, taxiMass = tom + l.taxiFuel;
    const taxiBurn = l.taxiFuel * s.taxiProgress;
    const tripBurn = Math.min(s.tripFuel, l.takeoffFuel) * s.flightProgress;
    const rampFuel = l.takeoffFuel + l.taxiFuel;
    return { bem, dom, traffic, zfm, om, useful, tom, taxiMass,
      lm: tom - s.tripFuel, landingFuel: l.takeoffFuel - s.tripFuel,
      rampFuel, taxiBurn, tripBurn, fuel: rampFuel - taxiBurn - tripBurn,
      current: taxiMass - taxiBurn - tripBurn };
  }
  function award(s, key, points) {
    if (s.awards.includes(key)) return false;
    s.awards.push(key); s.score += points; return true;
  }
  function change(s, key, direction) {
    if (s.mode === 'practice' || !['prepare', 'load', 'fuel'].includes(s.stage) || !(key in D.capacity)) return false;
    if (direction !== 1 && direction !== -1) return false;
    const step = ['crew', 'passengers', 'bags'].includes(key) ? 1 : D.unit[key];
    const next = clamp(s.loads[key] + direction * step, 0, D.capacity[key]);
    if (next === s.loads[key]) return false;
    s.loads[key] = next; return true;
  }
  function preparation(s) { return s.loads.crew === 2 && s.loads.items === 200; }
  function violations(s) {
    const a = calculate(s), l = s.loads, errors = [];
    if (!preparation(s)) errors.push('Add 2 crew and 200 kg of operating items.');
    if (s.mode === 'mission') {
      const m = D.missions[s.missionIndex];
      if (l.passengers < m.minPassengers) errors.push('Add at least ' + m.minPassengers + ' passengers.');
      if (l.bags < Math.max(m.minBags, l.passengers)) errors.push('Load one 20 kg bag for each passenger.');
      if (l.cargo < m.minCargo) errors.push('Load at least ' + m.minCargo + ' kg of cargo.');
      if (l.takeoffFuel < m.requiredFuel) errors.push('Keep at least ' + m.requiredFuel + ' kg of takeoff fuel.');
      Object.entries(m.limits).forEach(([k, v]) => {
        if (a[k] > v) errors.push(k === 'zfm' ? 'ZFM is too high. Remove some cargo or allowed traffic load. Removing fuel does not change ZFM.' : D.labels[k][0] + ' is too heavy. Check the limit.');
      });
    } else {
      Object.entries(D.guide).forEach(([k, v]) => { if (l[k] !== v) errors.push('Match the guided target for ' + ({items:'operating items',takeoffFuel:'takeoff fuel',taxiFuel:'taxi fuel'}[k] || k) + '.'); });
    }
    if (l.taxiFuel !== 50) errors.push('Add 50 kg of start and taxi fuel.');
    if (l.takeoffFuel < s.tripFuel) errors.push('Not enough fuel for the trip.');
    return errors;
  }
  function advance(s) {
    if (s.mode === 'practice') return false;
    if (s.stage === 'prepare') {
      if (!preparation(s)) return false;
      award(s, 'prepare', 20); s.stage = 'load'; return true;
    }
    if (s.stage === 'load') {
      const l=s.loads, m=D.missions[s.missionIndex];
      if (s.mode === 'learn' && ['passengers','bags','cargo'].some(k=>l[k]!==D.guide[k])) return false;
      if (s.mode === 'mission' && (l.passengers<m.minPassengers || l.bags<Math.max(m.minBags,l.passengers) || l.cargo<m.minCargo)) return false;
      award(s, 'load', 20); s.stage = 'fuel'; return true;
    }
    if (s.stage === 'fuel') {
      if (violations(s).length) return false;
      award(s, 'fuel', 20); s.stage = 'taxi'; return true;
    }
    if (s.stage === 'taxi' && s.taxiProgress === 1) {
      if (violations(s).length) return false;
      award(s, 'taxi', 20); s.stage = 'fly'; return true;
    }
    if (s.stage === 'fly' && s.flightProgress === 1) {
      award(s, 'land', 40); s.stage = 'land'; return true;
    }
    return false;
  }
  function progress(s, fraction) {
    if (!Number.isFinite(fraction)) return;
    if (s.stage === 'taxi') s.taxiProgress = Math.max(s.taxiProgress, clamp(fraction, 0, 1));
    if (s.stage === 'fly') s.flightProgress = Math.max(s.flightProgress, clamp(fraction, 0, 1));
  }
  function setupQuestion(s) {
    const q=D.questions[s.question];
    s.loads={...D.guide, ...q.patch}; s.stage=q.stage || 'fuel';
    s.taxiProgress=q.taxiProgress || 0; s.flightProgress=q.flightProgress || 0; s.solved=false;
  }
  function answer(s, value) {
    if (s.mode!=='practice' || s.solved) return false;
    const expected=D.questions[s.question].answer;
    const correct=typeof expected==='number' ? String(value).trim()!=='' && Number(value)===expected : value===expected;
    if (correct) { s.solved=true; award(s,'question-'+s.question,20); }
    return correct;
  }
  root.MassCore={create,calculate,change,advance,progress,violations,preparation,award,setupQuestion,answer};
  if(typeof module!=='undefined') module.exports=root.MassCore;
})(typeof window!=='undefined'?window:globalThis);
