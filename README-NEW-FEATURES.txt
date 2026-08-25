MY GYM — MOTIVATION / PHOTO / ROUTINE / CELEBRATION / FRIEND REACTIONS

REPLACE IN GITHUB:
- index.html
- app.js
- styles.css

KEEP:
- firebase-config.js
- your main MY GYM icon

FIRESTORE:
Friend workout reactions need ONE new nested reactions rule.
Use FIRESTORE-REACTION-RULES-SNIPPET.txt to add only that block to your current rules.
A full firestore.rules is also included for reference.

NEW FEATURES
1. DAILY MOTIVATION
   - One built-in motivational quote per calendar day.
   - Same quote all day; automatically changes next day.
   - No internet quote service required.

2. PROFILE PHOTO
   - Profile > Change Photo.
   - Crops/compresses to 320x320 JPEG before saving.
   - Saved privately in the existing user profile document.
   - Also shown beside Welcome on Home.
   - No Firebase Storage required.

3. AUTOMATIC WORKOUT PATTERN
   - Learns from the user's actual recent workouts + manually recorded Rest days.
   - Classifies recent sessions as Push, Pull, Upper, Lower, Full Body, Cardio, Core, etc.
   - Detects a repeating sequence when the last cycle repeats.
   - Otherwise shows the recent pattern.
   - It adapts automatically when the user's routine changes.

4. WORKOUT COMPLETE CELEBRATION
   - Firework/confetti-style screen after a successful workout save.
   - Generated clap sound.
   - Shows exercises, sets, minutes and training volume.
   - Does not appear until Firebase confirms the workout was saved.

5. FRIEND ENCOURAGEMENT
   - On a friend's read-only workout: 👏 Clap or 👍 Nice.
   - A friend can react but STILL cannot edit the workout.
   - Tapping the same reaction again removes it.
   - The workout owner sees received 👏 / 👍 counts on their workout cards.

6. EVERYTHING ALREADY WORKING IS PRESERVED
   - Light / Dark theme
   - Better workout/body-part icons
   - Track IT import
   - Calendar tracking rules
   - Calories
   - Friends / connections
   - Workout save fixes
   - iPhone-safe bottom navigation and set controls
