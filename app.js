import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch,
  collection, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const $ = id => document.getElementById(id);

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
    {name:"Standing Leg Curl",type:"Selectorized"},
    {name:"Hip Abductor",type:"Selectorized"},
    {name:"Hip Adductor",type:"Selectorized"},
    {name:"Seated Calf Raise",type:"Machine"},
    {name:"Standing Calf Raise",type:"Machine"},
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

let user=null, workout=null, activeExercise=null, timerHandle=null, currentDisplayName="Athlete", myFriendCode="";
let workoutsCache=[], calendarStatuses={}, bodyWeightCache=[], mealCache=[], calorieTarget=0, calorieSelectedDate=new Date(), calendarCursor=new Date();
let selectedCalendarKey=null, editingWorkout=null;

function showMessage(text, success=false) {
  $("authMessage").textContent=text;
  $("authMessage").className=success?"message success":"message";
}
function showToast(text,type=""){
  const el=$("toast");
  el.textContent=text;
  el.className=`toast ${type}`;
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>el.classList.add("hidden"),2600);
  el.classList.remove("hidden");
}
function showScreen(name){
  ["homeScreen","workoutScreen","historyScreen","caloriesScreen","connectionsScreen","profileScreen"].forEach(id=>{
    const el=$(id);
    if(el)el.classList.add("hidden");
  });
  const screen=$(`${name}Screen`);
  if(!screen)return;
  screen.classList.remove("hidden");

  document.querySelectorAll(".navbtn[data-screen]").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.screen===name);
  });

  if(name==="workout"){
    document.querySelectorAll(".navbtn[data-screen]").forEach(btn=>btn.classList.remove("active"));
    document.querySelector('.navbtn[data-screen="home"]')?.classList.add("active");
    renderCurrentWorkoutSummary();
  }

  if(name==="connections"){
    document.querySelectorAll(".navbtn[data-screen]").forEach(btn=>btn.classList.remove("active"));
    document.querySelector('.navbtn[data-screen="profile"]')?.classList.add("active");
  }

  if(name==="history"){showHistoryPanel("calendar");renderCalendar();}
  if(name==="calories"){initializeCaloriesScreen();}
  if(name==="connections"){loadConnectionsArea();}
}
document.querySelectorAll(".navbtn[data-screen]").forEach(btn=>btn.addEventListener("click",()=>showScreen(btn.dataset.screen)));

$("profileWorkoutBtn")?.addEventListener("click",()=>showScreen("workout"));
$("profileConnectionsBtn")?.addEventListener("click",()=>showScreen("connections"));

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value)}
  catch(err){showMessage("Email or password is incorrect.")}
});
$("registerForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    const name=$("registerName").value.trim(),email=$("registerEmail").value.trim();
    const cred=await createUserWithEmailAndPassword(auth,email,$("registerPassword").value);
    await updateProfile(cred.user,{displayName:name});
    await setDoc(doc(db,"users",cred.user.uid),{
      displayName:name,email:email.toLowerCase(),createdAt:serverTimestamp(),
      settings:{weightUnit:"lb",theme:"dark"}
    });
  }catch(err){showMessage(err.code||"Could not create account.")}
});
$("resetForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{await sendPasswordResetEmail(auth,$("resetEmail").value.trim());showMessage("Password reset email sent. Check your inbox.",true)}
  catch(err){showMessage(err.code||"Could not send reset email.")}
});
$("logoutBtn").addEventListener("click",async()=>{
  if(workout&&!confirm("A workout is in progress. Log out and lose unsaved workout data?"))return;
  workout=null;activeExercise=null;stopTimer();await signOut(auth);
});

onAuthStateChanged(auth,async currentUser=>{
  user=currentUser;
  if(!currentUser){
    $("appView").classList.add("hidden");
    $("authView").classList.remove("hidden");
    return;
  }
  let name=currentUser.displayName||"Athlete";
  try{
    const snap=await getDoc(doc(db,"users",currentUser.uid));
    if(snap.exists()&&snap.data().displayName)name=snap.data().displayName;
  }catch(_){}
  currentDisplayName=name;
  $("userName").textContent=name;$("profileName").textContent=name;
  $("userEmail").textContent=currentUser.email||"";$("profileEmail").textContent=currentUser.email||"";
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");
  showScreen("home");
  await loadAllData();
  await ensureFriendCode();
});


function categoryArtwork(category){
  const colors={Chest:["#ff4f68","#ff7a59"],Back:["#2f7dff","#39c2ff"],Shoulders:["#ff9b2f","#ffc247"],Arms:["#d65cff","#ff66b2"],Legs:["#38d58b","#8ee650"],Core:["#ff7b39","#ffb02e"],Cardio:["#25cbe5","#4df0c3"]};
  const [a,b]=colors[category]||colors.Chest;
  const icons={
    Chest:`<path d="M35 72c12-26 31-39 55-30 24-9 43 4 55 30-15 20-34 31-55 34-21-3-40-14-55-34z"/><path d="M90 43v55M55 64l35 19 35-19"/>`,
    Back:`<path d="M38 73c11-25 30-38 52-31 22-7 41 6 52 31-14 19-31 30-52 34-21-4-38-15-52-34z"/><path d="M90 43v56M55 58l35 24 35-24M57 82l33 13 33-13"/>`,
    Shoulders:`<circle cx="90" cy="34" r="13"/><path d="M34 78c12-20 30-30 56-30s44 10 56 30c-14 12-31 18-48 20l-8-18-8 18c-17-2-34-8-48-20z"/>`,
    Arms:`<path d="M39 80c10-29 24-43 39-35 8 4 10 13 6 20 12-4 23 0 29 9 7 11 1 24-14 30-24 10-48 1-60-24z"/><path d="M141 80c-10-29-24-43-39-35-8 4-10 13-6 20 12-4 23 0 29 9 7 11 1 24-14 30-24 10-48 1-60-24z" opacity=".75"/>`,
    Legs:`<path d="M64 18h22l8 38-14 48H55l14-49zM116 18H94l-8 38 14 48h25l-14-49z"/>`,
    Core:`<path d="M63 18h54l7 21-12 64H68L56 39z"/><path d="M90 23v75M70 44h40M69 66h42M71 86h38"/>`,
    Cardio:`<path d="M38 63c0-18 13-31 31-31 10 0 18 4 21 11 3-7 11-11 21-11 18 0 31 13 31 31 0 24-27 37-52 48-25-11-52-24-52-48z"/><path d="M49 67h22l8-19 13 37 10-25 7 7h22"/>`
  };
  return `<svg viewBox="0 0 180 110" aria-hidden="true"><defs><linearGradient id="g-${category}" x1="0" x2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><g fill="url(#g-${category})" stroke="#ffffff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${icons[category]||icons.Chest}</g></svg>`;
}
function machineKind(name){
  const n=name.toLowerCase();
  if(n.includes("treadmill")) return "treadmill";
  if(n.includes("stair")) return "stairs";
  if(n.includes("elliptical")) return "elliptical";
  if(n.includes("bike")) return "bike";
  if(n.includes("rowing machine")) return "rower";
  if(n.includes("leg press")) return "legpress";
  if(n.includes("hack squat")) return "hacksquat";
  if(n.includes("leg extension")) return "legextension";
  if(n.includes("leg curl")) return "legcurl";
  if(n.includes("hip abductor")||n.includes("hip adductor")) return "hipmachine";
  if(n.includes("calf")) return "calf";
  if(n.includes("glute")||n.includes("hip thrust")) return "hipthrust";
  if(n.includes("pec deck")||n.includes("chest fly")) return "fly";
  if(n.includes("cable fly")) return "cablefly";
  if(n.includes("smith")) return "smith";
  if(n.includes("dumbbell")) return "dumbbell";
  if(n.includes("incline")&&n.includes("press")) return "inclinepress";
  if(n.includes("decline")&&n.includes("press")) return "declinepress";
  if(n.includes("chest press")) return "chestpress";
  if(n.includes("lat pulldown")||n.includes("front pulldown")) return "pulldown";
  if(n.includes("high row")) return "highrow";
  if(n.includes("seated row")||n.includes("low row")||n.includes("iso-lateral row")||n.includes("cable row")) return "row";
  if(n.includes("assisted pull")) return "pullup";
  if(n.includes("back extension")) return "backextension";
  if(n.includes("shoulder press")) return "shoulderpress";
  if(n.includes("lateral raise")||n.includes("front raise")) return "lateral";
  if(n.includes("rear delt")) return "reardelt";
  if(n.includes("biceps")||n.includes("preacher")||n.includes("cable curl")) return "curl";
  if(n.includes("triceps")||n.includes("pushdown")) return "triceps";
  if(n.includes("dip")) return "dip";
  if(n.includes("abdominal")||n.includes("cable crunch")) return "abs";
  if(n.includes("torso rotation")) return "rotation";
  if(n.includes("hanging knee")) return "kneeraise";
  if(n.includes("plank")) return "plank";
  return "generic";
}

