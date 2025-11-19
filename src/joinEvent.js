import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
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

console.log("Firebase initialized (list page)");

// Container in HTML
let eventsList = document.getElementById("eventsList");

async function loadEvents() {
  const q = query(collection(db, "testEvents"), orderBy("date"));
  const snapshot = await getDocs(q);

  eventsList.innerHTML = "";

  snapshot.forEach((doc) => {
    let data = doc.data();

    let dateString = data.date.toDate().toLocaleString();

    let card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML = `
      <h3>${data.name}</h3>
      <p>${data.description}</p>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Date:</strong> ${dateString}</p>

      <button data-id="${doc.id}" class="join-btn">
        Join Event
      </button>
    `;

    eventsList.appendChild(card);
  });
}

loadEvents();
