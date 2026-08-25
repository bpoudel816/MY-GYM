import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, updateDoc, collection,
  query, orderBy, limit, getDocs, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EXERCISES = {
  Chest:[
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
  Back:[
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
  Shoulders:[
    {name:"Shoulder Press",type:"Selectorized"},
    {name:"Hammer Strength MTS Shoulder Press",type:"MTS",independent:true},
    {name:"Hammer Strength Plate-Loaded Shoulder Press",type:"Plate Loaded",independent:true},
    {name:"Lateral Raise",type:"Selectorized"},
    {name:"Rear Delt Fly",type:"Selectorized"},
    {name:"Cable Lateral Raise",type:"Cable",independent:true},
    {name:"Front Raise",type:"Cable",independent:true}
  ],
  Arms:[
    {name:"Biceps Curl",type:"Selectorized"},
    {name:"Preacher Curl",type:"Machine"},
    {name:"Cable Curl",type:"Cable"},
    {name:"Hammer Strength Biceps Curl",type:"Plate Loaded",independent:true},
    {name:"Triceps Press",type:"Selectorized"},
    {name:"Triceps Pushdown",type:"Cable"},
    {name:"Dip Machine",type:"Selectorized"},
    {name:"Hammer Strength Triceps Extension",type:"Plate Loaded",independent:true}
  ],
  Legs:[
    {name:"Leg Press",type:"Selectorized"},
    {name:"45° Leg Press",type:"Plate Loaded"},
    {name:"Hack Squat",type:"Plate Loaded"},
    {name:"Hammer Strength MTS Leg Press",type:"MTS",independent:true},
    {name:"Hammer Strength Plate-Loaded Linear Leg Press",type:"Plate Loaded"},
    {name:"Leg Extension",type:"Selectorized"},
    {name:"Seated Leg Curl",type:"Selectorized"},
    {name:"Lying Leg Curl",type:"Selectorized"},
    {name:"Hip Abductor",type:"Selectorized"},
    {name:"Hip Adductor",type:"Selectorized"},
    {name:"Calf Raise",type:"Machine"},
    {name:"Glute Drive / Hip Thrust",type:"Machine"}
  ],
  Core:[
    {name:"Abdominal Crunch",type:"Selectorized"},
    {name:"Torso Rotation",type:"Selectorized"},
    {name:"Cable Crunch",type:"Cable"},
    {name:"Hanging Knee Raise",type:"Bodyweight"},
    {name:"Plank",type:"Bodyweight"}
  ],
  Cardio:[
    {name:"Treadmill",type:"Cardio"},
    {name:"Stair Climber",type:"Cardio"},
    {name:"Elliptical",type:"Cardio"},
    {name:"Stationary Bike",type:"Cardio"},
    {name:"Recumbent Bike",type:"Cardio"},
    {name:"Rowing Machine",type:"Cardio"}
  ]
};

const CATEGORY_ICONS={Chest:"◫",Back:"↔",Shoulders:"△",Arms:"⌁",Legs:"⌄",Core:"◎",Cardio:"♥"};

let currentUser=null,currentWorkout=null,currentExercise=null,timerHandle=null;
let workoutsCache=[],calendarCursor=new Date(),selectedCalendarDate=null,editingWorkout=null;
const $=id=>document.getElementById(id);

function toast(text,type=""){const el=$("toast");el.textContent=text;el.className=`toast ${type}`;clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add("hidden"),3000);el.classList.remove("hidden")}
function authMsg(text,success=false){$("authMessage").textContent=text;$("authMessage").className=success?"message success":"message"}
function switchAuth(panel){["loginPanel","registerPanel","resetPanel"].forEach(id=>$(id).classList.remove("active"));$(panel).classList.add("active");$("loginTab").classList.toggle("active",panel==="loginPanel");$("registerTab").classList.toggle("active",panel==="registerPanel");authMsg("")}

$("loginTab").onclick=()=>switchAuth("loginPanel");
$("registerTab").onclick=()=>switchAuth("registerPanel");
$("forgotPasswordBtn").onclick=()=>{$("resetEmail").value=$("loginEmail").value||"";switchAuth("resetPanel")};
$("backToLoginBtn").onclick=()=>switchAuth("loginPanel");

$("registerForm").onsubmit=async e=>{e.preventDefault();try{const name=$("registerName").value.trim(),email=$("registerEmail").value.trim();const c=await createUserWithEmailAndPassword(auth,email,$("registerPassword").value);await updateProfile(c.user,{displayName:name});await setDoc(doc(db,"users",c.user.uid),{displayName:name,email:email.toLowerCase(),createdAt:serverTimestamp(),settings:{weightUnit:"lb",theme:"dark"}})}catch(err){authMsg(readableError(err.code))}};
$("loginForm").onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value)}catch(err){authMsg(readableError(err.code))}};
$("resetForm").onsubmit=async e=>{e.preventDefault();try{await sendPasswordResetEmail(auth,$("resetEmail").value.trim());authMsg("Password reset email sent. Check your inbox.",true)}catch(err){authMsg(readableError(err.code))}};
$("logoutBtn").onclick=async()=>{if(currentWorkout&&!confirm("Workout in progress. Log out and lose unsaved workout?"))return;currentWorkout=null;currentExercise=null;await signOut(auth)};

