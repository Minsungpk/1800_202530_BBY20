import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

import { db } from "./firebaseConfig.js";

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

export const sendFriendRequest = async (fromUserId, toUserId) => {
  if (fromUserId === toUserId) return;

  const toUserRef = doc(db, "users", toUserId);
  const toUserSnap = await getDoc(toUserRef);

  if (!toUserSnap.exists()) throw new Error("User does not exist.");

  const data = toUserSnap.data();
  if (data.friends?.includes(fromUserId)) return;
  if (data.friendRequests?.includes(fromUserId)) return;

  await updateDoc(toUserRef, {
    friendRequests: arrayUnion(fromUserId),
  });
};

export const acceptFriendRequest = async (userId, requesterId) => {
  const userRef = doc(db, "users", userId);
  const requesterRef = doc(db, "users", requesterId);

  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User does not exist");

  const userData = userSnap.data();
  if (!userData.friendRequests?.includes(requesterId)) {
    throw new Error("No friend request exists");
  }

  await updateDoc(userRef, {
    friends: arrayUnion(requesterId),
    friendRequests: arrayRemove(requesterId),
  });

  await updateDoc(requesterRef, {
    friends: arrayUnion(userId),
  });
};

export const declineFriendRequest = async (userId, requesterId) => {
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    friendRequests: arrayRemove(requesterId),
  });
};
