/* All numbers are fictional training values. No external data is loaded. */
(function (root) {
  'use strict';
  const data = {
    bem: 4000,
    capacity: { crew: 2, items: 200, passengers: 12, bags: 12, cargo: 1000, takeoffFuel: 1200, taxiFuel: 50 },
    unit: { crew: 100, items: 200, passengers: 80, bags: 20, cargo: 100, takeoffFuel: 100, taxiFuel: 50 },
    guide: { crew: 2, items: 200, passengers: 8, bags: 8, cargo: 200, takeoffFuel: 600, taxiFuel: 50 },
    missions: [
      { name: '01 / The ZFM trap', text: 'Carry 10 passengers and their 10 bags. Cargo is optional. Check each mass limit.',
        minPassengers: 10, minBags: 10, minCargo: 0, requiredFuel: 600, tripFuel: 400,
        limits: { zfm: 5500, tom: 6500, taxiMass: 6600, lm: 5800 },
        initial: { crew: 2, items: 200, passengers: 10, bags: 10, cargo: 300, takeoffFuel: 600, taxiFuel: 50 } },
      { name: '02 / Cargo run', text: 'Carry at least 700 kg of cargo. Add crew, operating items, and the required fuel.',
        minPassengers: 0, minBags: 0, minCargo: 700, requiredFuel: 800, tripFuel: 600,
        limits: { zfm: 5200, tom: 6100, taxiMass: 6200, lm: 5500 }, initial: {} }
    ],
    labels: {
      bem: ['BEM', 'Basic Empty Mass', 'The starting aircraft mass.'],
      dom: ['DOM', 'Dry Operating Mass', 'BEM + crew and operating items'],
      om: ['OM', 'Operating Mass', 'DOM + takeoff fuel'],
      traffic: ['Traffic Load', 'Passengers, bags, and cargo', 'Passenger mass excludes bags in this game.'],
      zfm: ['ZFM', 'Zero Fuel Mass', 'DOM + Traffic Load'],
      useful: ['Useful Load', 'Traffic Load + takeoff fuel', 'Traffic Load + takeoff fuel'],
      taxiMass: ['Taxi Mass', 'Mass before start and taxi', 'TOM + start and taxi fuel'],
      tom: ['TOM', 'Takeoff Mass', 'DOM + Useful Load'],
      lm: ['LM', 'Landing Mass', 'TOM − trip fuel']
    },
    questions: [
      { title: 'You add 200 kg of fuel. Does ZFM change?', note: 'The example has 600 kg of takeoff fuel. Now it has 800 kg. All other loads stay the same.',
        patch: { takeoffFuel: 800 }, hide: ['zfm'], choices: ['No', 'Yes'], answer: 'No',
        explanation: 'Fuel changes total mass. It does not change ZFM. ZFM stays at 5,400 kg.' },
      { title: 'Taxi uses 50 kg of fuel. What is TOM?', note: 'Taxi Mass is 6,050 kg. Start and taxi fuel is 50 kg.', stage: 'taxi', taxiProgress: 1,
        hide: ['tom', 'current'], answer: 6000, explanation: '6,050 − 50 = 6,000 kg. Taxi fuel is used once.' },
      { title: 'Which load helps build DOM?', note: 'Start with BEM. Choose what to add.', hide: ['dom'],
        choices: ['Passengers and bags', 'Crew and operating items', 'Takeoff fuel'], answer: 'Crew and operating items',
        explanation: 'BEM + crew and operating items = DOM. Passengers and bags are Traffic Load.' },
      { title: 'What is the landing mass?', note: 'TOM is 6,000 kg. Trip fuel is 400 kg.', stage: 'land', taxiProgress: 1, flightProgress: 1,
        hide: ['lm', 'current'], answer: 5600, explanation: 'LM = TOM − trip fuel = 6,000 − 400 = 5,600 kg.' },
      { title: 'What is the Useful Load?', note: 'Traffic Load is 1,000 kg. Takeoff fuel is 600 kg.', hide: ['useful'], answer: 1600,
        explanation: 'Useful Load = Traffic Load + takeoff fuel = 1,600 kg.' },
      { title: 'Add 100 kg of cargo. What is the new ZFM?', note: 'ZFM was 5,400 kg. This view includes the extra cargo.', patch: { cargo: 300 },
        hide: ['zfm'], answer: 5500, explanation: 'Cargo is Traffic Load. ZFM and total mass both rise by 100 kg.' }
    ]
  };
  root.MassData = data;
  if (typeof module !== 'undefined') module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
