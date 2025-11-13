// src/invites.js
import { app } from "./firebaseConfig.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, where, onSnapshot, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

// Grab elements from invites.html
const sendBtn = document.getElementById("sendInviteBtn");
const emailInput = document.getElementById("inviteEmail");
const inviteMsg = document.getElementById("inviteMsg");
const myInvitesList = document.getElementById("myInvites");
const sentInvitesList = document.getElementById("sentInvites");

let currentUser = null;

// 1) Wait until user is logged in
onAuthStateChanged(auth, (user) => {
  currentUser = user || null;

  if (!currentUser) {
    inviteMsg.textContent = "Please log in to use invites.";
    myInvitesList.innerHTML = "";
    sentInvitesList.innerHTML = "";
    return;
  }

  inviteMsg.textContent = "";
  startListeningToMyInvites();
  startListeningToSentInvites();
});

// 2) Send an invite (adds a document in Firestore)
async function sendInvite() {
  if (!currentUser) {
    inviteMsg.textContent = "You must be logged in.";
    return;
  }
  const recipientEmail = (emailInput.value || "").trim().toLowerCase();
  if (!recipientEmail) {
    inviteMsg.textContent = "Enter a recipient email.";
    return;
  }
  if (recipientEmail === currentUser.email?.toLowerCase()) {
    inviteMsg.textContent = "You cannot invite yourself.";
    return;
  }

  try {
    await addDoc(collection(db, "invites"), {
      senderUid: currentUser.uid,
      senderEmail: currentUser.email,
      recipientEmail,
      status: "pending",
      createdAt: serverTimestamp()
    });
    emailInput.value = "";
    inviteMsg.textContent = "Invite sent ✅";
  } catch (e) {
    console.error(e);
    inviteMsg.textContent = "Failed to send invite.";
  }
}
sendBtn?.addEventListener("click", sendInvite);

// 3) Live list of invites sent TO ME
function startListeningToMyInvites() {
  const q = query(
    collection(db, "invites"),
    where("recipientEmail", "==", currentUser.email.toLowerCase())
  );
  onSnapshot(q, (snap) => {
    myInvitesList.innerHTML = "";
    snap.forEach((docSnap) => {
      const inv = { id: docSnap.id, ...docSnap.data() };
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong>From:</strong> ${inv.senderEmail} &nbsp;—&nbsp;
          <strong>Status:</strong> ${inv.status}
        </div>
        <div>
          <button class="btn btn-success btn-sm me-2" ${inv.status !== "pending" ? "disabled" : ""}>Accept</button>
          <button class="btn btn-outline-secondary btn-sm" ${inv.status !== "pending" ? "disabled" : ""}>Decline</button>
        </div>
      `;
      const [acceptBtn, declineBtn] = li.querySelectorAll("button");
      acceptBtn?.addEventListener("click", () => updateInviteStatus(inv.id, "accepted"));
      declineBtn?.addEventListener("click", () => updateInviteStatus(inv.id, "declined"));
      myInvitesList.appendChild(li);
    });
  });
}

// 4) Live list of invites I SENT
function startListeningToSentInvites() {
  const q = query(
    collection(db, "invites"),
    where("senderUid", "==", currentUser.uid)
  );
  onSnapshot(q, (snap) => {
    sentInvitesList.innerHTML = "";
    snap.forEach((docSnap) => {
      const inv = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `To: ${inv.recipientEmail} — Status: ${inv.status}`;
      sentInvitesList.appendChild(li);
    });
  });
}

// 5) Accept / Decline = update the invite's status in Firestore
async function updateInviteStatus(inviteId, newStatus) {
  try {
    await updateDoc(doc(db, "invites", inviteId), { status: newStatus });

    // (Optional) When accepted, you could also add the user to a group here.
    // For MVP we keep it simple.
  } catch (e) {
    console.error(e);
    alert("Could not update invite.");
  }
}
