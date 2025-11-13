// src/statistics.js
// Module to compute and render user statistics from Firestore 'events' collection

import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, Timestamp, deleteDoc, runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

let currentUser = null;
let chart = null;

const els = {
  authMsg: document.getElementById('authMsg'),
  kpiOnTime: document.getElementById('kpi-onTime'),
  kpiOnTimeMeta: document.getElementById('kpi-onTime-meta'),
  kpiArrivals: document.getElementById('kpi-arrivals'),
  kpiCompletions: document.getElementById('kpi-completions'),
  kpiPoints: document.getElementById('kpi-points'),
  kpiPointsMeta: document.getElementById('kpi-points-meta'),
  redeemBtn: document.getElementById('redeemBtn'),
  openStoreBtn: document.getElementById('openStoreBtn'),
  rewardsModal: document.getElementById('rewardsModal'),
  closeStoreBtn: document.getElementById('closeStoreBtn'),
  rewardsGrid: document.getElementById('rewardsGrid'),
  equippedBadgeDisplay: document.getElementById('equippedBadgeDisplay'),
  trendChart: document.getElementById('trendChart'),
  seedBtn: document.getElementById('seedBtn'),
  activityTimeline: document.getElementById('activityTimeline'),
  showMoreContainer: document.getElementById('showMoreContainer'),
  clearActivityBtn: document.getElementById('clearActivityBtn')
};

// Reward catalog (could be moved to separate config file)
const REWARDS = [
  { id: 'badge_time_master', name: 'Time Master', emoji: '⏰', cost: 100, desc: 'Shows superior punctuality.' },
  { id: 'badge_consistency', name: 'Consistency Champ', emoji: '🌟', cost: 100, desc: 'Awarded for persistent effort.' },
  { id: 'badge_focus', name: 'Laser Focus', emoji: '🎯', cost: 100, desc: 'Represents sharp task execution.' },
  { id: 'badge_velocity', name: 'Speed Runner', emoji: '⚡', cost: 100, desc: 'You move fast and finish early.' },
  { id: 'badge_resilience', name: 'Unstoppable', emoji: '🔥', cost: 100, desc: 'Nothing slows you down.' },
  { id: 'badge_elite', name: 'Elite Planner', emoji: '📅', cost: 100, desc: 'Meticulous scheduling skills.' }
];

let rewardState = { points: 0, owned: {}, equipped: null };

onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
  if (!currentUser) {
    els.authMsg.textContent = 'Please log in to view your statistics.';
    clearUI();
    return;
  }
  els.authMsg.textContent = '';
  Promise.all([loadStats(currentUser.uid), loadPoints(currentUser.uid)])
    .catch(err => console.error(err));
});

async function loadPoints(uid) {
  try {
    const dref = doc(db, 'userRewards', uid);
    const snap = await getDoc(dref);
    const pts = snap.exists() ? (snap.data().points || 0) : 0;
    els.kpiPoints.textContent = pts.toString();
    els.kpiPointsMeta.textContent = 'Points earned';
    // Show redeem button only if points >= 1000
    if (els.redeemBtn) {
      if (pts >= 1000) {
        els.redeemBtn.style.display = 'inline-block';
        els.redeemBtn.disabled = false;
        els.redeemBtn.textContent = 'Redeem 1000';
      } else {
        els.redeemBtn.style.display = 'none';
      }
    }
    rewardState.points = pts;
    // Load owned/equipped data
    if (snap.exists()) {
      rewardState.owned = snap.data().owned || {};
      rewardState.equipped = snap.data().equippedBadge || null;
    }
    renderEquippedBadge();
  } catch (e) {
    console.error('Could not load points', e);
    els.kpiPoints.textContent = '—';
  }
}

function renderEquippedBadge() {
  if (!els.equippedBadgeDisplay) return;
  if (!rewardState.equipped) {
    els.equippedBadgeDisplay.style.display = 'none';
    return;
  }
  const reward = REWARDS.find(r => r.id === rewardState.equipped);
  if (!reward) { els.equippedBadgeDisplay.style.display = 'none'; return; }
  els.equippedBadgeDisplay.innerHTML = `${reward.emoji} <span>${reward.name}</span>`;
  els.equippedBadgeDisplay.style.display = 'inline-flex';
}

