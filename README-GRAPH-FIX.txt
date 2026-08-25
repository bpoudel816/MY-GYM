MY GYM — GRAPH DEFINITIVE FIX

Replace ONLY:
1. index.html
2. app.js

Keep your current styles.css, firebase-config.js, ui.js, manifest, and icons.

WHAT WAS FIXED
- The uploaded app.js is loaded as an ES module.
- Chart.js is loaded by a normal UMD script in index.html.
- Graph creation now explicitly uses window.Chart instead of relying on the bare Chart identifier.
- Progress waits until the visible panel and fonts have completed layout before drawing.
- If a chart still hits a runtime error, the actual error is displayed inside the graph card instead of leaving a mysterious blank white box.

This does NOT change:
- light mode
- cardio input system
- saved workouts
- Firestore rules
- import logic
