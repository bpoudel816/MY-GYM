MY GYM — EMERGENCY LOGIN/UI FIX

I checked the ACTUAL GitHub files and found the live index.html was malformed.
It was missing Home elements such as:
- logoutBtn
- startWorkoutBtn
- userName / userEmail
- home workout metrics

app.js tried to access these missing elements, so JavaScript stopped before login could work.

REPLACE ONLY:
- index.html
- app.js
- styles.css

OPTIONAL ICON FILES:
- my-gym-icon-192.png
- my-gym-icon-512.png

DO NOT CHANGE:
- firebase-config.js
- firestore.rules

After GitHub deploys:
- hard refresh Ctrl+Shift+R
- the page source should show app.js?v=emergencyfix2
