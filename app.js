import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const configReady = !Object.values(firebaseConfig).some(v => String(v).startsWith("PASTE_"));

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const authMessage = document.getElementById("authMessage");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

function showMessage(text, success = false) {
  authMessage.textContent = text;
  authMessage.className = success ? "message success" : "message";
}

function switchTab(tab) {
  const login = tab === "login";
  loginPanel.classList.toggle("active", login);
  registerPanel.classList.toggle("active", !login);
  loginTab.classList.toggle("active", login);
  registerTab.classList.toggle("active", !login);
  showMessage("");
}

loginTab.addEventListener("click", () => switchTab("login"));
registerTab.addEventListener("click", () => switchTab("register"));

if (!configReady) {
  showMessage("Setup needed: paste your Firebase Web App configuration into firebase-config.js.");
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });

      await setDoc(doc(db, "users", credential.user.uid), {
        displayName: name,
        email: email.toLowerCase(),
        createdAt: serverTimestamp(),
        settings: {
          weightUnit: "lb",
          theme: "dark"
        }
      });

      showMessage("Account created successfully.", true);
    } catch (error) {
      showMessage(readableError(error.code));
    }
  });

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      showMessage(readableError(error.code));
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      dashboardView.classList.add("hidden");
      authView.classList.remove("hidden");
      return;
    }

    let displayName = user.displayName || "Athlete";
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (snapshot.exists() && snapshot.data().displayName) {
        displayName = snapshot.data().displayName;
      }
    } catch (_) {}

    userName.textContent = displayName;
    userEmail.textContent = user.email || "";
    authView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
  });
}

function readableError(code = "") {
  const messages = {
    "auth/email-already-in-use": "That email already has a MY GYM account.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network problem. Check your internet connection."
  };
  return messages[code] || `Something went wrong (${code || "unknown error"}).`;
}
