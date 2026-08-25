import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const $ = id => document.getElementById(id);

const EXERCISES = {
  Chest: [
    {name:"Chest Press",type:"Selectorized"},
    {name:"Incline Chest Press",type:"Selectorized"},
    {name:"Decline Chest Press",type:"Selectorized"},
    {name:"Hammer Strength MTS Chest Press",type:"MTS",independent:true},
    {name:"Hammer Strength MTS Incline Press",type:"MTS",independent:true},
    {name:"Hammer Strength MTS Decline Press",type:"MTS",independent:true},
    {name:"Hammer Strength Plate-Loaded Chest Press",type:"Plate Loaded",independent:true},
    {name:"Hammer Strength Plate-Loaded Incline Press",type:"Plate Loaded",independent:true},
    {name:"Pec Deck / Chest Fly",type:"Selectorized"},
    {name:"Cable Fly",type:"Cable"},
    {name:"Smith Machine Bench Press",type:"Smith"},
    {name:"Dumbbell Bench Press",type:"Free Weight",independent:true}
  ],
  Back: [
    {name:"Lat Pulldown",type:"Selectorized"},
    {name:"Seated Row",type:"Selectorized"},
    {name:"High Row",type:"Selectorized"},
    {name:"Hammer Strength MTS High Row",type:"MTS",independent:true},
    {name:"Hammer Strength MTS Front Pulldown",type:"MTS",independent:true},
    {name:"Hammer Strength MTS Iso-Lateral Row",type:"MTS",independent:true},
    {name:"Hammer Strength Plate-Loaded High Row",type:"Plate Loaded",independent:true},
    {name:"Hammer Strength Plate-Loaded Low Row",type:"Plate Loaded",independent:true},
    {name:"Assisted Pull-Up",type:"Selectorized"},
    {name:"Cable Row",type:"Cable"},
    {name:"Straight-Arm Pulldown",type:"Cable"},
    {name:"Back Extension",type:"Machine"}
  ],
  Shoulders: [
    {name:"Shoulder Press",type:"Selectorized"},
    {name:"Hammer Strength MTS Shoulder Press",type:"MTS",independent:true},
    {name:"Hammer Strength Plate-Loaded Shoulder Press",type:"Plate Loaded",independent:true},
    {name:"Lateral Raise",type:"Selectorized"},
    {name:"Rear Delt Fly",type:"Selectorized"},
    {name:"Cable Lateral Raise",type:"Cable",independent:true},
    {name:"Front Raise",type:"Cable",independent:true}
  ],
  Arms: [
    {name:"Biceps Curl",type:"Selectorized"},
    {name:"Preacher Curl",type:"Machine"},
    {name:"Cable Curl",type:"Cable"},
    {name:"Hammer Strength Biceps Curl",type:"Plate Loaded",independent:true},
    {name:"Triceps Press",type:"Selectorized"},
    {name:"Triceps Pushdown",type:"Cable"},
    {name:"Dip Machine",type:"Selectorized"},
    {name:"Hammer Strength Triceps Extension",type:"Plate Loaded",independent:true}
  ],
  Legs: [
    {name:"Leg Press",type:"Selectorized"},
    {name:"45° Leg Press",type:"Plate Loaded"},
    {name:"Hack Squat",type:"Plate Loaded"},
    {name:"Hammer Strength MTS Leg Press",type:"MTS",independent:true},
    {name:"Hammer Strength Plate-Loaded Linear Leg Press",type:"Plate Loaded"},
    {name:"Leg Extension",type:"Selectorized"},
    {name:"Seated Leg Curl",type:"Selectorized"},
    {name:"Lying Leg Curl",type:"Selectorized"},
    {name:"Standing Leg Curl",type:"Selectorized"},
    {name:"Hip Abductor",type:"Selectorized"},
    {name:"Hip Adductor",type:"Selectorized"},
    {name:"Seated Calf Raise",type:"Machine"},
    {name:"Standing Calf Raise",type:"Machine"},
    {name:"Glute Drive / Hip Thrust",type:"Machine"}
  ],
  Core: [
    {name:"Abdominal Crunch",type:"Selectorized"},
    {name:"Torso Rotation",type:"Selectorized"},
    {name:"Cable Crunch",type:"Cable"},
    {name:"Hanging Knee Raise",type:"Bodyweight"},
    {name:"Plank",type:"Bodyweight"}
  ],
  Cardio: [
    {name:"Treadmill",type:"Cardio"},
    {name:"Stair Climber",type:"Cardio"},
    {name:"Elliptical",type:"Cardio"},
    {name:"Stationary Bike",type:"Cardio"},
    {name:"Recumbent Bike",type:"Cardio"},
    {name:"Rowing Machine",type:"Cardio"}
  ]
};

