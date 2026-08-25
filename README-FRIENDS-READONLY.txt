MY GYM — FRIENDS / READ-ONLY SHARING UPGRADE

REPLACE / ADD:
- index.html
- styles.css
- app.js
- ui.js

KEEP:
- firebase-config.js
- manifest.webmanifest
- my-gym-icon.svg

IMPORTANT: FIRESTORE RULES MUST BE UPDATED
Firebase > Firestore Database > Rules
Paste the included firestore.rules and click Publish.

NEW CONNECTIONS FEATURE
- Each MY GYM account gets an 8-character Friend Code.
- Share the code with a friend.
- Friend enters code and sends request.
- Receiver sees request in Connections.
- Receiver can Approve or Decline.
- Approved friends appear in the Friends list.
- Tap View Progress to see the friend's recent workouts.
- Shared progress is READ ONLY.
- Friend cannot edit/delete another user's workouts.
- Calories/meals and calendar statuses stay private.
- Body-weight data is permitted for future friend progress charts.
- Remove connection supported.

RECOMMENDED TEST WITH TWO ACCOUNTS
1. Account A: open Connections and copy Friend Code.
2. Account B: enter Account A's code and Send Request.
3. Account A: refresh/open Connections and approve.
4. Account B: Connections should now show Account A.
5. Account B: View Progress.
6. Confirm Account A workouts appear.
7. Confirm there are NO edit/delete controls in friend progress.
8. Remove friend and confirm progress access disappears.

IMPORTANT
This feature needs two separate MY GYM accounts to test properly.
