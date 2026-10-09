# RF–01 model and boundaries

Version 2.0, fictional educational aircraft. Units: kg, metres, seconds, °C unless stated. No operational or certification accuracy is claimed.

## A. Exact accounting within the dataset

Oxford categories are delegated to the unchanged `MassCore.calculate`, with passenger and baggage counts aggregated from stations. See OXFORD_SOURCE_AUDIT.md for every relationship. Stored calculations use full floating precision; formatting happens only in the UI. Comparison tolerance is 1e-7 kg/m. Inputs reject negative/nonfinite values, fractional people/bags and exceeded capacities.

| Item | Mass | Arm aft of nose datum |
|---|---|---|
| Basic empty aircraft | 4000 | 5.0 m |
| Crew | two, 100 each | 2.0 m |
| Operating items | 200 | 5.0 m |
| Forward cabin | up to six, 80 each | 4.2 m |
| Aft cabin | up to six, 80 each | 6.0 m |
| Forward baggage / cargo | bags 20 each; cargo kg | 2.0 m |
| Aft baggage / cargo | bags 20 each; cargo kg | 8.0 m |
| All usable fuel | up to 1250 at ramp | 5.3 m |

Bags: maximum 12 combined. Cargo: maximum 1000 combined. Takeoff fuel maximum 1200 plus 50 starting/taxi fuel. No unusable-fuel term is added because BEM is preserved as the prior teaching starting mass. No fuel dumping.

Each station moment is mass × arm. Sum dry moments and current fuel moment. CG = moment/current mass. MAC leading edge = 4 m and MAC length = 3 m; %MAC = 100(CG−4)/3. This invented geometry extends RF–01; it is not an Oxford quotation or measured aircraft data. Seat icons represent group stations (group centroid at the model arm); their spacing is schematic. Cargo/fuel labels show their corresponding modeled longitudinal stations.

CG changes with burn according to fuel arm relative to current CG; direction is never hardcoded. During flight, load stations are locked. Current mass = initial Taxi Mass − taxi consumed − airborne consumed. Planned TOM/LM remain departure plan categories rather than being redefined as instantaneous mass. The departure snapshot is retained for what-if comparisons.

Structural example limits: MZFM 5800, MTOM 6500, maximum Taxi Mass 6550, MLM 6000 kg. Mission 2 applies a lower dispatch TOM cap of 6100, mission 9 a cap of 6000; these are fictional mission caps, not assertions of certified structural limitations. Classic mission-specific values are untouched.

Let t = clamp((mass−4400)/2100,0,1). CG bounds in metres: forward 4.55+0.12t; aft 5.40−0.16t. The plotted envelope includes its 4400 kg slope breakpoint, clamps beyond endpoints and tops out at ramp limit 6550 kg. Dispatch checks ramp, takeoff and planned arrival CG and individual mass limits. At a single tank station CG is monotonic with fuel, but the envelope changes with mass; flight arrival is checked again for the chosen route. There is no unsupported simulation of handling beyond the envelope.

Before mission 9 verification, displayed mass is explicitly **manifest/unverified**, not an assertion of actual measured mass. A deterministic 200 kg discrepancy is included when the hold is verified. Dispatch is forbidden before that verification.

## B. Transparent fictional performance model

Pressure altitude h is restricted to 0–3000 m; outside temperature −20 to 45°C. Dry-air density ratio sigma = (1−2.25577e−5 h)^5.25588 × 288.15/(273.15+temperature). This applies a standard tropospheric pressure profile and actual outside temperature. Ignore humidity, wind, slope and runway contamination. Pressure altitude is an input, not an inferred geometric altitude.

The ideal-gas dependence rho = p/(R T) is supported by [NASA Glenn, Equation of State](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/equation-of-state/), accessed 2026-10-09. This is a supplementary physics reference, not a replacement for Oxford mass terminology. **No NASA performance data are claimed.**

Takeoff required distance = 600 × (mass/5000)^2 / sigma metres. The fictional reference is 600 m at 5000 kg in sea-level standard conditions. The squared mass dependence represents increased speed-energy requirement and reduced effective acceleration at higher mass; it is an explicitly selected training fit, not a calibrated takeoff model. Modeled speed cue = 31 sqrt((mass/5000)/sigma) m/s is internal only, not displayed as a real airspeed. It is not a certified V-speed.

Climb indicator = 5 × (5000/mass) × sigma − 1.5 m/s, a fictional excess-power surrogate with 3.5 m/s reference climb. Operational dispatch minimum = 1.5 m/s. Required landing distance = 420 × (landing mass/5000)^2/sigma m, based on a fictional braking/approach reference. Runway choices supply actual distances to these equations. Increasing available runway alone cannot fix an inadequate climb indicator. No obstacle field, brake-energy model, acceleration integration, wet runway, wind or engine-out certification is simulated.

The intended mass range for performance exploration is 4000–7850 kg (all UI capacity extremes), with normal dispatch constrained to the lower structural limits. This makes overload estimates visible for learning; it never authorizes dispatch above those limits. These fitted values must not be used for an actual aircraft.

## Fuel, routes and holding

A mission specifies total planned trip fuel directly. The simplified flight manager allocates 8% to takeoff, 12% to climb, 70% of remaining route burn to cruise/descent entry and all remaining burn to approach. This is a deterministic budget model, not a real engine fuel-flow calculation. Fuel flow does not respond to changing weather or aircraft mass; those affect the fictional runway and climb checks only. The player advances phases, so wall-clock time does not consume fuel.

Taxi consumes the separate 50 kg allocation once. Required landing reserve is a fictional operational target of 150 kg, not a regulatory assertion. A hold burns 50 kg without reducing the remaining route requirement. Holding is denied if the route reserve would fall below 150 or current CG would cross its boundary. No tanker or dumping capability exists.

Mission 8 changes remaining route burn after climb to 80 kg for a return. Mission 10 adds 250 kg to remaining burn after climb. Diversion selects a remaining burn budget of 120 kg and 1600 m landing runway; weather is retained for simplicity. It is not automatically safe: arrival mass, fuel and CG are recomputed, and holding or prior payload reduction can still be necessary. Choosing the alternate adds no fuel and does not teleport the aircraft. No map distances are invented from these fuel budgets.

## C. Consequences and visual scope

- Loading, check and revision gate: reject unsafe dispatch; explain individual constraints. No accident from an exceeded label alone.
- No-go: remains on the ground. Safe cancellation is distinct from mission completion.
- Return/diversion: use actual remaining burn and arrival mass, with available holding.
- Arrival reserve/mass/CG/runway failure: landing clearance withheld, classified operational failure. This is a training stop, not a claim the aircraft touched down or crashed.
- Fuel exhausted during a selected route: consume only available fuel, stop at zero and classify serious incident (propulsion unavailable). There is no forced-landing or terrain model, so no crash/impact outcome is generated.
- Success: only when all arrival constraints pass after a valid dispatched load. Diversion is scored separately.

The aircraft remains a plan-view load diagram during flight; phase ribbon and fuel budget convey progress. No unsupported altitude, stall animation, damage probability, impact trajectory or unseeded randomness is displayed. A recorded timeline stores real phase/loading/mass/CG/fuel state at each decision. What-if reports recalculated **departure feasibility**, explicitly not a full counterfactual flight prediction.

Operational limits, model estimates and game scoring are separate functions/data. A future validated trajectory/damage model could add accidents; version 2.0 deliberately has none rather than fabricate them.
