MY GYM — FRIEND REQUEST FIX

Replace ONLY:
- app.js

Keep:
- index.html
- styles.css
- ui.js
- firebase-config.js
- firestore.rules

Why:
The prior app tried to read a connection document before it existed.
Firestore correctly denied that read, which caused "Could not send friend request."

After replacing app.js:
1. Commit to main.
2. Wait for GitHub Pages deployment.
3. Hard refresh with Ctrl+Shift+R.
4. Try sending the friend request again.
