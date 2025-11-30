import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { app } from "./firebaseConfig.js";

const db = getFirestore(app);

export const initializeNewUser = async (userId, name, email) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name,
      email,
      friends: [],
      friendRequests: [],
    });
  } else {
    const data = userSnap.data();
    if (!data.friends) await updateDoc(userRef, { friends: [] });
    if (!data.friendRequests) await updateDoc(userRef, { friendRequests: [] });
  }
};

// Send / accept / decline friend requests
export const sendFriendRequest = async (fromUserId, toUserId) => {};
export const acceptFriendRequest = async (userId, requesterId) => {};
export const declineFriendRequest = async (userId, requesterId) => {};
