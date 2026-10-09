# Flight Lab integration

Brand: **Flight Lab**. Platform tagline: **Master Aviation by Playing**. Game tagline: **Load It. Balance It. Fly It. Survive It.**

Verified canonical platform: https://aliajam2000.github.io/flight-lab/ . On 2026-10-09, its public index returned HTTP 200 with title “Flight Lab — Master Aviation by Playing”; repository aliajam2000/flight-lab identifies the same brand and platform. The header links back to that URL. The game remains at https://aliajam2000.github.io/aircraft-mass-game/ . Only the aircraft-mass-game repository is modified.

The academy currently describes external games as not reporting performance to its platform. This release does not pretend to synchronize scores. Game state and best results live under a namespaced localStorage key `flightlab-mass-v2`; no backend, account or cross-game write is introduced. The academy registry need not change because this game's public URL is unchanged.

Future integration could provide a documented completion event carrying game ID, version, mission ID, decision score and completion flag. It must distinguish a safe diversion/no-go from destination completion and must not claim professional competency from game scores. No such integration endpoint is implemented in v2.0.

Original source images are retained because the owner supplied them as the project's instructional foundation. This release does not assert an Oxford affiliation or redistribute additional textbook material. New RF–01 geometry/performance must stay labeled fictional if reused by another Flight Lab game.
