# Oxford source audit — 2026-10-08

Baseline commit: a24a9703ff0306e3d804f313dfa94be16f34647a. Remote backup: pre-v2-redesign. Audit completed before gameplay edits. Both PNGs were opened and read visually.

## Source inventory
- assets/source-diagram.png: Figure 2.4, Definitions and flow diagram. Git blob e748fdc7d2efa09fb1a42a4b3f76233c5bfc55e1.
- assets/source-definitions.png: supplied extract covering BEM, DOM, OM, Traffic Load, Useful Load, MZFM and Maximum Structural Taxi Mass. Git blob e446af04c665b8ebdc6b6f167b8d463a66ece6ba.
- js/data.js: original labels, training masses, five missions and six questions.
- js/core.js: original calculate, violations, state transitions.
- index.html (now also classic.html): source links and explicitly qualified teaching summaries.
- js/lessons.js: predictions, component bars, 13 challenges, change log, review.
- README_FA.html and VERIFICATION.md: original explanation and test limitations.

## Relationships and implementation mapping
| Preserved relationship | Original calculate field | v2 engine field |
|---|---|---|
| BEM = 4000 kg (fictional training value) | bem | bem |
| BEM + crew + operating items = DOM | dom | dom |
| DOM + takeoff fuel = OM | om | om |
| DOM + Traffic Load = ZFM | zfm | zfm |
| Traffic Load + takeoff fuel = Useful Load | useful | useful |
| DOM + Useful Load = TOM | tom | tom |
| TOM + start/taxi fuel = Taxi Mass | taxiMass | taxiMass |
| TOM − trip fuel = LM | lm | lm |

The new engine delegates these category calculations to the unchanged original MassCore.calculate. Negative projected landing fuel is flagged as an infeasible plan, not an achievable landing state. Actual consumed fuel is bounded by available fuel. Calculated masses and their upper limits remain separate.

## Definitions, scope and ambiguity
The diagram shows OM + Traffic Load and ZFM + takeoff fuel as alternative TOM paths. Its vertical Useful Load arrow is ambiguous in isolation; the text explicitly defines Useful Load as Traffic Load plus takeoff fuel. Existing code implements that interpretation correctly and it is retained.

The text calls Traffic Load the revenue-generating load, formerly payload. Full BEM/DOM/OM/Traffic Load/MZFM definitions refer to CAP 696, which is NOT included. Existing short labels are teaching interpretations, not purported Oxford or CAP quotations. No replacement definitions were imported.

Source names also include Maximum Structural Taxi Mass, Ramp Mass, Block Mass, MSTOM, PLTOM, MSLM, PLLM, Dry Operating Index and Fuel Index. These names and source links remain accessible; index conversion and performance-limited mass definitions cannot be derived from the extract and are not fabricated. The DOM moment example has no complete units/aircraft dataset; it cannot specify RF–01 geometry.

The source distinguishes structural maxima with stars. It describes extra starting/taxi fuel as consumed before takeoff. v2 burns the loaded 50 kg taxi allocation once. MZFM is a separate structural constraint and cannot be fixed by reducing fuel.

No full CG, datum, moment or MAC definition or RF–01 envelope is present. v2 mass-weighted geometry is an explicitly fictional extension, not an Oxford quotation. Forward/aft boundaries restrict dispatch; handling or loss of control is not asserted from them.

## Preserved values and features
BEM 4000; crew 2 × 100; operating items 200; passenger 80 excluding bag; bag 20; 12 seats; takeoff fuel maximum 1200 plus taxi maximum 50 = tank 1250 kg. Original limits vary by mission, so there was no single certified aircraft envelope. v2 declares a new coherent fictional structural set and can apply lower mission dispatch caps; original scenarios stay intact in classic.html.

Original scripts, styles, source assets, five missions, six practice questions, guided flight, prediction gate, 13 learning challenges and Persian guide remain available through Classic training. Source PNG bytes are unchanged. No mathematical correction to the Oxford relationships was necessary.
