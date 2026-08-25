MY GYM — FINAL LIGHT MODE + GRAPH + LEGACY CARDIO FIX

Replace:
- index.html
- app.js
- styles.css

No Firestore rule change.

FIXED:
1. Light mode workout rows
   - Exercise names are now dark and visible.
   - Set details are readable.
   - White/light exercise rows instead of black blocks.

2. Progress graphs
   - Charts explicitly resize and render after the Progress panel becomes visible.
   - Safe Chart.js rendering through the canvas 2D context.
   - Light/dark axis/legend colors are applied dynamically.
   - Charts redraw after theme changes.
   - Strength and cardio histories remain supported.
   - Imported/older workouts remain included.

3. Legacy cardio
   - Old cardio records that were previously stored as lb x reps are no longer presented as normal strength data.
   - They show as "Legacy cardio data".
   - New cardio continues to use machine-specific fields.

4. Current cardio
   - Stair Climber: Stairs, Time, Floors
   - Treadmill: Distance, Time, Incline
   - Elliptical/Bikes: Distance, Time, Resistance
   - Rowing: Distance, Time, Resistance