onAuthStateChanged(auth,async user=>{currentUser=user;if(!user){stopTimer();$("appView").classList.add("hidden");$("authView").classList.remove("hidden");switchAuth("loginPanel");return}let name=user.displayName||"Athlete";try{const s=await getDoc(doc(db,"users",user.uid));if(s.exists()&&s.data().displayName)name=s.data().displayName}catch(_){}$("userName").textContent=name;$("profileName").textContent=name;$("userEmail").textContent=user.email||"";$("profileEmail").textContent=user.email||"";$("authView").classList.add("hidden");$("appView").classList.remove("hidden");showScreen("home");await loadWorkouts()});

document.querySelectorAll(".nav-btn").forEach(btn=>btn.onclick=()=>showScreen(btn.dataset.view));
$("brandHome").onclick=e=>{e.preventDefault();if(currentUser)showScreen("home")};

function showScreen(name){["homeScreen","workoutScreen","historyScreen","profileScreen"].forEach(id=>$(id).classList.add("hidden"));$(`${name}Screen`).classList.remove("hidden");document.querySelectorAll(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===name));if(name==="workout"&&!currentWorkout)showWorkoutLanding();if(name==="history"){showHistoryTab("calendar");renderCalendar();}}
$("startWorkoutBtn").onclick=()=>{showScreen("workout");showWorkoutLanding()};

function renderCategories(){$("categoryGrid").innerHTML="";Object.keys(EXERCISES).forEach(cat=>{const b=document.createElement("button");b.className="category-card";b.innerHTML=`<div class="category-icon">${CATEGORY_ICONS[cat]}</div><strong>${cat}</strong><small>${EXERCISES[cat].length} exercises</small>`;b.onclick=()=>openCategory(cat);$("categoryGrid").appendChild(b)})}
function showWorkoutLanding(){$("workoutLanding").classList.remove("hidden");$("exercisePicker").classList.add("hidden");$("activeExercise").classList.add("hidden");$("activeWorkoutBar").classList.toggle("hidden",!currentWorkout);if(currentWorkout)$("wholeWorkoutStatus").textContent=`${currentWorkout.exercises.length} exercise${currentWorkout.exercises.length===1?"":"s"} completed`;renderCategories()}
function openCategory(cat){$("workoutLanding").classList.add("hidden");$("exercisePicker").classList.remove("hidden");$("activeExercise").classList.add("hidden");$("selectedCategoryLabel").textContent=cat.toUpperCase();$("exerciseGrid").innerHTML="";EXERCISES[cat].forEach(item=>{const b=document.createElement("button");b.className="exercise-card";b.innerHTML=`<strong>${item.name}</strong><span>${cat} • ${item.type}${item.independent?" • Independent arms":""}</span>`;b.onclick=()=>startExercise(cat,item);$("exerciseGrid").appendChild(b)})}
$("backToCategoriesBtn").onclick=showWorkoutLanding;

function startExercise(category,item){
  if(!currentWorkout){currentWorkout={startedAt:new Date(),exercises:[]};startTimer()}
  currentExercise={category,name:item.name,type:item.type,independent:Boolean(item.independent),weightMode:item.independent?"perArm":"total",sets:[{weight:"",reps:"8",done:false},{weight:"",reps:"8",done:false},{weight:"",reps:"8",done:false}]};
  renderActiveExercise();
}

function renderActiveExercise(){
  $("workoutLanding").classList.add("hidden");$("exercisePicker").classList.add("hidden");$("activeExercise").classList.remove("hidden");
  $("activeExerciseMeta").textContent=`${currentExercise.category.toUpperCase()} • ${currentExercise.type}`;
  $("activeExerciseName").textContent=currentExercise.name;
  $("weightModeWrap").classList.toggle("hidden",!currentExercise.independent);
  $("perArmBtn").classList.toggle("active",currentExercise.weightMode==="perArm");
  $("totalBtn").classList.toggle("active",currentExercise.weightMode==="total");
  renderCurrentSets();
}
$("perArmBtn").onclick=()=>{currentExercise.weightMode="perArm";renderActiveExercise()};
$("totalBtn").onclick=()=>{currentExercise.weightMode="total";renderActiveExercise()};

