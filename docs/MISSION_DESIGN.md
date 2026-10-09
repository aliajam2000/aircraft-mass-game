# Campaign mission design

All scenarios are deterministic and all 10 are selectable. Shared actions: edit loads before taxi, inspect, dispatch, choose longer runway, no-go; in cruise/descent choose alternate; hold where fuel/CG permit; review, what-if and restart. Every mission has a safe route plus unsafe-fuel, warning, recovery/no-go, exact debrief and reset tests in tests/v2.test.js. tests/v2-browser.cjs executes the safe route through real controls.

## 01 — Your First Load

Passengers are waiting at North Quay. Add two passengers and their bags, then prepare RF–01 for its first departure.

Oxford links: DOM, Traffic Load, TOM. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 0,
  "rear": 0,
  "bagsFront": 0,
  "bagsRear": 0,
  "cargoFront": 0,
  "cargoRear": 0,
  "fuel": 600,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1400 m runway, 0 m pressure altitude, 15°C; trip fuel 400 kg; landing runway 1200 m. 

Service objectives: at least 2 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 5000 kg, ZFM 4400 kg; takeoff estimate 600 m.

**Decisions, events, recovery and debrief:** Board two passengers and two bags. Check, dispatch and follow the route. Removing passengers below two blocks completion; no-go is safe.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 02 — One Passenger Too Many

Eleven passengers are aboard. A twelfth asks to join. Compare the 6,100 kg dispatch cap before accepting.

Oxford links: TOM, MTOM. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 6,
  "rear": 5,
  "bagsFront": 6,
  "bagsRear": 5,
  "cargoFront": 0,
  "cargoRear": 0,
  "fuel": 600,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1400 m runway, 0 m pressure altitude, 15°C; trip fuel 400 kg; landing runway 1200 m. Lower mission TOM cap 6100 kg.

Service objectives: at least 10 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 6100 kg, ZFM 5500 kg; takeoff estimate 894 m.

**Decisions, events, recovery and debrief:** Defer the late passenger for TOM 6100, or accept (+100), observe TOM 6200 above the mission cap, then offload an existing passenger and bag. Recheck required.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 03 — The Fuel Dilemma

The island sector needs 650 kg trip fuel. Keep the reserve while carrying eight passengers; surplus cargo can wait.

Oxford links: Useful Load, OM, ZFM. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 4,
  "rear": 4,
  "bagsFront": 4,
  "bagsRear": 4,
  "cargoFront": 200,
  "cargoRear": 200,
  "fuel": 500,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1400 m runway, 0 m pressure altitude, 15°C; trip fuel 650 kg; landing runway 1200 m. 

Service objectives: at least 8 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 6100 kg, ZFM 5600 kg; takeoff estimate 894 m.

**Decisions, events, recovery and debrief:** Load 800 kg fuel for 650 trip + 150 reserve; reduce the optional cargo from 400 to 200 kg so TOM is 6200 and ZFM 5400. Fuel alone cannot change ZFM.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 04 — Baggage in the Wrong Place

Six passengers sit aft; their group baggage and a 400 kg consignment are also in the aft hold. Move baggage forward while retaining the freight.

Oxford links: Moment, CG, Traffic Load. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 0,
  "rear": 6,
  "bagsFront": 0,
  "bagsRear": 12,
  "cargoFront": 0,
  "cargoRear": 400,
  "fuel": 600,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1400 m runway, 0 m pressure altitude, 15°C; trip fuel 400 kg; landing runway 1200 m. 

Service objectives: at least 6 passengers, one bag per passenger and 400 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 6120 kg, ZFM 5520 kg; takeoff estimate 899 m.

**Decisions, events, recovery and debrief:** Move five of the 12 aft bags to the forward hold. The 100 kg transfer changes moment by −600 kg·m with the same total mass. Retain 400 kg consignment; do not discard it to pass.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 05 — The Short Runway

Harbour strip has only 650 m available. Test the lightest permitted load, then arrange the longer runway or choose no-go.

Oxford links: TOM, MTOM. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 4,
  "rear": 4,
  "bagsFront": 4,
  "bagsRear": 4,
  "cargoFront": 200,
  "cargoRear": 200,
  "fuel": 600,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 650 m runway, 0 m pressure altitude, 15°C; trip fuel 400 kg; landing runway 1200 m. 

Service objectives: at least 4 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 6200 kg, ZFM 5600 kg; takeoff estimate 923 m.

**Decisions, events, recovery and debrief:** Choose the 1800 m runway or make a safe no-go decision. Even the lightest permitted four-passenger, four-bag load with 550 kg fuel needs about 687 m, so payload reduction alone cannot meet the 650 m strip. Initial TOM is below structural MTOM but takeoff distance exceeds 650 m.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 06 — Hot and High

At Ridge Field, pressure altitude is 1,800 m and temperature is 35°C. Protect takeoff and climb margins.