function machineArtwork(item,category){
  const kind=machineKind(item.name);
  const c={
    Chest:"#8b6cff",Back:"#4297ff",Shoulders:"#eca23a",Arms:"#c55ae6",
    Legs:"#34c99a",Core:"#f47a50",Cardio:"#36cbd0"
  }[category]||"#8b6cff";
  const steel="#8d9bad",dark="#303947",light="#d2d9e2";
  const parts={
    chestpress:`<path d="M47 145V52M133 145V52M47 55h86" stroke="${steel}" stroke-width="7"/><rect x="69" y="81" width="42" height="52" rx="12" fill="${c}"/><rect x="67" y="134" width="46" height="15" rx="7" fill="${c}"/><path d="M72 84L50 68M108 84l22-16M49 68H32M131 68h17" stroke="${light}" stroke-width="7" stroke-linecap="round"/>`,
    inclinepress:`<path d="M50 146V51M130 146V51M50 54h80" stroke="${steel}" stroke-width="7"/><rect x="73" y="77" width="38" height="58" rx="11" fill="${c}" transform="rotate(-15 73 77)"/><path d="M74 81L51 58M107 76l23-24M50 58H33M130 52h16" stroke="${light}" stroke-width="7" stroke-linecap="round"/><path d="M65 144h55" stroke="${steel}" stroke-width="8"/>`,
    declinepress:`<path d="M48 145V55M132 145V55M48 58h84" stroke="${steel}" stroke-width="7"/><rect x="68" y="90" width="44" height="48" rx="11" fill="${c}" transform="rotate(13 68 90)"/><path d="M72 91L51 77M108 91l22-14M50 77H32M131 77h17" stroke="${light}" stroke-width="7" stroke-linecap="round"/>`,
    fly:`<path d="M48 145V46M132 145V46M48 49h84" stroke="${steel}" stroke-width="7"/><rect x="69" y="81" width="42" height="51" rx="12" fill="${c}"/><path d="M70 84L43 69l-11 22M110 84l27-15 11 22" stroke="${light}" stroke-width="7" stroke-linecap="round"/><circle cx="31" cy="93" r="8" fill="${dark}"/><circle cx="149" cy="93" r="8" fill="${dark}"/>`,
    cablefly:`<path d="M35 145V35M145 145V35M35 38h110" stroke="${steel}" stroke-width="7"/><path d="M43 57h19M137 57h-19M62 57l28 43M118 57L90 100" stroke="${light}" stroke-width="5"/><circle cx="90" cy="102" r="9" fill="${c}"/><path d="M51 145h78" stroke="${steel}" stroke-width="7"/>`,
    smith:`<path d="M42 145V30M138 145V30M42 34h96M55 63h70" stroke="${steel}" stroke-width="7"/><circle cx="52" cy="63" r="11" fill="${dark}"/><circle cx="128" cy="63" r="11" fill="${dark}"/><rect x="62" y="112" width="58" height="13" rx="6" fill="${c}"/><path d="M80 125v20M105 125v20" stroke="${steel}" stroke-width="6"/>`,
    dumbbell:`<path d="M48 120h84" stroke="${light}" stroke-width="8" stroke-linecap="round"/><rect x="61" y="77" width="58" height="21" rx="10" fill="${c}"/><path d="M77 98v31M105 98v31" stroke="${steel}" stroke-width="7"/><path d="M55 67h70" stroke="${light}" stroke-width="7"/><rect x="38" y="55" width="17" height="25" rx="6" fill="${dark}"/><rect x="125" y="55" width="17" height="25" rx="6" fill="${dark}"/>`,
    pulldown:`<path d="M46 145V31M134 145V31M46 34h88" stroke="${steel}" stroke-width="7"/><path d="M65 48h50M90 48v35M64 81h52" stroke="${light}" stroke-width="6"/><rect x="66" y="107" width="48" height="15" rx="7" fill="${c}"/><path d="M72 122v22M108 122v22" stroke="${steel}" stroke-width="6"/>`,
    highrow:`<path d="M47 145V48M133 145V48M47 51h86" stroke="${steel}" stroke-width="7"/><rect x="67" y="92" width="46" height="42" rx="11" fill="${c}"/><path d="M73 94L49 61M107 94l24-33M49 61l-13 17M131 61l13 17" stroke="${light}" stroke-width="7" stroke-linecap="round"/>`,
    row:`<path d="M48 145h84M62 140l23-42M85 98h44" stroke="${steel}" stroke-width="7"/><rect x="56" y="104" width="44" height="16" rx="7" fill="${c}"/><path d="M129 98l20-20M149 78h12" stroke="${light}" stroke-width="7" stroke-linecap="round"/><circle cx="153" cy="78" r="7" fill="${dark}"/>`,
    pullup:`<path d="M42 145V29M138 145V29M42 32h96M62 45h56" stroke="${steel}" stroke-width="7"/><rect x="69" y="109" width="42" height="13" rx="6" fill="${c}"/><path d="M90 55v37M75 70h30" stroke="${light}" stroke-width="6"/><path d="M68 122v22M112 122v22" stroke="${steel}" stroke-width="6"/>`,
    backextension:`<path d="M46 142h91M70 136l18-46M88 90h42" stroke="${steel}" stroke-width="7"/><rect x="78" y="69" width="56" height="18" rx="8" fill="${c}" transform="rotate(18 78 69)"/><path d="M65 137h40" stroke="${light}" stroke-width="6"/>`,
    shoulderpress:`<path d="M52 145V51M128 145V51M52 54h76" stroke="${steel}" stroke-width="7"/><rect x="69" y="90" width="42" height="43" rx="11" fill="${c}"/><path d="M72 92V62M108 92V62M62 60h20M98 60h20" stroke="${light}" stroke-width="7" stroke-linecap="round"/>`,
    lateral:`<path d="M49 145V50M131 145V50M49 53h82" stroke="${steel}" stroke-width="7"/><rect x="70" y="89" width="40" height="42" rx="11" fill="${c}"/><path d="M70 89L43 83M110 89l27-6M43 83l-13 12M137 83l13 12" stroke="${light}" stroke-width="7" stroke-linecap="round"/>`,
    reardelt:`<path d="M47 145V45M133 145V45M47 48h86" stroke="${steel}" stroke-width="7"/><rect x="68" y="91" width="44" height="41" rx="11" fill="${c}"/><path d="M68 94L45 73M112 94l23-21M44 72h-15M136 72h15" stroke="${light}" stroke-width="7" stroke-linecap="round"/>`,
    curl:`<path d="M55 145V50M125 145V50M55 53h70" stroke="${steel}" stroke-width="7"/><rect x="62" y="93" width="56" height="16" rx="8" fill="${c}" transform="rotate(-9 62 93)"/><path d="M70 112l20 18 20-18" stroke="${light}" stroke-width="7" stroke-linecap="round"/><circle cx="67" cy="112" r="10" fill="${dark}"/><circle cx="113" cy="112" r="10" fill="${dark}"/>`,
    triceps:`<path d="M47 145V32M133 145V32M47 35h86" stroke="${steel}" stroke-width="7"/><path d="M90 42v45M70 88h40M72 88l-12 28M108 88l12 28" stroke="${light}" stroke-width="6"/><rect x="63" y="120" width="54" height="14" rx="7" fill="${c}"/>`,
    dip:`<path d="M53 145V46M127 145V46M53 49h74" stroke="${steel}" stroke-width="7"/><path d="M64 80h24M116 80H92M66 80v35M114 80v35" stroke="${light}" stroke-width="7"/><rect x="67" y="119" width="46" height="13" rx="6" fill="${c}"/>`,
    legpress:`<path d="M43 145h98M59 136l32-77M91 59h34M96 73l27 37" stroke="${steel}" stroke-width="8"/><rect x="54" y="104" width="49" height="17" rx="8" transform="rotate(-18 54 104)" fill="${c}"/><circle cx="128" cy="52" r="15" fill="${dark}" stroke="${light}" stroke-width="4"/><circle cx="136" cy="107" r="15" fill="${dark}" stroke="${light}" stroke-width="4"/>`,
    hacksquat:`<path d="M48 145h84M60 137l34-93M94 44h28M80 83h40" stroke="${steel}" stroke-width="8"/><rect x="78" y="64" width="42" height="18" rx="8" fill="${c}"/><circle cx="126" cy="47" r="14" fill="${dark}" stroke="${light}" stroke-width="4"/>`,
    legextension:`<path d="M54 145h72M65 138l10-55M75 83h43" stroke="${steel}" stroke-width="7"/><rect x="66" y="65" width="48" height="18" rx="8" fill="${c}"/><path d="M112 82l20 32M132 114h18" stroke="${light}" stroke-width="7" stroke-linecap="round"/><circle cx="150" cy="114" r="10" fill="${dark}"/>`,
    legcurl:`<path d="M45 145h92M63 138l14-50M77 88h48" stroke="${steel}" stroke-width="7"/><rect x="68" y="70" width="58" height="17" rx="8" fill="${c}"/><path d="M126 86l16 27M142 113h13" stroke="${light}" stroke-width="7"/><circle cx="155" cy="113" r="10" fill="${dark}"/>`,
    hipmachine:`<path d="M55 145V59M125 145V59M55 62h70" stroke="${steel}" stroke-width="7"/><rect x="70" y="93" width="40" height="35" rx="11" fill="${c}"/><path d="M70 99L48 89M110 99l22-10M48 89v25M132 89v25" stroke="${light}" stroke-width="7"/>`,
    calf:`<path d="M52 145V48M128 145V48M52 51h76" stroke="${steel}" stroke-width="7"/><rect x="69" y="89" width="42" height="35" rx="11" fill="${c}"/><path d="M70 78h40M70 78v15M110 78v15M64 136h52" stroke="${light}" stroke-width="7"/>`,
    hipthrust:`<path d="M43 144h94M57 136l15-47M72 89h60" stroke="${steel}" stroke-width="7"/><rect x="62" y="105" width="56" height="16" rx="8" fill="${c}"/><path d="M82 89l10-24M92 65h30" stroke="${light}" stroke-width="7"/><circle cx="126" cy="65" r="13" fill="${dark}"/>`,
    abs:`<path d="M58 145V42M122 145V42M58 45h64" stroke="${steel}" stroke-width="7"/><rect x="70" y="78" width="40" height="42" rx="11" fill="${c}"/><path d="M70 80L58 62M110 80l12-18M90 119v22" stroke="${light}" stroke-width="7"/>`,
    rotation:`<path d="M52 145V54M128 145V54M52 57h76" stroke="${steel}" stroke-width="7"/><rect x="70" y="92" width="40" height="33" rx="11" fill="${c}"/><path d="M70 85h40M58 79c15-14 49-14 64 0" stroke="${light}" stroke-width="7" stroke-linecap="round"/>`,
    kneeraise:`<path d="M48 145V31M132 145V31M48 34h84M63 55h54" stroke="${steel}" stroke-width="7"/><path d="M90 58v41M75 76h30M90 99l-17 23M90 99l17 23" stroke="${light}" stroke-width="6"/><circle cx="90" cy="52" r="8" fill="${c}"/>`,
    plank:`<path d="M44 127h92" stroke="${steel}" stroke-width="8"/><path d="M57 108h62M66 108l-10 19M109 108l12 19" stroke="${light}" stroke-width="7"/><circle cx="122" cy="104" r="9" fill="${c}"/>`,
    treadmill:`<path d="M42 133h96L119 91H66z" stroke="${steel}" stroke-width="8"/><path d="M108 92V50h25" stroke="${light}" stroke-width="7"/><rect x="112" y="39" width="31" height="20" rx="6" fill="${c}"/><path d="M57 139h81" stroke="${steel}" stroke-width="8"/>`,
    stairs:`<path d="M54 137h79M61 128h58V45H96V60H83V75H70V90H57" stroke="${steel}" stroke-width="8" stroke-linejoin="round"/><path d="M106 42h28M113 42v-15" stroke="${light}" stroke-width="7"/><rect x="116" y="19" width="27" height="18" rx="6" fill="${c}"/>`,
    elliptical:`<path d="M55 132h70M90 126V56M90 56l24-24M90 56L66 32" stroke="${steel}" stroke-width="7"/><ellipse cx="75" cy="108" rx="28" ry="13" fill="none" stroke="${c}" stroke-width="7"/><ellipse cx="107" cy="108" rx="28" ry="13" fill="none" stroke="${light}" stroke-width="6"/>`,
    bike:`<circle cx="63" cy="112" r="27" fill="none" stroke="${steel}" stroke-width="7"/><circle cx="123" cy="112" r="27" fill="none" stroke="${steel}" stroke-width="7"/><path d="M63 112l23-38h21l16 38M86 74l20 38H63M87 74l-9-14M107 74h17" stroke="${light}" stroke-width="6" stroke-linecap="round"/><circle cx="94" cy="94" r="7" fill="${c}"/>`,
    rower:`<path d="M44 132h94M57 125l25-33h52M94 92l22-34" stroke="${steel}" stroke-width="7"/><rect x="52" y="106" width="43" height="14" rx="7" fill="${c}"/><path d="M116 58h23M126 58l13-17" stroke="${light}" stroke-width="6"/>`,
    generic:`<path d="M50 145V48M130 145V48M50 51h80" stroke="${steel}" stroke-width="7"/><rect x="69" y="87" width="42" height="42" rx="11" fill="${c}"/><path d="M65 78h50M90 51v35" stroke="${light}" stroke-width="7"/>`
  };
  return `<div class="machine-visual">
    <svg viewBox="0 0 180 170" aria-hidden="true">
      <path class="floor" d="M22 151h136"/>
      ${parts[kind]||parts.generic}
    </svg>
    <span class="machine-badge">${item.type}${item.independent?" • Independent":""}</span>
  </div>`;
}


function randomFriendCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out="";
  for(let i=0;i<8;i++)out+=chars[Math.floor(Math.random()*chars.length)];
  return out;
}

async function ensureFriendCode(){
  if(!user)return;
  try{
    const profileRef=doc(db,"users",user.uid);
    const snap=await getDoc(profileRef);
    let code=snap.exists()?String(snap.data().friendCode||""):"";

    if(!code){
      for(let attempt=0;attempt<8;attempt++){
        const candidate=randomFriendCode();
        const codeRef=doc(db,"friendCodes",candidate);
        const existing=await getDoc(codeRef);
        if(existing.exists())continue;

        await setDoc(codeRef,{
          uid:user.uid,
          displayName:currentDisplayName,
          createdAt:serverTimestamp()
        });
        await setDoc(profileRef,{friendCode:candidate},{merge:true});
        code=candidate;
        break;
      }
    }else{
      await setDoc(doc(db,"friendCodes",code),{
        uid:user.uid,
        displayName:currentDisplayName,
        updatedAt:serverTimestamp()
      },{merge:true});
    }

    myFriendCode=code;
    if($("myFriendCode"))$("myFriendCode").textContent=code||"UNAVAILABLE";
  }catch(err){
    console.error("Friend code setup failed",err);
    if($("myFriendCode"))$("myFriendCode").textContent="UNAVAILABLE";
  }
}

$("copyFriendCodeBtn").addEventListener("click",async()=>{
  if(!myFriendCode){showToast("Friend code is not ready yet.","error");return}
  try{
    await navigator.clipboard.writeText(myFriendCode);
    showToast("Friend code copied.","success");
  }catch(_){
    prompt("Copy your MY GYM friend code:",myFriendCode);
  }
});

$("sendFriendRequestBtn").addEventListener("click",async()=>{
  const code=$("friendCodeInput").value.trim().toUpperCase();
  if(!code){showToast("Enter a friend code.","error");return}
  if(code===myFriendCode){showToast("That is your own friend code.","error");return}

  try{
    const codeSnap=await getDoc(doc(db,"friendCodes",code));
    if(!codeSnap.exists()){showToast("No MY GYM user was found with that code.","error");return}

    const target=codeSnap.data();
    if(target.uid===user.uid){showToast("That is your own friend code.","error");return}

    await setDoc(doc(db,"users",target.uid,"friendRequests",user.uid),{
      fromUid:user.uid,
      targetUid:target.uid,
      fromName:currentDisplayName,
      targetName:target.displayName||"MY GYM User",
      friendCode:code,
      status:"pending",
      createdAt:serverTimestamp()
    });

    $("friendCodeInput").value="";
    showToast(`Friend request sent to ${target.displayName||"that user"}.`,"success");
  }catch(err){
    console.error(err);
    showToast("Could not send friend request. Check Firestore rules.","error");
  }
});

async function loadConnectionsArea(){
  if(!user)return;
  await ensureFriendCode();
  await Promise.all([loadIncomingRequests(),loadApprovedConnections()]);
}

async function loadIncomingRequests(){
  const wrap=$("incomingFriendRequests");
  if(!wrap)return;

  try{
    const q=query(collection(db,"users",user.uid,"friendRequests"),where("status","==","pending"));
    const snap=await getDocs(q);
    $("friendRequestCount").textContent=String(snap.size);
    wrap.innerHTML="";
    wrap.classList.remove("empty");

    if(snap.empty){
      wrap.classList.add("empty");
      wrap.textContent="No pending requests.";
      return;
    }

    snap.docs.forEach(requestDoc=>{
      const request=requestDoc.data();
      const row=document.createElement("div");
      row.className="connection-row";
      row.innerHTML=`
        <div>
          <strong>${request.fromName||"MY GYM User"}</strong>
          <span class="muted">Wants to view your workout progress</span>
        </div>
        <div class="connection-actions">
          <button class="approve-btn" type="button">Approve</button>
          <button class="decline-btn" type="button">Decline</button>
        </div>`;
      row.querySelector(".approve-btn").addEventListener("click",()=>approveFriendRequest(requestDoc.id,request));
      row.querySelector(".decline-btn").addEventListener("click",()=>declineFriendRequest(requestDoc.id));
      wrap.appendChild(row);
    });
  }catch(err){
    console.error(err);
    wrap.className="connections-list empty";
    wrap.textContent="Could not load requests.";
  }
}

async function approveFriendRequest(requesterUid,request){
  try{
    const requestRef=doc(db,"users",user.uid,"friendRequests",requesterUid);

    // Step 1: the receiver approves the request first.
    await updateDoc(requestRef,{
      status:"accepted",
      acceptedAt:serverTimestamp()
    });

    // Step 2: requester may view the receiver's progress.
    await setDoc(doc(db,"connections",`${user.uid}_${requesterUid}`),{
      ownerUid:user.uid,
      viewerUid:requesterUid,
      ownerName:currentDisplayName,
      viewerName:request.fromName||"MY GYM User",
      requestedBy:requesterUid,
      acceptedBy:user.uid,
      status:"accepted",
      createdAt:serverTimestamp()
    });

    // Step 3: receiver may also view requester's progress.
    await setDoc(doc(db,"connections",`${requesterUid}_${user.uid}`),{
      ownerUid:requesterUid,
      viewerUid:user.uid,
      ownerName:request.fromName||"MY GYM User",
      viewerName:currentDisplayName,
      requestedBy:requesterUid,
      acceptedBy:user.uid,
      status:"accepted",
      createdAt:serverTimestamp()
    });

    await loadConnectionsArea();
    showToast("Friend request approved.","success");
  }catch(err){
    console.error("Friend approval failed:",err);
    showToast(`Could not approve request (${err.code||"unknown error"}).`,"error");
  }
}
async function declineFriendRequest(requesterUid){
  if(!confirm("Decline this friend request?"))return;
  try{
    await updateDoc(doc(db,"users",user.uid,"friendRequests",requesterUid),{
      status:"declined",
      updatedAt:serverTimestamp()
    });
    await loadIncomingRequests();
    showToast("Friend request declined.","success");
  }catch(err){
    console.error(err);
    showToast("Could not decline request.","error");
  }
}

async function loadApprovedConnections(){
  const wrap=$("approvedConnections");
  if(!wrap)return;

  try{
    const q=query(collection(db,"connections"),
      where("viewerUid","==",user.uid),
      where("status","==","accepted")
    );
    const snap=await getDocs(q);
    $("connectionCount").textContent=String(snap.size);
    wrap.innerHTML="";
    wrap.classList.remove("empty");

    if(snap.empty){
      wrap.classList.add("empty");
      wrap.textContent="No approved friends yet.";
      return;
    }

    snap.docs.forEach(connectionDoc=>{
      const c=connectionDoc.data();
      const row=document.createElement("div");
      row.className="connection-row";
      row.innerHTML=`
        <div>
          <strong>${c.ownerName||"MY GYM Friend"}</strong>
          <span class="muted">Progress sharing approved</span>
        </div>
        <div class="connection-actions">
          <button class="view-progress-btn" type="button">View Progress</button>
          <button class="remove-friend-btn" type="button">Remove</button>
        </div>`;
      row.querySelector(".view-progress-btn").addEventListener("click",()=>openFriendProgress(c.ownerUid,c.ownerName||"Friend"));
      row.querySelector(".remove-friend-btn").addEventListener("click",()=>removeConnection(c.ownerUid));
      wrap.appendChild(row);
    });
  }catch(err){
    console.error(err);
    wrap.className="connections-list empty";
    wrap.textContent="Could not load friends.";
  }
}

async function openFriendProgress(friendUid,friendName){
  const panel=$("friendProgressPanel");
  panel.classList.remove("hidden");
  $("friendProgressName").textContent=friendName;
  $("friendWorkoutList").className="list empty";
  $("friendWorkoutList").textContent="Loading shared workouts...";

  try{
    const q=query(collection(db,"users",friendUid,"workouts"),orderBy("startedAt","desc"),limit(30));
    const snap=await getDocs(q);
    const list=snap.docs.map(d=>({id:d.id,...d.data()})).filter(w=>!isEmptyWorkout(w));

    $("friendWorkoutCount").textContent=String(list.length);
    $("friendSetCount").textContent=String(list.reduce((n,w)=>n+workoutSetCount(w),0));
    const names=new Set();
    list.forEach(w=>(w.exercises||[]).forEach(ex=>names.add(ex.name)));
    $("friendExerciseCount").textContent=String(names.size);

    renderReadOnlyFriendWorkouts($("friendWorkoutList"),list);
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){
    console.error(err);
    $("friendWorkoutList").className="list empty";
    $("friendWorkoutList").textContent="Could not load this friend's shared progress.";
  }
}

function renderReadOnlyFriendWorkouts(container,list){
  container.innerHTML="";
  container.classList.remove("empty");

  if(!list.length){
    container.classList.add("empty");
    container.textContent="No workouts shared yet.";
    return;
  }

  list.forEach(w=>{
    const d=toDate(w.startedAt);
    const sets=workoutSetCount(w);
    const card=document.createElement("article");
    card.className="workout-card readonly-card";
    const details=(w.exercises||[]).map(ex=>`
      <div class="exercise-summary-row">
        <strong>${ex.name}</strong>
        <div class="set-summary">${compactSetText(ex)||"No set details"}</div>
      </div>`).join("");

    card.innerHTML=`
      <div class="workout-top-line">
        <div>
          <h4>${d?d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Workout"}</h4>
          <span class="muted mini">${d?d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}</span>
        </div>
        <span class="pill">Read only</span>
      </div>
      <div class="summary">
        <span class="pill">${w.exercises?.length||0} exercises</span>
        <span class="pill">${sets} sets</span>
      </div>
      <div class="exercise-summary">${details}</div>`;
    container.appendChild(card);
  });
}

$("closeFriendProgressBtn").addEventListener("click",()=>{
  $("friendProgressPanel").classList.add("hidden");
});

