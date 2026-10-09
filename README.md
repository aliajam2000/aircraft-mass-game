# Aircraft Mass Game 2.0

**Flight Lab — Master Aviation by Playing**
*Load It. Balance It. Fly It. Survive It.*

[Play the game](https://aliajam2000.github.io/aircraft-mass-game/) · [Flight Lab Academy](https://aliajam2000.github.io/flight-lab/) · [Classic training](https://aliajam2000.github.io/aircraft-mass-game/classic.html)

Ten deterministic mass-and-balance missions for fictional RF–01. Board passengers and bags, move cargo, plan fuel, inspect moments and CG, check runway performance, then dispatch or choose no-go. During flight, reassess an early return or route extension, hold when permitted, or divert. A timeline and isolated what-if calculation explain the result.

## Start playing

Open `index.html` locally, or serve the directory with `python -m http.server 8000`. No build, account, API key, runtime package, external font or paid service is needed. Online entry point remains the same GitHub Pages URL. The downloaded files work without a network; there is no service worker claiming automatic offline installation.

- **PLAY:** choose any of ten missions. Start with “+ Passenger & bag”, then Check Aircraft. Checks are invalidated whenever a load changes. Controls lock at taxi. Each primary action advances one discrete flight-management phase; there is no hidden real-time timer.
- **LAB:** experiment with loads, fuel and trip burn using the same calculation engine.
- **LEARN:** original terminology, formulas, worked example, source images, geometry explanation and links to classic exercises.
- **Review:** separates mission completion from decision quality. No-go and diversion can score strongly. What-if compares dispatch feasibility, not guaranteed success in later events.

Progress stays in localStorage under `flightlab-mass-v2`. Storage denial/corruption does not prevent a new playable session. Mission restart clears the current flight, not your achievement record. Achievement ranks are game labels, not qualifications.

## Educational foundation

`assets/source-diagram.png` and `assets/source-definitions.png` are byte-for-byte preserved. The original `js/core.js` still calculates all Oxford mass categories. Full definitions referred to CAP 696 are absent from the supplied extract; the game does not invent them. See [source audit](docs/OXFORD_SOURCE_AUDIT.md).

`classic.html` preserves the prior interface and scripts: guided flight, all five original missions, six practice questions, predictions, mass component bars, 13 additional challenges and Persian guide. Only the main entry point has changed.

## Development and checks

Node 20+ is recommended. No dependencies are required for the numerical tests:

```sh
node tests/core.test.js
node tests/advanced.test.js
node --test tests/v2.test.js
```

Developer-only browser/DOM checks:

```sh
npm install
npx playwright install chromium
npm run test:dom
npm run test:browser
```

The browser test starts its own local HTTP server and tests `/aircraft-mass-game/` paths. `GAME_URL=https://aliajam2000.github.io/aircraft-mass-game/ npm run test:browser` checks production. It only changes its own browser-local game state. See [test report](docs/TEST_REPORT.md) for actual executed results and environmental overrides.

## Architecture and model

- `js/core.js`, `js/data.js`: unchanged Oxford accounting and classic dataset.
- `v2/aircraft.js`: centralized fictional stations, geometry, capacity and limits.
- `v2/missions.js`: structured campaign data.
- `v2/engine.js`: pure mass/moment calculations, performance, checks, fuel accounting, state machine, consequences, scoring and recorded snapshots.
- `v2/ui.js`, `v2/game.css`: responsive SVG interface and guarded local persistence.
- `tests/`: preserved classic tests and v2 numerical/campaign/browser suites.

[Game design](docs/GAME_DESIGN.md) · [Physics model](docs/PHYSICS_MODEL.md) · [Mission guide](docs/MISSION_DESIGN.md) · [Changes](docs/CHANGELOG.md) · [Platform integration](docs/FLIGHTLAB_INTEGRATION.md)

RF–01, its envelope and performance data are fictional. The game is an educational supplement, not operational flight-planning software. It does not simulate loss of control, aircraft damage or crash trajectories. Unsafe dispatch is blocked. In-flight fuel exhaustion is an explicit serious incident; no unmodelled impact is asserted.

## Release protection

Original main commit: `a24a9703ff0306e3d804f313dfa94be16f34647a`; protected copy: branch `pre-v2-redesign`. GitHub Pages uses the existing main/root dynamic build. No unrelated repository is modified. Source history and original assets are retained.
