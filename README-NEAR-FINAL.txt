MY GYM — NEAR-FINAL CONSOLIDATION BUILD

REPLACE:
- index.html
- styles.css
- app.js
- ui.js

KEEP:
- firebase-config.js

FIRESTORE RULES:
Use the included firestore.rules if your current rules are older.
This build does not require a new collection beyond the previous Calories + Body Weight build.

NEW CLEANUP / FINALIZATION FEATURES:
- 0-exercise / 0-set workouts are hidden automatically
- new empty workouts cannot be saved
- edit a workout and remove an exercise
- delete an individual saved workout
- if an edited workout has no data left, MY GYM asks whether to delete it
- Profile > Danger Zone
- Delete Empty/Test Workouts
- Delete All Tracked Data
- Delete All requires typing DELETE plus a second confirmation
- Delete All keeps the Firebase login account intact
- workouts, calendar statuses, body weights, meals, and nutrition settings are removed

TEST:
1. History: old 0-exercise workouts should no longer appear.
2. Profile > Delete Empty Workouts: remove old empty test records.
3. Open a real workout > Delete Workout > confirm it disappears.
4. Edit a workout > remove all exercises > Save Changes > confirm delete prompt.
5. Start/cancel a workout before completing an exercise: no empty record should be saved.
6. DO NOT test Delete All Tracked Data unless you are intentionally ready to wipe test data.
