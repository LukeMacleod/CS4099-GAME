/**
 * Teacher Dashboard JavaScript
 *
 * Manages the teacher dashboard with:
 * - Real-time live session monitoring
 * - Historical session data querying
 * - Aggregate statistics
 * - CSV/JSON data export
 */

// Global dashboard state
const dashboard = {
  db: null,
  auth: null,
  teacherCode: null,
  currentPage: 1,
  pageSize: 20,
  filters: {
    participant: 'all',
    dateRange: 'week'
  },
  allSessions: [],
  liveListener: null
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  dashboard.db = window.firebaseDb;
  dashboard.auth = window.firebaseAuth;

  // Check authentication
  await checkAuthentication();

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  setupLiveSessionsListener();
  await loadHistoricalSessions();
  await calculateAggregateStats();
  await populateParticipantFilter();
});

/**
 * Check if user is authenticated as a teacher
 * Redirect to login if not authenticated or not a teacher
 */
async function checkAuthentication() {
  return new Promise((resolve) => {
    dashboard.auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Not signed in - redirect to main page
        window.location.href = '/';
        return;
      }

      // Get custom claims to check if teacher
      const idTokenResult = await user.getIdTokenResult();

      if (!idTokenResult.claims.type || idTokenResult.claims.type !== 'teacher') {
        // Not a teacher - sign out and redirect
        await dashboard.auth.signOut();
        alert('Access denied. Teacher code required.');
        window.location.href = '/';
        return;
      }

      // Authenticated as teacher
      dashboard.teacherCode = idTokenResult.claims.code;
      document.getElementById('teacher-code').textContent = `Còd: ${dashboard.teacherCode}`;

      resolve();
    });
  });
}

/**
 * Setup event listeners for buttons and filters
 */
function setupEventListeners() {
  // Logout
  document.getElementById('logout-button').addEventListener('click', async () => {
    await dashboard.auth.signOut();
    window.location.href = '/';
  });

  // Filters
  document.getElementById('participant-filter').addEventListener('change', (e) => {
    dashboard.filters.participant = e.target.value;
    dashboard.currentPage = 1;
    loadHistoricalSessions();
  });

  document.getElementById('date-filter').addEventListener('change', (e) => {
    dashboard.filters.dateRange = e.target.value;
    dashboard.currentPage = 1;
    loadHistoricalSessions();
  });

  // Refresh
  document.getElementById('refresh-button').addEventListener('click', () => {
    loadHistoricalSessions();
    calculateAggregateStats();
  });

  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => {
    if (dashboard.currentPage > 1) {
      dashboard.currentPage--;
      renderSessionsTable();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(dashboard.allSessions.length / dashboard.pageSize);
    if (dashboard.currentPage < totalPages) {
      dashboard.currentPage++;
      renderSessionsTable();
    }
  });

  // Export buttons
  document.getElementById('export-csv').addEventListener('click', exportToCSV);
  document.getElementById('export-json').addEventListener('click', exportToJSON);

  // Modal close
  document.getElementById('close-modal').addEventListener('click', closeModal);

  // Close modal on background click
  document.getElementById('session-modal').addEventListener('click', (e) => {
    if (e.target.id === 'session-modal') {
      closeModal();
    }
  });
}

/**
 * Setup real-time listener for live (in-progress) sessions
 */
function setupLiveSessionsListener() {
  const liveSessionsContainer = document.getElementById('live-sessions');
  const liveCountBadge = document.getElementById('live-count');

  // Detach previous listener if exists
  if (dashboard.liveListener) {
    dashboard.liveListener();
  }

  // Create real-time listener
  dashboard.liveListener = dashboard.db.collection('sessions')
    .where('status', '==', 'in_progress')
    .orderBy('startTime', 'desc')
    .onSnapshot((snapshot) => {
      const liveSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update count badge
      liveCountBadge.textContent = `${liveSessions.length} active`;

      // Render live session cards
      if (liveSessions.length === 0) {
        liveSessionsContainer.innerHTML = '<p class="empty-state">Chan eil cluicheadairean beò an-dràsta / No active players</p>';
      } else {
        liveSessionsContainer.innerHTML = liveSessions.map(session => `
          <div class="live-session-card">
            <h3>${session.participantCode}</h3>
            <div class="live-session-info">
              <div>
                <span>Geama (Game):</span>
                <span class="live-badge">${getCurrentGame(session)}</span>
              </div>
              <div>
                <span>Puingean (Points):</span>
                <strong>${session.totalPoints || 0}</strong>
              </div>
              <div>
                <span>Ùine (Elapsed):</span>
                <strong>${formatElapsedTime(session.startTime)}</strong>
              </div>
            </div>
          </div>
        `).join('');
      }

      // Auto-refresh elapsed time every second
      if (liveSessions.length > 0) {
        setTimeout(() => {
          const timeElements = document.querySelectorAll('.live-session-card strong');
          liveSessions.forEach((session, idx) => {
            if (timeElements[idx * 2 + 1]) { // Every second time element is elapsed time
              timeElements[idx * 2 + 1].textContent = formatElapsedTime(session.startTime);
            }
          });
        }, 1000);
      }
    });
}