function renderCurrentSets(){
  const wrap=$("currentSets");wrap.innerHTML="";
  currentExercise.sets.forEach((s,i)=>{const row=document.createElement("div");row.className="set-row";row.innerHTML=`<div class="set-number">${i+1}</div><input type="number" min="0" step="2.5" placeholder="${currentExercise.weightMode==="perArm"?"lb/arm":"lb"}" value="${s.weight}"><input type="number" min="0" step="1" placeholder="reps" value="${s.reps}"><button class="set-check ${s.done?"done":""}" type="button">${s.done?"✓":"○"}</button>`;const inputs=row.querySelectorAll("input");inputs[0].oninput=e=>s.weight=e.target.value;inputs[1].oninput=e=>s.reps=e.target.value;row.querySelector(".set-check").onclick=()=>{s.done=!s.done;renderCurrentSets()};wrap.appendChild(row)})
}
$("addSetBtn").onclick=()=>{const last=currentExercise.sets[currentExercise.sets.length-1]||{weight:"",reps:"8"};currentExercise.sets.push({weight:last.weight,reps:last.reps||"8",done:false});renderCurrentSets()};
$("removeCurrentExerciseBtn").onclick=()=>{currentExercise=null;showWorkoutLanding()};
$("finishThisExerciseBtn").onclick=()=>{
  const cleanSets=currentExercise.sets.filter(s=>Number(s.weight||0)>0||Number(s.reps||0)>0);
  if(!cleanSets.length){toast("Enter at least one set before finishing this exercise.","error");return}
  currentWorkout.exercises.push({...currentExercise,completed:true,sets:cleanSets});
  currentExercise=null;
  showWorkoutLanding();
  toast("Exercise completed. Choose the next body part or finish the whole workout.","success");
};

$("finishWholeWorkoutBtn").onclick=finishWholeWorkout;
$("cancelWorkoutBtn").onclick=()=>{if(confirm("Cancel the whole workout? Unsaved data will be lost.")){currentWorkout=null;currentExercise=null;stopTimer();showWorkoutLanding()}};

async function finishWholeWorkout(){
  if(!currentWorkout||!currentWorkout.exercises.length){toast("Finish at least one exercise first.","error");return}
  const ended=new Date(),durationSeconds=Math.max(1,Math.round((ended-currentWorkout.startedAt)/1000));
  const exercises=currentWorkout.exercises.map(ex=>({...ex,sets:ex.sets.map(s=>({weight:Number(s.weight||0),reps:Number(s.reps||0),done:Boolean(s.done)}))}));
  try{
    await addDoc(collection(db,"users",currentUser.uid,"workouts"),{startedAt:currentWorkout.startedAt,endedAt:ended,createdAt:serverTimestamp(),durationSeconds,exerciseCount:exercises.length,exercises});
    currentWorkout=null;currentExercise=null;stopTimer();await loadWorkouts();showScreen("home");toast("Workout saved to your cloud account.","success");
  }catch(err){console.error(err);toast(`Could not save workout (${err.code||"unknown"}).`,"error")}
}

