// ======================================================================
// 1. IMPORT FIREBASE MODULES (from CDN)
// ======================================================================
// These imports allow this JavaScript file to talk to Firebase services.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Timestamp,
  getDoc,
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
// 6. LISTEN ONLY TO MYSELF + MY FRIENDS' LOCATIONS
// ======================================================================
const markers = {}; // one marker per userId

// Helper: create/move/remove marker for a single user
function updateMarkerForUser(uid, data, isMe = false) {
  if (!data || data.lat == null || data.lng == null) return;

  const popupText =
    (isMe ? "(You) " : "") +
    (data.displayName || data.userDisplayName || uid);

  if (markers[uid]) {
    // Move existing marker + update popup text
    markers[uid].setLngLat([data.lng, data.lat]);
    const popup = markers[uid].getPopup();
    if (popup) popup.setText(popupText);
    return;
  }

  // Create custom icon element
  const iconUrl = isMe ? "./images/pin.png" : "./images/otherpin.png";

  const el = document.createElement("img");
  el.src = iconUrl;
  el.alt = popupText;
  el.style.width = "40px";
  el.style.height = "40px";
  el.style.borderRadius = "50%";
  el.style.objectFit = "cover";

  const popup = new maplibregl.Popup({ offset: 25 }).setText(popupText);

  markers[uid] = new maplibregl.Marker({ element: el })
    .setLngLat([data.lng, data.lat])
    .setPopup(popup)
    .addTo(map);

  markers[uid].togglePopup();
}

// Listen to ONE location document (either me or a friend)
function listenToLocationDoc(uid, isMe = false) {
  const locRef = doc(db, "locations", uid);

  onSnapshot(
    locRef,
    (snap) => {
      if (!snap.exists()) {
        if (markers[uid]) {
          markers[uid].remove();
          delete markers[uid];
        }
        return;
      }
      updateMarkerForUser(uid, snap.data(), isMe);
    },
    (err) => {
      console.error("Location listener error for", uid, err);
    }
  );
}

// Load my friends and start listeners
async function startFriendsLocationsListener() {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    let friends = [];
    if (userSnap.exists()) {
      const data = userSnap.data();
      friends = Array.isArray(data.friends) ? data.friends : [];
    }

    // Always listen to my own location
    listenToLocationDoc(userId, true);

    // Listen to each friend's location
    friends.forEach((friendId) => {
      listenToLocationDoc(friendId, false);
    });

    console.log("Started location listeners for friends:", friends);
  } catch (err) {
    console.error("Error starting friends listeners:", err);
  }
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

    // Start listening only to my friends' locations (and myself)
    startFriendsLocationsListener();

  } else {
    // ❌ No user logged in → redirect to login page
    console.log("No user logged in. Redirecting to login...");
    // Adjust path if needed (e.g., "./login.html" or "/auth/login.html")
    window.location.href = "login.html";
  }
});
