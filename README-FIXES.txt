MY GYM — NAVIGATION + SAVE + DELETE + REPS FIX

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

FIXES

1. NAVIGATION
Old:
Home | Workout | History | Calories | Connections | Profile

New:
Home | Workout | History | Calories | More

More opens:
- Connections
- Profile

This removes congestion on desktop and especially on phones.

2. FINISH WHOLE WORKOUT
- Saving is now separated from refreshing.
- If Firebase successfully saves the workout, MY GYM will say it saved.
- A later refresh problem can no longer falsely say "Could not save workout."
- If you are currently inside an unfinished exercise, Finish Whole Workout tells you to finish/remove that exercise first.

3. DELETE ALL TRACKED DATA
- Fixed missing Firestore writeBatch import.
- Batch deletion now works for workouts, calendarDays, bodyWeights, meals, settings.
- Button shows "Deleting..." while processing.
- Login account remains untouched.

4. FANCY REP CONTROL
- Round minus button
- Manual reps input in the center
- Round plus button
- +/- 1 rep per tap
- Manual typing still works

TEST
1. Check top navigation is less crowded.
2. Click More -> Connections and Profile.
3. Complete one exercise -> Finish This Exercise -> Finish Whole Workout.
4. Confirm it says saved and appears in History.
5. Start an active exercise and try Finish Whole Workout before finishing that exercise: it should tell you to finish/remove it first.
6. Test + / - reps.
7. Only when ready, test Delete All Tracked Data on test data.
