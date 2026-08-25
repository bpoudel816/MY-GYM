MY GYM — PROGRESS GRAPH + PERIOD FILTER FIX

Replace:
- index.html
- app.js
- styles.css

No Firestore rule change.

CHANGES:
- Progress graphs normalize saved set data before graphing.
- Supports current MY GYM, older MY GYM, and Track IT imported set field variants.
- Progress can be filtered by Weekly, Monthly, Yearly, or Total.
- The selected period changes:
  * workout count
  * total sets
  * exercise count
  * best weight / estimated 1RM
  * strength graphs
  * cardio graphs
  * workouts-by-week consistency chart
- Graph rendering explicitly uses window.Chart.
- Blank graphs now show a useful no-data or runtime-error message.
- Current light mode and cardio-specific input system are preserved.

Period meaning:
- Weekly = last 7 calendar days including today
- Monthly = rolling previous month
- Yearly = rolling previous 12 months
- Total = all saved history
