import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, collection,
  query, orderBy, limit, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EXERCISES = {
  Chest:["Chest Press","Incline Chest Press","Pec Deck","Cable Fly","Smith Machine Bench Press","Dumbbell Bench Press"],
  Back:["Lat Pulldown","Seated Row","High Row","Assisted Pull-Up","Cable Row","Back Extension"],
  Shoulders:["Shoulder Press","Lateral Raise","Rear Delt Fly","Cable Lateral Raise","Front Raise"],
  Arms:["Biceps Curl","Triceps Press","Preacher Curl","Cable Curl","Triceps Pushdown","Dip Machine"],
  Legs:["Leg Press","Hack Squat","Leg Extension","Seated Leg Curl","Lying Leg Curl","Hip Abductor","Hip Adductor","Calf Raise"],
  Core:["Abdominal Crunch","Torso Rotation","Cable Crunch","Hanging Knee Raise","Plank"],
  Cardio:["Treadmill","Stair Climber","Elliptical","Stationary Bike","Rowing Machine"]
};
const CATEGORY_ICONS={Chest:"◫",Back:"↔",Shoulders:"△",Arms:"⌁",Legs:"⌄",Core:"◎",Cardio:"♥"};

let currentUser=null,currentWorkout=null,timerHandle=null;
const $=id=>document.getElementById(id);

function showToast(text,type=""){const e=$("toast");e.textContent=text;e.className=`toast ${type}`;clearTimeout(showToast.t);showToast.t=setTimeout(()=>e.classList.add("hidden"),3000);e.classList.remove("hidden")}
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
function showWorkoutLanding(){$("workoutLanding").classList.remove("hidden");$("exercisePicker").classList.add("hidden");$("activeWorkout").classList.add("hidden");renderCategories()}
$("startWorkoutBtn").onclick=()=>{showScreen("workout");showWorkoutLanding()};

function renderCategories(){$("categoryGrid").innerHTML="";Object.keys(EXERCISES).forEach(cat=>{const b=document.createElement("button");b.className="category-card";b.innerHTML=`<div class="category-icon">${CATEGORY_ICONS[cat]}</div><strong>${cat}</strong><small>${EXERCISES[cat].length} exercises</small>`;b.onclick=()=>openCategory(cat);$("categoryGrid").appendChild(b)})}
function openCategory(cat){$("workoutLanding").classList.add("hidden");$("activeWorkout").classList.add("hidden");$("exercisePicker").classList.remove("hidden");$("selectedCategoryLabel").textContent=cat.toUpperCase();renderExercises(cat)}
$("backToCategoriesBtn").onclick=showWorkoutLanding;
function renderExercises(cat){$("exerciseGrid").innerHTML="";EXERCISES[cat].forEach(name=>{const b=document.createElement("button");b.className="exercise-card";b.innerHTML=`<div class="machine-art">${CATEGORY_ICONS[cat]}</div><div><strong>${name}</strong><span>${cat}</span></div>`;b.onclick=()=>addExerciseToWorkout(cat,name);$("exerciseGrid").appendChild(b)})}

function addExerciseToWorkout(category,name){if(!currentWorkout){currentWorkout={startedAt:new Date(),exercises:[]};startTimer()}if(!currentWorkout.exercises.find(x=>x.name===name)){currentWorkout.exercises.push({category,name,sets:[{weight:"",reps:"8",done:false},{weight:"",reps:"8",done:false},{weight:"",reps:"8",done:false}]})}showActiveWorkout()}
function showActiveWorkout(){$("workoutLanding").classList.add("hidden");$("exercisePicker").classList.add("hidden");$("activeWorkout").classList.remove("hidden");renderSession()}
function renderSession(){const list=$("exerciseSessionList");list.innerHTML="";currentWorkout.exercises.forEach((ex,ei)=>{const card=document.createElement("article");card.className="exercise-session";card.innerHTML=`<div class="exercise-session-head"><div><p class="eyebrow">${ex.category.toUpperCase()}</p><h3>${ex.name}</h3></div><button class="remove-exercise">Remove</button></div><div class="set-header"><span>SET</span><span>WEIGHT</span><span>REPS</span><span>✓</span></div><div class="sets"></div><button class="add-set-btn">+ Add set</button>`;card.querySelector(".remove-exercise").onclick=()=>{currentWorkout.exercises.splice(ei,1);if(!currentWorkout.exercises.length)cancelWorkout(false);else showActiveWorkout()};const sets=card.querySelector(".sets");ex.sets.forEach((s,si)=>{const row=document.createElement("div");row.className="set-row";row.innerHTML=`<div class="set-number">${si+1}</div><input type="number" inputmode="decimal" min="0" step="2.5" placeholder="lb" value="${s.weight}"><input type="number" inputmode="numeric" min="0" step="1" placeholder="reps" value="${s.reps}"><button class="set-check ${s.done?"done":""}">${s.done?"✓":"○"}</button>`;const inputs=row.querySelectorAll("input");inputs[0].oninput=e=>s.weight=e.target.value;inputs[1].oninput=e=>s.reps=e.target.value;row.querySelector(".set-check").onclick=()=>{s.done=!s.done;renderSession()};sets.appendChild(row)});card.querySelector(".add-set-btn").onclick=()=>{const last=ex.sets[ex.sets.length-1]||{weight:"",reps:"8"};ex.sets.push({weight:last.weight,reps:last.reps||"8",done:false});renderSession()};list.appendChild(card)});$("activeWorkoutTitle").textContent=`${currentWorkout.exercises.length} exercise${currentWorkout.exercises.length===1?"":"s"}`}
$("addExerciseBtn").onclick=()=>{$("activeWorkout").classList.add("hidden");$("exercisePicker").classList.add("hidden");$("workoutLanding").classList.remove("hidden");renderCategories()};
$("cancelWorkoutBtn").onclick=()=>{if(confirm("Cancel this workout? Unsaved sets will be lost."))cancelWorkout(true)};
function cancelWorkout(msg=true){currentWorkout=null;stopTimer();showWorkoutLanding();if(msg)showToast("Workout canceled.")}
$("finishWorkoutBtn").onclick=finishWorkout;

