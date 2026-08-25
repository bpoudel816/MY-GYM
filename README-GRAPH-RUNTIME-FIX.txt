MY GYM — GRAPH RUNTIME FIX

Replace:
- index.html
- app.js
- styles.css

No Firestore rule change.

ROOT CAUSE FOUND:
The previous build called renderProgressChartsSoon() and resizeProgressCharts(),
but those functions were not actually defined. JavaScript syntax checking does
not catch undefined functions, so the file passed syntax validation but failed
when the app tried to render Progress.

THIS FIX:
- Defines both missing graph runtime functions.
- Clicking History > Progress explicitly rebuilds the exercise selector and graphs.
- Waits two animation frames after the hidden Progress panel becomes visible,
  so Chart.js receives the correct canvas size.
- Changing an exercise redraws the charts using the same safe timing.
- Shows a visible warning if the external Chart.js library fails to load.
- Keeps the light-mode, cardio, legacy cardio, motivation, profile photo,
  celebrations, reactions, Track IT import, and calendar changes.
