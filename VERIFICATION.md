# Verification

## Results actually obtained

- `tests/core.test.js`: all 9 test groups passed in Node.js.
- `tests/dom.test.js`: actual local HTML, CSS, and ordinary script files loaded in jsdom. Full Learn flight, both complete Mission flights, all six Practice questions, retries, caps, fuel gates, ZFM trap, restart, scoring, and mode switching during taxi passed. No script errors.
- `tests/browser.test.js`: passed in headless Chromium 153 on Linux. The page was opened with a `file://` URL and the browser context was offline. The complete Learn flight, all Practice answers, the ZFM Mission flight, Cargo Mission setup, minimum fuel gate, disabled controls, capacity limits, score reset, and switching mode during fuel burn passed. No JavaScript errors and no HTTP/HTTPS requests were observed.
- Desktop (1440 px) and narrow (390 px) layouts were captured. No horizontal overflow at 390 px. A final visual check corrected the cargo appearance animation to scale within each box's own bounds.
- All runtime links and scripts refer to existing local files. No fetch, server, JavaScript modules, CDN, remote fonts, or external requests are used.

## Example verified

| Value | kg |
|---|---:|
| BEM | 4,000 |
| Crew and operating items | 400 |
| DOM | 4,400 |
| Traffic Load | 1,000 |
| ZFM | 5,400 |
| OM | 5,000 |
| Useful Load | 1,600 |
| Taxi Mass | 6,050 |
| TOM | 6,000 |
| LM | 5,600 |
| Ramp fuel | 650 |
| Fuel after taxi | 600 |
| Fuel at landing | 200 |

The core tests also confirm that fuel does not affect ZFM, cargo affects both ZFM and total mass, progress cannot burn either fuel allocation twice, loads cannot go below zero or above capacity, preparation and mission constraints gate departure, and repeated awards cannot increase the score.

Mission 1 starts at TOM 6,300 (below 6,500), but ZFM 5,700 (above 5,500). Removing fuel keeps ZFM at 5,700 and can break the required-fuel constraint. Removing 200 kg of optional cargo while retaining required fuel permits the flight.

## Scope and limitations

- Windows 11, installed Microsoft Edge, and installed Google Chrome were not directly available for testing. Direct local opening was tested in Linux Chromium, not on the user's Windows laptop.
- No screen-reader audit or real mobile-device test was performed. Keyboard focus styles, labelled controls, reduced-motion CSS, and a live feedback region are included.
- This game has no save system. A reload or restart begins a new run.
- All aircraft capacities, loads, and mission limits are fictional training examples. Calculations follow the uploaded diagram and the relationships in the request. The full CAP 696 definitions referenced in the source image were not supplied and are not quoted or substituted.

## Optional developer tests

These are not needed to launch or play the game. No dependencies are bundled or required by the game itself.

- Core: `node tests/core.test.js`
- DOM integration: `node tests/dom.test.js` with jsdom available. `JSDOM_PATH` may specify its installed path.
- Browser: `node tests/browser.test.js` with Playwright and Chromium available. `CHROMIUM_PATH` may specify a browser executable. Test screenshots go to the temporary directory; `SHOT_PATH` may override the desktop screenshot path.