Oxford links: TOM, Useful Load. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 5,
  "rear": 5,
  "bagsFront": 5,
  "bagsRear": 5,
  "cargoFront": 100,
  "cargoRear": 100,
  "fuel": 600,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1100 m runway, 1800 m pressure altitude, 35°C; trip fuel 400 kg; landing runway 1200 m. 

Service objectives: at least 2 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 6200 kg, ZFM 5600 kg; takeoff estimate 1227 m.

**Decisions, events, recovery and debrief:** Reduce optional cargo to zero and carry four passengers forward/four aft with eight bags. Initial 1227 m estimate exceeds the 1100 m runway. The revised lower mass improves runway and climb margin. Longer runway alone does not fix a failed climb gate.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 07 — The Last-minute Passenger

Your first check will be followed by a confirmed passenger and bag change. Update the loadsheet and check again.

Oxford links: Traffic Load, ZFM, TOM. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 4,
  "rear": 4,
  "bagsFront": 4,
  "bagsRear": 4,
  "cargoFront": 0,
  "cargoRear": 0,
  "fuel": 600,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1400 m runway, 0 m pressure altitude, 15°C; trip fuel 400 kg; landing runway 1200 m. 

Service objectives: at least 8 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 5800 kg, ZFM 5200 kg; takeoff estimate 808 m.

**Decisions, events, recovery and debrief:** First check triggers one confirmed aft passenger and bag (+100 kg). It returns to loading with an invalidated check. Inspect again to authorize departure. Event cannot repeat.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 08 — Return to Base

A cabin fault after climb requires an early return. A light planned landing does not guarantee a light return.

Oxford links: LM, MLM, Trip fuel. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 4,
  "rear": 4,
  "bagsFront": 4,
  "bagsRear": 4,
  "cargoFront": 100,
  "cargoRear": 100,
  "fuel": 1000,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1400 m runway, 0 m pressure altitude, 15°C; trip fuel 500 kg; landing runway 1200 m. 

Service objectives: at least 8 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 6400 kg, ZFM 5400 kg; takeoff estimate 984 m.

**Decisions, events, recovery and debrief:** Initial TOM 6400 and planned LM 5900 pass. After climb, early return uses 80 kg remaining burn, giving predicted LM 6220. Five 50 kg holds yield 5970 kg landing and 570 kg fuel. Ignoring MLM produces a withheld landing clearance, not a fabricated accident.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 09 — The Unreported Cargo

The manifest and a hold seal disagree. Verify the actual cargo before signing the release.

Oxford links: Traffic Load, ZFM, Taxi Mass. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 4,
  "rear": 4,
  "bagsFront": 4,
  "bagsRear": 4,
  "cargoFront": 100,
  "cargoRear": 0,
  "fuel": 600,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 1400 m runway, 0 m pressure altitude, 15°C; trip fuel 400 kg; landing runway 1200 m. Lower mission TOM cap 6000 kg.

Service objectives: at least 8 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 5900 kg, ZFM 5300 kg; takeoff estimate 836 m.

**Decisions, events, recovery and debrief:** Hold verification adds the deterministic unreported 200 kg. Manifest 5900 becomes actual TOM 6100 above the 6000 kg dispatch cap. Remove that optional cargo, check again and fly. Verification is mandatory and idempotent.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. 

## 10 — Captain’s Final Decision

Coastal heat, a short runway and a busy cabin. After departure, a route extension will change your arrival fuel. Plan, reassess, and defend your decision.

Oxford links: TOM, LM, CG, Useful Load. CG/moments are documented fictional extensions where the extract lacks full definitions.

Initial loading (kg except passenger/bag/crew counts):

```json
{
  "front": 5,
  "rear": 5,
  "bagsFront": 5,
  "bagsRear": 5,
  "cargoFront": 100,
  "cargoRear": 100,
  "fuel": 700,
  "taxi": 50,
  "crew": 2,
  "items": 200
}
```

Conditions: 900 m runway, 600 m pressure altitude, 30°C; trip fuel 500 kg; landing runway 1200 m. 

Service objectives: at least 6 passengers, one bag per passenger and 0 kg minimum cargo. All aircraft limits and 150 kg landing reserve apply. Initial TOM 6300 kg, ZFM 5600 kg; takeoff estimate 1077 m.

**Decisions, events, recovery and debrief:** Arrange 1800 m runway. With initial 700 kg fuel, the route extension yields a 50 kg fuel deficit if continued. Divert (120 kg remaining) and hold twice for a safe alternate landing, or plan 900 kg takeoff fuel and continue with 150 kg arrival reserve. Reducing traffic before dispatch is another available strategy. Safe cancellation is also recognized.

**Success:** Land within all mandatory mass, CG, runway and reserve constraints with the required traffic, or record a justified safe no-go/diversion separately.

**Failure:** Dispatch is blocked for unsafe loads. An in-flight unresolved reserve, landing or fuel deficit prevents mission completion. Fuel exhaustion on the extended route is a serious incident; the model does not assert a crash.

