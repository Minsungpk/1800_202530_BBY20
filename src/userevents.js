import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  getDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "group-project-8a6ee.firebaseapp.com",
  projectId: "group-project-8a6ee",
  storageBucket: "group-project-8a6ee.firebasestorage.app",
  messagingSenderId: "922685674876",
  appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
  measurementId: "G-1LCVJ62HEL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

// Container in HTML
const eventsList = document.getElementById("eventsList");

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadEvents();
  } else {
    eventsList.innerHTML = "<p>Please log in to join events.</p>";
  }
});

async function loadEvents() {
  if (!currentUser) return;

  const q = query(collection(db, "testEvents"), orderBy("date"));
  const snapshot = await getDocs(q);

  eventsList.innerHTML = "";

  snapshot.forEach(async (docSnap) => {
    const data = docSnap.data();
    const eventId = docSnap.id;
    const dateString = data.date
      ? data.date.toDate().toLocaleString()
      : "No date";

    // Create card
    const card = document.createElement("div");
    card.className = "event-card";

    const participantsCountElem = document.createElement("p");
    participantsCountElem.innerHTML = "<strong>Participants:</strong> 0";

    const joinButton = document.createElement("button");
    joinButton.className = "join-btn";
    joinButton.textContent = "Join Event";
    joinButton.dataset.id = eventId;

    card.innerHTML = `
      <h3>${data.name}</h3>
      <p>${data.description}</p>
      <p><strong>Location:</strong> ${data.location.name}</p>
      <p><strong>Date:</strong> ${dateString}</p>
    `;
    card.appendChild(participantsCountElem);
    card.appendChild(joinButton);
    eventsList.appendChild(card);

    const participantsColRef = collection(
      db,
      `testEvents/${eventId}/participants`
    );
    const participantDocRef = doc(
      db,
      `testEvents/${eventId}/participants/${currentUser.uid}`
    );

    // Load initial participant count
    const participantsSnapshot = await getDocs(participantsColRef);
    participantsCountElem.innerHTML = `<strong>Participants:</strong> ${participantsSnapshot.size}`;

    // Check if current user already joined
    const joinedSnap = await getDoc(participantDocRef);
    if (joinedSnap.exists()) {
      joinButton.textContent = "Joined";
      joinButton.disabled = true;
      card.classList.add("joined-card");
    }

    // Handle join button click
    joinButton.addEventListener("click", async () => {
      try {
        // 1. Add user to event participants
        await setDoc(participantDocRef, { joinedAt: new Date() });

        // 2. Add event reference to user's joinedEvents subcollection
        const userJoinedRef = doc(
          db,
          `users/${currentUser.uid}/joinedEvents/${eventId}`
        );
        await setDoc(userJoinedRef, {
          eventRef: doc(db, "testEvents", eventId),
          joinedAt: new Date(),
        });

        // Update UI
        joinButton.textContent = "Joined";
        joinButton.disabled = true;
        card.classList.add("joined-card");

        // Update participant count dynamically
        const updatedSnap = await getDocs(participantsColRef);
        participantsCountElem.innerHTML = `<strong>Participants:</strong> ${updatedSnap.size}`;
      } catch (err) {
        console.error("Error joining event:", err);
        alert("Failed to join event. Please try again.");
      }
    });

    // Listen for real-time updates to participant count
    onSnapshot(participantsColRef, (snap) => {
      participantsCountElem.innerHTML = `<strong>Participants:</strong> ${snap.size}`;
    });
  });
}
