/**
 * SIMPLE Dashboard - KISS Principle
 * 
 * Listens to /participants collection
 * Updates UI in real-time
 */

let participantsListener = null;
let updateTimeout = null;

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
      // Minimal debounce (50ms) for near-instant updates
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        updateDashboard(snapshot.docs);
      }, 50);
    }, (error) => {
      console.error('Listener error:', error);
    });

  // Auto-delete all participant records every 48 hours
  setInterval(() => {
    deleteAllParticipants();
  }, 172800000); // 48 hours = 48 * 60 * 60 * 1000 ms
});

// Update the dashboard UI with participant data
function updateDashboard(docs) {
  const tbody = document.querySelector('.participants-table tbody');
  if (!tbody) return;

  // Sort by code
  const participants = docs
    .map(doc => doc.data())
    .sort((a, b) => a.code.localeCompare(b.code));

  // Create a map of existing rows by participant code
  const existingRows = new Map();
  Array.from(tbody.children).forEach(row => {
    const code = row.querySelector('.participant-code')?.textContent;
    if (code) {
      existingRows.set(code, row);
    }
  });

  // Track which rows we've processed
  const processedCodes = new Set();

  // Update or add rows
  participants.forEach((p, index) => {
    processedCodes.add(p.code);
    const existingRow = existingRows.get(p.code);

    if (existingRow) {
      // Update existing row only if data changed
      updateRowIfChanged(existingRow, p);

      // Ensure correct position (move if needed)
      const currentIndex = Array.from(tbody.children).indexOf(existingRow);
      if (currentIndex !== index) {
        if (index >= tbody.children.length) {
          tbody.appendChild(existingRow);
        } else {
          tbody.insertBefore(existingRow, tbody.children[index]);
        }
      }
    } else {
      // Add new row
      const newRow = createParticipantRow(p);
      if (index >= tbody.children.length) {
        tbody.appendChild(newRow);
      } else {
        tbody.insertBefore(newRow, tbody.children[index]);
      }
    }
  });

  // Remove rows that no longer exist
  existingRows.forEach((row, code) => {
    if (!processedCodes.has(code)) {
      row.remove();
    }
  });

  // Update help panels
  updateHelpPanels(participants);
}

