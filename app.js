import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, collection,
  query, orderBy, limit, getDocs, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EXERCISES = {
  Chest: [
    {name:"Chest Press", type:"Selectorized"},
    {name:"Incline Chest Press", type:"Selectorized"},
    {name:"Decline Chest Press", type:"Selectorized"},
    {name:"Hammer Strength MTS Chest Press", type:"MTS"},
    {name:"Hammer Strength MTS Incline Press", type:"MTS"},
    {name:"Hammer Strength MTS Decline Press", type:"MTS"},
    {name:"Hammer Strength Plate-Loaded Chest Press", type:"Plate Loaded"},
    {name:"Hammer Strength Plate-Loaded Incline Press", type:"Plate Loaded"},
    {name:"Pec Deck / Chest Fly", type:"Selectorized"},
    {name:"Cable Fly", type:"Cable"},
    {name:"Smith Machine Bench Press", type:"Smith"},
    {name:"Dumbbell Bench Press", type:"Free Weight"}
  ],
  Back: [
    {name:"Lat Pulldown", type:"Selectorized"},
    {name:"Seated Row", type:"Selectorized"},
    {name:"High Row", type:"Selectorized"},
    {name:"Hammer Strength MTS High Row", type:"MTS"},
    {name:"Hammer Strength MTS Front Pulldown", type:"MTS"},
    {name:"Hammer Strength MTS Iso-Lateral Row", type:"MTS"},
    {name:"Hammer Strength Plate-Loaded High Row", type:"Plate Loaded"},
    {name:"Hammer Strength Plate-Loaded Low Row", type:"Plate Loaded"},
    {name:"Assisted Pull-Up", type:"Selectorized"},
    {name:"Cable Row", type:"Cable"},
    {name:"Straight-Arm Pulldown", type:"Cable"},
    {name:"Back Extension", type:"Machine"}
  ],
  Shoulders: [
    {name:"Shoulder Press", type:"Selectorized"},
    {name:"Hammer Strength MTS Shoulder Press", type:"MTS"},
    {name:"Hammer Strength Plate-Loaded Shoulder Press", type:"Plate Loaded"},
    {name:"Lateral Raise", type:"Selectorized"},
    {name:"Rear Delt Fly", type:"Selectorized"},
    {name:"Cable Lateral Raise", type:"Cable"},
    {name:"Front Raise", type:"Cable"}
  ],
  Arms: [
    {name:"Biceps Curl", type:"Selectorized"},
    {name:"Preacher Curl", type:"Machine"},
    {name:"Cable Curl", type:"Cable"},
    {name:"Hammer Strength Biceps Curl", type:"Plate Loaded"},
    {name:"Triceps Press", type:"Selectorized"},
    {name:"Triceps Pushdown", type:"Cable"},
    {name:"Dip Machine", type:"Selectorized"},
    {name:"Hammer Strength Triceps Extension", type:"Plate Loaded"}
  ],
  Legs: [
    {name:"Leg Press", type:"Selectorized"},
    {name:"45° Leg Press", type:"Plate Loaded"},
    {name:"Hack Squat", type:"Plate Loaded"},
    {name:"Hammer Strength MTS Leg Press", type:"MTS"},
    {name:"Hammer Strength Plate-Loaded Linear Leg Press", type:"Plate Loaded"},
    {name:"Leg Extension", type:"Selectorized"},
    {name:"Seated Leg Curl", type:"Selectorized"},
    {name:"Lying Leg Curl", type:"Selectorized"},
    {name:"Standing Leg Curl", type:"Selectorized"},
    {name:"Hip Abductor", type:"Selectorized"},
    {name:"Hip Adductor", type:"Selectorized"},
    {name:"Seated Calf Raise", type:"Machine"},
    {name:"Standing Calf Raise", type:"Machine"},
    {name:"Glute Drive / Hip Thrust", type:"Machine"}
  ],
  Core: [
    {name:"Abdominal Crunch", type:"Selectorized"},
    {name:"Torso Rotation", type:"Selectorized"},
    {name:"Cable Crunch", type:"Cable"},
    {name:"Hanging Knee Raise", type:"Bodyweight"},
    {name:"Plank", type:"Bodyweight"}
  ],
  Cardio: [
    {name:"Treadmill", type:"Cardio"},
    {name:"Stair Climber", type:"Cardio"},
    {name:"Elliptical", type:"Cardio"},
    {name:"Stationary Bike", type:"Cardio"},
    {name:"Recumbent Bike", type:"Cardio"},
    {name:"Rowing Machine", type:"Cardio"}
  ]
};

