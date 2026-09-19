# Advanced version verification

Executed in this environment:
- tests/core.test.js: 9 calculation/state groups pass.
- tests/advanced.test.js: all three additional missions are solvable with required fuel; comparison masses pass.
- tests/dom.test.js using jsdom: guided flight, original missions, six questions, stage locks, fuel deductions and scoring pass.
- tests/lessons.test.js using jsdom: prediction gate/retry, 13 challenges, colour breakdown, score deduplication, practice answer hiding and reset pass. Dialog methods are shimmed in this DOM test; this is not a visual browser test.

Not tested for this version: rendered browser layout, native modal focus handling, real browser offline interaction, or Windows 11. Prior-version browser tests are retained as optional developer tests, not claimed as executed for this version.

Game uses ordinary local scripts and bundled assets. No runtime dependencies or network requests are required. Learning points last for the current page session only. All masses and limits are fictional training examples.
