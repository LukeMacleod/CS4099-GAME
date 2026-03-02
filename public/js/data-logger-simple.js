/**
 * SIMPLE DataLogger - KISS Principle
 *
 * ONE document per participant: /participants/{code}
 * Updates current state every 10 seconds
 *
 * BACKUP SYSTEM: Complete experiment data backup for safety
 */

class DataLogger {
  constructor(participantCode) {
    this.code = participantCode;
    this.db = window.firebaseDb;
    this.docRef = this.db.collection('participants').doc(participantCode);

    // BACKUP: Create unique session ID with timestamp
    this.sessionId = `${participantCode}_${Date.now()}`;
    this.sessionStartTime = new Date().toISOString();

    // Local state (syncs every 10 seconds)
    this.state = {
      code: participantCode,
      currentGame: 'intro',
      currentStatus: 'playing',
      totalPoints: 0,
      game1Points: 0,
      game2Points: 0,
      game3Points: 0,
      progress: 0,
      lastUpdate: new Date(),
      helpSeanfhacail: [],
      helpCuideachadh: []
    };

    // Auto-sync every 10 seconds
    this.syncInterval = null;
    this.syncTimeout = null;

    // BACKUP: Snapshot interval (every 30 seconds)
    this.backupInterval = null;
  }

  // Initialize - create/update participant document
  async init() {
    try {
      // Write to main participants collection
      await this.docRef.set(this.state, { merge: true });

      // BACKUP: Log login event to experiment_backup collection
      await this.logLoginToBackup();

      // BACKUP: Create initial session snapshot
      await this.createBackupSnapshot('session_start');

    } catch (error) {
      console.error('Failed to write initial data:', error);
      throw error;
    }

    // Start auto-sync every 5 seconds (balances real-time updates with Firestore limits)
    this.syncInterval = setInterval(() => this.sync(), 5000);

    // BACKUP: Start automatic snapshot every 30 seconds
    this.backupInterval = setInterval(() => this.createBackupSnapshot('auto_snapshot'), 30000);
  }