const CATEGORY_ICONS={Chest:"◫",Back:"↔",Shoulders:"△",Arms:"⌁",Legs:"⌄",Core:"◎",Cardio:"♥"};

let currentUser=null,currentWorkout=null,timerHandle=null,editingWorkout=null;
const $=id=>document.getElementById(id);

function showToast(text,type=""){const e=$("toast");e.textContent=text;e.className=`toast ${type}`;clearTimeout(showToast.t);showToast.t=setTimeout(()=>e.classList.add("hidden"),3200);e.classList.remove("hidden")}
function showAuthMessage(text,success=false){$("authMessage").textContent=text;$("authMessage").className=success?"message success":"message"}
function switchAuthPanel(panel){["loginPanel","registerPanel","resetPanel"].forEach(id=>$(id).classList.remove("active"));$(panel).classList.add("active");$("loginTab").classList.toggle("active",panel==="loginPanel");$("registerTab").classList.toggle("active",panel==="registerPanel");showAuthMessage("")}

$("loginTab").onclick=()=>switchAuthPanel("loginPanel");
$("registerTab").onclick=()=>switchAuthPanel("registerPanel");
$("forgotPasswordBtn").onclick=()=>{$("resetEmail").value=$("loginEmail").value||"";switchAuthPanel("resetPanel")};
$("backToLoginBtn").onclick=()=>switchAuthPanel("loginPanel");

$("registerForm").addEventListener("submit",async e=>{e.preventDefault();try{const name=$("registerName").value.trim(),email=$("registerEmail").value.trim(),password=$("registerPassword").value;const c=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(c.user,{displayName:name});await setDoc(doc(db,"users",c.user.uid),{displayName:name,email:email.toLowerCase(),createdAt:serverTimestamp(),settings:{weightUnit:"lb",theme:"dark"}})}catch(err){showAuthMessage(readableError(err.code))}});
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value)}catch(err){showAuthMessage(readableError(err.code))}});
$("resetForm").addEventListener("submit",async e=>{e.preventDefault();try{await sendPasswordResetEmail(auth,$("resetEmail").value.trim());showAuthMessage("Password reset email sent. Check your inbox.",true)}catch(err){showAuthMessage(readableError(err.code))}});
$("logoutBtn").onclick=async()=>{if(currentWorkout&&!confirm("A workout is in progress. Log out anyway? Unsaved workout data will be lost."))return;currentWorkout=null;await signOut(auth)};

onAuthStateChanged(auth,async user=>{currentUser=user;if(!user){stopTimer();$("appView").classList.add("hidden");$("authView").classList.remove("hidden");switchAuthPanel("loginPanel");return}let name=user.displayName||"Athlete";try{const s=await getDoc(doc(db,"users",user.uid));if(s.exists()&&s.data().displayName)name=s.data().displayName}catch(_){}$("userName").textContent=name;$("profileName").textContent=name;$("userEmail").textContent=user.email||"";$("profileEmail").textContent=user.email||"";$("authView").classList.add("hidden");$("appView").classList.remove("hidden");showScreen("home");await loadWorkouts()});

document.querySelectorAll(".nav-btn").forEach(btn=>btn.onclick=()=>showScreen(btn.dataset.view));
$("brandHome").onclick=e=>{e.preventDefault();if(currentUser)showScreen("home")};

