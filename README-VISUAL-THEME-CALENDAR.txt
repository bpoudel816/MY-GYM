MY GYM — VISUAL / THEME / CALENDAR UPDATE

REPLACE THESE 3 FILES IN GITHUB:
- index.html
- app.js
- styles.css

KEEP UNCHANGED:
- firebase-config.js
- firestore.rules
- your current main MY GYM icon

INCLUDED
- Bubble-style colorful body-part icons
- Distinct visual tag for every exercise/machine
- Profile Dark / Light theme switch
- Theme saves in Firebase settings
- iPhone-safe large bottom navigation
- Non-overlapping weight/reps controls
- Calendar behavior:
    GREEN = workout
    BLUE = rest
    RED = skipped/missed
    dates before first login with this updated build remain untouched
    today remains neutral until workout/rest
    completed past tracked day without workout/rest becomes red
- Track IT import remains included

NO FIRESTORE RULE CHANGE REQUIRED.

After upload/deploy, hard refresh once because the app uses new cache version visualtheme4.
