import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
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

let app = initializeApp(firebaseConfig);
let db = getFirestore(app);

async function createEvent(event) {
  event.preventDefault();
  console.log("Form submitted");

  try {
    let name = document.getElementById("eventname").value.trim();
    let description = document.getElementById("eventdescription").value.trim();
    let dateValue = document.getElementById("eventdate").value;
    let location = document.getElementById("eventlocation").value.trim();
    let friendsInput = document.getElementById("invitefriends").value;
    let friends = friendsInput
      ? friendsInput.split(",").map((f) => f.trim())
      : [];

    console.log("Form values:", {
      name,
      description,
      dateValue,
      location,
      friends,
    });

    if (!dateValue) {
      alert("Please select a date and time for your event.");
      return;
    }

    let dateObj = new Date(dateValue);
    if (isNaN(dateObj)) {
      console.error("Invalid date:", dateValue);
      alert("Invalid date. Please check your input.");
      return;
    }

    let date = Timestamp.fromDate(dateObj);
    console.log("Converted Firestore Timestamp:", date);

    let docRef = await addDoc(collection(db, "events"), {
      name,
      description,
      date,
      location,
      createdAt: Timestamp.fromDate(new Date()),
      attendees: friends,
    });

    console.log("Event created successfully! ID:", docRef.id);
    alert("Event created successfully!");
    document.getElementById("eventForm").reset();
  } catch (error) {
    console.error("Error creating event:", error);
    alert("Error creating event. Check console for details.");
  }
}

document.getElementById("eventForm").addEventListener("submit", createEvent);
