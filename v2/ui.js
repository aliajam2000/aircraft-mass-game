(function () {
  "use strict";
  const E = MassV2,
    A = RF01,
    M = MassMissions,
    $ = (id) => document.getElementById(id),
    fmt = (n, d = 0) =>
      Number(n).toLocaleString("en-US", {
        maximumFractionDigits: d,
        minimumFractionDigits: d,
      }),
    escape = (s) =>
      String(s).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  let s = E.create(),
    mode = "play",
    results = {},
    storage = true;
  try {
    const saved = JSON.parse(
      localStorage.getItem("flightlab-mass-v2") || "null",
    );
    if (saved?.version === 2) {
      results = saved.results || {};
      if (saved.state && M[saved.state.index]) {
        E.calc(saved.state);
        E.check(saved.state);
        if (
          ![
            "loading",
            "preflight",
            "taxi",
            "takeoff",
            "climb",
            "cruise",
            "descent",
            "landing",
            "debrief",
          ].includes(saved.state.phase) ||
          !["play", "lab"].includes(saved.state.mode) ||
          !Array.isArray(saved.state.history) ||
          !saved.state.history.every(
            (h) =>
              typeof h.label === "string" &&
              typeof h.phase === "string" &&
              [h.current, h.tom, h.zfm, h.lm, h.cg, h.fuel].every(
                Number.isFinite,
              ),
          ) ||
          !Number.isInteger(saved.state.revision) ||
          (saved.state.phase === "debrief" && !saved.state.outcome?.score)
        )
          throw Error("Invalid saved session");
        s = saved.state;
        mode = s.mode;
      }
    }
  } catch {
    s = E.create();
    mode = "play";
  }
  function save() {
    try {
      localStorage.setItem(
        "flightlab-mass-v2",
        JSON.stringify({ version: 2, state: s, results }),
      );
    } catch {
      storage = false;
    }
    $("save-status").textContent = storage
      ? "Progress saved on this device"
      : "Storage unavailable · session still playable";
  }
  const fields = {
    front: ["Forward cabin", "80 kg each · arm 4.2 m", 1],
    rear: ["Aft cabin", "80 kg each · arm 6.0 m", 1],
    bagsFront: ["Forward bags", "20 kg each · arm 2.0 m", 1],
    bagsRear: ["Aft bags", "20 kg each · arm 8.0 m", 1],
    cargoFront: ["Forward cargo", "kg · arm 2.0 m", 100],
    cargoRear: ["Aft cargo", "kg · arm 8.0 m", 100],
    fuel: ["Takeoff fuel", "kg · tank arm 5.3 m", 50],
    taxi: ["Start / taxi fuel", "kg · separate fuel allocation", 50],
    crew: ["Crew", "100 kg each · arm 2.0 m", 1],
    items: ["Operating items", "kg · arm 5.0 m", 200],
  };
  $("load-controls").innerHTML = Object.entries(fields)
    .map(
      ([k, [name, note, step]]) =>
        `<div class="control"><label for="load-${k}">${name}<small>${note}</small></label><div class="stepper"><button data-key="${k}" data-delta="-${step}" aria-label="Remove ${name}">−</button><input id="load-${k}" data-input="${k}" type="number" min="0" max="${A.capacities[k]}" step="${step}" aria-label="${name}"><button data-key="${k}" data-delta="${step}" aria-label="Add ${name}">+</button></div></div>`,
    )
    .join("");
  $("mission").innerHTML = M.map(
    (m, i) =>
      `<option value="${i}">${String(m.id).padStart(2, "0")} / ${m.title}</option>`,
  ).join("");
  $("definitions").className = "definitions";
  $("definitions").innerHTML =
    Object.values(MassData.labels)
      .map((x) => `<article><h3>${x[0]} · ${x[1]}</h3><p>${x[2]}</p></article>`)
      .join("") +
    "<article><h3>Mass versus limit</h3><p>MZFM, MTOM, MLM and maximum Taxi Mass are limits, not calculated masses. Fuel removal does not reduce ZFM.</p></article>";
  function station(key, x, y, w, text) {
    return `<g class="station" tabindex="0" role="button" data-station="${key}" aria-label="Adjust ${fields[key][0]}"><rect x="${x}" y="${y}" width="${w}" height="32" rx="6" fill="#153d50" stroke="#64e2eb"/><text x="${x + w / 2}" y="${y + 21}" text-anchor="middle" fill="#d2f7f7" font-size="12">${text}</text></g>`;
  }
  function aircraft(a) {
    const x = 70 + a.cg * 80;
    let seats = "";
    for (let i = 0; i < 12; i++) {
      const key = i < 6 ? "front" : "rear",
        j = i % 6,
        cx = 70 + A.arms[key] * 80 + ((j % 3) - 1) * 17,
        cy = 139 + Math.floor(j / 3) * 22;
      seats += `<rect x="${cx}" y="${cy}" width="12" height="16" rx="3" fill="${j < s.load[key] ? "#71ebc2" : "#233d51"}" stroke="#6e94a9"/>`;
    }
    $("aircraft").innerHTML =
      `<svg viewBox="0 0 900 345" role="group" aria-label="RF01 plan view. Nose left; station positions map to model arms."><defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#42677d" stroke-width=".4"/></pattern><linearGradient id="fuselage" x2="0" y2="1"><stop stop-color="#b5d1df"/><stop offset="1" stop-color="#628da5"/></linearGradient></defs><rect width="900" height="345" fill="url(#grid)" opacity=".35"/><path d="M430 133 550 30H610L546 145M430 187 550 304H610L546 176" fill="#355c74" stroke="#779aac"/><path d="m705 140 57-65h36l-28 76m-65 29 57 65h36l-28-76" fill="#41677c" stroke="#779aac"/><path d="M70 160Q105 116 200 124L752 140 828 160 752 180 200 196Q105 204 70 160" fill="url(#fuselage)" stroke="#c5e5f4" stroke-width="2"/><path d="M95 151 124 137 124 183 95 169Z" fill="#10293b"/><path d="M190 187 760 173" stroke="#43d8d4" stroke-width="4"/>${seats}<text x="185" y="165" fill="#143449" font-size="19" font-weight="800">RF–01</text><line x1="70" x2="70" y1="108" y2="236" stroke="#93b6c9" stroke-dasharray="3 3"/><text x="70" y="253" text-anchor="middle" fill="#a9bdcb" font-size="11">DATUM 0 m</text>${station("front", 350, 87, 110, "CABIN FWD " + s.load.front + "/6")}${station("rear", 505, 87, 110, "CABIN AFT " + s.load.rear + "/6")}${station("cargoFront", 180, 219, 138, "FWD HOLD " + (s.load.bagsFront * 20 + s.load.cargoFront) + " kg")}${station("cargoRear", 649, 219, 140, "AFT HOLD " + (s.load.bagsRear * 20 + s.load.cargoRear) + " kg")}${station("fuel", 419, 268, 155, "FUEL " + fmt(a.fuel) + " kg")}<line x1="${x}" x2="${x}" y1="117" y2="212" stroke="#ffd58f" stroke-width="2"/><circle cx="${x}" cy="160" r="9" fill="#0b2334" stroke="#ffd58f" stroke-width="3"/><text x="${x}" y="232" text-anchor="middle" fill="#ffd58f" font-size="12">CG ${a.cg.toFixed(2)} m</text></svg>`;
    $("load-summary").textContent =
      `${s.load.front + s.load.rear} passengers · ${s.load.bagsFront + s.load.bagsRear} bags · ${s.load.cargoFront + s.load.cargoRear} kg cargo`;
    const phases = [
      "loading",
      "preflight",
      "taxi",
      "takeoff",
      "climb",
      "cruise",
      "descent",
      "landing",
      "debrief",
    ];
    $("flight-path").innerHTML = phases
      .map(
        (p) =>
          `<span class="${s.phase === p ? "active" : ""}">${p.toUpperCase()}</span>`,
      )
      .join("");
  }
  function envelope(a) {
    const px = (c) => 35 + ((c - 4.2) / 1.5) * 235,
      py = (m) => 155 - ((m - 4000) / 2800) * 125;
    const pts = [4000, 4400, 6550].map((m) => ({ m, ...A.envelope(m) }));
    const poly = [
      [pts[0].min, 4000],
      [pts[1].min, 4400],
      [pts[2].min, 6550],
      [pts[2].max, 6550],
      [pts[1].max, 4400],
      [pts[0].max, 4000],
    ]
      .map(([x, y]) => px(x) + "," + py(y))
      .join(" ");
    const safe =
      a.cg >= a.envelope.min &&
      a.cg <= a.envelope.max &&
      a.current <= A.limits.taxiMass;
    $("envelope").innerHTML =
      `<svg viewBox="0 0 300 195" role="img" aria-label="Mass and CG envelope. Current ${fmt(a.current)} kg at ${a.cg.toFixed(2)} metres. ${safe ? "Inside" : "Outside"} displayed limits."><path d="M35 20V155H280" stroke="#738fa3" fill="none"/><polygon points="${poly}" fill="#235345" stroke="#8ee6b2"/><path d="M35 ${py(6500)}H278" stroke="#597488" stroke-dasharray="3 3"/><circle cx="${Math.max(30, Math.min(282, px(a.cg)))}" cy="${Math.max(10, Math.min(160, py(a.current)))}" r="6" fill="${safe ? "#64e2eb" : "#ffcf85"}" stroke="#fff"/><text x="4" y="${py(6500) + 4}" font-size="9" fill="#b6c9d6">6500</text><text x="4" y="157" font-size="9" fill="#b6c9d6">4000</text><text x="35" y="174" font-size="10" fill="#b6c9d6">4.2</text><text x="265" y="174" font-size="10" fill="#b6c9d6">5.7</text><text x="135" y="190" font-size="10" fill="#b6c9d6">CG · m aft of datum</text><text x="35" y="12" font-size="9" fill="#b6c9d6">MASS · kg</text></svg>`;
    $("balance-text").textContent =
      `${safe ? "Inside current envelope" : "Outside current envelope"} · CG ${a.cg.toFixed(3)} m / ${a.mac.toFixed(1)}% MAC. Bounds ${a.envelope.min.toFixed(2)}–${a.envelope.max.toFixed(2)} m.`;
  }
  function board(a, v) {
    $("mass-board").innerHTML =
      '<div class="mass-grid">' +
      Object.entries(MassData.labels)
        .map(
          ([k, x]) =>
            `<div><small>${x[0]}</small><b>${k === "lm" && a.landingFuel < 0 ? "Infeasible" : fmt(a[k])} ${k === "lm" && a.landingFuel < 0 ? "" : "kg"}</b><small>${x[2]}</small></div>`,
        )
        .join("") +
      Object.entries({
        MZFM: v.limits.zfm,
        MTOM: A.limits.tom,
        "Mission TOM cap": v.limits.tom,
        MLM: v.limits.lm,
        "Maximum Taxi": v.limits.taxiMass,
        "Takeoff fuel": s.load.fuel,
        "Taxi fuel": s.load.taxi,
        "Trip fuel": s.trip,
        "Planned landing fuel": a.landingFuel,
        "Fuel consumed": s.burn + s.taxiBurn,
      })
        .map(([k, n]) => `<div><small>${k}</small><b>${fmt(n)} kg</b></div>`)
        .join("") +
      `<div><small>Current total moment</small><b>${fmt(a.moment)} kg·m</b></div><div><small>Current CG / MAC</small><b>${a.cg.toFixed(3)} m</b><small>${a.mac.toFixed(2)}% MAC</small></div></div><table><caption>Station mass × arm = moment · current fuel</caption><tr><th>Station</th><th>kg</th><th>m</th><th>kg·m</th></tr>` +
      [
        ["BEM", 4000, 5],
        ["Crew", s.load.crew * 100, 2],
        ["Items", s.load.items, 5],
        ...[
          "front",
          "rear",
          "bagsFront",
          "bagsRear",
          "cargoFront",
          "cargoRear",
        ].map((k) => [
          fields[k][0],
          s.load[k] *
            (k.includes("bags") ? 20 : ["front", "rear"].includes(k) ? 80 : 1),
          A.arms[k],
        ]),
        ["Fuel", a.fuel, 5.3],
      ]
        .map(
          ([k, m, r]) =>
            `<tr><td>${k}</td><td>${fmt(m)}</td><td>${r}</td><td>${fmt(m * r)}</td></tr>`,
        )
        .join("") +
      "</table>";
  }
  function render() {
    const a = E.calc(s),
      v = E.check(s),
      m = M[s.index],
      ground = ["loading", "preflight"].includes(s.phase),
      air = ["takeoff", "climb", "cruise", "descent", "landing"].includes(
        s.phase,
      );
    $("game").hidden = mode === "learn";
    $("learn").hidden = mode !== "learn";
    document
      .querySelectorAll("[data-mode]")
      .forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === mode));
    $("late-request").hidden =
      s.conditions.event !== "late-request" || !!s.lateChoice;
    $("mission").value = s.index;
    $("mission").disabled = mode === "lab";
    $("mission-title").textContent =
      mode === "lab" ? "Your aircraft. Your experiment." : m.title;
    $("narrative").textContent =
      mode === "lab"
        ? "Change one variable and watch every mass and moment respond. The same engine powers LAB and campaign."
        : m.narrative;
    $("objectives").innerHTML =
      mode === "lab"
        ? ""
        : [
            `At least ${m.objectives.pax} passengers`,
            "One bag per passenger",
            m.objectives.cargo
              ? `Retain ${m.objectives.cargo} kg cargo`
              : "Cargo is optional",
          ]
            .map(
              (x, i) =>
                `<span class="objective ${[s.load.front + s.load.rear >= m.objectives.pax, s.load.bagsFront + s.load.bagsRear >= s.load.front + s.load.rear, s.load.cargoFront + s.load.cargoRear >= m.objectives.cargo][i] ? "met" : ""}">${x}</span>`,
            )
            .join("");
    $("conditions").innerHTML = [
      s.conditions.runway + " m runway",
      s.conditions.temp + "°C",
      s.conditions.altitude + " m pressure altitude",
      s.trip + " kg trip fuel",
    ]
      .map((x) => `<span>${x}</span>`)
      .join("");
    $("current").previousElementSibling.textContent = s.verified
      ? "CURRENT MASS"
      : "MANIFEST · UNVERIFIED";
    $("current").textContent = fmt(a.current) + " kg";
    $("tom").textContent = fmt(a.tom) + " kg";
    $("cg").textContent = a.cg.toFixed(2) + " m";
    $("fuel").textContent = fmt(a.fuel) + " kg";
    $("status").textContent =
      s.phase === "debrief"
        ? s.outcome.type.replaceAll("-", " ")
        : ground
          ? s.checked === s.revision
            ? "Checked · ready"
            : v.ok
              ? "Check required"
              : "Adjust load / plan"
          : s.phase === "taxi"
            ? "Taxi complete"
            : s.phase.toUpperCase();
    $("scene-title").textContent = ground
      ? "At the stand"
      : s.phase === "debrief"
        ? "Decision recorded"
        : s.phase[0].toUpperCase() + s.phase.slice(1);
    $("lock").textContent = ground ? "AT THE STAND" : "LOADING LOCKED";
    for (const k in fields) {
      const input = $("load-" + k);
      if (document.activeElement !== input) input.value = s.load[k];
      input.disabled = !ground;
    }
    document
      .querySelectorAll("[data-delta]")
      .forEach((b) => (b.disabled = !ground));
    $("quick-board").disabled = !ground || s.load.front + s.load.rear >= 12;
    $("transfer").disabled = !ground;
    $("transfer-bags").disabled = !ground || !s.load.bagsRear;
    $("verify").hidden = s.verified;
    $("verify").disabled = !ground;
    $("runway").disabled = !ground || s.conditions.runway === 1800;
    $("lab-tools").hidden = mode !== "lab";
    $("trip").value = s.trip;
    $("trip").disabled = !ground;
    $("add-fuel").disabled = !ground;
    $("move-aft").disabled = !ground;
    const eventText = s.history
      .filter((h) =>
        /Cabin fault|Route extension|Confirmed late passenger|Hold verified|Late passenger and bag accepted/.test(
          h.label,
        ),
      )
      .at(-1)?.label;
    $("event-note").hidden = !eventText;
    $("event-note").textContent = eventText || "";
    const warnings = ground
      ? [...v.errors, ...v.objective]
      : air
        ? E.arrival(s).errors
        : [];
    $("checks").innerHTML =
      (warnings.length
        ? warnings.map((t) => `<p class="check">${escape(t)}</p>`).join("")
        : `<p class="check good">${ground ? "✓ Mass, balance, fuel and performance checks meet the plan." : s.phase === "debrief" ? "Flight decision recorded." : "✓ Current route checks available below."}</p>`) +
      `<p class="muted">Takeoff estimate ${Math.ceil(v.p.distance)} / ${s.conditions.runway} m · climb ${v.p.climb.toFixed(2)} m/s<br>Fictional performance model, not certified data.</p>`;
    $("primary").textContent = {
      loading: "Check Aircraft →",
      preflight: "Dispatch · taxi →",
      taxi: "Begin takeoff →",
      takeoff: "Initial climb →",
      climb: "Manage cruise →",
      cruise: "Continue to descent →",
      descent: "Fly approach →",
      landing: "Request landing →",
      debrief: "Review recorded flight ↓",
    }[s.phase];
    $("cancel").hidden = !["loading", "preflight", "taxi"].includes(s.phase);
    $("divert").hidden = !["cruise", "descent"].includes(s.phase);
    $("hold").hidden = !["cruise", "descent", "landing"].includes(s.phase);
    $("hold").disabled = air && E.arrival(s).fuel - 50 < A.reserve;
    $("arrival").textContent = air
      ? `Route: ${s.route}. Remaining burn ${fmt(E.remaining(s))} kg. Predicted arrival ${fmt(E.arrival(s).mass)} kg / fuel ${fmt(E.arrival(s).fuel)} kg. Reserve target ${A.reserve} kg.`
      : "";
    $("flight-telemetry").hidden = !air;
    if (air) {
      const arrival = E.arrival(s);
      $("flight-telemetry").innerHTML =
        `<span>FUEL DECISION · ${s.route.toUpperCase()}</span><div class="fuel-track"><i style="width:${(a.fuel / 1250) * 100}%"></i></div><p>${fmt(a.fuel)} kg aboard − ${fmt(arrival.required)} kg remaining burn = <b>${fmt(arrival.fuel)} kg arrival fuel</b> / ${A.reserve} kg reserve target.</p>`;
    }
    aircraft(a);
    envelope(a);
    board(a, v);
    $("debrief").hidden = !s.outcome || mode === "learn";
    if (s.outcome) debrief();
    const count = Object.values(results).filter((r) => r.score >= 80).length;
    $("rank").textContent = [
      "Student Loader",
      "Load Planner",
      "Flight Operations Specialist",
      "Mass & Balance Expert",
      "Captain Level",
    ][Math.min(4, Math.floor(count / 2))];
    save();
  }
  function debrief() {
    const o = s.outcome,
      a = E.calc(s);
    $("debrief").innerHTML =
      `<span class="eyebrow">MISSION ${s.index + 1} / FLIGHT REVIEW</span><h2>${escape(o.type.replaceAll("-", " "))}</h2><p>${escape(o.reason)}</p><p>Mission completion: <b>${o.completed ? "Completed" : "Not completed"}</b> · Decision quality: <b>${o.score.total}/100</b>. Safe cancellation and diversion are recognized separately from destination completion.</p><div class="scores">${Object.entries(
        o.score,
      )
        .map(
          ([k, n]) =>
            `<div>${k}<b>${n}${k === "total" ? "/100" : ""}</b></div>`,
        )
        .join(
          "",
        )}</div><p>Actual: ${s.load.front + s.load.rear} passengers, ${s.load.bagsFront + s.load.bagsRear} bags, ${s.load.cargoFront + s.load.cargoRear} kg cargo. TOM ${fmt(a.tom)} kg → current ${fmt(a.current)} kg. CG ${a.cg.toFixed(3)} m; fuel ${fmt(a.fuel)} kg. ${escape(s.decision || "Route followed")}.</p><p>Oxford connections: ${M[s.index].concepts.join(", ")}. Alternative: correct the first failed constraint in the timeline; moving a load changes moment without changing ZFM, while removing fuel cannot solve MZFM.</p><details><summary>Replay the computed decision timeline (${s.history.length} events)</summary><div class="timeline"><table><tr><th>Event / phase</th><th>Mass kg</th><th>CG m</th><th>Fuel kg</th></tr>${s.history.map((h) => `<tr><td>${escape(h.label)}<small> · ${h.phase}</small></td><td>${fmt(h.current)}</td><td>${h.cg.toFixed(3)}</td><td>${fmt(h.fuel)}</td></tr>`).join("")}</table></div></details><h3>What if we changed the departure plan?</h3><p class="muted">Recomputes dispatch feasibility, not a prediction that every later flight event succeeds.</p><div class="whatif"><button data-what="cargo">Remove up to 200 kg cargo</button><button data-what="fuel">Add 150 kg takeoff fuel</button><button data-what="balance">Move aft cargo forward</button><button data-what="runway">Use 1,800 m runway</button></div><p id="what-result" role="status">Compare a revised plan with the original departure check.</p><button id="retry">Retry this mission</button> <button id="next-mission">Next mission →</button>`;
  }
  function act(fn) {
    const before = E.calc(s);
    const result = fn();
    const after = E.calc(s);
    $("message").textContent =
      result === false
        ? "Action unavailable or check requires correction. Review the messages above."
        : s.history.at(-1).label;
    $("delta").textContent =
      `Change: TOM ${fmt(after.tom - before.tom)} kg · ZFM ${fmt(after.zfm - before.zfm)} kg · CG ${(after.cg - before.cg).toFixed(3)} m.`;
    if (s.outcome && s.mode === "play") {
      const prev = results[s.index];
      results[s.index] = {
        type: s.outcome.type,
        score: Math.max(prev?.score || 0, s.outcome.score.total),
        completed: !!(prev?.completed || s.outcome.completed),
      };
    }
    render();
    if (s.outcome) {
      $("debrief").focus({ preventScroll: true });
    }
  }
  function reset(index = s.index, newMode = mode) {
    s = E.create(index, newMode);
    mode = newMode;
    $("message").textContent = "";
    render();
  }
  $("load-controls").addEventListener("click", (e) => {
    const b = e.target.closest("[data-key]");
    if (b)
      act(() =>
        E.change(
          s,
          b.dataset.key,
          s.load[b.dataset.key] + Number(b.dataset.delta),
        ),
      );
  });
  $("load-controls").addEventListener("change", (e) => {
    const k = e.target.dataset.input;
    if (k) {
      const ok = E.change(
        s,
        k,
        e.target.value.trim() === "" ? NaN : Number(e.target.value),
      );
      e.target.value = s.load[k];
      act(() => ok);
    }
  });
  function focusStation(e) {
    const g = e.target.closest("[data-station]");
    if (!g) return;
    $("load-" + g.dataset.station).focus();
    $("load-" + g.dataset.station).scrollIntoView({
      block: "center",
      behavior: "auto",
    });
  }
  $("aircraft").addEventListener("click", focusStation);
  $("aircraft").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      focusStation(e);
    }
  });
  $("quick-board").onclick = () => act(() => E.boardPassenger(s));
  $("jump-controls").onclick = () => {
    $("controls").scrollIntoView({ block: "start" });
    $("load-front").focus({ preventScroll: true });
  };
  $("jump-check").onclick = () => {
    $("primary").scrollIntoView({ block: "center" });
    $("primary").focus({ preventScroll: true });
  };
  $("accept-late").onclick = () => act(() => E.latePassenger(s, true));
  $("defer-late").onclick = () => act(() => E.latePassenger(s, false));
  $("primary").onclick = () =>
    s.outcome
      ? $("debrief").scrollIntoView({ block: "start" })
      : act(() => E.next(s));
  $("cancel").onclick = () => act(() => E.cancel(s));
  $("divert").onclick = () => act(() => E.divert(s));
  $("hold").onclick = () => act(() => E.hold(s));
  $("verify").onclick = () => act(() => E.verify(s));
  $("transfer-bags").onclick = () => act(() => E.transferBags(s));
  $("transfer").onclick = () => act(() => E.move(s));
  $("runway").onclick = () => act(() => E.longRunway(s));
  $("restart").onclick = () => reset();
  $("mission").onchange = (e) => reset(Number(e.target.value), "play");
  document.querySelectorAll("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.mode === "learn") {
          mode = "learn";
          render();
        } else if (mode === "learn" && b.dataset.mode === s.mode) {
          mode = s.mode;
          render();
        } else reset(s.index, b.dataset.mode);
      }),
  );
  $("add-fuel").onclick = () =>
    act(() => E.change(s, "fuel", s.load.fuel + 200));
  $("move-aft").onclick = () =>
    act(() => {
      if (
        !["loading", "preflight"].includes(s.phase) ||
        s.load.cargoFront < 100
      )
        return false;
      E.change(s, "cargoFront", s.load.cargoFront - 100);
      return E.change(s, "cargoRear", s.load.cargoRear + 100);
    });
  $("trip").onchange = (e) =>
    act(() => {
      const n = Number(e.target.value);
      if (!Number.isFinite(n) || n < 50 || n > 1000) return false;
      s.trip = n;
      s.revision++;
      s.checked = -1;
      s.phase = "loading";
      E.record(s, "Changed trip fuel plan");
      return true;
    });
  $("debrief").onclick = (e) => {
    if (e.target.id === "retry") reset();
    if (e.target.id === "next-mission") reset((s.index + 1) % M.length, "play");
    const kind = e.target.dataset.what;
    if (!kind) return;
    const patch = {},
      c = {};
    if (kind === "cargo") {
      let remove = Math.min(200, s.load.cargoRear);
      patch.cargoRear = s.load.cargoRear - remove;
      patch.cargoFront = Math.max(0, s.load.cargoFront - (200 - remove));
    }
    if (kind === "fuel") patch.fuel = s.load.fuel + 150;
    if (kind === "balance") {
      patch.cargoFront = s.load.cargoFront + s.load.cargoRear;
      patch.cargoRear = 0;
    }
    if (kind === "runway") c.runway = 1800;
    try {
      const old = E.whatIf(s),
        v = E.whatIf(s, patch, c);
      $("what-result").textContent =
        `Original: ${old.ok ? "dispatch feasible" : "dispatch blocked"}; revised: ${v.ok ? "dispatch feasible" : "dispatch blocked"}. TOM ${fmt(old.a.tom)} → ${fmt(v.a.tom)} kg; CG ${old.a.takeoff.cg.toFixed(3)} → ${v.a.takeoff.cg.toFixed(3)} m. ${[...v.errors, ...v.objective].join(" ")}`;
    } catch (err) {
      $("what-result").textContent = "Revised plan rejected: " + err.message;
    }
  };
  render();
  window.FlightLab = { getState: () => E.copy(s) };
})();
