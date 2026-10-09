const test = require("node:test"),
  assert = require("node:assert/strict"),
  E = require("../v2/engine"),
  A = require("../v2/aircraft"),
  M = require("../v2/missions");
const near = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function prepared(i) {
  const s = E.create(i);
  if (i === 0) {
    s.load.front = 2;
    s.load.bagsFront = 2;
  }
  if (i === 1) E.latePassenger(s, false);
  if (i === 2) {
    s.load.fuel = 800;
    s.load.cargoFront = 100;
    s.load.cargoRear = 100;
  }
  if (i === 3) {
    E.transferBags(s);
  }
  if (i === 4 || i === 9) E.longRunway(s);
  if (i === 5) {
    Object.assign(s.load, {
      front: 4,
      rear: 4,
      bagsFront: 4,
      bagsRear: 4,
      cargoFront: 0,
      cargoRear: 0,
    });
  }
  if (i === 8) {
    E.verify(s);
    s.load.cargoRear = 0;
  }
  return s;
}
function depart(s) {
  if (!E.inspect(s)) assert(E.inspect(s));
  assert.equal(s.phase, "preflight");
  E.next(s);
  assert.equal(s.phase, "taxi");
  E.next(s);
  E.next(s);
  E.next(s);
  assert.equal(s.phase, "cruise");
}
function complete(s) {
  for (let i = 0; i < 12 && !s.outcome; i++) {
    if (s.phase === "cruise" && s.index === 9 && s.route !== "diversion")
      E.divert(s);
    while (
      ["cruise", "descent", "landing"].includes(s.phase) &&
      E.arrival(s).mass > A.limits.lm
    ) {
      assert(E.hold(s));
    }
    E.next(s);
  }
  assert(s.outcome);
  return s;
}
test("Preserved Oxford guided example exactly matches all categories", () => {
  const s = E.create();
  Object.assign(s.load, {
    front: 4,
    rear: 4,
    bagsFront: 4,
    bagsRear: 4,
    cargoFront: 100,
    cargoRear: 100,
  });
  const a = E.calc(s);
  for (const [k, v] of Object.entries({
    bem: 4000,
    dom: 4400,
    traffic: 1000,
    zfm: 5400,
    om: 5000,
    useful: 1600,
    tom: 6000,
    taxiMass: 6050,
    lm: 5600,
    landingFuel: 200,
  }))
    assert.equal(a[k], v, k);
});
test("Moment and %MAC independently sum station masses", () => {
  let s = E.create();
  s.load = { ...A.base };
  const a = E.calc(s),
    moment =
      4000 * 5 +
      200 * 2 +
      200 * 5 +
      160 * 4.2 +
      160 * 6 +
      40 * 2 +
      40 * 8 +
      650 * 5.3;
  near(a.moment, moment);
  near(a.cg, moment / 5450);
  near(a.mac, ((a.cg - 4) / 3) * 100);
});
test("Fuel addition changes OM/useful/TOM, never ZFM or Traffic Load", () => {
  const s = E.create(),
    a = E.calc(s);
  E.change(s, "fuel", 800);
  const b = E.calc(s);
  near(b.zfm, a.zfm);
  near(b.traffic, a.traffic);
  near(b.tom - a.tom, 200);
  near(b.om - a.om, 200);
  near(b.useful - a.useful, 200);
});
test("Transfer changes moment and CG without changing mass", () => {
  const s = E.create(3),
    a = E.calc(s);
  E.move(s);
  const b = E.calc(s);
  near(b.tom, a.tom);
  near(b.cg - a.cg, (-100 * 6) / a.current);
  assert(b.cg < a.cg);
});
test("Fuel burn CG direction is computed on either side of the tank", () => {
  for (const rear of [0, 1000]) {
    const s = E.create();
    s.load.cargoRear = rear;
    const a = E.calc(s);
    s.burn = 100;
    const b = E.calc(s);
    near(a.current - b.current, 100);
    assert.equal(Math.sign(b.cg - a.cg), Math.sign(a.cg - A.arms.fuel));
  }
});
test("Empty/full capacities, tank and impossible plans remain finite", () => {
  let s = E.create();
  for (const k in s.load) s.load[k] = 0;
  assert.equal(E.calc(s).current, 4000);
  near(E.calc(s).cg, 5);
  assert(E.check(s).errors.length);
  s = E.create();
  Object.assign(s.load, {
    front: 6,
    rear: 6,
    bagsFront: 6,
    bagsRear: 6,
    cargoFront: 500,
    cargoRear: 500,
    fuel: 1200,
  });
  assert.equal(E.calc(s).fuel, 1250);
  assert(E.check(s).errors.some((x) => x.includes("ZFM")));
});
test("Negative, NaN, infinite, fractional seats, capacity and invalid state rejected", () => {
  const s = E.create();
  for (const n of [-1, NaN, Infinity, 7, 1.5])
    assert.equal(E.change(s, "front", n), false);
  assert.equal(E.change(s, "fuel", 1201), false);
  assert.equal(E.change(s, "missing", 1), false);
  assert.throws(() => E.calc({ ...s, trip: NaN }));
  assert.throws(() => E.calc({ ...s, burn: 9999 }));
  assert.throws(() => E.performance(6000, { altitude: 9000, temp: 15 }));
});
test("Unrounded mass limits: exact boundary allowed, epsilon above rejected", () => {
  const s = E.create(1);
  E.latePassenger(s, false);
  assert.equal(E.calc(s).tom, 6100);
  assert(!E.check(s).errors.some((e) => e.startsWith("TOM")));
  s.load.cargoFront = 0.01;
  assert(E.check(s).errors.some((e) => e.startsWith("TOM")));
});
test("Taxi fuel deducted once and frozen loads cannot mutate", () => {
  const s = prepared(0);
  E.inspect(s);
  const start = E.calc(s).current;
  E.next(s);
  near(E.calc(s).current, start - 50);
  assert.equal(E.change(s, "fuel", 800), false);
  E.next(s);
  near(E.calc(s).current, start - 50 - s.trip * 0.08);
});
test("Changes invalidate checked revision including runway and trip plan", () => {
  const s = prepared(0);
  E.inspect(s);
  assert.equal(s.checked, s.revision);
  E.change(s, "fuel", 650);
  assert.equal(s.phase, "loading");
  assert.equal(s.checked, -1);
  E.inspect(s);
  E.longRunway(s);
  assert.equal(s.checked, -1);
});
test("Late acceptance crosses cap; offload restores valid dispatch", () => {
  const s = E.create(1);
  assert(E.latePassenger(s, true));
  assert.equal(E.calc(s).tom, 6200);
  assert(E.check(s).errors.some((e) => e.startsWith("TOM")));
  E.change(s, "front", 5);
  E.change(s, "bagsFront", 5);
  assert(E.inspect(s));
  assert.equal(E.latePassenger(s, true), false);
});
test("Last-minute event is once only and requires a new check", () => {
  const s = E.create(6),
    a = E.calc(s);
  assert.equal(E.inspect(s), false);
  assert.equal(s.checked, -1);
  near(E.calc(s).tom - a.tom, 100);
  assert(E.inspect(s));
  assert.equal(s.load.rear, 5);
});
test("Cargo verification adds actual load once before release", () => {
  const s = E.create(8),
    a = E.calc(s);
  assert(!E.inspect(s));
  assert(E.verify(s));
  near(E.calc(s).tom - a.tom, 200);
  assert(!E.verify(s));
  assert(E.check(s).errors.some((x) => x.startsWith("TOM")));
});
test("Short runway and hot/high reject loads even below MTOM", () => {
  for (const i of [4, 5]) {
    const s = E.create(i),
      v = E.check(s);
    assert(v.a.tom < A.limits.tom);
    assert(v.errors.some((e) => e.includes("runway")));
    assert(!v.ok);
  }
  assert(
    E.performance(6000, { altitude: 1800, temp: 35 }).distance >
      E.performance(6000, { altitude: 0, temp: 15 }).distance,
  );
});
test("Early return needs holding: planned LM versus actual arrival mass", () => {
  const s = prepared(7);
  assert(E.calc(s).lm <= 6000);
  depart(s);
  assert(E.arrival(s).mass > 6000);
  const r = E.remaining(s),
    before = E.calc(s);
  E.hold(s);
  near(E.remaining(s), r);
  near(E.calc(s).current, before.current - 50);
  complete(s);
  assert.equal(s.outcome.type, "success");
  assert(E.calc(s).current <= 6000);
});
test("Ignoring early return MLM prevents false mission success", () => {
  const s = prepared(7);
  depart(s);
  E.next(s);
  E.next(s);
  E.next(s);
  assert.equal(s.outcome.type, "operational-failure");
  assert(!s.outcome.completed);
  assert.match(s.outcome.reason, /MLM/);
});
test("Final mission extension exhausts fuel if continued; no automatic crash label", () => {
  const s = prepared(9);
  depart(s);
  assert(E.arrival(s).fuel < 0);
  while (!s.outcome) E.next(s);
  assert.equal(s.outcome.type, "serious-incident");
  assert.match(s.outcome.reason, /Fuel exhausted/);
  assert.equal(E.calc(s).fuel, 0);
  assert(!s.outcome.completed);
});
test("Final mission alternative: higher fuel supports continue safely", () => {
  const s = prepared(9);
  s.load.fuel = 900;
  depart(s);
  while (!s.outcome) E.next(s);
  assert.equal(s.outcome.type, "success");
  near(E.calc(s).fuel, 150);
});
test("Low fuel/CG restrictions do not fabricate accidents; no-go scores safety", () => {
  for (const i of [0, 3]) {
    const s = E.create(i);
    if (i === 0) s.load.fuel = 0;
    assert(!E.inspect(s));
    assert.equal(s.outcome, null);
    E.cancel(s);
    assert.equal(s.outcome.type, "safe-cancellation");
    assert.equal(s.outcome.score.safety, 40);
    assert(s.outcome.score.total >= 80);
    assert(!s.outcome.completed);
  }
});
test("Hold cannot spend reserve; diverted route cannot alter loaded fuel", () => {
  const s = prepared(0);
  depart(s);
  s.remaining = E.calc(s).fuel - 150;
  assert.equal(E.hold(s), false);
  const f = E.calc(s).fuel;
  assert(E.divert(s));
  near(E.calc(s).fuel, f);
  near(E.remaining(s), 120);
});
test("What-if is isolated and compares real engine values", () => {
  const s = E.create(4),
    snapshot = JSON.stringify(s),
    v = E.whatIf(s, {}, { runway: 1800 });
  assert(v.ok);
  assert(!E.check(s).ok);
  assert.equal(JSON.stringify(s), snapshot);
  assert.throws(() => E.whatIf(s, { fuel: 9999 }));
});
for (let i = 0; i < M.length; i++) {
  test(`Mission ${i + 1}: safe route, exact debrief, recovery and independent reset`, () => {
    const s = prepared(i);
    depart(s);
    complete(s);
    assert(["success", "safe-diversion"].includes(s.outcome.type));
    assert.equal(s.outcome.score.safety, 40);
    const a = E.calc(s),
      h = s.history.at(-1);
    near(h.current, a.current);
    near(h.cg, a.cg);
    near(h.fuel, a.fuel);
    near(a.current, a.taxiMass - s.taxiBurn - s.burn);
    assert(s.history.length > 7);
    const reset = E.create(i);
    assert.equal(reset.phase, "loading");
    assert.equal(reset.burn, 0);
    assert.equal(reset.outcome, null);
    assert.notEqual(reset.load, s.load);
  });
  test(`Mission ${i + 1}: unsafe fuel warning, dispatch gate and safe recovery`, () => {
    const s = prepared(i);
    s.load.fuel = 0;
    assert(!E.inspect(s));
    assert(E.check(s).errors.some((e) => e.includes("fuel")));
    assert.equal(s.phase, "loading");
    assert.equal(s.outcome, null);
    E.cancel(s);
    assert.equal(s.outcome.type, "safe-cancellation");
    assert(s.outcome.score.total >= 80);
    assert(!s.outcome.completed);
  });
}
module.exports = { prepared, depart, complete };

test("Original educational source assets retain audited git blob hashes", () => {
  const fs = require("node:fs"),
    crypto = require("node:crypto"),
    path = require("node:path");
  for (const [name, sha] of Object.entries({
    "source-diagram.png": "e748fdc7d2efa09fb1a42a4b3f76233c5bfc55e1",
    "source-definitions.png": "e446af04c665b8ebdc6b6f167b8d463a66ece6ba",
  })) {
    const b = fs.readFileSync(path.join(__dirname, "../assets", name));
    assert.equal(
      crypto
        .createHash("sha1")
        .update("blob " + b.length + "\0")
        .update(b)
        .digest("hex"),
      sha,
    );
  }
});
