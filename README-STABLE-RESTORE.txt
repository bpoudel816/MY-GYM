MY GYM — STABLE FEATURE RESTORE

This build starts from the recovery-build structure that already proved:
- Firebase login works
- existing signed-in sessions work
- cloud workouts load
- Forgot Password UI works

REPLACE:
- index.html
- styles.css
- app.js
- ui.js

DO NOT REPLACE:
- firebase-config.js
- firestore.rules

RESTORED FEATURES:
- Full exercise library
- MTS / Hammer Strength entries
- Per Arm vs Total/Both Arms for independent machines
- Finish This Exercise -> returns to body parts
- Finish Whole Workout separately
- Compact weight/reps details in History
- Calendar | Workouts | Progress
- Calendar workout markers
- Tap workout to edit date, weight, reps, set count
- Save edits back to Firebase
- Progress summary cards
- Forgot Password kept isolated in ui.js

IMPORTANT:
Graph charts and unique machine artwork are intentionally NOT in this build.
First test stability. Then we add graphs/artwork in the next round.

TEST ORDER:
1. Log out
2. Click Forgot Password? and confirm panel opens
3. Log in
4. Confirm old cloud workouts appear
5. Start Workout
6. Chest -> Hammer Strength MTS Chest Press
7. Confirm Per Arm / Total/Both Arms
8. Enter 50 lb per arm x 8
9. Finish This Exercise
10. Confirm return to body parts
11. Finish Whole Workout
12. History -> Workouts: confirm 50 lb/arm x 8 appears
13. History -> Calendar: confirm workout-day dot
14. Tap workout -> edit a set -> Save Changes
15. Refresh and confirm edit persists