async function removeConnection(friendUid){
  if(!confirm("Remove this friend connection? You will no longer be able to view each other's shared progress."))return;
  try{
    const batch=writeBatch(db);
    batch.delete(doc(db,"connections",`${friendUid}_${user.uid}`));
    batch.delete(doc(db,"connections",`${user.uid}_${friendUid}`));
    await batch.commit();
    $("friendProgressPanel").classList.add("hidden");
    await loadApprovedConnections();
    showToast("Friend removed.","success");
  }catch(err){
    console.error(err);
    showToast("Could not remove friend.","error");
  }
}

function renderCategories(){
  const grid=$("categoryGrid");grid.innerHTML="";
  for(const [category,items] of Object.entries(EXERCISES)){
    const btn=document.createElement("button");
    btn.className="category";
    btn.dataset.category=category;
    btn.innerHTML=`
      <div class="category-art">${categoryArtwork(category)}</div>
      <div class="category-copy">
        <strong>${category}</strong>
        <span>${items.length} exercises</span>
      </div>`;
    btn.addEventListener("click",()=>openCategory(category));
    grid.appendChild(btn);
  }
}
function showCategoryView(){
  $("categoryView").classList.remove("hidden");
  $("exerciseView").classList.add("hidden");
  $("activeView").classList.add("hidden");
  $("workoutTop").classList.toggle("hidden",!workout);
  if(workout)$("workoutStatus").textContent=`${workout.exercises.length} exercise${workout.exercises.length===1?"":"s"} completed`;
  renderCategories();
}
$("startWorkoutBtn").addEventListener("click",()=>{showScreen("workout");showCategoryView()});
$("backBtn").addEventListener("click",showCategoryView);

function openCategory(category){
  $("categoryView").classList.add("hidden");$("exerciseView").classList.remove("hidden");$("activeView").classList.add("hidden");
  $("categoryTitle").textContent=category;
  const grid=$("exerciseGrid");grid.innerHTML="";
  EXERCISES[category].forEach(item=>{
    const btn=document.createElement("button");btn.className="exercise";
    btn.dataset.category=category;btn.innerHTML=`${machineArtwork(item,category)}<div class="exercise-info"><strong>${item.name}</strong><span>${category} • ${item.type}${item.independent?" • Independent arms":""}</span></div>`;
    btn.addEventListener("click",()=>startExercise(category,item));
    grid.appendChild(btn);
  });
}

function exerciseKey(name){return name.trim().toLowerCase();}
function getLastExerciseRecord(name){
  const key=exerciseKey(name);
  for(const w of workoutsCache){
    const matches=(w.exercises||[]).filter(ex=>exerciseKey(ex.name||"")===key);
    if(matches.length){
      const ex=matches[0];
      const firstSet=(ex.sets||[])[0];
      if(firstSet)return {weight:Number(firstSet.weight||0),reps:Number(firstSet.reps||8),weightMode:ex.weightMode||"total"};
    }
  }
  return null;
}
function getDefaultWeight(name){
  const last=getLastExerciseRecord(name);
  return last&&last.weight>0?last.weight:30;
}
function getDefaultReps(name){
  const last=getLastExerciseRecord(name);
  return last&&last.reps>0?last.reps:8;
}

function startExercise(category,item){
  if(!workout){workout={startedAt:new Date(),exercises:[]};startTimer();}
  const last=getLastExerciseRecord(item.name);
  const defaultWeight=getDefaultWeight(item.name);
  const defaultReps=getDefaultReps(item.name);
  activeExercise={
    category,name:item.name,type:item.type,independent:Boolean(item.independent),
    weightMode:item.independent?(last?.weightMode||"perArm"):"total",
    sets:[
      {weight:defaultWeight,reps:defaultReps,done:false},
      {weight:defaultWeight,reps:defaultReps,done:false},
      {weight:defaultWeight,reps:defaultReps,done:false}
    ]
  };
  $("lastWeightHint").textContent=last?`Last saved: ${last.weight} ${(last.weightMode||"total")==="perArm"?"lb/arm":"lb"} × ${last.reps}`:"First time: starting at 30 lb";
  renderActiveExercise();
}
function renderActiveExercise(){
  $("categoryView").classList.add("hidden");$("exerciseView").classList.add("hidden");$("activeView").classList.remove("hidden");
  $("activeExerciseMeta").textContent=`${activeExercise.category.toUpperCase()} • ${activeExercise.type}`;
  $("activeExerciseName").textContent=activeExercise.name;
  $("weightModeWrap").classList.toggle("hidden",!activeExercise.independent);
  $("perArmBtn").classList.toggle("active",activeExercise.weightMode==="perArm");
  $("totalBtn").classList.toggle("active",activeExercise.weightMode==="total");
  renderSets();
}
$("perArmBtn").addEventListener("click",()=>{activeExercise.weightMode="perArm";renderActiveExercise()});
$("totalBtn").addEventListener("click",()=>{activeExercise.weightMode="total";renderActiveExercise()});

function renderCurrentWorkoutSummary(){
  const box=$("currentWorkoutSummary");
  const list=$("currentWorkoutItems");
  const count=$("currentWorkoutCount");
  if(!box||!list||!count)return;

  const rows=(workout?.exercises||[]).map(ex=>({
    name:ex.name, sets:(ex.sets||[]).length, active:false
  }));

  if(activeExercise){
    rows.push({name:activeExercise.name,sets:(activeExercise.sets||[]).length,active:true});
  }

  if(!workout&&!activeExercise){
    box.classList.add("hidden");
    list.innerHTML="";
    count.textContent="0 exercises";
    return;
  }

  box.classList.remove("hidden");
  count.textContent=`${rows.length} exercise${rows.length===1?"":"s"}`;
  list.innerHTML=rows.length?rows.map(r=>`
    <div class="current-workout-chip">
      <span><strong>${r.name}</strong><small> • ${r.sets} set${r.sets===1?"":"s"}</small></span>
      <span class="${r.active?"active-now":"complete"}">${r.active?"In progress":"✓ Added"}</span>
    </div>`).join(""):`<div class="empty">Choose a body part and your first exercise below.</div>`;
}

function adjustWeight(setIndex,delta){
  const set=activeExercise.sets[setIndex];
  set.weight=Math.max(0,Number(set.weight||0)+delta);
  renderSets();
}

function adjustReps(setIndex,delta){
  const set=activeExercise.sets[setIndex];
  set.reps=Math.max(0,Number(set.reps||0)+delta);
  renderSets();
}

function renderSets(){
  renderCurrentWorkoutSummary();
  const list=$("setList");list.innerHTML="";
  activeExercise.sets.forEach((set,index)=>{
    const row=document.createElement("div");row.className="set-row";
    row.innerHTML=`
      <div class="set-num">${index+1}</div>
      <div>
        <div class="weight-stepper">
          <button class="round-step minus" type="button" aria-label="Decrease weight">−</button>
          <input class="weight-center" type="number" min="0" step="1" value="${Number(set.weight||0)}" aria-label="Manual weight input">
          <button class="round-step plus" type="button" aria-label="Increase weight">+</button>
        </div>
        <span class="weight-unit-label">${activeExercise.weightMode==="perArm"?"lb / arm":"lb"}</span>
      </div>
      <div>
        <div class="rep-stepper">
          <button class="rep-step rep-minus" type="button" aria-label="Decrease reps">−</button>
          <input class="rep-center" type="number" min="0" step="1" value="${Number(set.reps||0)}" aria-label="Manual reps input">
          <button class="rep-step rep-plus" type="button" aria-label="Increase reps">+</button>
        </div>
        <span class="rep-unit-label">reps</span>
      </div>
      <button class="check ${set.done?"done":""}" type="button">${set.done?"✓":"○"}</button>
    `;
    row.querySelector(".minus").addEventListener("click",()=>adjustWeight(index,-5));
    row.querySelector(".plus").addEventListener("click",()=>adjustWeight(index,5));
    row.querySelector(".rep-minus").addEventListener("click",()=>adjustReps(index,-1));
    row.querySelector(".rep-plus").addEventListener("click",()=>adjustReps(index,1));

    const inputs=row.querySelectorAll("input");
    inputs[0].addEventListener("input",e=>set.weight=Number(e.target.value||0));
    inputs[1].addEventListener("input",e=>set.reps=Number(e.target.value||0));
    row.querySelector(".check").addEventListener("click",()=>{set.done=!set.done;renderSets()});
    list.appendChild(row);
  });
}
$("addSetBtn").addEventListener("click",()=>{
  const last=activeExercise.sets[activeExercise.sets.length-1]||{weight:30,reps:8};
  activeExercise.sets.push({weight:Number(last.weight||30),reps:Number(last.reps||8),done:false});
  renderSets();
});
$("removeCurrentExerciseBtn").addEventListener("click",()=>{activeExercise=null;showCategoryView()});
$("finishThisExerciseBtn").addEventListener("click",()=>{
  const entered=activeExercise.sets.filter(s=>Number(s.weight||0)>0||Number(s.reps||0)>0);
  if(!entered.length){showToast("Enter at least one set first.","error");return}
  workout.exercises.push({...activeExercise,completed:true,sets:entered.map(s=>({weight:Number(s.weight||0),reps:Number(s.reps||0),done:Boolean(s.done)}))});
  activeExercise=null;showCategoryView();
  showToast("Exercise finished. Choose the next body part or finish the whole workout.","success");
});
$("finishWholeWorkoutBtn").addEventListener("click",async()=>{
  if(activeExercise){
    showToast("Finish or remove the current exercise before finishing the whole workout.","error");
    return;
  }

  if(!workout||!workout.exercises.length||workout.exercises.every(ex=>!(ex.sets||[]).length)){
    showToast("A workout needs at least one completed exercise with a set.","error");
    return;
  }

  const endedAt=new Date();

  // SAVE is isolated from all later UI refreshing.
  try{
    await addDoc(collection(db,"users",user.uid,"workouts"),{
      startedAt:workout.startedAt,
      endedAt,
      createdAt:serverTimestamp(),
      durationSeconds:Math.max(1,Math.round((endedAt-workout.startedAt)/1000)),
      exerciseCount:workout.exercises.length,
      exercises:workout.exercises
    });
  }catch(err){
    console.error("Workout save failed:",err);
    showToast(`Could not save workout (${err.code||"unknown error"}).`,"error");
    return;
  }

  // At this point the workout is definitely saved.
  workout=null;
  activeExercise=null;
  stopTimer();
  showScreen("home");
  showToast("Workout saved to your cloud account.","success");

  // Refresh data AFTER success. A refresh failure must never be reported as a save failure.
  try{
    await loadAllData();
  }catch(err){
    console.error("Workout saved, but refresh failed:",err);
    showToast("Workout saved. Refresh the page if the new history does not appear yet.","success");
  }
});
$("cancelWorkoutBtn").addEventListener("click",()=>{
  if(!confirm("Cancel the whole workout? Unsaved data will be lost."))return;
  workout=null;activeExercise=null;stopTimer();showCategoryView();
});