function showScreen(name){["homeScreen","workoutScreen","historyScreen","profileScreen"].forEach(id=>$(id).classList.add("hidden"));$(`${name}Screen`).classList.remove("hidden");document.querySelectorAll(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===name));if(name==="workout"&&!currentWorkout)showWorkoutLanding();if(name==="history")loadWorkouts()}
function showWorkoutLanding(){$("workoutLanding").classList.remove("hidden");$("exercisePicker").classList.add("hidden");$("activeWorkout").classList.add("hidden");renderCategories();renderActiveLandingControls()}
function renderActiveLandingControls(){let old=$("activeLandingControls");if(old)old.remove();if(!currentWorkout)return;const wrap=document.createElement("div");wrap.id="activeLandingControls";wrap.className="active-landing-controls";wrap.innerHTML=`<div><strong>Workout in progress</strong><span>${currentWorkout.exercises.length} exercise${currentWorkout.exercises.length===1?"":"s"} added</span></div><button id="landingFinishWhole" class="finish-workout-top" type="button">Finish Whole Workout</button>`;$("workoutLanding").prepend(wrap);$("landingFinishWhole").onclick=finishWorkout}
$("startWorkoutBtn").onclick=()=>{showScreen("workout");showWorkoutLanding()};

function renderCategories(){$("categoryGrid").innerHTML="";Object.keys(EXERCISES).forEach(cat=>{const b=document.createElement("button");b.className="category-card";b.innerHTML=`<div class="category-icon">${CATEGORY_ICONS[cat]}</div><strong>${cat}</strong><small>${EXERCISES[cat].length} exercises</small>`;b.onclick=()=>openCategory(cat);$("categoryGrid").appendChild(b)})}
function openCategory(cat){$("workoutLanding").classList.add("hidden");$("activeWorkout").classList.add("hidden");$("exercisePicker").classList.remove("hidden");$("selectedCategoryLabel").textContent=cat.toUpperCase();renderExercises(cat)}
$("backToCategoriesBtn").onclick=showWorkoutLanding;

function machineMarkup(cat,type){
  const cls=cat.toLowerCase();
  return `<div class="machine-art ${cls}">
    <span class="frame-a"></span><span class="frame-b"></span><span class="seat"></span><span class="plate"></span>
    <span class="machine-badge">${type}</span>
  </div>`;
}

function renderExercises(cat){$("exerciseGrid").innerHTML="";EXERCISES[cat].forEach(item=>{const b=document.createElement("button");b.className="exercise-card";b.innerHTML=`${machineMarkup(cat,item.type)}<div><strong>${item.name}</strong><span>${cat} • ${item.type}</span></div>`;b.onclick=()=>addExerciseToWorkout(cat,item);$("exerciseGrid").appendChild(b)})}

function addExerciseToWorkout(category,item){if(!currentWorkout){currentWorkout={startedAt:new Date(),exercises:[]};startTimer()}if(!currentWorkout.exercises.find(x=>x.name===item.name)){currentWorkout.exercises.push({category,name:item.name,type:item.type,completed:false,sets:[{weight:"",reps:"8",done:false},{weight:"",reps:"8",done:false},{weight:"",reps:"8",done:false}]})}showActiveWorkout()}
function showActiveWorkout(){$("workoutLanding").classList.add("hidden");$("exercisePicker").classList.add("hidden");$("activeWorkout").classList.remove("hidden");renderSession()}

