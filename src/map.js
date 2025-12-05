//imports for Firebase modules
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

//Firebase configurations and initialization
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

let userId = null;
let userDisplayName = null;

//map creation
const map = new maplibregl.Map({
  container: "map",
  style:
    "https://api.maptiler.com/maps/019a5278-dbf9-77ba-8b85-d04e6ac21b57/style.json?key=tdthCswjV8GNYleNLj1C",
  center: [-123.0016, 49.2532], // Burnaby campus area
  zoom: 13,
  pitch: 0,
  bearing: 0,
});

map.dragRotate.enable();
map.touchZoomRotate.enableRotation();

map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
    showCompass: true,
    showZoom: true,
  })
);

// geolocate control
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true,
});

map.addControl(geolocate);
map.on("load", () => geolocate.trigger());

//send location to Firebase
async function sendMyLocationToFirebase(position) {
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
      { merge: true }
    );

    console.log("Updated my location in Firestore:", lat, lng);
  } catch (err) {
    console.error("Error updating location:", err);
  }
}

//myself and friends locations only
const markers = {};

function updateMarkerForUser(uid, data, isMe = false) {
  if (!data || data.lat == null || data.lng == null) return;

  const popupText =
    (isMe ? "(You) " : "") + (data.displayName || data.userDisplayName || uid);

  if (markers[uid]) {
    markers[uid].setLngLat([data.lng, data.lat]);
    const popup = markers[uid].getPopup();
    if (popup) popup.setText(popupText);
    return;
  }
  const iconUrl = "./images/otherpin.png";


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

//one location document only
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

//load my friends and start listeners
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

    //always listen to my own musuem
    listenToLocationDoc(userId, true);

    //listen to each friend's location
    friends.forEach((friendId) => {
      listenToLocationDoc(friendId, false);
    });

    console.log("Started location listeners for friends:", friends);
  } catch (err) {
    console.error("Error starting friends listeners:", err);
  }
}

//auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    userDisplayName = user.displayName || user.email || "Anonymous";

    console.log("Logged in as:", userId, userDisplayName);
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        sendMyLocationToFirebase,
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    } else {
      console.error("Geolocation is not supported on this device.");
    }
    startFriendsLocationsListener();
  } else {
    console.log("No user logged in. Redirecting to login...");
    window.location.href = "index.html";
  }
});

