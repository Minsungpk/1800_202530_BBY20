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
  getDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

const eventsList = document.getElementById("eventsList");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    const userDocRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        createdAt: new Date(),
        email: currentUser.email,
      });
      console.log("User document created for:", currentUser.uid);
    }

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
    const dateString = data.date.toDate().toLocaleString();

    const card = document.createElement("div");
    card.className = "event-card";

    const participantsCountElem = document.createElement("p");
    participantsCountElem.innerHTML = "<strong>Participants:</strong> 0";

    const joinBadge = document.createElement("span");
    joinBadge.className = "joined-badge";
    joinBadge.textContent = "Joined";
    joinBadge.style.display = "none";

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
    card.appendChild(joinBadge);
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

    const participantsSnapshot = await getDocs(participantsColRef);
    participantsCountElem.innerHTML = `<strong>Participants:</strong> ${participantsSnapshot.size}`;

    const joinedSnap = await getDoc(participantDocRef);
    if (joinedSnap.exists()) {
      joinButton.textContent = "Joined";
      joinButton.disabled = true;
      joinBadge.style.display = "inline-block";
      card.classList.add("joined-card");
    }

    joinButton.addEventListener("click", async () => {
      try {
        await setDoc(participantDocRef, { joinedAt: new Date() });

        const userJoinedRef = doc(
          db,
          `users/${currentUser.uid}/joinedEvents/${eventId}`
        );
        await setDoc(userJoinedRef, {
          eventRef: doc(db, "testEvents", eventId),
          joinedAt: new Date(),
        });

        joinButton.textContent = "Joined";
        joinButton.disabled = true;
        joinBadge.style.display = "inline-block";
        card.classList.add("joined-card");

        const updatedSnap = await getDocs(participantsColRef);
        participantsCountElem.innerHTML = `<strong>Participants:</strong> ${updatedSnap.size}`;
      } catch (err) {
        console.error("Error joining event:", err);
        alert("Failed to join event. Please try again.");
      }
    });

    onSnapshot(participantsColRef, (snap) => {
      participantsCountElem.innerHTML = `<strong>Participants:</strong> ${snap.size}`;
    });
  });
}



// Old js code
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
// import {
//   getAuth,
//   onAuthStateChanged,
// } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
// import {
//   getFirestore,
//   collection,
//   getDocs,
//   setDoc,
//   doc,
//   query,
//   orderBy,
//   getDoc,
//   onSnapshot,
// } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// // Firebase config
// const firebaseConfig = {
//   apiKey: "AIzaSyDD_2z29qDHPVXeSXyZ0T9VO_n_PcW1EqU",
//   authDomain: "group-project-8a6ee.firebaseapp.com",
//   projectId: "group-project-8a6ee",
//   storageBucket: "group-project-8a6ee.firebasestorage.app",
//   messagingSenderId: "922685674876",
//   appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
//   measurementId: "G-1LCVJ62HEL",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const auth = getAuth(app);
// let currentUser = null;

// const eventsList = document.getElementById("eventsList");

// // Ensure user exists and then load events
// onAuthStateChanged(auth, async (user) => {
//   if (user) {
//     currentUser = user;

//     // Ensure Firestore document exists for the user
//     const userDocRef = doc(db, "users", currentUser.uid);
//     const userSnap = await getDoc(userDocRef);
//     if (!userSnap.exists()) {
//       await setDoc(userDocRef, {
//         createdAt: new Date(),
//         email: currentUser.email,
//       });
//       console.log("User document created for:", currentUser.uid);
//     }

//     // Load all events
//     loadEvents();
//   } else {
//     eventsList.innerHTML = "<p>Please log in to join events.</p>";
//   }
// });

// async function loadEvents() {
//   if (!currentUser) return;

//   const q = query(collection(db, "testEvents"), orderBy("date"));
//   const snapshot = await getDocs(q);

//   eventsList.innerHTML = "";

//   snapshot.forEach(async (docSnap) => {
//     const data = docSnap.data();
//     const eventId = docSnap.id;
//     const dateString = data.date.toDate().toLocaleString();

//     // Create event card
//     const card = document.createElement("div");
//     card.className = "event-card";

//     const participantsCountElem = document.createElement("p");
//     participantsCountElem.innerHTML = "<strong>Participants:</strong> 0";

//     const joinBadge = document.createElement("span");
//     joinBadge.className = "joined-badge";
//     joinBadge.textContent = "Joined";
//     joinBadge.style.display = "none";

//     const joinButton = document.createElement("button");
//     joinButton.className = "join-btn";
//     joinButton.textContent = "Join Event";
//     joinButton.dataset.id = eventId;

//     card.innerHTML = `
//       <h3>${data.name}</h3>
//       <p>${data.description}</p>
//       <p><strong>Location:</strong> ${data.location.name}</p>
//       <p><strong>Date:</strong> ${dateString}</p>
//     `;
//     card.appendChild(participantsCountElem);
//     card.appendChild(joinBadge);
//     card.appendChild(joinButton);
//     eventsList.appendChild(card);

//     const participantsColRef = collection(
//       db,
//       `testEvents/${eventId}/participants`
//     );
//     const participantDocRef = doc(
//       db,
//       `testEvents/${eventId}/participants/${currentUser.uid}`
//     );

//     // Load initial participant count
//     const participantsSnapshot = await getDocs(participantsColRef);
//     participantsCountElem.innerHTML = `<strong>Participants:</strong> ${participantsSnapshot.size}`;

//     // Check if current user already joined
//     const joinedSnap = await getDoc(participantDocRef);
//     if (joinedSnap.exists()) {
//       joinButton.textContent = "Joined";
//       joinButton.disabled = true;
//       joinBadge.style.display = "inline-block";
//       card.classList.add("joined-card");
//     }

//     // Join button click
//     joinButton.addEventListener("click", async () => {
//       try {
//         // Add user to event participants
//         await setDoc(participantDocRef, { joinedAt: new Date() });

//         // Add event to user's joinedEvents subcollection
//         const userJoinedRef = doc(
//           db,
//           `users/${currentUser.uid}/joinedEvents/${eventId}`
//         );
//         await setDoc(userJoinedRef, {
//           eventRef: doc(db, "testEvents", eventId),
//           joinedAt: new Date(),
//         });

//         // Update UI
//         joinButton.textContent = "Joined";
//         joinButton.disabled = true;
//         joinBadge.style.display = "inline-block";
//         card.classList.add("joined-card");

//         // Update participant count dynamically
//         const updatedSnap = await getDocs(participantsColRef);
//         participantsCountElem.innerHTML = `<strong>Participants:</strong> ${updatedSnap.size}`;
//       } catch (err) {
//         console.error("Error joining event:", err);
//         alert("Failed to join event. Please try again.");
//       }
//     });

//     // Real-time participant count updates
//     onSnapshot(participantsColRef, (snap) => {
//       participantsCountElem.innerHTML = `<strong>Participants:</strong> ${snap.size}`;
//     });
//   });
// }



