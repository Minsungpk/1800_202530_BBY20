import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

let firebaseConfig = {
  apiKey: "AIzaSyDD_2z29qDHPVXeSXyZ0T9VO_n_PcW1EqU",
  authDomain: "group-project-8a6ee.firebaseapp.com",
  projectId: "group-project-8a6ee",
  storageBucket: "group-project-8a6ee.firebasestorage.app",
  messagingSenderId: "922685674876",
  appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
  measurementId: "G-1LCVJ62HEL",
};

// Init
let app = initializeApp(firebaseConfig);
let db = getFirestore(app);
let auth = getAuth(app);
let currentUser = null;

console.log("Firebase initialized (list page)");

// Container in HTML
let eventsList = document.getElementById("eventsList");
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadEvents(); // Reload events once user is known
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
    let data = docSnap.data();
    let eventId = docSnap.id;
    let dateString = data.date.toDate().toLocaleString();

    // Create card
    let card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <h3>${data.name}</h3>
      <p>${data.description}</p>
      <p><strong>Location:</strong> ${data.location.name}</p>
      <p><strong>Date:</strong> ${dateString}</p>
      <button data-id="${eventId}" class="join-btn">
        Join Event
      </button>
    `;

    eventsList.appendChild(card);

    // Reference to participant document
    const participantRef = doc(
      db,
      `testEvents/${eventId}/participants/${currentUser.uid}`
    );
    const joinedSnap = await getDoc(participantRef);

    const joinButton = card.querySelector(".join-btn");

    if (joinedSnap.exists()) {
      joinButton.textContent = "Joined";
      joinButton.disabled = true;
    }

    joinButton.addEventListener("click", async () => {
      await setDoc(participantRef, {
        joinedAt: new Date(),
      });

      joinButton.textContent = "Joined";
      joinButton.disabled = true;
    });
  });
}

loadEvents();
