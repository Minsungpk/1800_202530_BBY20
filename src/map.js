// ======================================================================
// 1. IMPORT FIREBASE MODULES (from CDN)
// ======================================================================
// These imports allow this JavaScript file to talk to Firebase services.
// We use the Firebase "modular" SDK, which loads individual functions
// instead of a huge bundle (faster and more modern).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// ======================================================================
// 2. FIREBASE CONFIGURATION + INITIALIZATION
// ======================================================================
// firebaseConfig identifies WHICH Firebase project we want to connect to.
// This allows the browser to send data to the correct Firestore database.
const firebaseConfig = {
  apiKey: "AIzaSyDD_2z29qDHPVXeSXyZ0T9VO_n_PcW1EqU",
  authDomain: "group-project-8a6ee.firebaseapp.com",
  projectId: "group-project-8a6ee",
  storageBucket: "group-project-8a6ee.firebasestorage.app",
  messagingSenderId: "922685674876",
  appId: "1:922685674876:web:6edeac0ff4fb485db780f9",
  measurementId: "G-1LCVJ62HEL",
};

// Connect to Firebase
const app = initializeApp(firebaseConfig);

// Connect to Firestore database
const db = getFirestore(app);

// ======================================================================
// 3. CREATE A SIMPLE USER ID (one per browser)
// ======================================================================
// We need to uniquely identify each user so each device’s location can
// be stored separately in Firestore.
//
// Instead of forcing login, we generate a random ID and save it in
// localStorage so it stays the same after refresh.
let userId = localStorage.getItem("timelyUserId");
if (!userId) {
  userId = "user_" + Math.floor(Math.random() * 1000000);
  localStorage.setItem("timelyUserId", userId);
}

console.log("My userId:", userId);

// ======================================================================
// 4. CREATE THE MAP USING MAPLIBRE
// ======================================================================
// This initializes the MapLibre map component.
// - container: HTML element where the map appears
// - style: MapTiler map style URL
// - center: starting map position
// - zoom: initial zoom level
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
// 5. GEOLOCATE CONTROL (shows your own blue dot)
// ======================================================================
// This control shows where you are on the map and updates as you move.
// It does NOT send your location to Firebase. It is only visual.
// Firebase sending is done in the next section.
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true,
});

map.addControl(geolocate);

// Start geolocation when map loads
map.on("load", () => geolocate.trigger());

// ======================================================================
// 6. SEND **MY** LOCATION TO FIREBASE (real-time updating)
// ======================================================================
// This function receives GPS coordinates from the browser and writes them
// to Firestore under the user's document.
//
// Structure in Firestore:
// locations
//   └── user_123456
//         ├── lat: 49.xxx
//         ├── lng: -123.xxx
//         └── updatedAt: Timestamp
async function sendMyLocationToFirebase(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  try {
    await setDoc(
      doc(db, "locations", userId), // document path
      {
        lat: lat,
        lng: lng,
        updatedAt: Timestamp.now(), // so we know when it updated
      },
      { merge: true } // keeps old fields if they exist
    );

    console.log("Updated my location in Firestore:", lat, lng);
  } catch (err) {
    console.error("Error updating location:", err);
  }
}

// Browser continuously watches GPS and calls our function each time
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    sendMyLocationToFirebase,
    (err) => console.error("Geolocation error:", err),
    { enableHighAccuracy: true }
  );
} else {
  console.error("Geolocation is not supported on this device.");
}

// ======================================================================
// 7. LISTEN FOR ALL USERS' LOCATIONS (real-time map updates)
// ======================================================================
// markers[] will store all map markers, one per user.
const markers = {};

// Firestore's onSnapshot() watches the entire "locations" collection
// and triggers whenever ANY user updates their location.
//
// This gives us real-time updates exactly like Snapchat maps.
onSnapshot(collection(db, "locations"), (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    const otherUserId = change.doc.id;
    const data = change.doc.data();

    // Skip invalid data
    if (data.lat == null || data.lng == null) return;

    const isMe = otherUserId === userId;

    // ----------------------------------------------------------
    // If user is ADDED or UPDATED → create or move marker
    // ----------------------------------------------------------
    if (change.type === "added" || change.type === "modified") {
      if (markers[otherUserId]) {
        // Move existing marker to new location
        markers[otherUserId].setLngLat([data.lng, data.lat]);
      } else {
        // Create a new marker if this user has no marker yet
        markers[otherUserId] = new maplibregl.Marker({
          color: isMe ? "#00FF00" : "#FF0000", // Green = me, Red = other users
        })
          .setLngLat([data.lng, data.lat])
          .addTo(map);
      }
    }

    // ----------------------------------------------------------
    // If a user is REMOVED from Firestore → remove marker
    // ----------------------------------------------------------
    if (change.type === "removed") {
      if (markers[otherUserId]) {
        markers[otherUserId].remove();
        delete markers[otherUserId];
      }
    }
  });
});
