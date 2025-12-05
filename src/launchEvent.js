import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
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

console.log("Firebase initialized:", app.options.projectId);

const input = document.getElementById("search-container");
const resultsList = document.getElementById("autocomplete-results");
let selectedCoordinates = null;

const API_KEY = "710361f6-69e6-410f-8299-244cc2fecf5f";

async function searchStadia(query) {
  const url = `https://api.stadiamaps.com/geocoding/v1/search?text=${encodeURIComponent(
    query
  )}&api_key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.features || [];
}

input.addEventListener("input", async () => {
  const query = input.value.trim();
  if (query.length < 3) {
    resultsList.innerHTML = "";
    return;
  }

  const results = await searchStadia(query);
  resultsList.innerHTML = "";

  results.forEach((place) => {
    const li = document.createElement("li");
    li.textContent = place.properties.label;

    li.addEventListener("click", () => {
      input.value = place.properties.label;
      resultsList.innerHTML = "";
      selectedCoordinates = place.geometry.coordinates;
    });

    resultsList.appendChild(li);
  });
});
//event form descriptions
document.getElementById("eventForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("eventname").value.trim();
  const description = document.getElementById("eventdescription").value.trim();
  const dateValue = document.getElementById("eventdate").value;
  const locationName = document.getElementById("search-container").value.trim();

  if (!name || !description || !dateValue || !locationName) {
    alert("Please fill out all fields!");
    return;
  }

  const dateObj = new Date(dateValue);
  if (isNaN(dateObj)) {
    alert("Invalid date!");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "testEvents"), {
      name,
      description,
      date: Timestamp.fromDate(dateObj),
      location: {
        name: locationName,
        coordinates: selectedCoordinates,
      },
      createdAt: Timestamp.fromDate(new Date()),
    });
    //message returned
    alert(`Event "${name}" created successfully! ID: ${docRef.id}`);
    e.target.reset();
    selectedCoordinates = null;
  } catch (err) {
    console.error("Error creating event:", err);
    alert("Error creating event. Check console.");
  }
});
