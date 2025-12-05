import { auth } from "./firebaseConfig.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
//logout function
export function logout() {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((error) => {
      alert("Logout failed");
      console.error(error);
    });
}
