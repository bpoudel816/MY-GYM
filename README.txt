MY GYM RECOVERY BUILD

Replace:
- index.html
- styles.css
- app.js

Add:
- ui.js

DO NOT replace firebase-config.js.
DO NOT change Firebase or Firestore rules.

WHY:
The previous build's JavaScript stopped before attaching button handlers.
This recovery build separates Forgot Password UI into ui.js so that button works even if Firebase code fails.

After upload:
1. Wait for GitHub Pages deployment.
2. Hard refresh (Ctrl+Shift+R).
3. Click Forgot password FIRST.
4. If reset panel opens, UI script is working.
5. Then test Log in.
