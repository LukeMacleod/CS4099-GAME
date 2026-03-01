/**
 * SIMPLE DataLogger - KISS Principle
 * 
 * ONE document per participant: /participants/{code}
 * Updates current state every 10 seconds
 */

class DataLogger {
  constructor(participantCode) {
    this.code = participantCode;
    this.db = window.firebaseDb;
    this.docRef = this.db.collection('participants').doc(participantCode);
    
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
  }

  // Initialize - create/update participant document
  async init() {
    try {
      await this.docRef.set(this.state, { merge: true });
    } catch (error) {
      console.error('Failed to write initial data:', error);
      throw error;
    }

    // Start auto-sync every 5 seconds (balances real-time updates with Firestore limits)
    this.syncInterval = setInterval(() => this.sync(), 5000);
  }

  // Debounced sync - prevents hitting 1 write/second limit
  debouncedSync() {
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => this.sync(), 500);
  }

  // Update current game (game1, game2, game3, intro, completed)
  updateGame(game) {
    this.state.currentGame = game;
    this.state.lastUpdate = new Date();
    // CRITICAL: Sync immediately for state transitions (teachers see screen changes fast)
    this.sync();
  }

  // Update status (playing, paused, help, idle, tutorial)
  updateStatus(status) {
    this.state.currentStatus = status;
    this.state.lastUpdate = new Date();
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
    this.sync(); // Immediate sync for help requests
  }

  // Log help request for Cuideachadh panel
  logHelpCuideachadh(game) {
    this.state.helpCuideachadh.push({
      time: new Date().toISOString(),
      game: game
    });
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

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

window.DataLogger = DataLogger;
