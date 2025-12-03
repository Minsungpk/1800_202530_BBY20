import { auth } from "./firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

export async function signup(email, password, username) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(cred.user, {
    displayName: username,
  });

  return cred;
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}