function openRewardsModal() {
  if (!els.rewardsModal) return;
  els.rewardsModal.style.display = 'flex';
  renderRewardsGrid();
}

function closeRewardsModal() {
  if (!els.rewardsModal) return;
  els.rewardsModal.style.display = 'none';
}

function renderRewardsGrid() {
  if (!els.rewardsGrid) return;
  els.rewardsGrid.innerHTML = '';
  REWARDS.forEach(r => {
    const owned = !!rewardState.owned[r.id];
    const equipped = rewardState.equipped === r.id;
    const canAfford = rewardState.points >= r.cost;
    const card = document.createElement('div');
    card.className = 'col-12 col-sm-6 col-lg-4 mb-3';
    card.innerHTML = `
      <div class="border rounded p-3 h-100 d-flex flex-column" style="background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="font-size:2rem;">${r.emoji}</div>
        <h6 class="mt-2 mb-1" style="font-weight:700;">${r.name}</h6>
        <div class="small text-muted mb-2">${r.desc}</div>
        <div class="mb-2"><span class="badge bg-warning text-dark">Cost: ${r.cost}</span></div>
        <div class="mt-auto d-flex flex-wrap gap-2">
          ${owned ? `<button class="btn btn-sm btn-outline-secondary equip-btn" data-id="${r.id}" ${equipped?'disabled':''}>${equipped?'Equipped':'Equip'}</button>`
            : `<button class="btn btn-sm btn-primary buy-btn" data-id="${r.id}" ${canAfford?'':'disabled'}>${canAfford?'Buy':'Need '+(r.cost-rewardState.points)}</button>`}
        </div>
      </div>`;
    els.rewardsGrid.appendChild(card);
  });
  // Bind buy buttons
  els.rewardsGrid.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => purchaseReward(btn.dataset.id));
  });
  // Bind equip buttons
  els.rewardsGrid.querySelectorAll('.equip-btn').forEach(btn => {
    btn.addEventListener('click', () => equipReward(btn.dataset.id));
  });
}

async function purchaseReward(rewardId) {
  const reward = REWARDS.find(r => r.id === rewardId); if (!reward) return;
  if (!currentUser) { alert('Please log in'); return; }
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'userRewards', currentUser.uid);
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : { points: 0 };
      const pts = data.points || 0;
      const owned = data.owned || {};
      if (owned[rewardId]) throw new Error('Already owned');
      if (pts < reward.cost) throw new Error('Not enough points');
      owned[rewardId] = { acquiredAt: Date.now() };
      tx.set(ref, { points: pts - reward.cost, owned }, { merge: true });
    });
    await loadPoints(currentUser.uid);
    renderRewardsGrid();
    alert(`Purchased ${reward.name}!`);
  } catch (e) {
    console.error('Purchase failed', e);
    alert(e.message || 'Purchase failed');
  }
}

async function equipReward(rewardId) {
  const reward = REWARDS.find(r => r.id === rewardId); if (!reward) return;
  if (!currentUser) { alert('Please log in'); return; }
  try {
    await updateDoc(doc(db, 'userRewards', currentUser.uid), { equippedBadge: rewardId });
    rewardState.equipped = rewardId;
    renderEquippedBadge();
    renderRewardsGrid();
  } catch (e) {
    console.error('Equip failed', e);
    alert('Could not equip badge');
  }
}

function clearUI() {
  els.kpiOnTime.textContent = '—';
  els.kpiArrivals.textContent = '—';
  els.kpiCompletions.textContent = '—';
  if (chart) {
    chart.destroy(); chart = null;
  }
}

