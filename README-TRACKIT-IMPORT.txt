MY GYM — TRACK IT IMPORT UPDATE

REPLACE:
- index.html
- app.js
- styles.css

KEEP:
- firebase-config.js
- firestore.rules
- main MY GYM app icon

NO FIRESTORE RULE CHANGE REQUIRED.

HOW TO IMPORT OLD TRACK IT DATA
1. Export/locate the .json backup from Track IT.
2. MY GYM > Profile.
3. Find "Import from Track IT".
4. Tap "Choose Track IT Backup".
5. Select the .json file.
6. Review the preview counts.
7. Tap "Merge Into MY GYM".
8. Existing MY GYM data remains in place.

DUPLICATE PROTECTION
- Each old Track IT workout is saved using a stable document ID based on the old Track IT workout ID.
- Importing the same Track IT backup again updates the same imported document instead of creating another copy.

SUPPORTED
- Strength workouts and sets
- Per-arm / total tracking mode
- Cardio details
- Calendar Rest / Missed status
- Body-weight entries when the old backup contains dated body weights
- Custom exercise names are retained in imported workout history

IMPORTANT
Custom Track IT machines are preserved inside imported workout history, but this importer does not automatically add unknown custom machines to the permanent MY GYM exercise library.