function renderSession(){
  const list=$("exerciseSessionList");list.innerHTML="";
  currentWorkout.exercises.forEach((ex,ei)=>{
    const card=document.createElement("article");
    card.className=`exercise-session ${ex.completed?"completed":""}`;
    card.innerHTML=`
      <div class="exercise-session-head">
        <div>
          <p class="eyebrow">${ex.category.toUpperCase()} • ${ex.type || "EXERCISE"}</p>
          <h3>${ex.name}</h3>
        </div>
        <div class="exercise-header-actions">
          <button class="complete-exercise-btn ${ex.completed?"done":""}" type="button">${ex.completed?"✓ Exercise Finished":"Finish This Exercise"}</button>
          <button class="remove-exercise" type="button">Remove</button>
        </div>
      </div>
      <div class="set-header"><span>SET</span><span>WEIGHT</span><span>REPS</span><span>✓</span></div>
      <div class="sets"></div>
      <button class="add-set-btn" type="button">+ Add set</button>
      <div class="exercise-status ${ex.completed?"done":""}">${ex.completed?"Completed — you can still edit sets before ending the workout.":"Complete the exercise when you finish its sets."}</div>
    `;

    card.querySelector(".complete-exercise-btn").onclick=()=>{ex.completed=true;showToast(`${ex.name} finished. Choose your next body part.`,"success");showWorkoutLanding()};
    card.querySelector(".remove-exercise").onclick=()=>{currentWorkout.exercises.splice(ei,1);if(!currentWorkout.exercises.length)cancelWorkout(false);else showActiveWorkout()};

    const sets=card.querySelector(".sets");
    ex.sets.forEach((s,si)=>{
      const row=document.createElement("div");row.className="set-row";
      row.innerHTML=`<div class="set-number">${si+1}</div><input type="number" inputmode="decimal" min="0" step="2.5" placeholder="lb" value="${s.weight}"><input type="number" inputmode="numeric" min="0" step="1" placeholder="reps" value="${s.reps}"><button class="set-check ${s.done?"done":""}" type="button">${s.done?"✓":"○"}</button>`;
      const inputs=row.querySelectorAll("input");
      inputs[0].oninput=e=>s.weight=e.target.value;
      inputs[1].oninput=e=>s.reps=e.target.value;
      row.querySelector(".set-check").onclick=()=>{s.done=!s.done;renderSession()};
      sets.appendChild(row);
    });

    card.querySelector(".add-set-btn").onclick=()=>{const last=ex.sets[ex.sets.length-1]||{weight:"",reps:"8"};ex.sets.push({weight:last.weight,reps:last.reps||"8",done:false});renderSession()};
    list.appendChild(card);
  });

  const completed=currentWorkout.exercises.filter(x=>x.completed).length;
  $("activeWorkoutTitle").textContent=`${completed}/${currentWorkout.exercises.length} exercises complete`;
}

$("cancelWorkoutBtn").onclick=()=>{if(confirm("Cancel this workout? Unsaved sets will be lost."))cancelWorkout(true)};
function cancelWorkout(msg=true){currentWorkout=null;stopTimer();showWorkoutLanding();if(msg)showToast("Workout canceled.")}
$("finishWorkoutBtn").onclick=finishWorkout;

async function finishWorkout(){
  if(!currentUser||!currentWorkout||!currentWorkout.exercises.length)return;

  const incomplete=currentWorkout.exercises.filter(x=>!x.completed);
  if(incomplete.length){
    const ok=confirm(`${incomplete.length} exercise${incomplete.length===1?" is":"s are"} not marked complete. End the workout anyway?`);
    if(!ok)return;
  }

  const clean=currentWorkout.exercises.map(ex=>({
    category:ex.category,name:ex.name,type:ex.type||"",completed:Boolean(ex.completed),
    sets:ex.sets.map(s=>({weight:Number(s.weight||0),reps:Number(s.reps||0),done:Boolean(s.done)})).filter(s=>s.weight>0||s.reps>0)
  })).filter(ex=>ex.sets.length);

  if(!clean.length){showToast("Add at least one set before ending the workout.","error");return}

  const ended=new Date(),durationSeconds=Math.max(1,Math.round((ended-currentWorkout.startedAt)/1000));
  try{
    $("finishWorkoutBtn").disabled=true;
    await addDoc(collection(db,"users",currentUser.uid,"workouts"),{
      startedAt:currentWorkout.startedAt,endedAt:ended,createdAt:serverTimestamp(),
      durationSeconds,exerciseCount:clean.length,exercises:clean
    });
    currentWorkout=null;stopTimer();showToast("Workout saved to your cloud account.","success");
    await loadWorkouts();showScreen("home");
  }catch(err){console.error(err);showToast(`Could not save workout (${err.code||"unknown error"}).`,"error")}
  finally{$("finishWorkoutBtn").disabled=false}
}