function startTimer(){stopTimer();timerHandle=setInterval(updateTimer,1000);updateTimer()}
function stopTimer(){if(timerHandle)clearInterval(timerHandle);timerHandle=null}
function updateTimer(){
  if(!workout)return;
  const seconds=Math.floor((Date.now()-workout.startedAt.getTime())/1000);
  $("timer").textContent=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}

async function loadAllData(){
  await Promise.all([loadWorkouts(),loadCalendarStatuses(),loadBodyWeights(),loadMeals(),loadCalorieSettings()]);
  const visible = visibleWorkouts();
  renderWorkoutList($("recentList"),visible.slice(0,5));
  renderWorkoutList($("historyList"),visible);
  updateMetrics();updateProgressMetrics();renderCalendar();renderBodyWeightProfile();renderProgressControls();renderAllCharts();renderCaloriesForSelectedDate();
}

async function loadWorkouts(){
  if(!user)return;
  const q=query(collection(db,"users",user.uid,"workouts"),orderBy("startedAt","desc"),limit(300));
  const snap=await getDocs(q);
  workoutsCache=snap.docs.map(d=>({id:d.id,...d.data()}));
}
async function loadCalendarStatuses(){
  if(!user)return;
  calendarStatuses={};
  const snap=await getDocs(collection(db,"users",user.uid,"calendarDays"));
  snap.docs.forEach(d=>calendarStatuses[d.id]=d.data());
}

async function loadBodyWeights(){
  if(!user)return;
  const q=query(collection(db,"users",user.uid,"bodyWeights"),orderBy("loggedAt","desc"),limit(200));
  const snap=await getDocs(q);
  bodyWeightCache=snap.docs.map(d=>({id:d.id,...d.data()}));
}

async function loadMeals(){
  if(!user)return;
  const q=query(collection(db,"users",user.uid,"meals"),orderBy("mealDate","desc"),limit(500));
  const snap=await getDocs(q);
  mealCache=snap.docs.map(d=>({id:d.id,...d.data()}));
}

async function loadCalorieSettings(){
  if(!user)return;
  try{
    const snap=await getDoc(doc(db,"users",user.uid,"settings","nutrition"));
    calorieTarget=snap.exists()?Number(snap.data().dailyCalorieTarget||0):0;
  }catch(err){
    console.error(err);
    calorieTarget=0;
  }
}



