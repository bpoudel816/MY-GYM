MY GYM REALISTIC V21

Replace/upload all files and the complete assets folder.

Changes:
- one machine-specific asset filename for every exercise in the current library
- body-part cards: photo above, readable label below
- machine images use contain sizing so equipment is not cropped
- iPhone safe-area/header spacing fix
- rapid-tap zoom protection retained
- active-workout persistence/recovery retained
- Track IT calendar/import behavior retained
- new Profile > Import from Track IT > Remove Imported Track IT PF Data button
  * previews counts
  * requires REMOVE confirmation
  * deletes only records marked sourceApp=Track IT or trackit_* IDs
  * does not delete native MY GYM workouts

No Firestore schema migration or delete-on-load behavior is included.