async function loadStats(uid) {
  // Fetch events from last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceTs = Timestamp.fromDate(since);

  const q = query(
    collection(db, 'events'),
    where('userUid', '==', uid),
    where('timestamp', '>=', sinceTs),
    orderBy('timestamp', 'asc')
  );

  const snap = await getDocs(q);
  const arrivals = [];
  const completions = [];
  const daily = {}; // yyyy-mm-dd -> { arrivals: n, completions: n }
  const inspectorRows = [];

  snap.forEach(doc => {
    const d = doc.data();
    const ts = d.timestamp && d.timestamp.toDate ? d.timestamp.toDate() : new Date();
    let plotDate = ts;
    try {
      const meta = d.meta || {};
      if (meta.completedTime) {
        const c = meta.completedTime;
        const parsedC = (typeof c === 'number') ? new Date(c) : new Date(c);
        if (!isNaN(parsedC.getTime())) plotDate = parsedC;
      } else if (meta.scheduledTime) {
        const s = meta.scheduledTime;
        const parsed = (typeof s === 'number') ? new Date(s) : new Date(s);
        if (!isNaN(parsed.getTime())) plotDate = parsed;
      } else if (meta.arrivalTime) {
        const a = meta.arrivalTime;
        const parsedA = (typeof a === 'number') ? new Date(a) : new Date(a);
        if (!isNaN(parsedA.getTime())) plotDate = parsedA;
      }
    } catch (e) {
      console.warn('Could not parse meta time for event', e);
      plotDate = ts;
    }
    const day = plotDate.toISOString().slice(0,10);
    
    // Store event data for timeline rendering
    const event = {
      day,
      type: d.type,
      timestamp: (d.timestamp && d.timestamp.toDate) ? d.timestamp.toDate() : new Date(),
      meta: d.meta || {},
      raw: d
    };
    
    if (!daily[day]) daily[day] = { arrivals: 0, completions: 0 };
    if (d.type === 'arrival') {
      arrivals.push(event);
      daily[day].arrivals += 1;
    } else if (d.type === 'completion') {
      completions.push(event);
      daily[day].completions += 1;
    }
  });

  // KPIs
  const arrivalTotal = arrivals.length;
  const arrivalOnTime = arrivals.filter(a => a.meta && a.meta.onTime).length;
  const completionTotal = completions.length;

  els.kpiArrivals.textContent = arrivalTotal.toString();
  els.kpiCompletions.textContent = completionTotal.toString();
  els.kpiOnTime.textContent = arrivalTotal ? Math.round((arrivalOnTime / arrivalTotal) * 100) + '%' : '—';
  els.kpiOnTimeMeta.textContent = arrivalTotal ? `${arrivalOnTime} / ${arrivalTotal} arrivals on time` : 'No arrival data';

  renderChart(daily);

  // Render activity timeline (user-friendly)
  try {
    renderActivityTimeline(arrivals, completions);
  } catch (e) { console.warn('Timeline render failed', e); }
}