function localDateKey(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function localDateFromKey(key){
  const [y,m,d]=key.split("-").map(Number);
  return new Date(y,m-1,d);
}

function initializeCaloriesScreen(){
  if(!$("calorieEntryDate"))return;
  const key=localDateKey(calorieSelectedDate);
  $("calorieEntryDate").value=key;
  if(!$("mealTimeInput").value){
    const now=new Date();
    $("mealTimeInput").value=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  }
  renderCaloriesForSelectedDate();
}

$("calorieEntryDate").addEventListener("change",()=>{
  if(!$("calorieEntryDate").value)return;
  calorieSelectedDate=localDateFromKey($("calorieEntryDate").value);
  renderCaloriesForSelectedDate();
});

$("saveCalorieTargetBtn").addEventListener("click",async()=>{
  const value=Number($("dailyCalorieTargetInput").value||0);
  if(value<0){showToast("Enter a valid calorie target.","error");return}
  try{
    await setDoc(doc(db,"users",user.uid,"settings","nutrition"),{
      dailyCalorieTarget:value,
      updatedAt:serverTimestamp()
    },{merge:true});
    calorieTarget=value;
    $("dailyCalorieTargetInput").value="";
    renderCaloriesForSelectedDate();
    showToast(value>0?"Daily calorie target saved.":"Daily target cleared.","success");
  }catch(err){
    console.error(err);
    showToast("Could not save calorie target. Check Firestore rules.","error");
  }
});

$("saveMealBtn").addEventListener("click",async()=>{
  const name=$("mealNameInput").value.trim();
  const calories=Number($("mealCaloriesInput").value||0);
  const dateKey=$("calorieEntryDate").value||localDateKey(new Date());
  const time=$("mealTimeInput").value||"";
  if(!name){showToast("Enter the meal or food name.","error");return}
  if(calories<=0){showToast("Enter calories greater than 0.","error");return}
  try{
    await addDoc(collection(db,"users",user.uid,"meals"),{
      name,
      calories,
      mealDate:dateKey,
      mealTime:time,
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
    $("mealNameInput").value="";
    $("mealCaloriesInput").value="";
    await loadMeals();
    calorieSelectedDate=localDateFromKey(dateKey);
    renderCaloriesForSelectedDate();
    showToast("Meal added.","success");
  }catch(err){
    console.error(err);
    showToast("Could not save meal. Check Firestore rules.","error");
  }
});

function mealsForDate(key){
  return mealCache
    .filter(m=>m.mealDate===key)
    .sort((a,b)=>(a.mealTime||"").localeCompare(b.mealTime||""));
}

function prettyMealTime(value){
  if(!value)return "Time not set";
  const [h,m]=value.split(":").map(Number);
  const d=new Date();
  d.setHours(h,m,0,0);
  return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
}

function renderCaloriesForSelectedDate(){
  if(!$("mealList"))return;
  const key=localDateKey(calorieSelectedDate);
  const date=localDateFromKey(key);
  const todayKey=localDateKey(new Date());
  const label=key===todayKey?"Today":date.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});
  $("calorieSelectedDateLabel").textContent=label;
  $("mealListDateLabel").textContent=label;

  if($("calorieEntryDate").value!==key)$("calorieEntryDate").value=key;

  const meals=mealsForDate(key);
  const total=meals.reduce((sum,m)=>sum+Number(m.calories||0),0);
  $("calorieDayTotal").textContent=Math.round(total);

  if(calorieTarget>0){
    $("currentCalorieTargetText").textContent=`Current target: ${Math.round(calorieTarget)} kcal/day`;
    const remaining=calorieTarget-total;
    $("calorieRemainingText").textContent=remaining>=0
      ? `${Math.round(remaining)} kcal remaining`
      : `${Math.abs(Math.round(remaining))} kcal over target`;
    $("calorieProgressFill").style.width=`${Math.min(100,(total/calorieTarget)*100)}%`;
  }else{
    $("currentCalorieTargetText").textContent="No target set.";
    $("calorieRemainingText").textContent="No daily target set.";
    $("calorieProgressFill").style.width="0%";
  }

  const wrap=$("mealList");
  wrap.innerHTML="";
  wrap.classList.remove("empty");
  if(!meals.length){
    wrap.classList.add("empty");
    wrap.textContent="No meals logged for this day.";
    return;
  }

  meals.forEach(meal=>{
    const row=document.createElement("div");
    row.className="meal-row";
    row.innerHTML=`
      <div class="meal-main">
        <strong>${meal.name}</strong>
        <span>${prettyMealTime(meal.mealTime)}</span>
      </div>
      <div class="meal-calories">${Math.round(Number(meal.calories||0))} kcal</div>
      <div class="meal-actions">
        <button class="meal-action-btn edit" type="button">Edit</button>
        <button class="meal-action-btn delete" type="button">Delete</button>
      </div>
    `;
    row.querySelector(".edit").addEventListener("click",()=>editMeal(meal));
    row.querySelector(".delete").addEventListener("click",()=>deleteMeal(meal));
    wrap.appendChild(row);
  });
}

async function editMeal(meal){
  const newName=prompt("Meal / food name:",meal.name||"");
  if(newName===null)return;
  const newCaloriesText=prompt("Calories:",String(Number(meal.calories||0)));
  if(newCaloriesText===null)return;
  const newCalories=Number(newCaloriesText);
  if(!newName.trim()||newCalories<=0){showToast("Meal name and calories are required.","error");return}
  try{
    await updateDoc(doc(db,"users",user.uid,"meals",meal.id),{
      name:newName.trim(),
      calories:newCalories,
      updatedAt:serverTimestamp()
    });
    await loadMeals();
    renderCaloriesForSelectedDate();
    showToast("Meal updated.","success");
  }catch(err){
    console.error(err);
    showToast("Could not update meal.","error");
  }
}

async function deleteMeal(meal){
  if(!confirm(`Delete "${meal.name}"?`))return;
  try{
    await deleteDoc(doc(db,"users",user.uid,"meals",meal.id));
    await loadMeals();
    renderCaloriesForSelectedDate();
    showToast("Meal deleted.","success");
  }catch(err){
    console.error(err);
    showToast("Could not delete meal.","error");
  }
}


$("saveBodyWeightBtn").addEventListener("click",async()=>{
  const value=Number($("bodyWeightInput").value||0);
  if(value<=0){showToast("Enter a valid body weight.","error");return}
  try{
    await addDoc(collection(db,"users",user.uid,"bodyWeights"),{
      weight:value,
      unit:"lb",
      loggedAt:new Date(),
      createdAt:serverTimestamp()
    });
    $("bodyWeightInput").value="";
    await loadBodyWeights();
    renderBodyWeightProfile();
    renderAllCharts();
    showToast("Body weight saved.","success");
  }catch(err){console.error(err);showToast("Could not save body weight. Check Firestore rules.","error")}
});

function renderBodyWeightProfile(){
  const latest=$("latestBodyWeight"),wrap=$("bodyWeightHistory");
  if(!latest||!wrap)return;
  if(!bodyWeightCache.length){
    latest.textContent="No body weight logged yet.";
    wrap.className="weight-history empty";
    wrap.textContent="No entries yet.";
    return;
  }
  const newest=bodyWeightCache[0];
  latest.textContent=`Latest: ${Number(newest.weight).toFixed(1)} ${newest.unit||"lb"}`;
  wrap.className="weight-history";
  wrap.innerHTML="";
  bodyWeightCache.slice(0,10).forEach(entry=>{
    const d=toDate(entry.loggedAt);
    const row=document.createElement("div");
    row.className="weight-history-row";
    row.innerHTML=`<strong>${Number(entry.weight).toFixed(1)} ${entry.unit||"lb"}</strong><span class="muted mini">${d?d.toLocaleDateString():""}</span>`;
    wrap.appendChild(row);
  });
}

let charts={};

function destroyChart(name){
  if(charts[name]){charts[name].destroy();charts[name]=null}
}

function renderProgressControls(){
  const select=$("progressExerciseSelect");
  if(!select)return;
  const names=[...new Set(visibleWorkouts().flatMap(w=>(w.exercises||[]).map(ex=>ex.name)).filter(Boolean))].sort();
  const current=select.value;
  select.innerHTML="";
  if(!names.length){
    const opt=document.createElement("option");
    opt.value="";
    opt.textContent="No exercise history yet";
    select.appendChild(opt);
    return;
  }
  names.forEach(name=>{
    const opt=document.createElement("option");
    opt.value=name;opt.textContent=name;select.appendChild(opt);
  });
  if(current&&names.includes(current))select.value=current;
}

$("progressExerciseSelect").addEventListener("change",()=>{
  renderAllCharts();
  updateSelectedExerciseMetrics();
});

function exerciseHistory(name){
  const rows=[];
  visibleWorkouts().slice().reverse().forEach(w=>{
    const d=toDate(w.startedAt);
    (w.exercises||[]).filter(ex=>ex.name===name).forEach(ex=>{
      const sets=ex.sets||[];
      if(!sets.length)return;
      const maxSet=sets.reduce((best,s)=>Number(s.weight||0)>Number(best.weight||0)?s:best,sets[0]);
      const totalVolume=sets.reduce((sum,s)=>sum+(Number(s.weight||0)*Number(s.reps||0)),0);
      const best1rm=Math.max(...sets.map(s=>{
        const wt=Number(s.weight||0),reps=Number(s.reps||0);
        return wt>0?wt*(1+reps/30):0;
      }));
      rows.push({
        date:d,
        weight:Number(maxSet.weight||0),
        reps:Number(maxSet.reps||0),
        volume:totalVolume,
        oneRm:best1rm
      });
    });
  });
  return rows;
}


function updateSelectedExerciseMetrics(){
  const select=$("progressExerciseSelect");
  const name=select?.value||"";
  const hist=name?exerciseHistory(name):[];
  const unit=weightUnitLabel();

  if($("progressBestWeight")){
    const best=hist.length?Math.max(...hist.map(r=>Number(r.weight)||0)):0;
    $("progressBestWeight").textContent=best?`${formatNumber(best)} ${unit}`:"—";
  }

  if($("progressBestOneRm")){
    const best=hist.length?Math.max(...hist.map(r=>Number(r.oneRm)||0)):0;
    $("progressBestOneRm").textContent=best?`${formatNumber(best)} ${unit}`:"—";
  }
}

function chartDefaults(){
  return {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{legend:{labels:{color:"#cbd5e1"}}},
    scales:{
      x:{ticks:{color:"#7f8ba0"},grid:{color:"#ffffff08"}},
      y:{ticks:{color:"#7f8ba0"},grid:{color:"#ffffff08"}}
    }
  };
}

function renderAllCharts(){
  updateSelectedExerciseMetrics();
  if(typeof Chart==="undefined")return;
  const select=$("progressExerciseSelect");
  const name=select?.value||"";
  const hist=name?exerciseHistory(name):[];
  const labels=hist.map(r=>r.date?r.date.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"");

  destroyChart("strength");
  destroyChart("volume");
  destroyChart("oneRm");
  destroyChart("bodyWeight");
  destroyChart("frequency");

  if($("strengthChart")){
    charts.strength=new Chart($("strengthChart"),{
      type:"line",
      data:{labels,datasets:[
        {label:"Weight",data:hist.map(r=>r.weight),tension:.3},
        {label:"Reps",data:hist.map(r=>r.reps),tension:.3}
      ]},
      options:chartDefaults()
    });
  }

  if($("volumeChart")){
    charts.volume=new Chart($("volumeChart"),{
      type:"bar",
      data:{labels,datasets:[{label:"Volume",data:hist.map(r=>r.volume)}]},
      options:chartDefaults()
    });
  }

  if($("oneRmChart")){
    charts.oneRm=new Chart($("oneRmChart"),{
      type:"line",
      data:{labels,datasets:[{label:"Estimated 1RM",data:hist.map(r=>Math.round(r.oneRm*10)/10),tension:.3}]},
      options:chartDefaults()
    });
  }

  if($("bodyWeightChart")){
    const bw=bodyWeightCache.slice().reverse();
    charts.bodyWeight=new Chart($("bodyWeightChart"),{
      type:"line",
      data:{labels:bw.map(x=>{const d=toDate(x.loggedAt);return d?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):""}),datasets:[{label:"Body weight",data:bw.map(x=>Number(x.weight||0)),tension:.3}]},
      options:chartDefaults()
    });
  }

  if($("frequencyChart")){
    const weekly={};
    visibleWorkouts().forEach(w=>{
      const d=toDate(w.startedAt);
      if(!d)return;
      const monday=new Date(d);
      const day=(monday.getDay()+6)%7;
      monday.setDate(monday.getDate()-day);
      monday.setHours(0,0,0,0);
      const key=monday.toISOString().slice(0,10);
      weekly[key]=(weekly[key]||0)+1;
    });
    const keys=Object.keys(weekly).sort();
    charts.frequency=new Chart($("frequencyChart"),{
      type:"bar",
      data:{labels:keys.map(k=>new Date(k+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"})),datasets:[{label:"Workouts",data:keys.map(k=>weekly[k])}]},
      options:chartDefaults()
    });
  }
}



function workoutSetCount(w){
  return (w.exercises||[]).reduce((sum,ex)=>sum+(ex.sets?.length||0),0);
}

function isEmptyWorkout(w){
  return !(w.exercises||[]).length || workoutSetCount(w)===0;
}

function visibleWorkouts(){
  return workoutsCache.filter(w=>!isEmptyWorkout(w));
}

function compactSetText(exercise){
  if(exercise.cardio){
    const c=exercise.cardio;
    const parts=[];
    if(c.time)parts.push(c.time);
    else if(Number(c.timeMinutes||0)>0||Number(c.timeSeconds||0)>0)parts.push(`${Number(c.timeMinutes||0)}:${String(Number(c.timeSeconds||0)).padStart(2,"0")}`);
    if(c.distance)parts.push(`${c.distance} distance`);
    if(c.incline!=="")parts.push(`incline ${c.incline}`);
    if(c.stairs)parts.push(`${c.stairs} stairs`);
    if(c.level)parts.push(`level ${c.level}`);
    return parts.join(" • ")||"Cardio";
  }
  const unit=(exercise.weightMode||"total")==="perArm"?"lb/arm":"lb";
  return (exercise.sets||[]).map(set=>`${Number(set.weight||0)} ${unit} × ${Number(set.reps||0)}`).join(" • ");
}
function renderWorkoutList(container,list){
  container.innerHTML="";container.classList.remove("empty");
  if(!list.length){container.classList.add("empty");container.textContent="No workouts saved yet.";return}
  list.forEach(w=>{
    const d=toDate(w.startedAt);
    const sets=(w.exercises||[]).reduce((n,ex)=>n+(ex.sets?.length||0),0);
    const mins=Math.max(1,Math.round((w.durationSeconds||0)/60));
    const details=(w.exercises||[]).map(ex=>`<div class="exercise-summary-row"><strong>${ex.name}</strong><div class="set-summary">${compactSetText(ex)||"No set details"}</div></div>`).join("");
    const card=document.createElement("article");card.className="workout-card";
    card.innerHTML=`<div class="workout-top-line"><div><h4>${d?d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Workout"}</h4><span class="muted mini">${d?d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):""}</span></div><span class="pill">${mins} min</span></div><div class="summary"><span class="pill">${w.exercises?.length||0} exercises</span><span class="pill">${sets} sets</span><span class="pill">Tap to edit</span></div><div class="exercise-summary">${details}</div>`;
    card.addEventListener("click",()=>openEditWorkout(w));container.appendChild(card);
  });
}
function updateMetrics(){
  const visible=visibleWorkouts();
  $("workoutCount").textContent=visible.length;
  $("streakCount").textContent=calculateStreak(visible);
  if(visible.length){
    const latest=visible[0],d=toDate(latest.startedAt);
    $("lastWorkoutMetric").textContent=latest.exercises?.length||0;
    $("lastWorkoutDate").textContent=d?d.toLocaleDateString(undefined,{month:"short",day:"numeric"}):"Saved";
  }else{$("lastWorkoutMetric").textContent="—";$("lastWorkoutDate").textContent="No workouts"}
}
function updateProgressMetrics(){
  const visible=visibleWorkouts();
  $("progressWorkoutCount").textContent=visible.length;
  $("progressSetCount").textContent=visible.reduce((n,w)=>n+(w.exercises||[]).reduce((m,e)=>m+(e.sets?.length||0),0),0);
  const names=new Set();visible.forEach(w=>(w.exercises||[]).forEach(e=>names.add(e.name)));
  $("progressExerciseCount").textContent=names.size;
}
function calculateStreak(list){
  if(!list.length)return 0;
  const days=[...new Set(list.map(w=>{const d=toDate(w.startedAt);return d?new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime():null}).filter(Boolean))].sort((a,b)=>b-a);
  if(!days.length)return 0;
  const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),one=86400000;
  if(today-days[0]>one)return 0;
  let streak=1;
  for(let i=1;i<days.length;i++){const diff=Math.round((days[i-1]-days[i])/one);if(diff===1)streak++;else if(diff>1)break}
  return streak;
}

document.querySelectorAll(".history-tab").forEach(btn=>btn.addEventListener("click",()=>showHistoryPanel(btn.dataset.history)));
function showHistoryPanel(name){
  document.querySelectorAll(".history-tab").forEach(btn=>btn.classList.toggle("active",btn.dataset.history===name));
  ["calendarPanel","workoutsPanel","progressPanel"].forEach(id=>$(id).classList.add("hidden"));
  $(`${name}Panel`).classList.remove("hidden");
  if(name==="workouts")renderWorkoutList($("historyList"),visibleWorkouts());
  if(name==="calendar")renderCalendar();
}
$("prevMonthBtn").addEventListener("click",()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()});
$("nextMonthBtn").addEventListener("click",()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()});