/**
 * Determine current game from completed games
 */
function getCurrentGame(session) {
  const completed = session.completedGames || [];
  if (completed.length === 0) return 'Geama 1';
  if (completed.length === 1) return 'Geama 2';
  if (completed.length === 2) return 'Geama 3';
  return 'Crìochnaichte';
}

/**
 * Format elapsed time from Firestore timestamp
 */
function formatElapsedTime(firestoreTimestamp) {
  if (!firestoreTimestamp) return '0:00';

  const startTime = firestoreTimestamp.toDate ? firestoreTimestamp.toDate() : new Date(firestoreTimestamp.seconds * 1000);
  const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Load historical sessions based on filters
 */
async function loadHistoricalSessions() {
  const tbody = document.getElementById('sessions-tbody');
  tbody.innerHTML = '<tr class="empty-state-row"><td colspan="7">A\' luchdachadh... / Loading...</td></tr>';

  try {
    // Build query
    let query = dashboard.db.collection('sessions');

    // Filter by participant code
    if (dashboard.filters.participant !== 'all') {
      query = query.where('participantCode', '==', dashboard.filters.participant);
    }

    // Filter by date range
    if (dashboard.filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dashboard.filters.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
      }

      if (startDate) {
        query = query.where('startTime', '>=', startDate);
      }
    }

    // Order by most recent
    query = query.orderBy('startTime', 'desc');

    // Execute query
    const snapshot = await query.get();

    dashboard.allSessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Reset to first page
    dashboard.currentPage = 1;

    // Render table
    renderSessionsTable();

  } catch (error) {
    console.error('Error loading sessions:', error);
    tbody.innerHTML = '<tr class="empty-state-row"><td colspan="7">Mearachd a\' luchdachadh / Error loading data</td></tr>';
  }
}

/**
 * Render sessions table with pagination
 */
function renderSessionsTable() {
  const tbody = document.getElementById('sessions-tbody');

  if (dashboard.allSessions.length === 0) {
    tbody.innerHTML = '<tr class="empty-state-row"><td colspan="7">Cha deach seiseanan a lorg / No sessions found</td></tr>';
    updatePagination();
    return;
  }

  // Calculate pagination
  const startIdx = (dashboard.currentPage - 1) * dashboard.pageSize;
  const endIdx = Math.min(startIdx + dashboard.pageSize, dashboard.allSessions.length);
  const pageSessions = dashboard.allSessions.slice(startIdx, endIdx);

  // Render rows
  tbody.innerHTML = pageSessions.map(session => {
    const startTime = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime?.seconds * 1000);
    const endTime = session.endTime?.toDate ? session.endTime.toDate() : null;
    const duration = endTime ? Math.floor((endTime - startTime) / 1000 / 60) : 0;

    const statusClass = `status-${session.status || 'unknown'}`;
    const statusText = session.status === 'completed' ? 'Crìochnaichte' :
                       session.status === 'in_progress' ? 'A\' dol' :
                       'Air a thrèigsinn';

    const completedCount = session.completedGames?.length || 0;

    return `
      <tr>
        <td>${formatDate(startTime)}</td>
        <td><strong>${session.participantCode}</strong></td>
        <td>${session.totalPoints || 0}</td>
        <td>${completedCount}/3</td>
        <td>${duration} mionaidean</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="view-button" onclick="viewSessionDetail('${session.id}')">
            Seall / View
          </button>
        </td>
      </tr>
    `;
  }).join('');

  updatePagination();
}

/**
 * Update pagination controls
 */
function updatePagination() {
  const totalPages = Math.ceil(dashboard.allSessions.length / dashboard.pageSize);

  document.getElementById('prev-page').disabled = dashboard.currentPage === 1;
  document.getElementById('next-page').disabled = dashboard.currentPage >= totalPages;
  document.getElementById('page-info').textContent = `Duilleag ${dashboard.currentPage} à ${totalPages}`;
}

