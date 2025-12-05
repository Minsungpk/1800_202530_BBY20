import { initializeNewUser } from "./friends.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { app } from "./firebaseConfig.js";

const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      await initializeNewUser(user.uid, user.displayName, user.email);
    } catch (error) {
      console.error("Error initializing user document:", error);
    }
  }
});