// Update row only if data has changed (prevents unnecessary DOM manipulation)
function updateRowIfChanged(row, participantData) {
  const p = participantData;

  // Check if we need to update the row classes
  const shouldBeActive = p.currentStatus === 'playing';
  const shouldBeCompleted = p.currentGame === 'completed';

  if (shouldBeActive && !row.classList.contains('active')) {
    row.classList.add('active');
  } else if (!shouldBeActive && row.classList.contains('active')) {
    row.classList.remove('active');
  }

  if (shouldBeCompleted && !row.classList.contains('completed')) {
    row.classList.add('completed');
  } else if (!shouldBeCompleted && row.classList.contains('completed')) {
    row.classList.remove('completed');
  }

  // Get current activity text
  const activityText = getActivityLabel(p.currentGame);
  let statusText = '';
  let statusClass = '';

  // Only show status if NOT completed
  if (p.currentGame !== 'completed') {
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

  // Update activity cell
  const activityCell = row.children[1];
  const currentActivityHTML = activityCell.innerHTML;
  const newActivityHTML = `
      <span class="activity">${activityText}</span>
      ${statusText ? `<span class="activity-status ${statusClass}">${statusText}</span>` : ''}
    `.trim();

  if (currentActivityHTML.trim() !== newActivityHTML.trim()) {
    activityCell.innerHTML = newActivityHTML;
  }

  // Update progress bar
  const progressFill = row.children[2].querySelector('.progress-fill');
  const newProgress = p.progress || 0;
  const currentProgress = parseInt(progressFill.style.width) || 0;

  if (newProgress !== currentProgress) {
    progressFill.style.width = `${newProgress}%`;
    if (newProgress >= 100 && !progressFill.classList.contains('complete')) {
      progressFill.classList.add('complete');
    } else if (newProgress < 100 && progressFill.classList.contains('complete')) {
      progressFill.classList.remove('complete');
    }
  }

  // Update game points
  const game1El = row.children[3].querySelector('.game-points');
  const game2El = row.children[4].querySelector('.game-points');
  const game3El = row.children[5].querySelector('.game-points');
  const totalEl = row.children[6].querySelector('.points');

  updatePointsElement(game1El, p.game1Points);
  updatePointsElement(game2El, p.game2Points);
  updatePointsElement(game3El, p.game3Points);

  if (totalEl.textContent !== String(p.totalPoints || '—')) {
    totalEl.textContent = p.totalPoints || '—';
  }
}

// Helper to update points element
function updatePointsElement(element, points) {
  const displayValue = points || '—';
  const shouldBeInactive = points === 0;

  if (element.textContent !== String(displayValue)) {
    element.textContent = displayValue;
  }

  if (shouldBeInactive && !element.classList.contains('inactive-points')) {
    element.classList.add('inactive-points');
  } else if (!shouldBeInactive && element.classList.contains('inactive-points')) {
    element.classList.remove('inactive-points');
  }
}

// Map technical state names to teacher-friendly Gaelic labels
function getActivityLabel(currentGame) {
  // Normalize the state name (lowercase, trim whitespace)
  const normalizedState = (currentGame || '').toLowerCase().trim();

  const stateLabels = {
    'intro': 'Tòiseachadh',
    'login': 'Logadh a-steach',
    'ruairidh_intro': 'Fàilte le Ruairidh',
    'pregame_tutorial': 'Oideachadh: Sgrìn',
    'game1_tutorial': 'Oideachadh: Geama 1',
    'game1': 'Geama 1: Glac an Giomach',
    'game2_ready': 'Ullaichte airson Geama 2',
    'game2_tutorial': 'Oideachadh: Geama 2',
    'game2': 'Geama 2: Cho Coltrach',
    'game3_ready': 'Ullaichte airson Geama 3',
    'game3_tutorial': 'Oideachadh: Geama 3',
    'game3': 'Geama 3: Cho luath',
    'results': 'Toraidhean',
    'completed': 'Crìochnaichte'
  };

  // Return the mapped label, or a debug version showing what we received
  return stateLabels[normalizedState] || `[${normalizedState}]`;
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
  const activityText = getActivityLabel(p.currentGame);
  let statusText = '';
  let statusClass = '';

  // Only show status if NOT completed
  if (p.currentGame !== 'completed') {
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

    // Build HTML string first
    const newHTML = seanfhacailHelps.map(h => `
      <div class="help-item">
        <span class="help-code">${h.code}</span>
        <span class="help-detail">"${h.phrase || 'N/A'}"</span>
      </div>
    `).join('');

    // Only update if content changed (prevents flickering)
    if (seanfhacailList.innerHTML !== newHTML) {
      seanfhacailList.innerHTML = newHTML;
    }
  } else {
    seanfhacailList.style.display = 'none';
    seanfhacailEmpty.style.display = 'block';
  }

  // Cuideachadh panel - group by participant, show unique games
  const cuideachadhList = document.querySelector('.help-panel:nth-child(2) .help-list');
  const cuideachadhEmpty = document.querySelector('.help-panel:nth-child(2) .empty-help');

  // Group help requests by participant code
  const cuideachadhByParticipant = {};
  participants
    .filter(p => p.helpCuideachadh && p.helpCuideachadh.length > 0)
    .forEach(p => {
      if (!cuideachadhByParticipant[p.code]) {
        cuideachadhByParticipant[p.code] = {
          code: p.code,
          games: new Set(),
          lastTime: null
        };
      }

      p.helpCuideachadh.forEach(h => {
        if (h.game) {
          cuideachadhByParticipant[p.code].games.add(h.game);
        }
        // Track most recent help time for sorting
        const helpTime = new Date(h.time);
        if (!cuideachadhByParticipant[p.code].lastTime || helpTime > cuideachadhByParticipant[p.code].lastTime) {
          cuideachadhByParticipant[p.code].lastTime = helpTime;
        }
      });
    });

  // Convert to array and sort by most recent help request
  const cuideachadhGrouped = Object.values(cuideachadhByParticipant)
    .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
    .slice(0, 10); // Show last 10 participants

  if (cuideachadhGrouped.length > 0) {
    cuideachadhList.style.display = 'flex';
    cuideachadhEmpty.style.display = 'none';

    // Build HTML string first
    const newHTML = cuideachadhGrouped.map(p => {
      // Convert Set to Array and sort games (G1, G2, G3)
      const sortedGames = Array.from(p.games).sort();
      const gameBadges = sortedGames.map(game =>
        `<span class="game-badge ${game.toLowerCase()}">${game.toUpperCase().replace('GAME', 'G')}</span>`
      ).join('');

      return `
        <div class="help-item">
          <span class="help-code">${p.code}</span>
          <div class="help-games">
            ${gameBadges}
          </div>
        </div>
      `;
    }).join('');

    // Only update if content changed (prevents flickering)
    if (cuideachadhList.innerHTML !== newHTML) {
      cuideachadhList.innerHTML = newHTML;
    }
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
