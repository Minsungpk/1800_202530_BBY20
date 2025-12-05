import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

//Firebase configurations
const firebaseConfig = {
  apiKey: "AIzaSyDD_2z29qDHPVXeSXyZ0T9VO_n_PcW1EqU",
  authDomain: "group-project-8a6ee.firebaseapp.com",
  projectId: "group-project-8a6ee",
  storageBucket: "group-project-8a6ee.firebasestorage.app",
  messagingSenderId: "922685674876",
  appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
  measurementId: "G-1LCVJ62HEL",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const joinedEventsList = document.getElementById("joinedEventsList");

//authentication listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadJoinedEvents(user);
  } else {
    joinedEventsList.innerHTML =
      "<p>Please log in to see your joined events.</p>";
  }
});

//load joined events
async function loadJoinedEvents(user) {
  const joinedEventsRef = collection(db, `users/${user.uid}/joinedEvents`);

  onSnapshot(joinedEventsRef, async (snapshot) => {
    joinedEventsList.innerHTML = "";

    if (snapshot.empty) {
      joinedEventsList.innerHTML = "<p>You haven't joined any events yet.</p>";
      return;
    }

    for (const docSnap of snapshot.docs) {
      const joinedData = docSnap.data();
      const eventRef = joinedData.eventRef;

      if (!eventRef) continue;

      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        console.warn("Event doc not found:", docSnap.id);
        continue;
      }

      const eventData = eventSnap.data();
      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
        <h3>${eventData.name}</h3>
        <p>${eventData.description}</p>
        <p><strong>Location:</strong> ${eventData.location?.name || ""}</p>
        <p><strong>Date:</strong> ${
          eventData.date?.toDate ? eventData.date.toDate().toLocaleString() : ""
        }</p>
        <p><strong>Joined at:</strong> ${
          joinedData.joinedAt?.toDate
            ? joinedData.joinedAt.toDate().toLocaleString()
            : ""
        }</p>
      `;
      joinedEventsList.appendChild(card);
    }
  });
}