function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function workoutMap(){
  const map={};
  visibleWorkouts().forEach(w=>{const d=toDate(w.startedAt);if(!d)return;const key=dateKey(d);(map[key]||=[]).push(w)});
  return map;
}
function inferredStatusForDate(d,map){
  const key=dateKey(d);
  if(map[key]?.length)return "workout";
  const manual=calendarStatuses[key]?.status;
  if(manual==="rest"||manual==="missed")return manual;
  const today=new Date(),todayStart=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const dayStart=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  if(dayStart<todayStart)return "missed";
  return "clear";
}
function renderCalendar(){
  const grid=$("calendarGrid");if(!grid)return;
  const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
  $("calendarTitle").textContent=new Date(year,month,1).toLocaleDateString(undefined,{month:"long",year:"numeric"});
  grid.innerHTML="";
  const map=workoutMap();
  const first=new Date(year,month,1),start=new Date(year,month,1-first.getDay());
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const key=dateKey(d),status=inferredStatusForDate(d,map);
    const btn=document.createElement("button");btn.className="calendar-day";
    if(d.getMonth()!==month)btn.classList.add("other");
    if(key===dateKey(new Date()))btn.classList.add("today");
    if(status==="workout")btn.classList.add("workout-day");
    if(status==="rest")btn.classList.add("rest-day");
    if(status==="missed")btn.classList.add("missed-day");
    if(selectedCalendarKey===key)btn.classList.add("selected");
    btn.textContent=d.getDate();
    btn.addEventListener("click",()=>selectCalendarDay(d,map[key]||[]));
    grid.appendChild(btn);
  }
}
function selectCalendarDay(d,dayWorkouts){
  selectedCalendarKey=dateKey(d);renderCalendar();
  $("selectedDayHeading").innerHTML=`<h3>${d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</h3>`;
  $("dayStatusControls").classList.remove("hidden");
  const hasWorkout=dayWorkouts.length>0;
  $("markRestBtn").disabled=hasWorkout;
  $("markMissedBtn").disabled=hasWorkout;
  $("clearStatusBtn").disabled=hasWorkout;
  const wrap=$("selectedDayWorkouts");wrap.innerHTML="";
  if(hasWorkout){
    const note=document.createElement("p");note.className="muted";note.textContent="Workout is saved on this day, so its status is automatically Workout.";wrap.appendChild(note);
    dayWorkouts.forEach(w=>{
      const div=document.createElement("div");div.className="exercise-summary";
      div.innerHTML=(w.exercises||[]).map(ex=>`<div class="exercise-summary-row"><strong>${ex.name}</strong><div class="set-summary">${compactSetText(ex)}</div></div>`).join("");
      div.addEventListener("click",()=>openEditWorkout(w));wrap.appendChild(div);
    });
  }else{
    const status=inferredStatusForDate(d,workoutMap());
    const p=document.createElement("p");p.className="muted";
    p.textContent=status==="rest"?"Marked as Rest Day.":status==="missed"?"Marked as Missed Day.":"No status set.";
    wrap.appendChild(p);
  }
}
async function setSelectedDayStatus(status){
  if(!selectedCalendarKey||!user)return;
  try{
    const ref=doc(db,"users",user.uid,"calendarDays",selectedCalendarKey);
    if(status==="clear"){
      await deleteDoc(ref);
      delete calendarStatuses[selectedCalendarKey];
    }else{
      await setDoc(ref,{status,updatedAt:serverTimestamp()},{merge:true});
      calendarStatuses[selectedCalendarKey]={status};
    }
    renderCalendar();
    const [y,m,d]=selectedCalendarKey.split("-").map(Number);
    selectCalendarDay(new Date(y,m-1,d),workoutMap()[selectedCalendarKey]||[]);
    showToast(status==="clear"?"Day status cleared.":status==="rest"?"Marked as Rest Day.":"Marked as Missed Day.","success");
  }catch(err){console.error(err);showToast("Could not save day status. Check Firestore rules.","error")}
}
$("markRestBtn").addEventListener("click",()=>setSelectedDayStatus("rest"));
$("markMissedBtn").addEventListener("click",()=>setSelectedDayStatus("missed"));
$("clearStatusBtn").addEventListener("click",()=>setSelectedDayStatus("clear"));

function openEditWorkout(w){
  editingWorkout={
    id:w.id,startedAtDate:toDate(w.startedAt),
    exercises:(w.exercises||[]).map(ex=>({...ex,weightMode:ex.weightMode||"total",sets:(ex.sets||[]).map(s=>({...s}))}))
  };
  $("editWorkoutTitle").textContent=editingWorkout.startedAtDate?.toLocaleString()||"Workout";
  $("editWorkoutDateTime").value=toLocalInputValue(editingWorkout.startedAtDate||new Date());
  renderEditExercises();$("editModal").classList.remove("hidden");
}
function closeEditModal(){$("editModal").classList.add("hidden");editingWorkout=null}
$("closeEditBtn").addEventListener("click",closeEditModal);$("editBackdrop").addEventListener("click",closeEditModal);
function renderEditExercises(){
  const list=$("editExerciseList");list.innerHTML="";
  editingWorkout.exercises.forEach((ex,exIndex)=>{
    const card=document.createElement("div");card.className="edit-exercise";
    const showMode=ex.independent||ex.type==="MTS";
    card.innerHTML=`<div class="row"><h4>${ex.name}</h4><button class="danger remove-edit-exercise" type="button">Remove Exercise</button></div>${showMode?`<div class="mode-toggle"><button class="mode ${ex.weightMode==="perArm"?"active":""}" data-mode="perArm">Per Arm</button><button class="mode ${ex.weightMode==="total"?"active":""}" data-mode="total">Total / Both Arms</button></div>`:""}<div class="edit-sets"></div><button class="secondary full add-edit-set" type="button">+ Add set</button>`;
    card.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>{ex.weightMode=btn.dataset.mode;renderEditExercises()}));
    card.querySelector(".remove-edit-exercise").addEventListener("click",()=>{
      editingWorkout.exercises.splice(exIndex,1);
      renderEditExercises();
    });
    const setsWrap=card.querySelector(".edit-sets");
    ex.sets.forEach((set,setIndex)=>{
      const row=document.createElement("div");row.className="edit-set-row";
      row.innerHTML=`<input type="number" min="0" step="1" value="${Number(set.weight||0)}"><input type="number" min="0" step="1" value="${Number(set.reps||0)}"><button class="delete-set" type="button">×</button>`;
      const ins=row.querySelectorAll("input");ins[0].addEventListener("input",e=>set.weight=Number(e.target.value||0));ins[1].addEventListener("input",e=>set.reps=Number(e.target.value||0));
      row.querySelector(".delete-set").addEventListener("click",()=>{ex.sets.splice(setIndex,1);renderEditExercises()});setsWrap.appendChild(row);
    });
    card.querySelector(".add-edit-set").addEventListener("click",()=>{ex.sets.push({weight:30,reps:8,done:true});renderEditExercises()});list.appendChild(card);
  });
}
$("saveWorkoutChangesBtn").addEventListener("click",async()=>{
  if(!editingWorkout)return;

  const hasData=editingWorkout.exercises.some(ex=>(ex.sets||[]).length>0);
  if(!editingWorkout.exercises.length||!hasData){
    const remove=confirm("This workout has no exercises or sets left. Delete the whole workout?");
    if(remove)await deleteEditingWorkout();
    return;
  }

  try{
    const newStart=new Date($("editWorkoutDateTime").value);
    await updateDoc(doc(db,"users",user.uid,"workouts",editingWorkout.id),{
      startedAt:Timestamp.fromDate(newStart),exercises:editingWorkout.exercises,
      exerciseCount:editingWorkout.exercises.length,updatedAt:serverTimestamp()
    });
    closeEditModal();await loadAllData();showToast("Workout changes saved.","success");
  }catch(err){console.error(err);showToast("Could not save workout changes.","error")}
});

async function deleteEditingWorkout(){
  if(!editingWorkout||!user)return;
  try{
    await deleteDoc(doc(db,"users",user.uid,"workouts",editingWorkout.id));
    closeEditModal();
    await loadAllData();
    showToast("Workout deleted.","success");
  }catch(err){
    console.error(err);
    showToast("Could not delete workout.","error");
  }
}

$("deleteWorkoutBtn").addEventListener("click",async()=>{
  if(!editingWorkout)return;
  if(!confirm("Delete this workout permanently? This cannot be undone."))return;
  await deleteEditingWorkout();
});



/* ===== TRACK IT IMPORT ===== */
let pendingTrackItImport=null;

function safeTrackItId(value,fallback="item"){
  return String(value||fallback).replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,120);
}

function validDate(value){
  if(!value)return null;
  const d=new Date(value);
  return Number.isNaN(d.getTime())?null:d;
}

function normalizeTrackItExerciseName(ex){
  const exercise=String(ex?.exercise||"").trim();
  const machine=String(ex?.machine||"").trim();
  const combined=`${exercise} ${machine}`.toLowerCase();

  if(combined.includes("hammer mts") && combined.includes("high row")) return "Hammer Strength MTS High Row";
  if(combined.includes("hammer mts") && combined.includes("chest press")) return "Hammer Strength MTS Chest Press";
  if(combined.includes("hammer mts") && combined.includes("shoulder")) return "Hammer Strength MTS Shoulder Press";
  if(combined.includes("pec deck")) return "Pec Deck / Chest Fly";
  if(combined.includes("triceps") && combined.includes("pressdown")) return "Triceps Pushdown";
  if(combined.includes("lat pulldown")) return "Lat Pulldown";
  if(combined.includes("machine shoulder press")) return "Shoulder Press";
  if(combined.includes("stair climber")) return "Stair Climber";
  if(combined.includes("treadmill")) return "Treadmill";
  if(combined.includes("elliptical")) return "Elliptical";
  if(combined.includes("rowing")) return "Rowing Machine";
  if(combined.includes("recumbent") && combined.includes("bike")) return "Recumbent Bike";
  if(combined.includes("bike")) return "Stationary Bike";

  return exercise||machine||"Imported Exercise";
}

function inferTrackItCategory(ex,name){
  const id=String(ex?.baseMachineId||ex?.machineId||"").toLowerCase();
  const n=String(name||"").toLowerCase();
  if(id.startsWith("chest")||n.includes("chest")||n.includes("pec deck"))return "Chest";
  if(id.startsWith("back")||n.includes("row")||n.includes("pulldown")||n.includes("pull-up")||n.includes("back"))return "Back";
  if(id.startsWith("shoulder")||n.includes("shoulder")||n.includes("lateral raise")||n.includes("rear delt"))return "Shoulders";
  if(id.startsWith("arms")||n.includes("biceps")||n.includes("curl")||n.includes("triceps")||n.includes("dip"))return "Arms";
  if(id.startsWith("legs")||id.startsWith("leg")||n.includes("leg")||n.includes("squat")||n.includes("calf")||n.includes("hip"))return "Legs";
  if(id.startsWith("core")||n.includes("ab")||n.includes("plank")||n.includes("torso"))return "Core";
  if(id.startsWith("cardio")||String(ex?.type||"").toLowerCase()==="cardio")return "Cardio";
  return "Arms";
}

function trackItWeightMode(ex){
  const mode=String(ex?.trackingMode||ex?.weightMode||"").toLowerCase();
  return mode.includes("per-arm")||mode.includes("per arm")||mode.includes("both-per-arm") ? "perArm" : "total";
}

function convertTrackItExercise(ex){
  const name=normalizeTrackItExerciseName(ex);
  const isCardio=String(ex?.type||"").toLowerCase()==="cardio" || Boolean(ex?.cardio);
  const sets=Array.isArray(ex?.sets)?ex.sets.map(s=>({
    weight:Number(s?.weight||0),
    reps:Number(s?.reps||0),
    done:true
  })).filter(s=>s.weight>0||s.reps>0):[];

  const converted={
    name,
    category:inferTrackItCategory(ex,name),
    type:isCardio?"Cardio":String(ex?.machine||ex?.type||"Imported"),
    independent:trackItWeightMode(ex)==="perArm",
    weightMode:trackItWeightMode(ex),
    completed:true,
    sets,
    legacyTrackIt:{
      exerciseId:String(ex?.id||""),
      machineId:String(ex?.machineId||""),
      baseMachineId:String(ex?.baseMachineId||""),
      machine:String(ex?.machine||""),
      trackingMode:String(ex?.trackingMode||"")
    }
  };

  if(isCardio){
    const c=ex.cardio||{};
    converted.cardio={
      timeMinutes:Number(c.timeMinutes||0),
      timeSeconds:Number(c.timeSeconds||0),
      time:String(c.time||""),
      distance:String(c.distance??""),
      incline:String(c.incline??""),
      pace:String(c.pace??""),
      stairs:String(c.stairs??""),
      level:String(c.level??"")
    };
  }
  return converted;
}

