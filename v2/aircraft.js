(function (root) {
  "use strict";
  const aircraft = {
    id: "RF–01",
    datum: "Nose, positive aft",
    bem: 4000,
    bemArm: 5,
    crewArm: 2,
    itemsArm: 5,
    macLE: 4,
    mac: 3,
    arms: {
      front: 4.2,
      rear: 6,
      bagsFront: 2,
      bagsRear: 8,
      cargoFront: 2,
      cargoRear: 8,
      fuel: 5.3,
    },
    limits: { zfm: 5800, tom: 6500, taxiMass: 6550, lm: 6000 },
    tank: 1250,
    reserve: 150,
    capacities: {
      front: 6,
      rear: 6,
      bagsFront: 12,
      bagsRear: 12,
      cargoFront: 1000,
      cargoRear: 1000,
      fuel: 1200,
      taxi: 50,
      crew: 2,
      items: 200,
    },
    base: {
      front: 2,
      rear: 2,
      bagsFront: 2,
      bagsRear: 2,
      cargoFront: 0,
      cargoRear: 0,
      fuel: 600,
      taxi: 50,
      crew: 2,
      items: 200,
    },
    envelope(m) {
      const t = Math.max(0, Math.min(1, (m - 4400) / 2100));
      return { min: 4.55 + 0.12 * t, max: 5.4 - 0.16 * t };
    },
  };
  root.RF01 = aircraft;
  if (typeof module !== "undefined") module.exports = aircraft;
})(typeof window !== "undefined" ? window : globalThis);
