// ======================================================================
// 1. IMPORT FIREBASE MODULES (from CDN)
// ======================================================================
// These imports allow this JavaScript file to talk to Firebase services.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// ======================================================================
// 2. FIREBASE CONFIGURATION + INITIALIZATION
// ======================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDD_2z29qDHPVXeSXyZ0T9VO_n_PcW1EqU",
  authDomain: "group-project-8a6ee.firebaseapp.com",
  projectId: "group-project-8a6ee",
  storageBucket: "group-project-8a6ee.firebasestorage.app",
  messagingSenderId: "922685674876",
  appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
  measurementId: "G-1LCVJ62HEL",
};

// Initialize Firebase app + services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// These will be filled AFTER the user logs in
let userId = null;
let userDisplayName = null;

// ======================================================================
// 3. CREATE THE MAP USING MAPLIBRE
// ======================================================================
const map = new maplibregl.Map({
  container: "map",
  style:
    "https://api.maptiler.com/maps/019a5278-dbf9-77ba-8b85-d04e6ac21b57/style.json?key=tdthCswjV8GNYleNLj1C",
  center: [-123.0016, 49.2532], // Burnaby campus area
  zoom: 13,
  pitch: 0,
  bearing: 0,
});

// Enable map rotation controls
map.dragRotate.enable();
map.touchZoomRotate.enableRotation();

// Add map navigation controls (zoom buttons, compass)
map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
    showCompass: true,
    showZoom: true,
  })
);

// ======================================================================
// 4. GEOLOCATE CONTROL (blue dot only - NOT Firestore)
// ======================================================================
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true,
});

map.addControl(geolocate);

// Start geolocation visual when map loads
map.on("load", () => geolocate.trigger());

// ======================================================================
// 5. SEND MY LOCATION TO FIREBASE (real-time updating)
// ======================================================================
async function sendMyLocationToFirebase(position) {
  // If we don't know who the user is yet, skip
  if (!userId) {
    console.warn("No logged-in user yet, skipping location update.");
    return;
  }

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  try {
    await setDoc(
      doc(db, "locations", userId), // document ID = Firebase Auth UID
      {
        lat: lat,
        lng: lng,
        updatedAt: Timestamp.now(),
        displayName: userDisplayName,
      },
      { merge: true } // keep other fields if they exist
    );

    console.log("Updated my location in Firestore:", lat, lng);
  } catch (err) {
    console.error("Error updating location:", err);
  }
}

// ======================================================================
// 6. LISTEN FOR ALL USERS' LOCATIONS (real-time map updates)
// ======================================================================
const markers = {}; // one marker per userId

function startLocationsListener() {
  onSnapshot(collection(db, "locations"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const otherUserId = change.doc.id;
      const data = change.doc.data();

      // Skip invalid data
      if (data.lat == null || data.lng == null) return;

      const isMe = otherUserId === userId;

      // Text to show in popup
      const popupText = data.displayName || data.email || otherUserId;

      // ADDED or MODIFIED → create or move marker
      if (change.type === "added" || change.type === "modified") {
        if (markers[otherUserId]) {
          // Move existing marker
          markers[otherUserId].setLngLat([data.lng, data.lat]);

          // Update popup text if popup exists
          const existingPopup = markers[otherUserId].getPopup();
          if (existingPopup) {
            existingPopup.setText(popupText);
          }
        } else {
          // Create popup
          const popup = new maplibregl.Popup({ offset: 25 }).setText(popupText);

          // Create new marker with popup
          markers[otherUserId] = new maplibregl.Marker({
            color: isMe ? "#00FF00" : "#FF0000", // Green = me, Red = others
          })
            .setLngLat([data.lng, data.lat])
            .setPopup(popup)
            .addTo(map);

          // Automatically show popup
          markers[otherUserId].togglePopup();
        }
      }

      // REMOVED → delete marker
      if (change.type === "removed") {
        if (markers[otherUserId]) {
          markers[otherUserId].remove();
          delete markers[otherUserId];
        }
      }
    });
  });
}

// ======================================================================
// 7. AUTH STATE LISTENER – START EVERYTHING AFTER LOGIN
// ======================================================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    // ✅ User is logged in
    userId = user.uid;
    userDisplayName = user.displayName || user.email || "Anonymous";

    console.log("Logged in as:", userId, userDisplayName);

    // Start watching GPS → sendMyLocationToFirebase
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        sendMyLocationToFirebase,
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    } else {
      console.error("Geolocation is not supported on this device.");
    }

    // Start listening to all users' locations
    startLocationsListener();
  } else {
    // ❌ No user logged in → redirect to login page
    console.log("No user logged in. Redirecting to login...");
    // Adjust path if needed (e.g., "./login.html" or "/auth/login.html")
    window.location.href = "login.html";
  }
});