function startTimer(){stopTimer();timerHandle=setInterval(updateTimer,1000);updateTimer()}
function stopTimer(){if(timerHandle)clearInterval(timerHandle);timerHandle=null}
function updateTimer(){if(!currentWorkout)return;const s=Math.floor((Date.now()-currentWorkout.startedAt.getTime())/1000);$("workoutTimer").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

async function loadWorkouts(){
  if(!currentUser)return;
  try{
    const q=query(collection(db,"users",currentUser.uid,"workouts"),orderBy("startedAt","desc"),limit(200));
    const snap=await getDocs(q);workoutsCache=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderWorkoutList($("recentWorkoutList"),workoutsCache.slice(0,5));
    renderWorkoutList($("historyList"),workoutsCache);
    updateMetrics();updateProgressSummary();renderCalendar();
  }catch(err){console.error(err);$("recentWorkoutList").textContent="Could not load workouts yet.";$("historyList").textContent="Could not load workouts yet."}
}

function compactSetText(ex){
  return (ex.sets||[]).map(s=>{
    const w=Number(s.weight||0),r=Number(s.reps||0);
    const unit=(ex.weightMode||"total")==="perArm"?"lb/arm":"lb";
    return `${w} ${unit} × ${r}`;
  }).join(" • ");
}

function renderWorkoutList(container,workouts){
  container.innerHTML="";container.classList.remove("empty-state");
  if(!workouts.length){container.classList.add("empty-state");container.textContent="No workouts saved yet.";return}
  workouts.forEach(w=>{
    const d=toDate(w.startedAt),totalSets=(w.exercises||[]).reduce((n,e)=>n+(e.sets?.length||0),0),mins=Math.max(1,Math.round((w.durationSeconds||0)/60));
    const card=document.createElement("article");card.className="workout-card";
    const details=(w.exercises||[]).map(ex=>`<div class="compact-exercise-row"><strong>${ex.name}</strong><div class="compact-sets">${compactSetText(ex)||"No set details"}</div></div>`).join("");
    card.innerHTML=`<div class="workout-card-top"><div><h4>${d?d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Workout"}</h4><time>${d?d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}</time></div><span class="summary-pill">${mins} min</span></div><div class="workout-summary"><span class="summary-pill">${w.exercises?.length||0} exercises</span><span class="summary-pill">${totalSets} sets</span><span class="summary-pill">Tap to edit</span></div><div class="compact-exercises">${details}</div>`;
    card.onclick=()=>openEditWorkout(w);
    container.appendChild(card);
  });
}

function updateMetrics(){
  $("workoutCount").textContent=workoutsCache.length;
  $("streakCount").textContent=calculateStreak(workoutsCache);
  if(workoutsCache.length){const w=workoutsCache[0],d=toDate(w.startedAt);$("lastWorkoutMetric").textContent=w.exercises?.length||0;$("lastWorkoutDate").textContent=d?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"Saved"}else{$("lastWorkoutMetric").textContent="—";$("lastWorkoutDate").textContent="No workouts yet"}
}
function updateProgressSummary(){
  $("progressTotalWorkouts").textContent=workoutsCache.length;
  $("progressTotalSets").textContent=workoutsCache.reduce((n,w)=>n+(w.exercises||[]).reduce((m,e)=>m+(e.sets?.length||0),0),0);
  const names=new Set();workoutsCache.forEach(w=>(w.exercises||[]).forEach(e=>names.add(e.name)));$("progressExerciseCount").textContent=names.size;
}
function calculateStreak(workouts){if(!workouts.length)return 0;const days=[...new Set(workouts.map(w=>{const d=toDate(w.startedAt);return d?new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime():null}).filter(Boolean))].sort((a,b)=>b-a);if(!days.length)return 0;const one=86400000,t=new Date(),today=new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime();if(today-days[0]>one)return 0;let s=1;for(let i=1;i<days.length;i++){const diff=Math.round((days[i-1]-days[i])/one);if(diff===1)s++;else if(diff>1)break}return s}

document.querySelectorAll(".history-tab").forEach(btn=>btn.onclick=()=>showHistoryTab(btn.dataset.historyTab));
function showHistoryTab(tab){
  document.querySelectorAll(".history-tab").forEach(b=>b.classList.toggle("active",b.dataset.historyTab===tab));
  ["calendarTab","workoutsTab","progressTab"].forEach(id=>$(id).classList.add("hidden"));
  $(`${tab}Tab`).classList.remove("hidden");
  if(tab==="calendar")renderCalendar();
  if(tab==="workouts")renderWorkoutList($("historyList"),workoutsCache);
}

$("prevMonthBtn").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()};
$("nextMonthBtn").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()};

function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function renderCalendar(){
  if(!$("calendarGrid"))return;
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  $("calendarTitle").textContent=new Date(y,m,1).toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const grid=$("calendarGrid");grid.innerHTML="";
  const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
  const workoutMap={};workoutsCache.forEach(w=>{const d=toDate(w.startedAt);if(d){const k=dateKey(d);(workoutMap[k] ||= []).push(w)}});
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);const k=dateKey(d),b=document.createElement("button");b.className="calendar-day";if(d.getMonth()!==m)b.classList.add("other");if(k===dateKey(new Date()))b.classList.add("today");if(workoutMap[k])b.classList.add("has-workout");if(selectedCalendarDate===k)b.classList.add("selected");b.textContent=d.getDate();b.onclick=()=>{selectedCalendarDate=k;renderCalendar();renderSelectedDay(workoutMap[k]||[],d)};grid.appendChild(b)
  }
}
function renderSelectedDay(workouts,date){
  const panel=$("selectedDayWorkouts");panel.innerHTML="";panel.classList.remove("empty-state");
  const h=document.createElement("h3");h.textContent=date.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});panel.appendChild(h);
  if(!workouts.length){const p=document.createElement("p");p.className="muted";p.textContent="No workout saved on this day.";panel.appendChild(p);return}
  workouts.forEach(w=>{const div=document.createElement("div");div.className="compact-exercise-row";div.innerHTML=(w.exercises||[]).map(ex=>`<strong>${ex.name}</strong><div class="compact-sets">${compactSetText(ex)}</div>`).join("");div.onclick=()=>openEditWorkout(w);panel.appendChild(div)})
}