/**
 * Format date to readable string
 */
function formatDate(date) {
  if (!date) return '-';
  return date.toLocaleDateString('gd-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * View detailed session information in modal
 */
async function viewSessionDetail(sessionId) {
  const modal = document.getElementById('session-modal');
  const detailContainer = document.getElementById('session-detail');

  detailContainer.innerHTML = '<p>A\' luchdachadh... / Loading...</p>';
  modal.classList.add('visible');

  try {
    // Get session data
    const sessionDoc = await dashboard.db.collection('sessions').doc(sessionId).get();
    const session = { id: sessionDoc.id, ...sessionDoc.data() };

    // Get events
    const eventsSnapshot = await dashboard.db.collection('sessions').doc(sessionId)
                                             .collection('events').orderBy('timestamp', 'asc').get();
    const events = eventsSnapshot.docs.map(doc => doc.data());

    // Render detail
    const startTime = session.startTime?.toDate ? session.startTime.toDate() : null;
    const endTime = session.endTime?.toDate ? session.endTime.toDate() : null;
    const duration = startTime && endTime ? Math.floor((endTime - startTime) / 1000 / 60) : 0;

    detailContainer.innerHTML = `
      <div class="detail-section">
        <h3>Fiosrachadh Coitcheann / General Information</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Còd Com-pàirtiche</div>
            <div class="detail-value">${session.participantCode}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Puingean Iomlan</div>
            <div class="detail-value">${session.totalPoints || 0}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Inbhe</div>
            <div class="detail-value">${session.status}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Ùine Iomlan</div>
            <div class="detail-value">${duration} mionaidean</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Tòisich</div>
            <div class="detail-value">${formatDate(startTime)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Crìochnaich</div>
            <div class="detail-value">${endTime ? formatDate(endTime) : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Dèanadas Geama / Game Performance</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Geama 1 - Puingean</div>
            <div class="detail-value">${session.metadata?.game1Score || 0}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Geama 2 - Puingean</div>
            <div class="detail-value">${session.metadata?.game2Score || 0}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Geama 3 - Puingean</div>
            <div class="detail-value">${session.metadata?.game3Score || 0}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Cleachdadh Cuideachadh</div>
            <div class="detail-value">${session.metadata?.helpButtonClicks || 0} clicks</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Ùine Oideachaidh</div>
            <div class="detail-value">${session.metadata?.tutorialTimeSpent || 0}s</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Geamaichean Crìochnaichte</div>
            <div class="detail-value">${session.completedGames?.length || 0}/3</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Loga Tachartais / Event Log (${events.length} events)</h3>
        <div class="event-log">
          ${events.map(event => {
            const time = event.timestamp?.toDate ? event.timestamp.toDate() : new Date();
            return `
              <div class="event-item">
                <span class="event-time">${time.toLocaleTimeString()}</span>
                <span class="event-type">${event.eventType}</span>
                <span>${JSON.stringify(event.data || {})}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error loading session detail:', error);
    detailContainer.innerHTML = '<p>Mearachd a\' luchdachadh / Error loading details</p>';
  }
}

/**
 * Close modal
 */
function closeModal() {
  document.getElementById('session-modal').classList.remove('visible');
}

/**
 * Calculate and display aggregate statistics
 */
async function calculateAggregateStats() {
  try {
    // Get all completed sessions
    const completedSnapshot = await dashboard.db.collection('sessions')
                                                .where('status', '==', 'completed')
                                                .get();

    const completedSessions = completedSnapshot.docs.map(doc => doc.data());

    // Get total sessions (all statuses)
    const totalSnapshot = await dashboard.db.collection('sessions').get();
    const totalSessions = totalSnapshot.size;

    // Calculate stats
    const uniqueParticipants = new Set(completedSessions.map(s => s.participantCode)).size;
    const completionRate = totalSessions > 0 ? ((completedSessions.length / totalSessions) * 100).toFixed(1) : 0;

    const avgScore = completedSessions.length > 0
      ? (completedSessions.reduce((sum, s) => sum + (s.totalPoints || 0), 0) / completedSessions.length).toFixed(1)
      : 0;

    const avgDuration = completedSessions.length > 0
      ? (completedSessions.reduce((sum, s) => {
          const start = s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime?.seconds * 1000);
          const end = s.endTime?.toDate ? s.endTime.toDate() : new Date(s.endTime?.seconds * 1000);
          return sum + (end - start) / 1000 / 60;
        }, 0) / completedSessions.length).toFixed(1)
      : 0;

    const avgHelp = completedSessions.length > 0
      ? (completedSessions.reduce((sum, s) => sum + (s.metadata?.helpButtonClicks || 0), 0) / completedSessions.length).toFixed(1)
      : 0;

    // Update DOM
    document.getElementById('total-participants').textContent = uniqueParticipants;
    document.getElementById('total-sessions').textContent = totalSessions;
    document.getElementById('completion-rate').textContent = `${completionRate}%`;
    document.getElementById('avg-score').textContent = avgScore;
    document.getElementById('avg-duration').textContent = `${avgDuration} min`;
    document.getElementById('help-usage').textContent = avgHelp;

  } catch (error) {
    console.error('Error calculating stats:', error);
  }
}

/**
 * Populate participant filter dropdown
 */
async function populateParticipantFilter() {
  try {
    const snapshot = await dashboard.db.collection('sessions').get();
    const participants = new Set(snapshot.docs.map(doc => doc.data().participantCode));

    const select = document.getElementById('participant-filter');
    const sortedParticipants = Array.from(participants).sort();

    sortedParticipants.forEach(code => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = code;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error populating participant filter:', error);
  }
}

/**
 * Export sessions to CSV
 */
async function exportToCSV() {
  try {
    const sessions = dashboard.allSessions.filter(s => s.status === 'completed');

    if (sessions.length === 0) {
      alert('Cha deach seiseanan crìochnaichte a lorg / No completed sessions to export');
      return;
    }

    // CSV headers
    const headers = [
      'sessionId',
      'participantCode',
      'startTime',
      'endTime',
      'duration',
      'totalPoints',
      'game1Score',
      'game2Score',
      'game3Score',
      'completedGames',
      'helpClicks',
      'soundToggles',
      'tutorialTime'
    ];

    // CSV rows
    const rows = sessions.map(session => {
      const startTime = session.startTime?.toDate ? session.startTime.toDate() : null;
      const endTime = session.endTime?.toDate ? session.endTime.toDate() : null;
      const duration = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

      return [
        session.id,
        session.participantCode,
        startTime ? startTime.toISOString() : '',
        endTime ? endTime.toISOString() : '',
        duration,
        session.totalPoints || 0,
        session.metadata?.game1Score || 0,
        session.metadata?.game2Score || 0,
        session.metadata?.game3Score || 0,
        (session.completedGames || []).join(';'),
        session.metadata?.helpButtonClicks || 0,
        session.metadata?.soundToggleCount || 0,
        session.metadata?.tutorialTimeSpent || 0
      ];
    });

    // Generate CSV
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    // Download
    downloadFile('gaelic-games-sessions.csv', csv, 'text/csv');

  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Mearachd / Error exporting data');
  }
}

/**
 * Export sessions to JSON with full event logs
 */
async function exportToJSON() {
  try {
    const sessions = dashboard.allSessions.filter(s => s.status === 'completed');

    if (sessions.length === 0) {
      alert('Cha deach seiseanan crìochnaichte a lorg / No completed sessions to export');
      return;
    }

    // Fetch full data with events for each session
    const fullData = await Promise.all(sessions.map(async (session) => {
      const eventsSnapshot = await dashboard.db.collection('sessions').doc(session.id)
                                              .collection('events').orderBy('timestamp', 'asc').get();

      return {
        sessionId: session.id,
        participantCode: session.participantCode,
        startTime: session.startTime?.toDate ? session.startTime.toDate().toISOString() : null,
        endTime: session.endTime?.toDate ? session.endTime.toDate().toISOString() : null,
        status: session.status,
        totalPoints: session.totalPoints || 0,
        completedGames: session.completedGames || [],
        metadata: session.metadata || {},
        events: eventsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : null,
            eventType: data.eventType,
            data: data.data
          };
        })
      };
    }));

    const exportData = {
      exportDate: new Date().toISOString(),
      totalSessions: fullData.length,
      sessions: fullData
    };

    // Download
    downloadFile('gaelic-games-sessions.json', JSON.stringify(exportData, null, 2), 'application/json');

  } catch (error) {
    console.error('Error exporting JSON:', error);
    alert('Mearachd / Error exporting data');
  }
}

/**
 * Utility function to trigger file download
 */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Make viewSessionDetail available globally for onclick
window.viewSessionDetail = viewSessionDetail;