  // Debounced sync - prevents hitting 1 write/second limit
  debouncedSync() {
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => this.sync(), 500);
  }

  // Update current game (game1, game2, game3, intro, completed)
  updateGame(game) {
    const oldGame = this.state.currentGame;
    this.state.currentGame = game;
    this.state.lastUpdate = new Date();

    // BACKUP: Log state transition
    this.logEventToBackup('state_transition', {
      from: oldGame,
      to: game
    });

    // CRITICAL: Sync immediately for state transitions (teachers see screen changes fast)
    this.sync();
  }

  // Update status (playing, paused, help, idle, tutorial)
  updateStatus(status) {
    const oldStatus = this.state.currentStatus;
    this.state.currentStatus = status;
    this.state.lastUpdate = new Date();

    // BACKUP: Log status change
    this.logEventToBackup('status_change', {
      from: oldStatus,
      to: status
    });

    // CRITICAL: Sync immediately for status changes (not debounced)
    // Teachers need to see pause/help status in real-time
    this.sync();
  }

  // Add points to total and current game
  addPoints(points) {
    this.state.totalPoints += points;

    if (this.state.currentGame === 'game1') this.state.game1Points += points;
    if (this.state.currentGame === 'game2') this.state.game2Points += points;
    if (this.state.currentGame === 'game3') this.state.game3Points += points;

    this.state.lastUpdate = new Date();

    // Sync points to Firestore with debounce (prevents too many writes)
    // Points will sync within 500ms, ensuring dashboard updates quickly
    this.debouncedSync();
  }

  // Update progress percentage (0-100)
  updateProgress(percent) {
    this.state.progress = Math.min(100, Math.max(0, percent));
    this.state.lastUpdate = new Date();
    this.debouncedSync();
  }

  // Log help request for Seanfhacail panel
  logHelpSeanfhacail(phrase) {
    this.state.helpSeanfhacail.push({
      time: new Date().toISOString(),
      phrase: phrase
    });

    // BACKUP: Log help request event
    this.logEventToBackup('help_seanfhacail', { phrase: phrase });

    this.sync(); // Immediate sync for help requests
  }

  // Log help request for Cuideachadh panel
  logHelpCuideachadh(game) {
    this.state.helpCuideachadh.push({
      time: new Date().toISOString(),
      game: game
    });

    // BACKUP: Log help request event
    this.logEventToBackup('help_cuideachadh', { game: game });

    this.sync(); // Immediate sync for help requests
  }

  // Log sound toggle events
  logSoundToggle(enabled) {
    // Optional: track sound toggles if needed for research
    console.log('Sound toggled:', enabled);
  }

  // Log state transitions (e.g., LOGIN -> RUAIRIDH_INTRO -> GAME1)
  logStateTransition(oldState, newState) {
    console.log('State transition:', oldState, '->', newState);
    this.updateGame(newState.toLowerCase());
  }

  // Log game start events
  logGameStart(gameNumber) {
    console.log('Game started:', gameNumber);
    this.updateStatus('playing');
  }

  // Log help requests
  logHelpRequest(currentState, timeInGame) {
    this.logHelpCuideachadh(currentState);
  }

  // Log points increment (batched)
  logPointsIncrement(points) {
    this.addPoints(points);
  }

  // Finalize session at game completion
  async finalizeSession(data) {
    await this.complete();
  }

  // Sync current state to Firestore
  async sync() {
    try {
      await this.docRef.set({
        ...this.state,
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Complete the session
  async complete() {
    this.state.currentGame = 'completed';
    this.state.currentStatus = 'completed';
    this.state.progress = 100;
    await this.sync();

    // BACKUP: Create final session snapshot
    await this.createBackupSnapshot('session_complete');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
  }

  // ===== BACKUP SYSTEM METHODS =====

  /**
   * Log participant login to experiment_backup/logins collection
   * Records every login instance with timestamp
   */
  async logLoginToBackup() {
    try {
      const loginDoc = {
        code: this.code,
        sessionId: this.sessionId,
        loginTime: firebase.firestore.FieldValue.serverTimestamp(),
        loginTimeLocal: this.sessionStartTime,
        userAgent: navigator.userAgent,
        type: this.code.startsWith('T-') ? 'teacher' : 'participant'
      };

      await this.db.collection('experiment_backup')
        .doc('logins')
        .collection('entries')
        .add(loginDoc);

      console.log(`✅ BACKUP: Login logged for ${this.code}`);
    } catch (error) {
      console.error('❌ BACKUP: Failed to log login:', error);
    }
  }

  /**
   * Create a complete snapshot of current participant state
   * Saves to experiment_backup/sessions/{code}/snapshots/{timestamp}
   */
  async createBackupSnapshot(snapshotType = 'auto') {
    try {
      const snapshot = {
        sessionId: this.sessionId,
        snapshotType: snapshotType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        timestampLocal: new Date().toISOString(),
        sessionStartTime: this.sessionStartTime,

        // Complete participant state (everything shown on dashboard)
        code: this.state.code,
        currentGame: this.state.currentGame,
        currentStatus: this.state.currentStatus,
        totalPoints: this.state.totalPoints,
        game1Points: this.state.game1Points,
        game2Points: this.state.game2Points,
        game3Points: this.state.game3Points,
        progress: this.state.progress,

        // Help tracking (dashboard panels)
        helpSeanfhacail: [...this.state.helpSeanfhacail],
        helpCuideachadh: [...this.state.helpCuideachadh],

        // Session metadata
        snapshotNumber: Date.now()
      };

      await this.db.collection('experiment_backup')
        .doc('sessions')
        .collection(this.code)
        .doc(this.sessionId)
        .collection('snapshots')
        .add(snapshot);

      console.log(`✅ BACKUP: Snapshot created (${snapshotType}) for ${this.code}`);
    } catch (error) {
      console.error('❌ BACKUP: Failed to create snapshot:', error);
    }
  }

  /**
   * Log individual events to backup for detailed analysis
   */
  async logEventToBackup(eventType, eventData) {
    try {
      const event = {
        sessionId: this.sessionId,
        code: this.code,
        eventType: eventType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        timestampLocal: new Date().toISOString(),
        data: eventData,

        // Current state at time of event
        currentGame: this.state.currentGame,
        currentStatus: this.state.currentStatus,
        totalPoints: this.state.totalPoints
      };

      await this.db.collection('experiment_backup')
        .doc('events')
        .collection(this.code)
        .add(event);

      console.log(`✅ BACKUP: Event logged (${eventType}) for ${this.code}`);
    } catch (error) {
      console.error('❌ BACKUP: Failed to log event:', error);
    }
  }
}

window.DataLogger = DataLogger;