function renderActivityTimeline(arrivals, completions) {
  // Combine and sort all events by timestamp (newest first)
  const allEvents = [
    ...arrivals.map(e => ({ ...e, type: 'arrival' })),
    ...completions.map(e => ({ ...e, type: 'completion' }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const timeline = els.activityTimeline;
  timeline.innerHTML = '';

  if (allEvents.length === 0) {
    timeline.innerHTML = `
      <div class="empty-timeline">
        <i class="fas fa-inbox"></i>
        <p>No activity yet. Start completing tasks or recording arrivals!</p>
      </div>
    `;
    els.showMoreContainer.innerHTML = '';
    els.clearActivityBtn.style.display = 'none';
    return;
  }

  // Show clear button when there are events
  els.clearActivityBtn.style.display = 'block';

  // Render all events (CSS class will hide items 4+)
  allEvents.forEach((event, idx) => {
    const item = document.createElement('div');
    item.className = `timeline-item ${event.type}`;
    
    const timeStr = event.timestamp.toLocaleString();
    const meta = event.meta || {};

    let description = '';
    let icon = '';
    let statusBadge = '';

    if (event.type === 'completion') {
      icon = '✓';
      description = `<strong>${meta.taskText || 'Task completed'}</strong>`;
      if (meta.onTime !== undefined) {
        statusBadge = meta.onTime 
          ? '<span class="timeline-badge">On-Time ✓</span>'
          : '<span class="timeline-badge">Late</span>';
      }
    } else if (event.type === 'arrival') {
      icon = '📍';
      const location = meta.locationId || 'Location';
      description = `<strong>Arrival at ${location}</strong>`;
      if (meta.onTime !== undefined) {
        statusBadge = meta.onTime 
          ? '<span class="timeline-badge">On-Time ✓</span>'
          : '<span class="timeline-badge">Late</span>';
      }
    }

    item.innerHTML = `
      <div class="timeline-dot">${icon}</div>
      <div class="timeline-content">
        <div class="timeline-time">${timeStr}</div>
        <div class="timeline-desc">${description}</div>
        <div class="timeline-meta">
          ${statusBadge}
          ${meta.scheduledTime ? `<span><i class="fas fa-calendar"></i> Scheduled: ${new Date(meta.scheduledTime).toLocaleString()}</span>` : ''}
        </div>
      </div>
    `;

    timeline.appendChild(item);
  });

  // Render Show More button if there are more than 3 events
  if (allEvents.length > 3) {
    const moreCount = allEvents.length - 3;
    els.showMoreContainer.innerHTML = `
      <button class="show-more-btn" id="showMoreBtn">
        ▼ Show More (${moreCount} additional events)
      </button>
    `;
    
    const btn = document.getElementById('showMoreBtn');
    let isExpanded = false;
    
    btn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      if (isExpanded) {
        els.activityTimeline.classList.remove('timeline-collapsed');
        btn.textContent = `▲ Show Less`;
      } else {
        els.activityTimeline.classList.add('timeline-collapsed');
        btn.textContent = `▼ Show More (${moreCount} additional events)`;
      }
    });
  } else {
    els.showMoreContainer.innerHTML = '';
  }
}

function renderChart(daily) {
  // build arrays for the last 30 days (even days with 0)
  const labels = [];
  const arrivals = [];
  const completions = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0,10);
    labels.push(key);
    arrivals.push(daily[key] ? daily[key].arrivals : 0);
    completions.push(daily[key] ? daily[key].completions : 0);
  }

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = arrivals;
    chart.data.datasets[1].data = completions;
    chart.update();
    return;
  }

  const ctx = els.trendChart.getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Arrivals', data: arrivals, borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,0.08)', tension: 0.2 },
        { label: 'Completions', data: completions, borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.08)', tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      // Keep aspect ratio stable to avoid repeated resizing animated updates
      maintainAspectRatio: true,
      // Turn off draw animation to prevent the chart from 'moving' continuously
      animation: false,
      // Optional: reduce resize animation behavior (in some Chart.js versions)
      transitions: { show: { animation: { duration: 0 } }, resize: { animation: { duration: 0 } } }
    }
  });
}

// Clear activity history
els.clearActivityBtn?.addEventListener('click', async () => {
  if (!currentUser) { alert('Please log in'); return; }
  if (!confirm('Are you sure you want to clear all activity history? This cannot be undone.')) return;
  
  try {
    // Show loading state
    els.clearActivityBtn.disabled = true;
    els.clearActivityBtn.textContent = '⏳ Clearing...';
    
    // Get all events for this user (no time filter to clear everything)
    const q = query(
      collection(db, 'events'),
      where('userUid', '==', currentUser.uid)
    );
    
    console.log('Querying events for user:', currentUser.uid);
    const snap = await getDocs(q);
    console.log('Found', snap.docs.length, 'events to delete');
    
    // Delete all events
    let deleted = 0;
    let failed = 0;
    
    for (const docSnapshot of snap.docs) {
      try {
        console.log('Deleting event:', docSnapshot.id);
        await deleteDoc(docSnapshot.ref);
        deleted++;
      } catch (err) {
        console.error('Failed to delete event', docSnapshot.id, err);
        failed++;
      }
    }
    
    console.info(`Successfully deleted ${deleted} events, ${failed} failed`);
    
    // Add a small delay to ensure Firestore catches up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload stats
    console.log('Reloading stats...');
    await loadStats(currentUser.uid);
    console.log('Stats reloaded');
    
    // Reset button
    els.clearActivityBtn.disabled = false;
    els.clearActivityBtn.textContent = '🗑 Clear Activity';
    
    alert(`Activity history cleared (${deleted} events removed)`);
  } catch (e) {
    console.error('Failed to clear activity history', e);
    els.clearActivityBtn.disabled = false;
    els.clearActivityBtn.textContent = '🗑 Clear Activity';
    alert('Could not clear activity history: ' + e.message);
  }
});

