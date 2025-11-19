// src/notifications.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// 🔹 Same config you already use elsewhere
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

console.log("✅ Notifications page: Firebase initialized");

const notificationsList = document.getElementById("notificationsList");

// 🔹 Wait for the login state
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("⚠️ No user logged in on notifications page");
    notificationsList.innerHTML = `
      <p class="text-muted mb-0">Please log in to see your notifications.</p>
    `;
    return;
  }

  console.log("🔐 Logged in as:", user.uid, user.email);
  loadNotificationsForUser(user.uid);
});

// 🔹 Load notifications for this user
function loadNotificationsForUser(userUid) {
  console.log("📥 Loading notifications for:", userUid);

  // Query: notifications where userUid == current user, newest first
  const q = query(
    collection(db, "notifications"),
    where("userUid", "==", userUid),
    orderBy("createdAt", "desc")
  );

  // Real-time listener: updates instantly when data changes
  onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        notificationsList.innerHTML = `
          <p class="text-muted mb-0">No notifications yet.</p>
        `;
        return;
      }

      // Build HTML for each notification
      let html = "";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleString()
          : "Unknown time";

        const readClass = data.read ? "read" : "unread";

        html += `
          <div class="notification-item ${readClass}">
            <div class="d-flex justify-content-between">
              <div>
                <div>${data.message || "(no message)"}</div>
                <div class="notification-time">${createdAt}</div>
              </div>
              ${
                data.read
                  ? '<span class="badge bg-secondary">Read</span>'
                  : '<span class="badge bg-primary">New</span>'
              }
            </div>
          </div>
        `;
      });

      notificationsList.innerHTML = html;
    },
    (error) => {
      console.error("Error loading notifications:", error);
      notificationsList.innerHTML = `
        <p class="text-danger mb-0">Error loading notifications.</p>
      `;
    }
  );
}
