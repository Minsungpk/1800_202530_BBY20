import { createUserWithEmailAndPassword } from "firebase/auth";
import {auth} from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword  } from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  
};

export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// export const doSignOut = () => {
export const doSignOut = () => {
    return auth.signOut();
};
