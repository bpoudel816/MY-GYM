MY GYM — ACTUAL GRAPH ROOT-CAUSE FIX

Replace:
- index.html
- app.js
- styles.css

No Firestore rule change.

ROOT CAUSE FOUND:
The Progress code called TWO functions that did not exist:
- formatNumber()
- weightUnitLabel()

That caused a JavaScript ReferenceError inside updateSelectedExerciseMetrics().
Because renderAllCharts() called that function first, execution stopped BEFORE
Chart.js could draw Weight & Reps, Volume, Estimated 1RM, Body Weight, or
Consistency charts.

This explains why:
- Total workouts / total sets / exercises were correct
- exercise dropdown was correct
- Best Weight stayed —
- Best Est. 1RM stayed —
- every graph remained blank
even with brand-new MY GYM workouts.

FIXED:
- Added formatNumber()
- Added weightUnitLabel()
- Protected chart rendering from metric calculation errors
- Uses window.Chart explicitly
- Keeps Weekly / Monthly / Yearly / Total filters
- Bumped styles.css cache so period buttons use MY GYM styling
- Preserves light mode, cardio, Track IT import and all existing features.
