// src/events.js - Events listing & arrival recording
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Grace period (ms) after scheduled time counts as on-time arrival
const GRACE_MS = 5 * 60 * 1000; // 5 minutes

let currentUser = null;
let events = []; // unified list of personal + shared events
let activeFilter = 'today';

const els = {
  list: document.getElementById('eventsList'),
  tpl: document.getElementById('eventCardTpl'),
  filters: document.querySelectorAll('input[name="evfilter"]')
};

onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
  if (!currentUser) {
    els.list.innerHTML = `<div class="col-12"><div class="alert alert-warning">Please log in to view events.</div></div>`;
    return;
  }
  loadAllEvents(currentUser.uid).then(render).catch(e => {
    console.error(e);
    els.list.innerHTML = `<div class="col-12"><div class="alert alert-danger">Failed to load events.</div></div>`;
  });
});

async function loadAllEvents(uid) {
  events = [];
  // Personal events could be tasks with scheduled times not done yet
  // We'll read from tasks collection: tasks for user with scheduled != null and not done
  try {
    const tq = query(collection(db, 'tasks'), where('userUid', '==', uid));
    const tsnap = await getDocs(tq);
    tsnap.forEach(d => {
      const data = d.data();
      if (data.scheduled && !data.done) {
        events.push({
          id: d.id,
          kind: 'Personal',
          title: data.text || 'Task',
          scheduled: data.scheduled,
          ownerUid: uid,
          source: 'task',
          description: data.description || '',
        });
      }
    });
  } catch (e) { console.warn('Failed to load tasks as events', e); }

  // Shared events: query by email since participants array contains emails
  try {
    if (currentUser.email) {
      const sq = query(collection(db, 'sharedEvents'), where('participants', 'array-contains', currentUser.email));
      const ssnap = await getDocs(sq);
      ssnap.forEach(d => {
        const data = d.data();
        events.push({
          id: d.id,
          kind: 'Shared',
          title: data.title || 'Shared Event',
          scheduled: data.scheduled,
          ownerUid: data.ownerUid,
          ownerEmail: data.ownerEmail || '',
          source: 'shared',
          location: data.location || '',
          description: data.description || '',
          bring: data.bring || '',
          participants: data.participants || []
        });
      });
    }
  } catch (e) { console.info('No sharedEvents collection yet or load failed', e); }

  // Sort by scheduled ascending
  events.sort((a, b) => new Date(a.scheduled) - new Date(b.scheduled));
}

function render() {
  els.list.innerHTML = '';
  const now = new Date();
  const todayStr = now.toISOString().slice(0,10);
  const frag = document.createDocumentFragment();

  const filtered = events.filter(ev => {
    if (activeFilter === 'today') {
      try {
        return new Date(ev.scheduled).toISOString().slice(0,10) === todayStr;
      } catch { return false; }
    }
    return true; // 'all'
  });

  if (filtered.length === 0) {
    const div = document.createElement('div');
    div.className = 'col-12';
    div.innerHTML = `<div class="text-muted">No events${activeFilter==='today'?' today':''}.`;
    frag.appendChild(div);
    els.list.appendChild(frag);
    return;
  }

  filtered.forEach(ev => {
    const node = els.tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = ev.id;
    
    // Apply shared event styling
    if (ev.kind === 'Shared') {
      node.querySelector('.card').classList.add('shared');
      node.querySelector('.badge-kind').classList.add('shared');
    }
    
    node.querySelector('.ev-title').textContent = ev.title;
    node.querySelector('.ev-kind').textContent = ev.kind;
    node.querySelector('.ev-when').textContent = formatDate(ev.scheduled);
    node.querySelector('.ev-time').textContent = formatTime(ev.scheduled);
    
    // Location (for shared events)
    if (ev.location) {
      const locEl = node.querySelector('.ev-location');
      locEl.style.display = 'block';
      locEl.querySelector('span').textContent = ev.location;
    }
    
    // Description
    if (ev.description) {
      const descEl = node.querySelector('.ev-description');
      descEl.style.display = 'block';
      descEl.textContent = ev.description;
    }
    
    // What to bring
    if (ev.bring) {
      const bringEl = node.querySelector('.ev-bring');
      bringEl.style.display = 'block';
      bringEl.querySelector('span').textContent = ev.bring;
    }
    
    // Participants (for shared events)
    if (ev.participants && ev.participants.length > 0) {
      const partEl = node.querySelector('.ev-participants');
      partEl.style.display = 'block';
      const names = ev.participants.map(p => p.split('@')[0]).join(', ');
      partEl.querySelector('span').textContent = `${ev.participants.length} participant${ev.participants.length > 1 ? 's' : ''}: ${names}`;
    }

    const meta = node.querySelector('.ev-meta');
    meta.textContent = ''; // Clear old meta, now using dedicated fields

    // Status (upcoming / past)
    const sched = new Date(ev.scheduled);
    const statusEl = node.querySelector('.ev-status');
    const diff = sched - now;
    if (diff > 0) {
      statusEl.innerHTML = `<span class="status-pill status-on">Upcoming</span>`;
    } else if (diff <= 0 && Math.abs(diff) <= GRACE_MS) {
      statusEl.innerHTML = `<span class="status-pill status-on">Grace Window</span>`;
    } else {
      statusEl.innerHTML = `<span class="status-pill status-late">Past</span>`;
    }

    // Arrival button
    const arrivedBtn = node.querySelector('.ev-arrived');
    arrivedBtn.addEventListener('click', () => recordArrival(ev));

    frag.appendChild(node);
  });

  els.list.appendChild(frag);
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}
function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); } catch { return iso; }
}

async function recordArrival(ev) {
  if (!currentUser) { alert('Log in first'); return; }
  try {
    const sched = new Date(ev.scheduled);
    const now = new Date();
    const onTime = now <= new Date(sched.getTime() + GRACE_MS);
    await addDoc(collection(db, 'events'), {
      userUid: currentUser.uid,
      type: 'arrival',
      timestamp: serverTimestamp(),
      meta: {
        scheduledTime: ev.scheduled,
        arrivalTime: now.toISOString(),
        onTime,
        eventId: ev.id,
        source: 'eventsPage'
      }
    });
    alert(`Arrival recorded. ${onTime ? 'On-Time ✅' : 'Late 🕒'}`);
    // Simple feedback: re-render to update status pill (optional advanced tracking later)
    render();
  } catch (e) {
    console.error('Failed to record arrival', e);
    alert('Could not record arrival');
  }
}

// Filter bindings
els.filters.forEach(r => r.addEventListener('change', () => {
  activeFilter = document.querySelector('input[name="evfilter"]:checked').value;
  render();
}));
