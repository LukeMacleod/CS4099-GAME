/**
 * SIMPLE Dashboard - KISS Principle
 * 
 * Listens to /participants collection
 * Updates UI in real-time
 */

let participantsListener = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const db = window.firebaseDb;

  if (!db) {
    console.error('Firebase not initialized');
    return;
  }

  // Listen to all participants in real-time
  participantsListener = db.collection('participants')
    .onSnapshot((snapshot) => {
      updateDashboard(snapshot.docs);
    }, (error) => {
      console.error('Listener error:', error);
    });

  // Auto-delete all participant records every 1 minute
  setInterval(() => {
    deleteAllParticipants();
  }, 60000);
});

// Update the dashboard UI with participant data
function updateDashboard(docs) {
  const tbody = document.querySelector('.participants-table tbody');
  if (!tbody) return;
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Sort by code
  const participants = docs
    .map(doc => doc.data())
    .sort((a, b) => a.code.localeCompare(b.code));
  
  // Add rows for each participant
  participants.forEach(p => {
    const row = createParticipantRow(p);
    tbody.appendChild(row);
  });
  
  // Update help panels
  updateHelpPanels(participants);
}

// Create a table row for a participant
function createParticipantRow(p) {
  const tr = document.createElement('tr');
  tr.className = 'participant-row';
  
  // Add active class if currently playing
  if (p.currentStatus === 'playing') {
    tr.classList.add('active');
  }
  
  // Add completed class if done
  if (p.currentGame === 'completed') {
    tr.classList.add('completed');
  }
  
  // Determine activity text and status
  let activityText = '';
  let statusText = '';
  let statusClass = '';
  
  if (p.currentGame === 'completed') {
    activityText = 'Crìochnaichte';
    statusText = '';
  } else if (p.currentGame === 'intro') {
    activityText = 'Tòiseachadh';
    statusText = '';
  } else {
    // Game 1, 2, or 3
    const gameNum = p.currentGame.replace('game', '');
    activityText = `Geama ${gameNum}`;
    
    // Status
    if (p.currentStatus === 'playing') {
      statusText = "A' cluich";
      statusClass = 'status-playing';
    } else if (p.currentStatus === 'paused') {
      statusText = 'Stad';
      statusClass = 'status-paused';
    } else if (p.currentStatus === 'help') {
      statusText = 'Cuideachadh';
      statusClass = 'status-help';
    } else if (p.currentStatus === 'idle') {
      statusText = 'Gun ghluasad';
      statusClass = 'status-idle';
    } else if (p.currentStatus === 'tutorial') {
      statusText = 'Oideachadh';
      statusClass = 'status-tutorial';
    }
  }
  
  tr.innerHTML = `
    <td><span class="participant-code">${p.code}</span></td>
    <td>
      <span class="activity">${activityText}</span>
      ${statusText ? `<span class="activity-status ${statusClass}">${statusText}</span>` : ''}
    </td>
    <td>
      <div class="progress-bar">
        <div class="progress-fill${p.progress >= 100 ? ' complete' : ''}" 
             style="width: ${p.progress}%;"></div>
      </div>
    </td>
    <td><span class="game-points${p.game1Points === 0 ? ' inactive-points' : ''}">${p.game1Points || '—'}</span></td>
    <td><span class="game-points${p.game2Points === 0 ? ' inactive-points' : ''}">${p.game2Points || '—'}</span></td>
    <td><span class="game-points${p.game3Points === 0 ? ' inactive-points' : ''}">${p.game3Points || '—'}</span></td>
    <td><span class="points">${p.totalPoints || '—'}</span></td>
  `;
  
  return tr;
}

// Update help tracking panels on the right
function updateHelpPanels(participants) {
  // Seanfhacail panel
  const seanfhacailList = document.querySelector('.help-panel:nth-child(1) .help-list');
  const seanfhacailEmpty = document.querySelector('.help-panel:nth-child(1) .empty-help');
  
  const seanfhacailHelps = participants
    .filter(p => p.helpSeanfhacail && p.helpSeanfhacail.length > 0)
    .flatMap(p => p.helpSeanfhacail.map(h => ({ code: p.code, ...h })))
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10); // Last 10
  
  if (seanfhacailHelps.length > 0) {
    seanfhacailList.style.display = 'flex';
    seanfhacailEmpty.style.display = 'none';
    seanfhacailList.innerHTML = seanfhacailHelps.map(h => `
      <div class="help-item">
        <span class="help-code">${h.code}</span>
        <span class="help-detail">"${h.phrase || 'N/A'}"</span>
      </div>
    `).join('');
  } else {
    seanfhacailList.style.display = 'none';
    seanfhacailEmpty.style.display = 'block';
  }
  
  // Cuideachadh panel
  const cuideachadhList = document.querySelector('.help-panel:nth-child(2) .help-list');
  const cuideachadhEmpty = document.querySelector('.help-panel:nth-child(2) .empty-help');
  
  const cuideachadhHelps = participants
    .filter(p => p.helpCuideachadh && p.helpCuideachadh.length > 0)
    .flatMap(p => p.helpCuideachadh.map(h => ({ code: p.code, ...h })))
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10);
  
  if (cuideachadhHelps.length > 0) {
    cuideachadhList.style.display = 'flex';
    cuideachadhEmpty.style.display = 'none';
    cuideachadhList.innerHTML = cuideachadhHelps.map(h => `
      <div class="help-item">
        <span class="help-code">${h.code}</span>
        <div class="help-games">
          ${h.game ? `<span class="game-badge ${h.game.toLowerCase()}">${h.game.toUpperCase().replace('GAME', 'G')}</span>` : ''}
        </div>
      </div>
    `).join('');
  } else {
    cuideachadhList.style.display = 'none';
    cuideachadhEmpty.style.display = 'block';
  }
}

// Delete all participant records from Firestore
async function deleteAllParticipants() {
  const db = window.firebaseDb;

  try {
    const snapshot = await db.collection('participants').get();

    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting participants:', error);
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (participantsListener) {
    participantsListener();
  }
});
