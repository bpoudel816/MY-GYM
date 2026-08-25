MY GYM — HISTORY + WEIGHT MODE UPGRADE

REPLACE ONLY:
- index.html
- styles.css
- app.js

DO NOT REPLACE:
- firebase-config.js
- firestore.rules

NEW FEATURES
1. Independent-arm/MTS exercises show:
   - Per Arm
   - Total / Both Arms

2. Weight mode is saved per exercise in Firestore.

3. History workout cards now show compact details:
   Hammer Strength MTS Chest Press
   50 lb/arm × 8 • 50 lb/arm × 8 • 50 lb/arm × 8

4. History now has:
   - Calendar
   - Workouts
   - Progress

5. Calendar marks workout days.
   Tap a workout day to see that day's exercises and sets.

6. Tap any workout card to edit:
   - workout date/time
   - weight
   - reps
   - set count
   - per-arm/total mode (for MTS/independent machines)

7. Progress tab has summary metrics and is reserved for the full graph engine next.

TEST
- Start a new MTS Chest Press workout
- Select Per Arm
- Enter 50 x 8
- Finish This Exercise
- Finish Whole Workout
- Open History > Workouts
- Confirm it displays "50 lb/arm × 8"
- Open History > Calendar
- Confirm workout day has a dot
- Tap the workout and edit a set
- Save Changes
- Reopen and confirm the edit persisted
