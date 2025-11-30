// import {
//   doc,
//   getDoc,
//   setDoc,
//   updateDoc,
//   arrayUnion,
//   arrayRemove,
//   getFirestore,
// } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
// import { app } from "./firebaseConfig.js";

// const db = getFirestore(app);

// export const initializeNewUser = async (userId, name, email) => {
//   const userRef = doc(db, "users", userId);
//   const userSnap = await getDoc(userRef);

//   if (!userSnap.exists()) {
//     await setDoc(userRef, {
//       name,
//       email,
//       friends: [],
//       friendRequests: [],
//     });
//   } else {
//     const data = userSnap.data();
//     if (!data.friends) await updateDoc(userRef, { friends: [] });
//     if (!data.friendRequests) await updateDoc(userRef, { friendRequests: [] });
//   }
// };

// // Send / accept / decline friend requests
// export const sendFriendRequest = async (fromUserId, toUserId) => {};
// export const acceptFriendRequest = async (userId, requesterId) => {};
// export const declineFriendRequest = async (userId, requesterId) => {};
// friends.js
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

// --------------------------------------
// Create user if missing
// --------------------------------------
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

// --------------------------------------
// Send friend request
// --------------------------------------
export const sendFriendRequest = async (fromUserId, toUserId) => {
  const toUserRef = doc(db, "users", toUserId);

  await updateDoc(toUserRef, {
    friendRequests: arrayUnion(fromUserId),
  });
};

// --------------------------------------
// Accept friend request
// --------------------------------------
export const acceptFriendRequest = async (userId, requesterId) => {
  const userRef = doc(db, "users", userId);
  const requesterRef = doc(db, "users", requesterId);

  await updateDoc(userRef, {
    friends: arrayUnion(requesterId),
    friendRequests: arrayRemove(requesterId),
  });

  await updateDoc(requesterRef, {
    friends: arrayUnion(userId),
  });
};

// --------------------------------------
// Decline friend request
// --------------------------------------
export const declineFriendRequest = async (userId, requesterId) => {
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    friendRequests: arrayRemove(requesterId),
  });
};
