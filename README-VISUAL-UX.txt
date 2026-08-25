MY GYM — VISUAL + UX FINALIZATION

REPLACE / ADD IN GITHUB:
- index.html
- styles.css
- app.js
- ui.js
- manifest.webmanifest   (new)
- my-gym-icon.svg        (new)

KEEP:
- firebase-config.js
- firestore.rules

NO FIRESTORE RULE CHANGE IS REQUIRED.

WHAT CHANGED
- New MY GYM app icon / PWA manifest
- New brand mark
- Polished mobile bottom navigation
- Fancy body-part cards with distinct artwork
- Exercise cards now have distinct machine illustrations
- Chest press, incline, decline, fly, cable, Smith, dumbbell all look different
- Back machines have pulldown/row/high-row/pull-up/back-extension visuals
- Shoulder, arm, leg, core and cardio exercises use different machine archetypes
- Better spacing, shadows, touch targets and phone layout
- Workout weight stepper polished
- History, graphs, calories and profile visuals polished
- All current Firebase/data features stay unchanged

TEST
1. No Firebase/Firestore changes.
2. Hard refresh after deployment.
3. Open Workout > each body part.
4. Confirm machine illustrations differ between exercises.
5. Check phone-sized browser layout if possible.
6. Test one workout save to ensure functionality was not affected.
7. Check History, Progress, Calories and Profile still open.
