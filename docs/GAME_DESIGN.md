# Game design — version 2.0

## Experience

Open directly into mission 1. The aircraft has crew and operating items prepared, 600 kg takeoff fuel and 50 kg taxi fuel. The first meaningful control boards a passenger and one bag; their 100 kg immediately propagates through the Oxford categories and station moment. The 10–15 second first-interaction objective is a design target, not a measured human usability result.

The desktop aircraft column and essential status remain sticky while load controls scroll. Mobile retains a compact sticky status; quick aircraft actions link to loading and decision desk. Buttons and number inputs supplement keyboard-selectable SVG station groups. No dragging is required. Optional advanced board exposes all mass categories, limits, fuel breakdown and station moments. Reduced-motion media settings disable the optional CSS animation.

Three modes share the same core state engine. PLAY presents ten freely selectable missions, LAB adds controlled experiments, LEARN explains the preserved source and links to Classic training. Mode changes between PLAY and LAB start a fresh flight. Opening LEARN and returning to the existing mode retains the current flight. Restart keeps best campaign results but resets all loading/flight state.

## Learning loop

Narrative → load → observe → inspect → correct or no-go → taxi → takeoff → climb → cruise decisions → descent → landing clearance → debrief → compare a revised plan → retry. There is no timer-based rush incentive. Checked revisions become invalid after any change. Changes after taxi are unavailable. Special events invalidate old loading assumptions or change route burn.

One bag per passenger is the minimum service objective; additional baggage within capacity is allowed (mission 4 represents group baggage). Cargo can be optional or a minimum retained consignment. Operational dispatch checks and service objectives are shown separately in the engine; neither can be ignored to claim completion.

## Scores and ranks

Safety (40): awarded for successful flight, safe no-go or safe diversion. Accuracy (30): verified load with at least one check earns 30; verified but unchecked no-go 20; unverified cargo 10. Efficiency (20): justified cancellation 20, unnecessary cancellation 10; safe flight 20 minus one point per full 100 kg arrival fuel above the 150 kg reserve, with minimum 10. Decision (10): safe flight/diversion or justified no-go 10, other decisions 5. An intentional cancellation is not penalized merely because it did not take off; an unnecessary cancellation is distinguished from one with unmet constraints.

A score is distinct from mission completion. Best score and any previous completion are preserved per mission, so repeated clicking cannot farm cumulative points. The number of missions scoring at least 80 determines rank in two-mission steps: Student Loader, Load Planner, Flight Operations Specialist, Mass & Balance Expert, Captain Level (capped at final rank). These are educational game achievements, not certificates.

## Debrief and preservation

Every outcome includes classification, reason, actual loaded quantities, planned TOM versus current mass, current CG/fuel, decision, linked concepts and real snapshot timeline. Four what-if actions recalculate removing cargo, adding fuel, transferring aft cargo or choosing more runway. They do not mutate the completed flight. The result explicitly says whether departure is feasible, and shows the precise remaining reasons if not.

Classic training retains five previous missions, the guided flight, six questions, prediction gate, component bars, comparisons, 13 challenges and Persian guide. LEARN links directly to the two unchanged Oxford assets; no source material is hidden behind completing the campaign.

## Scope

Flight is an interactive discrete management exercise, not a piloting simulator. There are no fake flight controls, collision graphics or random failures. No sound is required. No modal is used by v2; classic learning dialogs remain. English remains the game language; the existing Persian guide is preserved. Human usability studies, certified-aircraft validation and cross-browser/device lab coverage remain future work.
