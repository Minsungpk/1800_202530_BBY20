import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

let currentUser = null;
let groups = [];
let selectedGroupId = null;

const els = {
  groupList: document.getElementById("groupList"),
  createGroupBtn: document.getElementById("createGroupBtn"),
  createGroupModal: document.getElementById("createGroupModal"),
  groupNameInput: document.getElementById("groupNameInput"),
  groupMembersInput: document.getElementById("groupMembersInput"),
  saveGroupBtn: document.getElementById("saveGroupBtn"),
};

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  if (currentUser) {
    await loadGroups();
    renderGroups();
  }
});

async function loadGroups() {
  groups = [];
  if (!currentUser) return;
  const q = query(
    collection(db, "groups"),
    where("members", "array-contains", currentUser.email)
  );
  const snap = await getDocs(q);
  snap.forEach((doc) => {
    const data = doc.data();
    groups.push({
      id: doc.id,
      name: data.name,
      members: data.members || [],
      createdBy: data.createdBy,
      createdAt: data.createdAt,
    });
  });
}

function renderGroups() {
  els.groupList.innerHTML = "";
  if (groups.length === 0) {
    els.groupList.innerHTML =
      '<div class="text-muted">No groups yet. Create one!</div>';
    return;
  }
  groups.forEach((g) => {
    const div = document.createElement("div");
    div.className = "group-item mb-2 p-2 border rounded";
    div.innerHTML = `<strong>${g.name}</strong> <span class="text-muted">(${g.members.length} members)</span> <button class="btn btn-sm btn-primary ms-2 selectGroupBtn" data-id="${g.id}">Select</button>`;
    els.groupList.appendChild(div);
  });
  els.groupList.querySelectorAll(".selectGroupBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      selectedGroupId = btn.dataset.id;
      localStorage.setItem("selectedGroupId", selectedGroupId);

      document.dispatchEvent(
        new CustomEvent("groupSelected", {
          detail: { groupId: selectedGroupId },
        })
      );
    });
  });
}
els.createGroupBtn.addEventListener("click", () => {
  els.createGroupModal.style.display = "block";
});
els.createGroupModal.addEventListener("click", (e) => {
  if (e.target === els.createGroupModal) {
    els.createGroupModal.style.display = "none";
  }
});
els.saveGroupBtn.addEventListener("click", async () => {
  const name = els.groupNameInput.value.trim();
  const membersRaw = els.groupMembersInput.value.trim();
  if (!name || !membersRaw) {
    alert("Please enter group name and at least one member email.");
    return;
  }
  const members = membersRaw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e);
  if (!currentUser) return;
  if (!members.includes(currentUser.email)) members.push(currentUser.email);
  try {
    const groupData = {
      name,
      members,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
    };
    const ref = doc(collection(db, "groups"));
    await setDoc(ref, groupData);
    alert("Group created!");
    els.createGroupModal.style.display = "none";
    await loadGroups();
    renderGroups();
  } catch (e) {
    alert("Could not create group.");
    console.error(e);
  }
});
