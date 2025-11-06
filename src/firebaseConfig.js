// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDG0yPsbgkduL_l1s04z-47G-VMtEwf5lY",
  authDomain: "timely-48cd7.firebaseapp.com",
  projectId: "timely-48cd7",
  storageBucket: "timely-48cd7.firebasestorage.app",
  messagingSenderId: "833159024057",
  appId: "1:833159024057:web:cc5faa998d46fd024fba68"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
