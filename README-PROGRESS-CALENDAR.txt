MY GYM — PROGRESS + CALENDAR FINALIZATION

Built on the version where Friends approval is confirmed working.

REPLACE:
- index.html
- styles.css
- app.js

KEEP:
- ui.js
- firebase-config.js
- firestore.rules
- manifest.webmanifest
- my-gym-icon.svg

NO FIRESTORE RULE CHANGE REQUIRED.

WHAT TO TEST
PROGRESS:
- History > Progress
- Choose an exercise
- Existing fancy charts remain:
  1. Weight & Reps
  2. Total Volume
  3. Estimated 1RM
  4. Body Weight
  5. Workouts per Week
- New Best Weight and Best Estimated 1RM cards update with exercise selection.

CALENDAR:
- Workout days remain automatic from saved workouts.
- Past non-workout days automatically show Missed.
- Tap a day and mark it Rest or Missed.
- Manual status can be cleared.
- Workout days show their exercise/set details.
- Today is more clearly highlighted.

IMPORTANT:
Friends/Connections code is preserved from the working approval fix.
No Firestore rule change is needed.
