MY GYM V23 — Weight & Reps graph display fix

Replace only:
- index.html
- app.js

What changed:
- Weight uses the LEFT Y-axis.
- Reps use a separate RIGHT Y-axis.
- Reps display as whole-number ticks.
- Weight and reps remain on the same graph but are both clearly visible.

What was NOT changed:
- Firestore/database structure
- workout records
- body-weight data
- calories
- friends/connections
- Track IT imported data
- workout save logic
- exercise/machine assets
- any delete/import logic

This is a chart-presentation-only update.