let user = null;
let workout = null;
let activeExercise = null;
let timerHandle = null;
let workoutsCache = [];
let calendarCursor = new Date();
let selectedCalendarKey = null;
let editingWorkout = null;

function showMessage(text, success=false) {
  $("authMessage").textContent = text;
  $("authMessage").className = success ? "message success" : "message";
}

function showToast(text, type="") {
  const el = $("toast");
  el.textContent = text;
  el.className = `toast ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 2600);
  el.classList.remove("hidden");
}

function showScreen(name) {
  ["homeScreen","workoutScreen","historyScreen","profileScreen"].forEach(id => $(id).classList.add("hidden"));
  $(`${name}Screen`).classList.remove("hidden");
  document.querySelectorAll(".navbtn").forEach(btn => btn.classList.toggle("active", btn.dataset.screen === name));
  if (name === "history") {
    showHistoryPanel("calendar");
    renderCalendar();
  }
}

document.querySelectorAll(".navbtn").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
  } catch (err) {
    showMessage("Email or password is incorrect.");
  }
});

$("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const name = $("registerName").value.trim();
    const email = $("registerEmail").value.trim();
    const cred = await createUserWithEmailAndPassword(auth, email, $("registerPassword").value);
    await updateProfile(cred.user, {displayName:name});
    await setDoc(doc(db,"users",cred.user.uid), {
      displayName:name,
      email:email.toLowerCase(),
      createdAt:serverTimestamp(),
      settings:{weightUnit:"lb",theme:"dark"}
    });
  } catch (err) {
    showMessage(err.code || "Could not create account.");
  }
});

$("resetForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await sendPasswordResetEmail(auth, $("resetEmail").value.trim());
    showMessage("Password reset email sent. Check your inbox.", true);
  } catch (err) {
    showMessage(err.code || "Could not send reset email.");
  }
});

$("logoutBtn").addEventListener("click", async () => {
  if (workout && !confirm("A workout is in progress. Log out and lose unsaved workout data?")) return;
  workout = null;
  activeExercise = null;
  stopTimer();
  await signOut(auth);
});

onAuthStateChanged(auth, async currentUser => {
  user = currentUser;
  if (!currentUser) {
    $("appView").classList.add("hidden");
    $("authView").classList.remove("hidden");
    return;
  }

  let name = currentUser.displayName || "Athlete";
  try {
    const snap = await getDoc(doc(db,"users",currentUser.uid));
    if (snap.exists() && snap.data().displayName) name = snap.data().displayName;
  } catch (_) {}

  $("userName").textContent = name;
  $("profileName").textContent = name;
  $("userEmail").textContent = currentUser.email || "";
  $("profileEmail").textContent = currentUser.email || "";
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  showScreen("home");
  await loadWorkouts();
});

function renderCategories() {
  const grid = $("categoryGrid");
  grid.innerHTML = "";
  for (const [category, items] of Object.entries(EXERCISES)) {
    const btn = document.createElement("button");
    btn.className = "category";
    btn.innerHTML = `<strong>${category}</strong><span>${items.length} exercises</span>`;
    btn.addEventListener("click", () => openCategory(category));
    grid.appendChild(btn);
  }
}

function showCategoryView() {
  $("categoryView").classList.remove("hidden");
  $("exerciseView").classList.add("hidden");
  $("activeView").classList.add("hidden");
  $("workoutTop").classList.toggle("hidden", !workout);
  if (workout) {
    $("workoutStatus").textContent = `${workout.exercises.length} exercise${workout.exercises.length === 1 ? "" : "s"} completed`;
  }
  renderCategories();
}

$("startWorkoutBtn").addEventListener("click", () => {
  showScreen("workout");
  showCategoryView();
});

function openCategory(category) {
  $("categoryView").classList.add("hidden");
  $("exerciseView").classList.remove("hidden");
  $("activeView").classList.add("hidden");
  $("categoryTitle").textContent = category;
  const grid = $("exerciseGrid");
  grid.innerHTML = "";

  EXERCISES[category].forEach(item => {
    const btn = document.createElement("button");
    btn.className = "exercise";
    btn.innerHTML = `<strong>${item.name}</strong><span>${category} • ${item.type}${item.independent ? " • Independent arms" : ""}</span>`;
    btn.addEventListener("click", () => startExercise(category, item));
    grid.appendChild(btn);
  });
}

$("backBtn").addEventListener("click", showCategoryView);

function startExercise(category, item) {
  if (!workout) {
    workout = {startedAt:new Date(), exercises:[]};
    startTimer();
  }

  activeExercise = {
    category,
    name:item.name,
    type:item.type,
    independent:Boolean(item.independent),
    weightMode:item.independent ? "perArm" : "total",
    sets:[
      {weight:"", reps:"8", done:false},
      {weight:"", reps:"8", done:false},
      {weight:"", reps:"8", done:false}
    ]
  };
  renderActiveExercise();
}

function renderActiveExercise() {
  $("categoryView").classList.add("hidden");
  $("exerciseView").classList.add("hidden");
  $("activeView").classList.remove("hidden");

  $("activeExerciseMeta").textContent = `${activeExercise.category.toUpperCase()} • ${activeExercise.type}`;
  $("activeExerciseName").textContent = activeExercise.name;
  $("weightModeWrap").classList.toggle("hidden", !activeExercise.independent);
  $("perArmBtn").classList.toggle("active", activeExercise.weightMode === "perArm");
  $("totalBtn").classList.toggle("active", activeExercise.weightMode === "total");
  renderSets();
}

$("perArmBtn").addEventListener("click", () => {
  activeExercise.weightMode = "perArm";
  renderActiveExercise();
});

$("totalBtn").addEventListener("click", () => {
  activeExercise.weightMode = "total";
  renderActiveExercise();
});

function renderSets() {
  const list = $("setList");
  list.innerHTML = "";
  activeExercise.sets.forEach((set, index) => {
    const row = document.createElement("div");
    row.className = "set-row";
    row.innerHTML = `
      <div class="set-num">${index+1}</div>
      <input type="number" min="0" step="2.5" placeholder="${activeExercise.weightMode === "perArm" ? "lb/arm" : "lb"}" value="${set.weight}">
      <input type="number" min="0" step="1" placeholder="reps" value="${set.reps}">
      <button class="check ${set.done ? "done" : ""}" type="button">${set.done ? "✓" : "○"}</button>
    `;
    const inputs = row.querySelectorAll("input");
    inputs[0].addEventListener("input", e => set.weight = e.target.value);
    inputs[1].addEventListener("input", e => set.reps = e.target.value);
    row.querySelector(".check").addEventListener("click", () => {
      set.done = !set.done;
      renderSets();
    });
    list.appendChild(row);
  });
}

$("addSetBtn").addEventListener("click", () => {
  const last = activeExercise.sets[activeExercise.sets.length-1] || {weight:"", reps:"8"};
  activeExercise.sets.push({weight:last.weight, reps:last.reps || "8", done:false});
  renderSets();
});

$("removeCurrentExerciseBtn").addEventListener("click", () => {
  activeExercise = null;
  showCategoryView();
});

$("finishThisExerciseBtn").addEventListener("click", () => {
  const enteredSets = activeExercise.sets.filter(s => Number(s.weight || 0) > 0 || Number(s.reps || 0) > 0);
  if (!enteredSets.length) {
    showToast("Enter at least one set first.", "error");
    return;
  }

  workout.exercises.push({
    ...activeExercise,
    completed:true,
    sets:enteredSets.map(s => ({
      weight:Number(s.weight || 0),
      reps:Number(s.reps || 0),
      done:Boolean(s.done)
    }))
  });
  activeExercise = null;
  showCategoryView();
  showToast("Exercise finished. Choose your next body part or finish the whole workout.", "success");
});

$("finishWholeWorkoutBtn").addEventListener("click", async () => {
  if (!workout || !workout.exercises.length) {
    showToast("Finish at least one exercise first.", "error");
    return;
  }

  const endedAt = new Date();
  try {
    await addDoc(collection(db,"users",user.uid,"workouts"), {
      startedAt:workout.startedAt,
      endedAt,
      createdAt:serverTimestamp(),
      durationSeconds:Math.max(1, Math.round((endedAt - workout.startedAt)/1000)),
      exerciseCount:workout.exercises.length,
      exercises:workout.exercises
    });
    workout = null;
    activeExercise = null;
    stopTimer();
    await loadWorkouts();
    showScreen("home");
    showToast("Workout saved to your cloud account.", "success");
  } catch (err) {
    console.error(err);
    showToast("Could not save workout.", "error");
  }
});

$("cancelWorkoutBtn").addEventListener("click", () => {
  if (!confirm("Cancel the whole workout? Unsaved data will be lost.")) return;
  workout = null;
  activeExercise = null;
  stopTimer();
  showCategoryView();
});

function startTimer() {
  stopTimer();
  timerHandle = setInterval(updateTimer,1000);
  updateTimer();
}

function stopTimer() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = null;
}

function updateTimer() {
  if (!workout) return;
  const seconds = Math.floor((Date.now() - workout.startedAt.getTime())/1000);
  $("timer").textContent = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}

async function loadWorkouts() {
  if (!user) return;
  try {
    const q = query(collection(db,"users",user.uid,"workouts"), orderBy("startedAt","desc"), limit(200));
    const snap = await getDocs(q);
    workoutsCache = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderWorkoutList($("recentList"), workoutsCache.slice(0,5));
    renderWorkoutList($("historyList"), workoutsCache);
    updateMetrics();
    updateProgressMetrics();
    renderCalendar();
  } catch (err) {
    console.error(err);
  }
}

function compactSetText(exercise) {
  const unit = (exercise.weightMode || "total") === "perArm" ? "lb/arm" : "lb";
  return (exercise.sets || []).map(set => {
    const weight = Number(set.weight || 0);
    const reps = Number(set.reps || 0);
    return `${weight} ${unit} × ${reps}`;
  }).join(" • ");
}

function renderWorkoutList(container, list) {
  container.innerHTML = "";
  container.classList.remove("empty");

  if (!list.length) {
    container.classList.add("empty");
    container.textContent = "No workouts saved yet.";
    return;
  }

  list.forEach(w => {
    const d = toDate(w.startedAt);
    const sets = (w.exercises || []).reduce((n, ex) => n + (ex.sets?.length || 0), 0);
    const minutes = Math.max(1, Math.round((w.durationSeconds || 0)/60));
    const details = (w.exercises || []).map(ex => `
      <div class="exercise-summary-row">
        <strong>${ex.name}</strong>
        <div class="set-summary">${compactSetText(ex) || "No set details"}</div>
      </div>
    `).join("");

    const card = document.createElement("article");
    card.className = "workout-card";
    card.innerHTML = `
      <div class="workout-top-line">
        <div>
          <h4>${d ? d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}) : "Workout"}</h4>
          <span class="muted mini">${d ? d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}) : ""}</span>
        </div>
        <span class="pill">${minutes} min</span>
      </div>
      <div class="summary">
        <span class="pill">${w.exercises?.length || 0} exercises</span>
        <span class="pill">${sets} sets</span>
        <span class="pill">Tap to edit</span>
      </div>
      <div class="exercise-summary">${details}</div>
    `;
    card.addEventListener("click", () => openEditWorkout(w));
    container.appendChild(card);
  });
}

function updateMetrics() {
  $("workoutCount").textContent = workoutsCache.length;
  $("streakCount").textContent = calculateStreak(workoutsCache);

  if (workoutsCache.length) {
    const latest = workoutsCache[0];
    const d = toDate(latest.startedAt);
    $("lastWorkoutMetric").textContent = latest.exercises?.length || 0;
    $("lastWorkoutDate").textContent = d ? d.toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "Saved";
  } else {
    $("lastWorkoutMetric").textContent = "—";
    $("lastWorkoutDate").textContent = "No workouts";
  }
}

function updateProgressMetrics() {
  $("progressWorkoutCount").textContent = workoutsCache.length;
  $("progressSetCount").textContent = workoutsCache.reduce((n,w) => n + (w.exercises || []).reduce((m,e) => m + (e.sets?.length || 0),0),0);
  const names = new Set();
  workoutsCache.forEach(w => (w.exercises || []).forEach(e => names.add(e.name)));
  $("progressExerciseCount").textContent = names.size;
}

function calculateStreak(list) {
  if (!list.length) return 0;
  const days = [...new Set(list.map(w => {
    const d = toDate(w.startedAt);
    return d ? new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime() : null;
  }).filter(Boolean))].sort((a,b) => b-a);

  if (!days.length) return 0;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  const oneDay = 86400000;
  if (todayStart - days[0] > oneDay) return 0;

  let streak = 1;
  for (let i=1;i<days.length;i++) {
    const diff = Math.round((days[i-1] - days[i])/oneDay);
    if (diff === 1) streak++;
    else if (diff > 1) break;
  }
  return streak;
}

document.querySelectorAll(".history-tab").forEach(btn => {
  btn.addEventListener("click", () => showHistoryPanel(btn.dataset.history));
});

function showHistoryPanel(name) {
  document.querySelectorAll(".history-tab").forEach(btn => btn.classList.toggle("active",btn.dataset.history === name));
  ["calendarPanel","workoutsPanel","progressPanel"].forEach(id => $(id).classList.add("hidden"));
  $(`${name}Panel`).classList.remove("hidden");
  if (name === "workouts") renderWorkoutList($("historyList"),workoutsCache);
  if (name === "calendar") renderCalendar();
}

$("prevMonthBtn").addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);
  renderCalendar();
});

$("nextMonthBtn").addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);
  renderCalendar();
});

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function renderCalendar() {
  const grid = $("calendarGrid");
  if (!grid) return;

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  $("calendarTitle").textContent = new Date(year,month,1).toLocaleDateString(undefined,{month:"long",year:"numeric"});
  grid.innerHTML = "";

  const map = {};
  workoutsCache.forEach(w => {
    const d = toDate(w.startedAt);
    if (!d) return;
    const key = dateKey(d);
    (map[key] ||= []).push(w);
  });

  const first = new Date(year,month,1);
  const start = new Date(year,month,1-first.getDay());

  for (let i=0;i<42;i++) {
    const d = new Date(start);
    d.setDate(start.getDate()+i);
    const key = dateKey(d);
    const btn = document.createElement("button");
    btn.className = "calendar-day";
    if (d.getMonth() !== month) btn.classList.add("other");
    if (key === dateKey(new Date())) btn.classList.add("today");
    if (map[key]) btn.classList.add("has-workout");
    if (selectedCalendarKey === key) btn.classList.add("selected");
    btn.textContent = d.getDate();
    btn.addEventListener("click", () => {
      selectedCalendarKey = key;
      renderCalendar();
      renderSelectedDay(d,map[key] || []);
    });
    grid.appendChild(btn);
  }
}

function renderSelectedDay(date, list) {
  const panel = $("selectedDayWorkouts");
  panel.innerHTML = `<h3>${date.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</h3>`;
  if (!list.length) {
    panel.innerHTML += `<p class="muted">No workout saved on this day.</p>`;
    return;
  }
  list.forEach(w => {
    const div = document.createElement("div");
    div.className = "exercise-summary";
    div.innerHTML = (w.exercises || []).map(ex => `
      <div class="exercise-summary-row">
        <strong>${ex.name}</strong>
        <div class="set-summary">${compactSetText(ex)}</div>
      </div>
    `).join("");
    div.addEventListener("click", () => openEditWorkout(w));
    panel.appendChild(div);
  });
}

function openEditWorkout(w) {
  editingWorkout = {
    id:w.id,
    startedAtDate:toDate(w.startedAt),
    exercises:(w.exercises || []).map(ex => ({
      ...ex,
      weightMode:ex.weightMode || "total",
      sets:(ex.sets || []).map(set => ({...set}))
    }))
  };

  $("editWorkoutTitle").textContent = editingWorkout.startedAtDate?.toLocaleString() || "Workout";
  $("editWorkoutDateTime").value = toLocalInputValue(editingWorkout.startedAtDate || new Date());
  renderEditExercises();
  $("editModal").classList.remove("hidden");
}

function closeEditModal() {
  $("editModal").classList.add("hidden");
  editingWorkout = null;
}

$("closeEditBtn").addEventListener("click", closeEditModal);
$("editBackdrop").addEventListener("click", closeEditModal);

function renderEditExercises() {
  const list = $("editExerciseList");
  list.innerHTML = "";

  editingWorkout.exercises.forEach((ex,exIndex) => {
    const card = document.createElement("div");
    card.className = "edit-exercise";
    const showMode = ex.independent || ex.type === "MTS";
    card.innerHTML = `
      <h4>${ex.name}</h4>
      ${showMode ? `
        <div class="mode-toggle">
          <button class="mode ${ex.weightMode === "perArm" ? "active" : ""}" data-mode="perArm">Per Arm</button>
          <button class="mode ${ex.weightMode === "total" ? "active" : ""}" data-mode="total">Total / Both Arms</button>
        </div>
      ` : ""}
      <div class="edit-sets"></div>
      <button class="secondary full add-edit-set" type="button">+ Add set</button>
    `;

    card.querySelectorAll("[data-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        ex.weightMode = btn.dataset.mode;
        renderEditExercises();
      });
    });

    const setsWrap = card.querySelector(".edit-sets");
    ex.sets.forEach((set,setIndex) => {
      const row = document.createElement("div");
      row.className = "edit-set-row";
      row.innerHTML = `
        <input type="number" min="0" step="2.5" value="${Number(set.weight || 0)}" aria-label="Weight">
        <input type="number" min="0" step="1" value="${Number(set.reps || 0)}" aria-label="Reps">
        <button class="delete-set" type="button">×</button>
      `;
      const inputs = row.querySelectorAll("input");
      inputs[0].addEventListener("input", e => set.weight = Number(e.target.value || 0));
      inputs[1].addEventListener("input", e => set.reps = Number(e.target.value || 0));
      row.querySelector(".delete-set").addEventListener("click", () => {
        ex.sets.splice(setIndex,1);
        renderEditExercises();
      });
      setsWrap.appendChild(row);
    });

    card.querySelector(".add-edit-set").addEventListener("click", () => {
      ex.sets.push({weight:0,reps:8,done:true});
      renderEditExercises();
    });

    list.appendChild(card);
  });
}

$("saveWorkoutChangesBtn").addEventListener("click", async () => {
  if (!editingWorkout) return;

  try {
    const newStart = new Date($("editWorkoutDateTime").value);
    await updateDoc(doc(db,"users",user.uid,"workouts",editingWorkout.id), {
      startedAt:Timestamp.fromDate(newStart),
      exercises:editingWorkout.exercises,
      exerciseCount:editingWorkout.exercises.length,
      updatedAt:serverTimestamp()
    });
    closeEditModal();
    await loadWorkouts();
    showToast("Workout changes saved.", "success");
  } catch (err) {
    console.error(err);
    showToast("Could not save workout changes.", "error");
  }
});

function toLocalInputValue(d) {
  const adjusted = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return adjusted.toISOString().slice(0,16);
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value.seconds === "number") return new Date(value.seconds*1000);
  return new Date(value);
}

renderCategories();