function openEditWorkout(w){
  editingWorkout=structuredCloneSafe(w);
  editingWorkout.id=w.id;
  editingWorkout.startedAtDate=toDate(w.startedAt);
  $("editWorkoutTitle").textContent=editingWorkout.startedAtDate?.toLocaleString()||"Workout";
  $("editWorkoutDateTime").value=toLocalInputValue(editingWorkout.startedAtDate||new Date());
  renderEditExercises();
  $("editModal").classList.remove("hidden");
}
$("closeEditBtn").onclick=closeEdit;$("editBackdrop").onclick=closeEdit;
function closeEdit(){$("editModal").classList.add("hidden");editingWorkout=null}

function renderEditExercises(){
  const wrap=$("editExerciseList");wrap.innerHTML="";
  (editingWorkout.exercises||[]).forEach((ex,ei)=>{
    ex.weightMode=ex.weightMode||"total";
    const card=document.createElement("article");card.className="edit-exercise-card";
    card.innerHTML=`<h4>${ex.name}</h4>${ex.independent||ex.type==="MTS"?`<div class="edit-weight-mode"><div class="mode-toggle"><button class="mode-btn ${ex.weightMode==="perArm"?"active":""}" data-mode="perArm">Per Arm</button><button class="mode-btn ${ex.weightMode==="total"?"active":""}" data-mode="total">Total / Both Arms</button></div></div>`:""}<div class="edit-sets"></div><button class="add-set-btn edit-add-set" type="button">+ Add set</button>`;
    card.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{ex.weightMode=btn.dataset.mode;renderEditExercises()});
    const setsWrap=card.querySelector(".edit-sets");
    (ex.sets||[]).forEach((s,si)=>{const row=document.createElement("div");row.className="edit-set-row";row.innerHTML=`<input type="number" min="0" step="2.5" value="${Number(s.weight||0)}" aria-label="Weight"><input type="number" min="0" step="1" value="${Number(s.reps||0)}" aria-label="Reps"><button class="delete-set-btn" type="button">×</button>`;const ins=row.querySelectorAll("input");ins[0].oninput=e=>s.weight=Number(e.target.value||0);ins[1].oninput=e=>s.reps=Number(e.target.value||0);row.querySelector(".delete-set-btn").onclick=()=>{ex.sets.splice(si,1);renderEditExercises()};setsWrap.appendChild(row)});
    card.querySelector(".edit-add-set").onclick=()=>{ex.sets.push({weight:0,reps:8,done:true});renderEditExercises()};
    wrap.appendChild(card)
  });
}

$("saveWorkoutChangesBtn").onclick=async()=>{
  if(!editingWorkout)return;
  try{
    const newStart=new Date($("editWorkoutDateTime").value);
    await updateDoc(doc(db,"users",currentUser.uid,"workouts",editingWorkout.id),{
      startedAt:Timestamp.fromDate(newStart),
      exercises:editingWorkout.exercises,
      exerciseCount:editingWorkout.exercises.length,
      updatedAt:serverTimestamp()
    });
    closeEdit();await loadWorkouts();toast("Workout changes saved.","success");
  }catch(err){console.error(err);toast(`Could not save changes (${err.code||"unknown"}).`,"error")}
}

function structuredCloneSafe(w){
  return {
    ...w,
    exercises:(w.exercises||[]).map(ex=>({
      ...ex,
      sets:(ex.sets||[]).map(s=>({...s}))
    }))
  };
}
function toLocalInputValue(d){const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,16)}
function toDate(v){if(!v)return null;if(typeof v.toDate==="function")return v.toDate();if(v instanceof Date)return v;if(typeof v.seconds==="number")return new Date(v.seconds*1000);if(v._seconds)return new Date(v._seconds*1000);return new Date(v)}
function readableError(code=""){const m={"auth/email-already-in-use":"That email already has a MY GYM account.","auth/invalid-email":"Please enter a valid email address.","auth/weak-password":"Use a stronger password with at least 6 characters.","auth/invalid-credential":"Email or password is incorrect.","auth/user-not-found":"No account was found for that email.","auth/too-many-requests":"Too many attempts. Try again later.","auth/network-request-failed":"Network problem. Check your internet connection."};return m[code]||`Something went wrong (${code||"unknown error"}).`}

renderCategories();