function convertTrackItWorkout(w,index){
  const started=validDate(w?.startedAt);
  const ended=validDate(w?.endedAt);
  if(!started)return null;

  const exercises=(Array.isArray(w?.exercises)?w.exercises:[])
    .map(convertTrackItExercise)
    .filter(ex=>(ex.sets?.length||0)>0 || ex.cardio);

  if(!exercises.length)return null;

  const durationSeconds=ended
    ?Math.max(1,Math.round((ended-started)/1000))
    :Math.max(1,exercises.length*60);

  return {
    docId:`trackit_${safeTrackItId(w?.id||`${started.toISOString()}_${index}`)}`,
    data:{
      startedAt:Timestamp.fromDate(started),
      endedAt:Timestamp.fromDate(ended||new Date(started.getTime()+durationSeconds*1000)),
      createdAt:serverTimestamp(),
      durationSeconds,
      exerciseCount:exercises.length,
      exercises,
      sourceApp:"Track IT",
      sourceWorkoutId:String(w?.id||""),
      importedAt:serverTimestamp()
    }
  };
}

function parseTrackItBodyWeights(raw){
  const list=Array.isArray(raw)?raw:[];
  return list.map((entry,index)=>{
    if(entry==null)return null;
    const obj=typeof entry==="number"?{weight:entry}:entry;
    const weight=Number(obj.weight??obj.value??obj.bodyWeight??0);
    const date=validDate(obj.loggedAt||obj.date||obj.createdAt||obj.timestamp);
    if(!(weight>0)||!date)return null;
    return {
      docId:`trackit_bw_${safeTrackItId(obj.id||`${date.toISOString()}_${index}`)}`,
      data:{
        weight,
        unit:String(obj.unit||"lb"),
        loggedAt:Timestamp.fromDate(date),
        createdAt:serverTimestamp(),
        sourceApp:"Track IT",
        importedAt:serverTimestamp()
      }
    };
  }).filter(Boolean);
}

function analyzeTrackItBackup(data){
  if(!data||typeof data!=="object"||!Array.isArray(data.workouts)){
    throw new Error("This does not look like a Track IT backup.");
  }

  const workouts=data.workouts.map(convertTrackItWorkout).filter(Boolean);
  const exercises=workouts.reduce((n,w)=>n+(w.data.exercises?.length||0),0);
  const bodyWeights=parseTrackItBodyWeights(data.bodyWeights);
  const calendarEntries=Object.entries(data.calendarStatuses||{})
    .filter(([date,status])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&["rest","missed","skipped"].includes(String(status).toLowerCase()));

  return {
    original:data,
    workouts,
    exercises,
    bodyWeights,
    calendarEntries,
    customMachines:Array.isArray(data.customMachines)?data.customMachines:[],
    unit:String(data.profile?.unit||"lb")
  };
}

function showTrackItPreview(parsed,fileName){
  pendingTrackItImport=parsed;
  $("trackItSelectedFile").textContent=fileName;
  $("trackItWorkoutCount").textContent=String(parsed.workouts.length);
  $("trackItExerciseCount").textContent=String(parsed.exercises);
  $("trackItBodyWeightCount").textContent=String(parsed.bodyWeights.length);
  $("trackItCalendarCount").textContent=String(parsed.calendarEntries.length);

  const cardioCount=parsed.workouts.reduce((n,w)=>n+w.data.exercises.filter(ex=>ex.cardio).length,0);
  const strengthCount=parsed.exercises-cardioCount;
  const notes=[
    `${strengthCount} strength exercise${strengthCount===1?"":"s"}`,
    `${cardioCount} cardio exercise${cardioCount===1?"":"s"}`,
    `${parsed.customMachines.length} custom machine${parsed.customMachines.length===1?"":"s"} found`,
    "Current MY GYM data will NOT be deleted",
    "Re-importing the same Track IT backup will update the same imported records instead of duplicating them"
  ];
  $("trackItPreviewNotes").innerHTML=notes.map(n=>`<div>✓ ${n}</div>`).join("");
  $("trackItPreview").classList.remove("hidden");
  $("trackItImportResult").classList.add("hidden");
  $("importTrackItBtn").disabled=parsed.workouts.length===0&&parsed.bodyWeights.length===0&&parsed.calendarEntries.length===0;
}

$("chooseTrackItFileBtn")?.addEventListener("click",()=>$("trackItFileInput").click());

$("trackItFileInput")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  try{
    const text=await file.text();
    const data=JSON.parse(text);
    const parsed=analyzeTrackItBackup(data);
    showTrackItPreview(parsed,file.name);
  }catch(err){
    console.error("Track IT preview failed:",err);
    pendingTrackItImport=null;
    $("trackItSelectedFile").textContent="Could not read this file";
    $("trackItPreview").classList.add("hidden");
    $("trackItImportResult").classList.remove("hidden");
    $("trackItImportResult").className="import-result error";
    $("trackItImportResult").textContent=err.message||"Could not read Track IT backup.";
  }
});

$("importTrackItBtn")?.addEventListener("click",async()=>{
  if(!user||!pendingTrackItImport)return;
  if(!confirm(`Merge ${pendingTrackItImport.workouts.length} Track IT workout${pendingTrackItImport.workouts.length===1?"":"s"} into your MY GYM account? Your existing MY GYM data will be kept.`))return;

  const btn=$("importTrackItBtn");
  const original=btn.textContent;
  btn.disabled=true;
  btn.textContent="Importing...";

  try{
    let workoutsImported=0,weightsImported=0,daysImported=0;

    for(const item of pendingTrackItImport.workouts){
      await setDoc(doc(db,"users",user.uid,"workouts",item.docId),item.data,{merge:true});
      workoutsImported++;
    }

    for(const item of pendingTrackItImport.bodyWeights){
      await setDoc(doc(db,"users",user.uid,"bodyWeights",item.docId),item.data,{merge:true});
      weightsImported++;
    }

    for(const [date,statusRaw] of pendingTrackItImport.calendarEntries){
      const status=String(statusRaw).toLowerCase()==="skipped"?"missed":String(statusRaw).toLowerCase();
      await setDoc(doc(db,"users",user.uid,"calendarDays",date),{
        status,
        sourceApp:"Track IT",
        importedAt:serverTimestamp()
      },{merge:true});
      daysImported++;
    }

    await loadAllData();

    $("trackItImportResult").classList.remove("hidden");
    $("trackItImportResult").className="import-result success";
    $("trackItImportResult").innerHTML=
      `<strong>Track IT import complete.</strong>
       <span>${workoutsImported} workouts • ${weightsImported} body weights • ${daysImported} calendar days merged.</span>`;
    showToast("Track IT data merged into MY GYM.","success");
  }catch(err){
    console.error("Track IT import failed:",err);
    $("trackItImportResult").classList.remove("hidden");
    $("trackItImportResult").className="import-result error";
    $("trackItImportResult").textContent=`Import stopped: ${err.code||err.message||"unknown error"}`;
    showToast("Could not finish Track IT import.","error");
  }finally{
    btn.disabled=false;
    btn.textContent=original;
  }
});

async function deleteDocsInCollection(collectionName){
  if(!user)throw new Error("No signed-in user");

  const snap=await getDocs(collection(db,"users",user.uid,collectionName));
  if(snap.empty)return 0;

  let deleted=0;
  const docs=snap.docs;

  // Firestore batches allow up to 500 operations; use 400 for margin.
  for(let i=0;i<docs.length;i+=400){
    const chunk=docs.slice(i,i+400);
    const batch=writeBatch(db);
    chunk.forEach(d=>batch.delete(d.ref));
    await batch.commit();
    deleted+=chunk.length;
  }
  return deleted;
}
$("deleteEmptyWorkoutsBtn").addEventListener("click",async()=>{
  if(!user)return;
  const empty=workoutsCache.filter(isEmptyWorkout);
  if(!empty.length){
    showToast("No empty/test workouts found.","success");
    return;
  }
  if(!confirm(`Delete ${empty.length} empty/test workout${empty.length===1?"":"s"} permanently?`))return;

  try{
    for(let i=0;i<empty.length;i+=400){
      const batch=writeBatch(db);
      empty.slice(i,i+400).forEach(w=>batch.delete(doc(db,"users",user.uid,"workouts",w.id)));
      await batch.commit();
    }
    await loadAllData();
    showToast(`${empty.length} empty/test workout${empty.length===1?"":"s"} deleted.`,"success");
  }catch(err){
    console.error(err);
    showToast("Could not delete empty workouts.","error");
  }
});

$("deleteAllTrackedDataBtn").addEventListener("click",async()=>{
  if(!user)return;

  const typed=prompt('This deletes ALL tracked MY GYM fitness data but keeps your login account. Type DELETE to continue:');
  if(typed!=="DELETE"){
    if(typed!==null)showToast("Nothing deleted. Type DELETE exactly to confirm.","error");
    return;
  }

  const second=confirm("Final confirmation: permanently delete workouts, calendar statuses, body weight, calorie meals, and nutrition settings?");
  if(!second)return;

  const btn=$("deleteAllTrackedDataBtn");
  const oldText=btn.textContent;
  btn.disabled=true;
  btn.textContent="Deleting...";

  try{
    const counts={};
    counts.workouts=await deleteDocsInCollection("workouts");
    counts.calendarDays=await deleteDocsInCollection("calendarDays");
    counts.bodyWeights=await deleteDocsInCollection("bodyWeights");
    counts.meals=await deleteDocsInCollection("meals");
    counts.settings=await deleteDocsInCollection("settings");

    workoutsCache=[];
    calendarStatuses={};
    bodyWeightCache=[];
    mealCache=[];
    calorieTarget=0;

    try{await loadAllData()}catch(refreshErr){console.error("Post-delete refresh failed:",refreshErr)}

    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    showToast(`${total} tracked record${total===1?"":"s"} deleted. Your login account was kept.`,"success");
  }catch(err){
    console.error("Delete all tracked data failed:",err);
    showToast(`Could not delete all tracked data (${err.code||err.message||"unknown error"}).`,"error");
  }finally{
    btn.disabled=false;
    btn.textContent=oldText;
  }
});
function toLocalInputValue(d){const adjusted=new Date(d.getTime()-d.getTimezoneOffset()*60000);return adjusted.toISOString().slice(0,16)}
function toDate(v){if(!v)return null;if(typeof v.toDate==="function")return v.toDate();if(v instanceof Date)return v;if(typeof v.seconds==="number")return new Date(v.seconds*1000);return new Date(v)}

renderCategories();