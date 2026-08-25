MY GYM — WEIGHT + CALENDAR UPGRADE

REPLACE IN GITHUB:
- index.html
- styles.css
- app.js
- ui.js

DO NOT REPLACE:
- firebase-config.js

FIRESTORE RULES:
This build adds cloud calendar status.
You MUST also update Firebase > Firestore > Rules using firestore.rules in this ZIP, then Publish.

NEW WEIGHT CONTROL:
- Round minus / plus buttons
- +/- changes weight by 5 lb
- Center weight remains manually editable
- First time an exercise is used: 30 lb
- Later: defaults to the last saved weight for that exact exercise
- Reps also default to the previous saved first-set reps, otherwise 8
- MTS/independent machines remember Per Arm / Total mode from the last workout

CALENDAR:
- Workout day = green
- Rest day = yellow
- Missed day = red
- Past date with no workout/rest automatically appears Missed
- Today is not auto-marked Missed
- Tap a day to mark Rest / Missed / Clear
- If a workout exists on a day, status is locked to Workout
- Manual day status syncs through Firebase

TEST ORDER:
1. Upload index.html, styles.css, app.js, ui.js.
2. Firebase > Firestore > Rules > paste firestore.rules > Publish.
3. Hard refresh MY GYM.
4. Start an exercise never used before: confirm 30 lb default.
5. Tap +: 35, 40, 45.
6. Tap -: decrease by 5.
7. Click center weight and type a manual value such as 47.
8. Finish workout.
9. Start the same exercise again: confirm last saved weight is the default.
10. History > Calendar.
11. Tap a past non-workout date and mark Rest.
12. Confirm it turns yellow.
13. Mark another past date Missed; confirm red.
14. Clear a manual status.
15. Refresh or login in Incognito and confirm statuses persist.