// Redeem 1000 points
els.redeemBtn?.addEventListener('click', async () => {
  if (!currentUser) { alert('Please log in'); return; }
  try {
    els.redeemBtn.disabled = true;
    els.redeemBtn.textContent = 'Redeeming...';

    await runTransaction(db, async (tx) => {
      const rewardsRef = doc(db, 'userRewards', currentUser.uid);
      const snap = await tx.get(rewardsRef);
      const currentPts = snap.exists() ? (snap.data().points || 0) : 0;
      if (currentPts < 1000) {
        throw new Error('Not enough points to redeem');
      }
      // deduct and increment redemption count
      const newPts = currentPts - 1000;
      tx.set(rewardsRef, { points: newPts, lastUpdated: serverTimestamp(), redemptions: increment(1) }, { merge: true });
    });

    // Optionally record a redemption entry
    try {
      await addDoc(collection(db, 'userRedemptions'), {
        userUid: currentUser.uid,
        amount: 1000,
        timestamp: serverTimestamp(),
        source: 'statisticsRedeemButton'
      });
    } catch (e) {
      console.warn('Could not record redemption entry', e);
    }

    // Reload points and refresh UI
    await loadPoints(currentUser.uid);
    alert('Redeemed 1000 points successfully!');
  } catch (e) {
    console.error('Redeem failed', e);
    alert(e.message || 'Redeem failed');
  } finally {
    // Button will be hidden by loadPoints if points < 1000
    if (els.redeemBtn) {
      els.redeemBtn.disabled = false;
      els.redeemBtn.textContent = 'Redeem 1000';
    }
  }
});

// Open/close store
els.openStoreBtn?.addEventListener('click', openRewardsModal);
els.closeStoreBtn?.addEventListener('click', closeRewardsModal);
els.rewardsModal?.addEventListener('click', (e) => {
  if (e.target === els.rewardsModal) closeRewardsModal();
});

// Seed sample data (for testing)
els.seedBtn?.addEventListener('click', async () => {
  if (!currentUser) { alert('Please log in'); return; }
  if (!confirm('Create sample events for the last 10 days?')) return;
  try {
    const now = new Date();
    let pointsToAward = 0;
    for (let i = 0; i < 10; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString();
      // random arrivals (0-2) with random onTime
      const arrivalCount = Math.floor(Math.random()*3);
      for (let a = 0; a < arrivalCount; a++) {
        const onT = Math.random() > 0.4;
        await addDoc(collection(db, 'events'), {
          userUid: currentUser.uid,
          type: 'arrival',
          timestamp: serverTimestamp(),
          meta: { scheduledTime: iso, onTime: onT }
        });
        if (onT) pointsToAward += 20;
      }
      // random completions (0-4)
      const compCount = Math.floor(Math.random()*5);
      for (let c = 0; c < compCount; c++) {
        await addDoc(collection(db, 'events'), {
          userUid: currentUser.uid,
          type: 'completion',
          timestamp: serverTimestamp(),
          meta: { taskId: `seed-${i}-${c}`, taskText: 'Seeded task' }
        });
        pointsToAward += 10;
      }
    }
    // award accumulated points from seed
    if (pointsToAward > 0) {
      const rewardsRef = doc(db, 'userRewards', currentUser.uid);
      const rSnap2 = await getDoc(rewardsRef);
      if (rSnap2.exists()) {
        await updateDoc(rewardsRef, { points: increment(pointsToAward) });
      } else {
        await setDoc(rewardsRef, { points: pointsToAward, lastUpdated: serverTimestamp() });
      }
    }
    // reload
    await loadStats(currentUser.uid);
    alert('Seed complete');
  } catch (e) {
    console.error(e); alert('Could not seed data');
  }
});

