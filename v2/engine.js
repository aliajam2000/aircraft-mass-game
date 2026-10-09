(function (root) {
  "use strict";
  const A = root.RF01 || require("./aircraft.js"),
    M = root.MassMissions || require("./missions.js"),
    Oxford = root.MassCore || require("../js/core.js");
  const copy = (x) => JSON.parse(JSON.stringify(x)),
    EPS = 1e-7;
  function create(index = 0, mode = "play") {
    const mission = M[index];
    if (!mission) throw Error("Unknown mission");
    const s = {
      version: 2,
      index,
      mode,
      phase: "loading",
      load: { ...mission.initial },
      conditions: { ...mission.conditions },
      trip: mission.conditions.trip,
      burn: 0,
      taxiBurn: 0,
      revision: 0,
      checked: -1,
      event: false,
      verified: mission.conditions.event !== "cargo",
      history: [],
      checks: 0,
      rejected: 0,
      decision: "",
      lateChoice: null,
      outcome: null,
      route: "destination",
      remaining: null,
    };
    record(s, "Mission started");
    return s;
  }
  function validate(l) {
    for (const [k, max] of Object.entries(A.capacities)) {
      if (!Number.isFinite(l[k]) || l[k] < 0 || l[k] > max)
        throw Error("Invalid " + k);
      if (
        ["front", "rear", "bagsFront", "bagsRear", "crew"].includes(k) &&
        !Number.isInteger(l[k])
      )
        throw Error("Whole units required");
    }
    if (l.bagsFront + l.bagsRear > 12) throw Error("Maximum 12 bags");
    if (l.cargoFront + l.cargoRear > 1000)
      throw Error("Maximum 1,000 kg cargo");
    if (l.fuel + l.taxi > A.tank) throw Error("Tank capacity");
  }
  function calc(s) {
    validate(s.load);
    if (
      !Number.isFinite(s.trip) ||
      s.trip < 0 ||
      s.trip > 1250 ||
      !Number.isFinite(s.burn) ||
      s.burn < 0 ||
      !Number.isFinite(s.taxiBurn) ||
      s.taxiBurn < 0 ||
      s.taxiBurn > s.load.taxi ||
      s.burn + s.taxiBurn > s.load.fuel + s.load.taxi + EPS
    )
      throw Error("Invalid fuel state");
    const l = s.load;
    const old = {
      loads: {
        crew: l.crew,
        items: l.items,
        passengers: l.front + l.rear,
        bags: l.bagsFront + l.bagsRear,
        cargo: l.cargoFront + l.cargoRear,
        takeoffFuel: l.fuel,
        taxiFuel: l.taxi,
      },
      tripFuel: s.trip,
      taxiProgress: 0,
      flightProgress: 0,
    };
    const a = Oxford.calculate(old);
    const fuel = Math.max(0, l.fuel + l.taxi - s.taxiBurn - s.burn);
    const dryMoment =
      A.bem * A.bemArm +
      l.crew * 100 * A.crewArm +
      l.items * A.itemsArm +
      l.front * 80 * A.arms.front +
      l.rear * 80 * A.arms.rear +
      l.bagsFront * 20 * A.arms.bagsFront +
      l.bagsRear * 20 * A.arms.bagsRear +
      l.cargoFront * A.arms.cargoFront +
      l.cargoRear * A.arms.cargoRear;
    const at = (f) => {
      const mass = a.zfm + Math.max(0, f),
        moment = dryMoment + Math.max(0, f) * A.arms.fuel,
        cg = moment / mass;
      return {
        mass,
        moment,
        cg,
        mac: (100 * (cg - A.macLE)) / A.mac,
        envelope: A.envelope(mass),
      };
    };
    const current = at(fuel);
    return {
      ...a,
      current: current.mass,
      fuel,
      cg: current.cg,
      mac: current.mac,
      moment: current.moment,
      envelope: current.envelope,
      dryMoment,
      takeoff: at(l.fuel),
      landing: at(Math.max(0, l.fuel - s.trip)),
      at,
    };
  }
  function performance(mass, c) {
    if (
      !Number.isFinite(mass) ||
      mass <= 0 ||
      !Number.isFinite(c.altitude) ||
      c.altitude < 0 ||
      c.altitude > 3000 ||
      !Number.isFinite(c.temp) ||
      c.temp < -20 ||
      c.temp > 45
    )
      throw Error("Outside fictional performance model range");
    const kelvin = 273.15 + c.temp;
    const pressure = Math.pow(1 - 2.25577e-5 * c.altitude, 5.25588);
    const sigma = (pressure * 288.15) / kelvin;
    const speed = 31 * Math.sqrt(mass / 5000 / sigma);
    const distance = (600 * Math.pow(mass / 5000, 2)) / sigma;
    const climb = 5 * (5000 / mass) * sigma - 1.5;
    return {
      sigma,
      speed,
      distance,
      climb,
      landingDistance: (420 * Math.pow(mass / 5000, 2)) / sigma,
    };
  }
  function cgErrors(v, label) {
    const b = v.envelope;
    return v.cg < b.min - EPS
      ? [label + " CG is forward of " + b.min.toFixed(2) + " m."]
      : v.cg > b.max + EPS
        ? [label + " CG is aft of " + b.max.toFixed(2) + " m."]
        : [];
  }
  function check(s) {
    if (
      !Number.isFinite(s.conditions.runway) ||
      s.conditions.runway <= 0 ||
      !Number.isFinite(s.conditions.landingRunway) ||
      s.conditions.landingRunway <= 0
    )
      throw Error("Invalid runway");
    const a = calc(s),
      l = s.load,
      m = M[s.index],
      limits = { ...A.limits, tom: s.conditions.tom || A.limits.tom },
      p = performance(a.tom, s.conditions),
      errors = [];
    if (l.crew !== 2 || l.items !== 200)
      errors.push("Prepare 2 crew and 200 kg operating items.");
    if (l.taxi !== 50) errors.push("Allocate 50 kg start/taxi fuel.");
    for (const k of ["zfm", "tom", "taxiMass", "lm"])
      if (a[k] > limits[k] + EPS)
        errors.push(
          k.toUpperCase() +
            " " +
            a[k].toFixed(0) +
            " kg exceeds " +
            limits[k] +
            " kg.",
        );
    if (l.fuel < s.trip + A.reserve - EPS)
      errors.push(
        "Takeoff fuel must cover trip " +
          s.trip +
          " + reserve " +
          A.reserve +
          " kg.",
      );
    for (const [v, label] of [
      [a.at(l.fuel + l.taxi), "Ramp"],
      [a.takeoff, "Takeoff"],
      [a.landing, "Planned landing"],
    ])
      errors.push(...cgErrors(v, label));
    if (p.distance > s.conditions.runway + EPS)
      errors.push(
        "Takeoff needs " +
          Math.ceil(p.distance) +
          " m; runway provides " +
          s.conditions.runway +
          " m.",
      );
    if (p.climb < 1.5)
      errors.push(
        "Climb " +
          p.climb.toFixed(2) +
          " m/s is below the 1.50 m/s dispatch minimum.",
      );
    if (
      performance(a.landing.mass, s.conditions).landingDistance >
      s.conditions.landingRunway
    )
      errors.push("Planned landing runway is too short.");
    if (s.conditions.event === "late-request" && !s.lateChoice)
      errors.push("Respond to the late passenger request before checking.");
    if (!s.verified)
      errors.push("Cargo discrepancy: verify the hold before dispatch.");
    const objective = [];
    if (s.mode === "play") {
      if (l.front + l.rear < m.objectives.pax)
        objective.push("Carry at least " + m.objectives.pax + " passengers.");
      if (l.bagsFront + l.bagsRear < l.front + l.rear)
        objective.push("One 20 kg bag per passenger.");
      if (l.cargoFront + l.cargoRear < m.objectives.cargo)
        objective.push("Retain " + m.objectives.cargo + " kg cargo.");
    }
    return {
      errors,
      objective,
      ok: errors.length === 0 && objective.length === 0,
      a,
      p,
      limits,
    };
  }
  function record(s, label) {
    const a = calc(s);
    s.history.push({
      label,
      phase: s.phase,
      load: copy(s.load),
      current: a.current,
      tom: a.tom,
      zfm: a.zfm,
      lm: a.lm,
      cg: a.cg,
      fuel: a.fuel,
      burn: s.burn,
      taxiBurn: s.taxiBurn,
      conditions: copy(s.conditions),
      route: s.route,
      remaining: s.remaining,
    });
  }
  function change(s, key, value) {
    if (!["loading", "preflight"].includes(s.phase) || !(key in A.capacities))
      return false;
    const next = { ...s.load, [key]: value };
    try {
      validate(next);
    } catch {
      return false;
    }
    s.load = next;
    s.revision++;
    s.checked = -1;
    s.phase = "loading";
    record(s, "Changed " + key);
    return true;
  }
  function boardPassenger(s) {
    if (
      !["loading", "preflight"].includes(s.phase) ||
      s.load.front + s.load.rear >= 12 ||
      s.load.bagsFront + s.load.bagsRear >= 12
    )
      return false;
    const seat = s.load.front < 6 ? "front" : "rear",
      bag = s.load.bagsFront < 6 ? "bagsFront" : "bagsRear";
    s.load[seat]++;
    s.load[bag]++;
    s.revision++;
    s.checked = -1;
    s.phase = "loading";
    record(
      s,
      "Boarded passenger (80 kg) and bag (20 kg): +100 kg Traffic Load",
    );
    return true;
  }
  function transferBags(s) {
    if (!["loading", "preflight"].includes(s.phase) || !s.load.bagsRear)
      return false;
    const n = Math.min(5, s.load.bagsRear);
    s.load.bagsRear -= n;
    s.load.bagsFront += n;
    s.revision++;
    s.checked = -1;
    s.phase = "loading";
    record(
      s,
      "Moved " +
        n +
        " bags forward: mass unchanged; moment reduced by " +
        n * 120 +
        " kg·m",
    );
    return true;
  }
  function move(s) {
    if (!["loading", "preflight"].includes(s.phase)) return false;
    const n = Math.min(100, s.load.cargoRear);
    if (n) {
      s.load.cargoRear -= n;
      s.load.cargoFront += n;
    } else {
      const b = Math.min(5, s.load.bagsRear);
      if (!b) return false;
      s.load.bagsRear -= b;
      s.load.bagsFront += b;
    }
    s.revision++;
    s.checked = -1;
    s.phase = "loading";
    record(s, "Transferred aft hold load forward");
    return true;
  }
  function latePassenger(s, accept) {
    if (
      !["loading", "preflight"].includes(s.phase) ||
      s.conditions.event !== "late-request" ||
      s.lateChoice
    )
      return false;
    if (accept) {
      if (s.load.rear >= 6 || s.load.bagsFront + s.load.bagsRear >= 12)
        return false;
      s.load.rear++;
      s.load.bagsRear++;
    }
    s.lateChoice = accept ? "accepted" : "declined";
    s.revision++;
    s.checked = -1;
    s.phase = "loading";
    record(
      s,
      accept
        ? "Late passenger and bag accepted: +100 kg. Recheck dispatch cap."
        : "Late passenger deferred for a later flight.",
    );
    return true;
  }
  function eventLoad(s) {
    const e = s.conditions.event;
    if (e === "late-confirmed" && !s.event) {
      s.event = true;
      s.load.rear = Math.min(6, s.load.rear + 1);
      s.load.bagsRear = Math.min(6, s.load.bagsRear + 1);
      s.revision++;
      s.checked = -1;
      s.phase = "loading";
      record(
        s,
        "Confirmed late passenger + bag: 100 kg added; old check invalidated",
      );
      return true;
    }
    return false;
  }
  function verify(s) {
    if (!["loading", "preflight"].includes(s.phase) || s.verified) return false;
    s.load.cargoRear += 200;
    s.verified = true;
    s.revision++;
    s.checked = -1;
    s.phase = "loading";
    record(s, "Hold verified: unreported 200 kg cargo included in actual load");
    return true;
  }
  function inspect(s) {
    if (!["loading", "preflight"].includes(s.phase)) return false;
    s.checks++;
    if (eventLoad(s)) return false;
    const v = check(s);
    s.checked = v.ok ? s.revision : -1;
    s.phase = v.ok ? "preflight" : "loading";
    record(
      s,
      v.ok
        ? "Preflight valid"
        : "Preflight rejected: " + [...v.errors, ...v.objective].join(" "),
    );
    return v.ok;
  }
  function remaining(s) {
    return s.remaining === null ? Math.max(0, s.trip - s.burn) : s.remaining;
  }
  function arrival(s) {
    const a = calc(s),
      required = remaining(s),
      f = a.fuel - required,
      v = a.at(Math.max(0, f));
    const errors = [];
    if (f < A.reserve - EPS)
      errors.push(
        "Arrival reserve " +
          Math.floor(f) +
          " kg is below " +
          A.reserve +
          " kg.",
      );
    if (f < 0)
      errors.push(
        "Route requires " + Math.ceil(-f) + " kg more fuel than is aboard.",
      );
    if (v.mass > A.limits.lm + EPS)
      errors.push(
        "Arrival mass " +
          Math.ceil(v.mass) +
          " kg exceeds MLM " +
          A.limits.lm +
          " kg.",
      );
    errors.push(...cgErrors(v, "Arrival"));
    if (
      performance(v.mass, s.conditions).landingDistance >
      s.conditions.landingRunway
    )
      errors.push("Landing distance exceeds available runway.");
    return { ...v, fuel: f, required, errors };
  }
  function burn(s, n) {
    const available = calc(s).fuel,
      used = Math.min(n, available);
    s.burn += used;
    if (s.remaining !== null) s.remaining = Math.max(0, s.remaining - used);
    return used + EPS >= n;
  }
  function finish(s, type, reason, completed = false) {
    s.phase = "debrief";
    s.outcome = { type, reason, completed, score: score(s, type) };
    record(s, reason);
    return s.outcome;
  }
  function score(s, type) {
    const safe = ["success", "safe-cancellation", "safe-diversion"].includes(
        type,
      ),
      v = check(s),
      noGo = type === "safe-cancellation",
      justified = noGo ? !v.ok : safe;
    const safety = safe ? 40 : 0;
    const accuracy = s.verified ? (s.checks > 0 ? 30 : 20) : 10;
    const excess = Math.max(0, calc(s).fuel - A.reserve);
    const efficiency = safe
      ? noGo
        ? justified
          ? 20
          : 10
        : Math.max(10, 20 - Math.floor(excess / 100))
      : 0;
    const decision = justified ? 10 : 5;
    return {
      safety,
      accuracy,
      efficiency,
      decision,
      total: safety + accuracy + efficiency + decision,
    };
  }
  function cancel(s) {
    if (!["loading", "preflight", "taxi"].includes(s.phase)) return false;
    s.decision = "No-go";
    return finish(
      s,
      "safe-cancellation",
      "Safe no-go: aircraft remains on the ground. " +
        [...check(s).errors, ...check(s).objective].join(" "),
    );
  }
  function next(s) {
    if (s.phase === "loading") return inspect(s);
    if (s.phase === "preflight") {
      if (s.checked !== s.revision || !check(s).ok) {
        s.phase = "loading";
        s.rejected++;
        return false;
      }
      s.departure = {
        load: copy(s.load),
        conditions: copy(s.conditions),
        trip: s.trip,
        verified: s.verified,
        lateChoice: s.lateChoice,
      };
      s.phase = "taxi";
      s.taxiBurn = s.load.taxi;
      record(s, "Taxi allocation consumed once");
      return true;
    }
    const phase = s.phase;
    if (phase === "taxi") {
      s.phase = "takeoff";
      if (!burn(s, s.trip * 0.08))
        return finish(
          s,
          "serious-incident",
          "Fuel exhausted: propulsion unavailable; simulation stops without asserting a crash.",
        );
    } else if (phase === "takeoff") {
      s.phase = "climb";
      burn(s, s.trip * 0.12);
    } else if (phase === "climb") {
      s.phase = "cruise";
      if (!s.event && s.conditions.event === "return") {
        s.event = true;
        s.route = "return";
        s.remaining = 80;
        record(
          s,
          "Cabin fault: early return requires 80 kg remaining burn. Recheck MLM.",
        );
      }
      if (!s.event && s.conditions.event === "extension") {
        s.event = true;
        s.remaining = remaining(s) + 250;
        record(
          s,
          "Route extension adds 250 kg required burn. Compare diversion.",
        );
      }
    } else if (phase === "cruise") {
      const r = remaining(s);
      if (!burn(s, r * 0.7))
        return finish(
          s,
          "serious-incident",
          "Fuel exhausted on route: required burn exceeded actual fuel. No impact or crash is simulated.",
        );
      s.phase = "descent";
    } else if (phase === "descent") {
      if (!burn(s, remaining(s)))
        return finish(
          s,
          "serious-incident",
          "Fuel exhausted before approach: no crash outcome asserted.",
        );
      s.phase = "landing";
    } else if (phase === "landing") {
      const a = arrival(s);
      if (a.errors.length)
        return finish(
          s,
          "operational-failure",
          "Landing clearance withheld: " +
            a.errors.join(" ") +
            " Review the earlier hold/diversion decision.",
        );
      return finish(
        s,
        s.route === "diversion" ? "safe-diversion" : "success",
        "Safe landing: mass, balance, runway and reserve checks passed.",
        s.route === "destination" || s.route === "return",
      );
    } else return false;
    record(s, "Advanced to " + s.phase);
    return true;
  }
  function divert(s) {
    if (!["cruise", "descent"].includes(s.phase)) return false;
    s.route = "diversion";
    s.remaining = 120;
    s.conditions.landingRunway = 1600;
    s.decision = "Divert";
    record(s, "Selected alternate: 120 kg to land, 1600 m runway");
    return true;
  }
  function hold(s) {
    if (!["cruise", "descent", "landing"].includes(s.phase)) return false;
    const a = arrival(s);
    if (a.fuel - 50 < A.reserve) return false;
    const v = calc(s).at(calc(s).fuel - 50);
    if (cgErrors(v, "After hold").length) return false;
    const r = s.remaining;
    burn(s, 50);
    s.remaining = r === null ? Math.max(0, s.trip - (s.burn - 50)) : r;
    s.decision = "Hold";
    record(s, "Holding burns 50 kg; route requirement unchanged");
    return true;
  }
  function longRunway(s) {
    if (!["loading", "preflight"].includes(s.phase)) return false;
    s.conditions.runway = 1800;
    s.revision++;
    s.checked = -1;
    s.phase = "loading";
    record(s, "Arranged 1800 m departure runway");
    return true;
  }
  function whatIf(s, patch = {}, conditions = {}) {
    const trial = create(s.index, s.mode);
    const base = s.departure || s;
    trial.load = { ...base.load, ...patch };
    trial.conditions = { ...base.conditions, ...conditions };
    trial.trip = base.trip;
    trial.verified = base.verified;
    trial.lateChoice = base.lateChoice;
    return check(trial);
  }
  const E = {
    create,
    calc,
    check,
    performance,
    validate,
    change,
    boardPassenger,
    transferBags,
    move,
    latePassenger,
    verify,
    inspect,
    next,
    cancel,
    divert,
    hold,
    longRunway,
    arrival,
    remaining,
    whatIf,
    record,
    score,
    copy,
  };
  root.MassV2 = E;
  if (typeof module !== "undefined") module.exports = E;
})(typeof window !== "undefined" ? window : globalThis);
