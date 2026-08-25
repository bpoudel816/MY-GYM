MY GYM — Workout Flow + Saved Workout Editing Update

Replace ONLY these three files in your GitHub MY-GYM repository:
1. index.html
2. styles.css
3. app.js

Do NOT replace firebase-config.js.
Do NOT change your Firestore rules for this update.

NEW FLOW
Start Workout -> Body Part -> Exercise -> Sets -> Finish This Exercise -> automatically back to Body Parts.
There is no Add Exercise button at the top.
Finish Whole Workout ends and saves the entire gym session.

EDIT AFTER SAVING
Open History and tap any saved workout card.
You can change the workout date/time, weights, reps, add/delete sets, remove an exercise, and add a custom exercise.
Tap Save Changes to update the existing Firestore workout document.

NOTE
The existing Firestore rule that allows the signed-in user to update their own workouts is required. Your current Day 2 rule already does this.
