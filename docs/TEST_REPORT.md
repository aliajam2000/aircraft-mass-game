# Validation report — Aircraft Mass Game 2.0

## Executed locally, 2026-10-09

| Check | Actual result |
|---|---|
| `node tests/core.test.js` | 9 original calculation/state groups passed |
| `node tests/advanced.test.js` | Three previous additional missions solvable; comparison assertions passed |
| `node --test tests/v2.test.js` | 42 tests passed, zero failed/skipped |
| `tests/dom.test.js` using jsdom 26 | Original guided flight, original missions, six questions, locks, reset and scoring passed |
| `tests/lessons.test.js` using jsdom 26 | Predictions, wrong-answer retry, all 13 challenges, score deduplication, bars and reset passed |
| `tests/v2-browser.cjs` | All ten missions played to safe success/diversion through actual UI controls |
| Responsive browser checks | 1440×1000, 1366×768, 768×1024, 390×844, 844×390 passed overflow/sticky checks |
| Browser input/navigation | Buttons, inputs, SVG keyboard station selection, touch tap, PLAY/LAB/LEARN, restart/retry, what-if passed |
| Browser persistence | Reload restore, blocked localStorage and corrupt JSON fallback passed |
| Reduced motion | Media preference respected; controls remain functional |
| Local production-path routing | `/aircraft-mass-game/` page, scripts, styles and source images resolved |
| Console / HTTP errors | No page-script errors or failed page asset responses during the v2 suite |
| Source preservation | Both PNG Git blob hashes match audit; original data/core/game/lessons scripts unchanged |
| Visual inspection | Desktop and mobile full-page screenshots opened and inspected; controls and labels remained contained |
| Whitespace/diff review | `git diff --check` passed |

The numerical suite checks Oxford identities, independently summed moments/%MAC, empty/full loads, input rejection, unrounded limit boundaries, CG movement both directions with burn, once-only taxi fuel, revision invalidation, baggage/cargo transfer, late passenger, discrepancy verification, runway and density changes, early-return holding, extension exhaustion, successful alternate/continue branches, no fabricated crash, no false landing success, immutable what-if, source hashes, and safe/unsafe/reset/debrief cases for each mission.

## Browser environment and reproducibility

Node 24.19.0, Playwright 1.62.1, headless Chromium 133 supplied by the developer-only `@sparticuz/chromium@133.0.0` package. The default Playwright browser download returned an invalid archive in this environment, so packaged Chromium was used. This package is not included in the game or required at runtime. Its `--single-process` and `--disable-web-security` arguments were removed. The v2 browser script starts its own local HTTP server; standalone server sessions could not reliably persist across execution calls.

Executed browser command:

```sh
CHROMIUM_PATH=/tmp/chromium \
CHROMIUM_ARGS_MODULE=/tmp/mass-game-qa/node_modules/@sparticuz/chromium \
node tests/v2-browser.cjs
```

For an ordinary development machine, install the listed devDependencies and `npx playwright install chromium`; `npm run test:browser` then needs no overrides. Classic DOM tests used `JSDOM_PATH=/tmp/mass-game-qa/node_modules/jsdom`; `npm run test:dom` uses an ordinary local install by default. The original `tests/browser.test.js` remains a historical optional classic script; it is not counted among the executed v2 results.

## Known limits

- No real-device Safari, Firefox, iOS or Android browser run; mobile checks use Chromium viewport and touch emulation.
- No screen-reader audit or formal WCAG certification. Keyboard controls, visible focus, readable text/colors and non-color warning reasons are implemented, but no claim of exhaustive accessibility compliance.
- No human study measured time-to-first-interaction. The 10–15 second goal is not presented as measured.
- No certification-level flight validation, real aircraft data or accident dynamics. Fictional performance and fixed fuel budgets are explicitly documented.
- Flight progresses in discrete player-triggered phases; no altitude/trajectory realism is claimed.
- The provided Oxford extracts refer to fuller CAP 696 definitions that are absent. No fabricated replacement is supplied.
- Classic dialogs were exercised in jsdom with dialog methods shimmed; native dialog focus behavior is not claimed to be visually retested here.

## Production

Local validation completed before publishing. Production verification is recorded below after the GitHub Pages build; a repository commit alone is not sufficient evidence of deployment.
