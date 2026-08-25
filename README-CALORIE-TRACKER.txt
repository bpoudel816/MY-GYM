MY GYM — SIMPLE CALORIE TRACKER UPGRADE

REPLACE IN GITHUB:
- index.html
- styles.css
- app.js
- ui.js

KEEP:
- firebase-config.js

ALSO UPDATE FIRESTORE RULES:
Firebase > Firestore Database > Rules
Paste the included firestore.rules and click Publish.

NEW CALORIES TAB:
- Pick a date
- Enter meal / food name
- Enter calories manually
- Optional meal time
- Add meal
- Daily calorie total
- Edit a meal
- Delete a meal
- Optional daily calorie target
- Shows remaining / over-target calories
- Data syncs through Firebase

TEST:
1. Open Calories.
2. Add "Breakfast" with 450 calories.
3. Add "Lunch" with 650 calories.
4. Confirm total = 1100 kcal.
5. Edit Breakfast to 500.
6. Confirm total updates to 1150.
7. Delete Lunch.
8. Confirm total updates.
9. Set a daily target such as 2000 kcal.
10. Refresh page and confirm meals + target remain.
11. Log in on another browser/device and confirm data appears.
