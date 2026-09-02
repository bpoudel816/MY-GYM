MY GYM — Stability Fix (September 2026)

Replace these 3 files in the GitHub MY-GYM repository:
1. index.html
2. app.js
3. styles.css

What this update fixes:
- Light mode workout screen contrast/visibility.
- In-progress workout recovery after iPhone/browser backgrounding or page reload.
- Active workout is saved locally after exercise/set/cardio changes and restored automatically after reload.
- Draft is cleared only after Finish Whole Workout successfully saves to Firestore, or when you explicitly cancel the workout.
- Track IT imported workout dates now show green even when they are older than MY GYM's calendar tracking-start date.

DATA SAFETY:
- This update DOES NOT delete or replace existing MY GYM Firestore workouts, body weights, meals, calendar entries, friends, or profile data.
- Track IT import remains merge-only and uses the same deterministic Track IT document IDs, so re-importing the same backup updates those imported records instead of creating duplicates.
- Do not use the "Delete all tracked data" option in Profile unless you intentionally want to erase data.

After uploading the 3 files, wait for GitHub Pages to deploy, then fully close/reopen MY GYM on iPhone so the new cache-busted JS/CSS loads.