async function finishWorkout(){if(!currentUser||!currentWorkout||!currentWorkout.exercises.length)return;const clean=currentWorkout.exercises.map(ex=>({category:ex.category,name:ex.name,sets:ex.sets.map(s=>({weight:Number(s.weight||0),reps:Number(s.reps||0),done:Boolean(s.done)})).filter(s=>s.weight>0||s.reps>0)})).filter(ex=>ex.sets.length);if(!clean.length){showToast("Add at least one set before finishing.","error");return}const ended=new Date(),durationSeconds=Math.max(1,Math.round((ended-currentWorkout.startedAt)/1000));try{$("finishWorkoutBtn").disabled=true;await addDoc(collection(db,"users",currentUser.uid,"workouts"),{startedAt:currentWorkout.startedAt,endedAt:ended,createdAt:serverTimestamp(),durationSeconds,exerciseCount:clean.length,exercises:clean});currentWorkout=null;stopTimer();showToast("Workout saved to your cloud account.","success");await loadWorkouts();showScreen("home")}catch(err){console.error(err);showToast(`Could not save workout (${err.code||"unknown error"}).`,"error")}finally{$("finishWorkoutBtn").disabled=false}}

function startTimer(){stopTimer();timerHandle=setInterval(updateTimer,1000);updateTimer()}
function stopTimer(){if(timerHandle)clearInterval(timerHandle);timerHandle=null}
function updateTimer(){if(!currentWorkout)return;const s=Math.floor((Date.now()-currentWorkout.startedAt.getTime())/1000);$("workoutTimer").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

async function loadWorkouts(){if(!currentUser)return;try{const q=query(collection(db,"users",currentUser.uid,"workouts"),orderBy("startedAt","desc"),limit(50));const snap=await getDocs(q);const workouts=snap.docs.map(d=>({id:d.id,...d.data()}));renderWorkoutList($("recentWorkoutList"),workouts.slice(0,5));renderWorkoutList($("historyList"),workouts);updateMetrics(workouts)}catch(err){console.error(err);$("recentWorkoutList").textContent="Could not load workouts yet.";$("historyList").textContent="Could not load workouts yet."}}
function renderWorkoutList(container,workouts){container.innerHTML="";container.classList.remove("empty-state");if(!workouts.length){container.classList.add("empty-state");container.textContent="No workouts saved yet.";return}workouts.forEach(w=>{const card=document.createElement("article");card.className="workout-card";const d=timestampToDate(w.startedAt),sets=(w.exercises||[]).reduce((sum,ex)=>sum+(ex.sets?.length||0),0),names=(w.exercises||[]).map(ex=>ex.name).slice(0,3).join(", "),mins=Math.max(1,Math.round((w.durationSeconds||0)/60));card.innerHTML=`<div class="workout-card-top"><div><h4>${d?d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Workout"}</h4><time>${d?d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}</time></div><span class="summary-pill">${mins} min</span></div><div class="workout-summary"><span class="summary-pill">${w.exerciseCount||w.exercises?.length||0} exercises</span><span class="summary-pill">${sets} sets</span></div><p class="muted small">${names||"Workout"}</p>`;container.appendChild(card)})}
function updateMetrics(workouts){$("workoutCount").textContent=workouts.length;$("streakCount").textContent=calculateStreak(workouts);if(workouts.length){const w=workouts[0],d=timestampToDate(w.startedAt);$("lastWorkoutMetric").textContent=w.exerciseCount||w.exercises?.length||0;$("lastWorkoutDate").textContent=d?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"Saved"}else{$("lastWorkoutMetric").textContent="—";$("lastWorkoutDate").textContent="No workouts yet"}}
function calculateStreak(workouts){if(!workouts.length)return 0;const days=[...new Set(workouts.map(w=>{const d=timestampToDate(w.startedAt);return d?new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime():null}).filter(Boolean))].sort((a,b)=>b-a);if(!days.length)return 0;const one=86400000,t=new Date(),today=new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime();if(today-days[0]>one)return 0;let streak=1;for(let i=1;i<days.length;i++){const diff=Math.round((days[i-1]-days[i])/one);if(diff===1)streak++;else if(diff>1)break}return streak}
function timestampToDate(v){if(!v)return null;if(typeof v.toDate==="function")return v.toDate();if(v instanceof Date)return v;if(typeof v.seconds==="number")return new Date(v.seconds*1000);return new Date(v)}
function readableError(code=""){const m={"auth/email-already-in-use":"That email already has a MY GYM account.","auth/invalid-email":"Please enter a valid email address.","auth/weak-password":"Use a stronger password with at least 6 characters.","auth/invalid-credential":"Email or password is incorrect.","auth/user-not-found":"No account was found for that email.","auth/too-many-requests":"Too many attempts. Try again later.","auth/network-request-failed":"Network problem. Check your internet connection."};return m[code]||`Something went wrong (${code||"unknown error"}).`}
renderCategories();
