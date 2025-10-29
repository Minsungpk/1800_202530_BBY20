// Import the Firebase SDKs directly from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDG0yPsbgkduL_l1s04z-47G-VMtEwf5lY",
  authDomain: "timely-48cd7.firebaseapp.com",
  projectId: "timely-48cd7",
  storageBucket: "timely-48cd7.firebasestorage.app",
  messagingSenderId: "833159024057",
  appId: "1:833159024057:web:cc5faa998d46fd024fba68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Select HTML elements
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const errorMsg = document.getElementById("error");

// LOGIN
loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    window.location.href = "./main.html";
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});

// SIGN UP
signupBtn?.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    window.location.href = "./main.html";
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});

// Keep users in or out depending on login state
onAuthStateChanged(auth, (user) => {
  const isLoginPage = window.location.pathname.includes("index.html");
  if (user && isLoginPage) {
    window.location.href = "./main.html";
  } else if (!user && !isLoginPage) {
    window.location.href = "./index.html";
  }
});
