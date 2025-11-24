import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// ✅ Firebase config — make sure this matches your other JS files
const firebaseConfig = {
  apiKey: "AIzaSyDD_2z29qDHPVXeSXyZ0T9VO_n_PcW1EqU",
  authDomain: "group-project-8a6ee.firebaseapp.com",
  projectId: "group-project-8a6ee",
  storageBucket: "group-project-8a6ee.firebasestorage.app",
  messagingSenderId: "922685674876",
  appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
  measurementId: "G-1LCVJ62HEL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HTML container
const joinedEventsList = document.getElementById("joinedEventsList");

// Listen for auth changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
    await loadJoinedEvents(user);
  } else {
    joinedEventsList.innerHTML =
      "<p>Please log in to see your joined events.</p>";
  }
});

// Load joined events for a user
async function loadJoinedEvents(user) {
  const joinedEventsRef = collection(db, `users/${user.uid}/joinedEvents`);

  // Real-time listener for joined events
  onSnapshot(joinedEventsRef, async (snapshot) => {
    joinedEventsList.innerHTML = "";

    if (snapshot.empty) {
      joinedEventsList.innerHTML = "<p>You haven't joined any events yet.</p>";
      return;
    }

    snapshot.forEach(async (docSnap) => {
      const joinedData = docSnap.data();
      const eventRef = joinedData.eventRef;

      // Get the actual event document
      const eventSnap = await getDocs(collection(db, "testEvents"));
      const eventDoc = await doc(db, "testEvents", docSnap.id);
      const eventDataSnap =
        (await eventRef.get?.()) || (await eventDoc.get?.());

      let eventData = {};
      try {
        const docData = await (await eventRef.get())?.data?.();
        if (docData) eventData = docData;
      } catch {
        eventData = { name: "Event not found", description: "" };
      }

      // Render event card
      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
        <h3>${eventData.name || "Event"}</h3>
        <p>${eventData.description || ""}</p>
        <p><strong>Joined at:</strong> ${
          joinedData.joinedAt?.toDate
            ? joinedData.joinedAt.toDate().toLocaleString()
            : ""
        }</p>
      `;
      joinedEventsList.appendChild(card);
    });
  });
}
