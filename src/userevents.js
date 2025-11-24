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
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "group-project-8a6ee.firebaseapp.com",
  projectId: "group-project-8a6ee",
  storageBucket: "group-project-8a6ee.firebasestorage.app",
  messagingSenderId: "922685674876",
  appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const joinedEventsList = document.getElementById("joinedEventsList");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    joinedEventsList.innerHTML =
      "<p>Please log in to see your joined events.</p>";
    return;
  }

  try {
    const joinedEventsCol = collection(db, `users/${user.uid}/joinedEvents`);
    const joinedEventsSnapshot = await getDocs(joinedEventsCol);

    if (joinedEventsSnapshot.empty) {
      joinedEventsList.innerHTML = "<p>You haven't joined any events yet.</p>";
      return;
    }

    joinedEventsList.innerHTML = ""; // clear

    // Loop through each joined event
    for (const joinedDoc of joinedEventsSnapshot.docs) {
      const eventData = await getDoc(joinedDoc.data().eventRef);
      const data = eventData.data();
      const dateString = data.date?.toDate().toLocaleString() || "No date";

      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
        <h3>${data.name}</h3>
        <p>${data.description}</p>
        <p><strong>Location:</strong> ${data.location.name}</p>
        <p><strong>Date:</strong> ${dateString}</p>
      `;
      joinedEventsList.appendChild(card);
    }
  } catch (err) {
    console.error("Error loading joined events:", err);
    joinedEventsList.innerHTML = "<p>Failed to load joined events.</p>";
  }
});
