MY GYM — FRIEND APPROVAL FIX

Replace ONLY:
- app.js

Do not replace:
- index.html
- styles.css
- ui.js
- firebase-config.js

This changes approval from one 3-write Firebase batch to a safe sequence:
1. mark request accepted
2. create receiver -> requester connection
3. create requester -> receiver connection

After upload:
1. Commit app.js to main.
2. Wait for GitHub Pages deployment.
3. Hard refresh both accounts.
4. Send a fresh friend request.
5. Approve it.

If an earlier failed approval created partial connection records, use Firebase Firestore Data tab:
- open the top-level `connections` collection
- delete the two test connection documents between these two test accounts
Then send a fresh request and approve again.