function startTimer(){stopTimer();timerHandle=setInterval(updateTimer,1000);updateTimer()}
function stopTimer(){if(timerHandle)clearInterval(timerHandle);timerHandle=null}
function updateTimer(){if(!currentWorkout)return;const s=Math.floor((Date.now()-currentWorkout.startedAt.getTime())/1000);$("workoutTimer").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

async function loadWorkouts(){if(!currentUser)return;try{const q=query(collection(db,"users",currentUser.uid,"workouts"),orderBy("startedAt","desc"),limit(50));const snap=await getDocs(q);const workouts=snap.docs.map(d=>({id:d.id,...d.data()}));renderWorkoutList($("recentWorkoutList"),workouts.slice(0,5));renderWorkoutList($("historyList"),workouts);updateMetrics(workouts)}catch(err){console.error(err);$("recentWorkoutList").textContent="Could not load workouts yet.";$("historyList").textContent="Could not load workouts yet."}}
function renderWorkoutList(container,workouts){container.innerHTML="";container.classList.remove("empty-state");if(!workouts.length){container.classList.add("empty-state");container.textContent="No workouts saved yet.";return}workouts.forEach(w=>{const card=document.createElement("article");card.className="workout-card clickable";const d=timestampToDate(w.startedAt),sets=(w.exercises||[]).reduce((sum,ex)=>sum+(ex.sets?.length||0),0),names=(w.exercises||[]).map(ex=>ex.name).slice(0,3).join(", "),mins=Math.max(1,Math.round((w.durationSeconds||0)/60));card.innerHTML=`<div class="workout-card-top"><div><h4>${d?d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Workout"}</h4><time>${d?d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}</time></div><span class="summary-pill">${mins} min</span></div><div class="workout-summary"><span class="summary-pill">${w.exerciseCount||w.exercises?.length||0} exercises</span><span class="summary-pill">${sets} sets</span><span class="summary-pill edit-hint">Tap to edit</span></div><p class="muted small">${names||"Workout"}</p>`;card.onclick=()=>openWorkoutEditor(w);container.appendChild(card)})}

function openWorkoutEditor(w){editingWorkout={...w,startedAt:timestampToDate(w.startedAt),exercises:(w.exercises||[]).map(ex=>({...ex,sets:(ex.sets||[]).map(set=>({...set}))}))};const d=editingWorkout.startedAt||new Date();const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);$("editWorkoutDate").value=local;renderWorkoutEditor();$("workoutEditor").classList.remove("hidden")}
function closeWorkoutEditor(){editingWorkout=null;$("workoutEditor").classList.add("hidden")}
$("closeEditorBtn").onclick=closeWorkoutEditor;
function renderWorkoutEditor(){const box=$("editExerciseList");box.innerHTML="";editingWorkout.exercises.forEach((ex,ei)=>{const card=document.createElement("article");card.className="exercise-session";card.innerHTML=`<div class="exercise-session-head"><div><p class="eyebrow">${ex.category||"EXERCISE"}</p><h3>${ex.name}</h3></div><button class="remove-exercise" type="button">Remove exercise</button></div><div class="set-header"><span>SET</span><span>WEIGHT</span><span>REPS</span><span>×</span></div><div class="sets"></div><button class="add-set-btn" type="button">+ Add set</button>`;card.querySelector(".remove-exercise").onclick=()=>{editingWorkout.exercises.splice(ei,1);renderWorkoutEditor()};const sets=card.querySelector(".sets");ex.sets.forEach((set,si)=>{const row=document.createElement("div");row.className="set-row";row.innerHTML=`<div class="set-number">${si+1}</div><input type="number" inputmode="decimal" min="0" step="2.5" value="${set.weight??0}"><input type="number" inputmode="numeric" min="0" step="1" value="${set.reps??0}"><button class="set-check" type="button">×</button>`;const inputs=row.querySelectorAll("input");inputs[0].oninput=e=>set.weight=e.target.value;inputs[1].oninput=e=>set.reps=e.target.value;row.querySelector("button").onclick=()=>{ex.sets.splice(si,1);renderWorkoutEditor()};sets.appendChild(row)});card.querySelector(".add-set-btn").onclick=()=>{const last=ex.sets.at(-1)||{weight:0,reps:8};ex.sets.push({weight:last.weight,reps:last.reps,done:true});renderWorkoutEditor()};box.appendChild(card)})}
$("editorAddExerciseBtn").onclick=()=>{const name=prompt("Exercise name to add:");if(!name)return;editingWorkout.exercises.push({category:"Other",name:name.trim(),type:"Custom",completed:true,sets:[{weight:0,reps:8,done:true}]});renderWorkoutEditor()};
$("saveWorkoutEditsBtn").onclick=async()=>{if(!editingWorkout||!currentUser)return;try{const d=new Date($("editWorkoutDate").value);if(Number.isNaN(d.getTime())){showToast("Choose a valid workout date.","error");return}const exercises=editingWorkout.exercises.map(ex=>({...ex,completed:true,sets:(ex.sets||[]).map(set=>({weight:Number(set.weight||0),reps:Number(set.reps||0),done:true}))}));await updateDoc(doc(db,"users",currentUser.uid,"workouts",editingWorkout.id),{startedAt:d,exerciseCount:exercises.length,exercises,updatedAt:serverTimestamp()});closeWorkoutEditor();showToast("Workout changes saved to the cloud.","success");await loadWorkouts()}catch(err){console.error(err);showToast(`Could not update workout (${err.code||"unknown error"}).`,"error")}};
function updateMetrics(workouts){$("workoutCount").textContent=workouts.length;$("streakCount").textContent=calculateStreak(workouts);if(workouts.length){const w=workouts[0],d=timestampToDate(w.startedAt);$("lastWorkoutMetric").textContent=w.exerciseCount||w.exercises?.length||0;$("lastWorkoutDate").textContent=d?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"Saved"}else{$("lastWorkoutMetric").textContent="—";$("lastWorkoutDate").textContent="No workouts yet"}}
function calculateStreak(workouts){if(!workouts.length)return 0;const days=[...new Set(workouts.map(w=>{const d=timestampToDate(w.startedAt);return d?new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime():null}).filter(Boolean))].sort((a,b)=>b-a);if(!days.length)return 0;const one=86400000,t=new Date(),today=new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime();if(today-days[0]>one)return 0;let streak=1;for(let i=1;i<days.length;i++){const diff=Math.round((days[i-1]-days[i])/one);if(diff===1)streak++;else if(diff>1)break}return streak}
function timestampToDate(v){if(!v)return null;if(typeof v.toDate==="function")return v.toDate();if(v instanceof Date)return v;if(typeof v.seconds==="number")return new Date(v.seconds*1000);return new Date(v)}
function readableError(code=""){const m={"auth/email-already-in-use":"That email already has a MY GYM account.","auth/invalid-email":"Please enter a valid email address.","auth/weak-password":"Use a stronger password with at least 6 characters.","auth/invalid-credential":"Email or password is incorrect.","auth/user-not-found":"No account was found for that email.","auth/too-many-requests":"Too many attempts. Try again later.","auth/network-request-failed":"Network problem. Check your internet connection."};return m[code]||`Something went wrong (${code||"unknown error"}).`}
renderCategories();
