// src/launchEvent.js - Create shared events with friends
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

let currentUser = null;
let invitedFriends = []; // emails of invited friends

const els = {
  form: document.getElementById('launchEventForm'),
  authMsg: document.getElementById('authMsg'),
  friendEmail: document.getElementById('friendEmail'),
  addFriendBtn: document.getElementById('addFriendBtn'),
  selectedFriends: document.getElementById('selectedFriends'),
  eventTitle: document.getElementById('eventTitle'),
  eventDate: document.getElementById('eventDate'),
  eventTime: document.getElementById('eventTime'),
  eventLocation: document.getElementById('eventLocation'),
  eventDescription: document.getElementById('eventDescription'),
  eventBring: document.getElementById('eventBring'),
};

// Verify all elements were found
console.log('Elements loaded:', {
  form: !!els.form,
  authMsg: !!els.authMsg,
  friendEmail: !!els.friendEmail,
  addFriendBtn: !!els.addFriendBtn,
  selectedFriends: !!els.selectedFriends,
  eventTitle: !!els.eventTitle,
  eventDate: !!els.eventDate,
  eventTime: !!els.eventTime,
  eventLocation: !!els.eventLocation,
  eventDescription: !!els.eventDescription,
  eventBring: !!els.eventBring,
});

if (!els.form) {
  console.error('CRITICAL: launchEventForm not found!');
}

onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
  console.log('Auth state changed:', currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in');
  if (!currentUser) {
    els.authMsg.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>Please <a href="login.html">log in</a> to create events.</div>`;
    els.form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
  } else {
    els.authMsg.innerHTML = '';
    els.form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
  }
});

// Add friend to invite list
if (els.addFriendBtn) {
  els.addFriendBtn.addEventListener('click', () => {
    console.log('Add friend button clicked');
    const email = els.friendEmail.value.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Enter a valid email address');
      return;
    }
    if (currentUser && email === currentUser.email) {
      alert("You can't invite yourself!");
      return;
    }
    if (invitedFriends.includes(email)) {
      alert('This friend is already added');
      return;
    }
    invitedFriends.push(email);
    els.friendEmail.value = '';
    renderFriendsList();
  });
  console.log('Add friend button listener attached');
} else {
  console.error('addFriendBtn element not found!');
}

function renderFriendsList() {
  if (invitedFriends.length === 0) {
    els.selectedFriends.innerHTML = `<small class="text-muted">No friends added yet</small>`;
    return;
  }
  els.selectedFriends.innerHTML = invitedFriends.map((email, idx) => `
    <span class="friend-pill">
      <i class="fas fa-user"></i>
      ${email}
      <span class="remove-friend" data-idx="${idx}" title="Remove">&times;</span>
    </span>
  `).join('');

  // Bind remove handlers
  els.selectedFriends.querySelectorAll('.remove-friend').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      invitedFriends.splice(idx, 1);
      renderFriendsList();
    });
  });
}

// Launch event form
if (els.form) {
  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (!currentUser) {
      alert('Please log in first');
      return;
    }

    const title = els.eventTitle.value.trim();
    const date = els.eventDate.value;
    const time = els.eventTime.value;
    const location = els.eventLocation.value.trim();
    const description = els.eventDescription.value.trim();
    const bring = els.eventBring.value.trim();

    console.log('Form values:', { title, date, time, location, description, bring });

    if (!title || !date || !time) {
      alert('Please fill in Event Name, Date, and Time');
      return;
    }

    // Combine date + time into ISO string for scheduled field
    const scheduled = new Date(`${date}T${time}`).toISOString();

    // Participants: creator + invited friends (we'll store emails for now; 
    // in a real app you'd resolve these to UIDs, but for demo we use emails)
    const participants = [currentUser.email, ...invitedFriends];

    try {
      const eventData = {
        title,
        scheduled,
        location,
        description,
        bring,
        participants,
        ownerUid: currentUser.uid,
        ownerEmail: currentUser.email,
        createdAt: serverTimestamp()
      };

      console.log('Creating event with data:', eventData);
      const docRef = await addDoc(collection(db, 'sharedEvents'), eventData);
      console.log('Event created successfully with ID:', docRef.id);
      
      alert(`🎉 Event "${title}" launched successfully!\n\nView it on the Events page.`);
      
      // Reset form
      els.form.reset();
      invitedFriends = [];
      renderFriendsList();
      
      // Optionally redirect to Events page
      // window.location.href = 'events.html';
    } catch (err) {
      console.error('Failed to launch event:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      alert(`Could not create event: ${err.message}\n\nCheck console for details.`);
    }
  });
  console.log('Form submit listener attached');
} else {
  console.error('Form element not found!');
}
