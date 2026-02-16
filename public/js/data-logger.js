/**
 * DataLogger Class
 *
 * Handles all Firebase Firestore data logging for the Gaelic Games research project.
 * Features:
 * - Session creation and management
 * - Event logging with batching (points updates every 10 seconds)
 * - Offline tolerance with automatic sync
 * - Game state tracking
 *
 * Usage:
 *   const logger = new DataLogger('P-17');
 *   await logger.initSession();
 *   logger.logEvent('login', { participantCode: 'P-17' });
 *   logger.logPointsIncrement(1); // Batched automatically
 *   await logger.finalizeSession();
 */

class DataLogger {
  constructor(participantCode) {
    this.participantCode = participantCode;
    this.sessionId = null;
    this.sessionRef = null;
    this.eventsRef = null;

    // Points batching
    this.pendingPointsUpdates = [];
    this.lastPointsSync = Date.now();
    this.BATCH_INTERVAL = 10000; // 10 seconds
    this.batchingInterval = null;

    // Game timing
    this.gameStartTimes = {};
    this.sessionStartTime = null;

    // Metadata tracking
    this.helpClickCount = 0;
    this.soundToggleCount = 0;
    this.tutorialStartTime = null;
    this.tutorialTimeSpent = 0;

    // Access Firebase instances from global window object
    this.db = window.firebaseDb;
    this.auth = window.firebaseAuth;

    // Offline event queue (fallback if Firestore unavailable)
    this.offlineQueue = [];
  }

  /**
   * Initialize a new session in Firestore
   * Creates session document and sets up references
   */
  async initSession() {
    try {
      this.sessionStartTime = new Date();

      // Create session document
      const sessionData = {
        participantCode: this.participantCode,
        startTime: firebase.firestore.FieldValue.serverTimestamp(),
        endTime: null,
        status: 'in_progress',
        totalPoints: 0,
        completedGames: [],
        userAgent: navigator.userAgent,
        metadata: {
          game1Score: 0,
          game2Score: 0,
          game3Score: 0,
          game1Duration: 0,
          game2Duration: 0,
          game3Duration: 0,
          tutorialTimeSpent: 0,
          helpButtonClicks: 0,
          soundToggleCount: 0
        }
      };

      const docRef = await this.db.collection('sessions').add(sessionData);

      this.sessionId = docRef.id;
      this.sessionRef = docRef;
      this.eventsRef = docRef.collection('events');

      console.log(`✅ Session initialized: ${this.sessionId}`);

      // Start automatic batching interval
      this.startBatchingInterval();

      // Handle page close/refresh
      this.setupUnloadHandler();

      return this.sessionId;

    } catch (error) {
      console.error('❌ Error initializing session:', error);
      this.queueOfflineEvent('session_init_failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Log a generic event to Firestore
   */
  async logEvent(eventType, data = {}) {
    if (!this.eventsRef) {
      console.warn('⚠️  Session not initialized. Queueing event offline.');
      this.queueOfflineEvent(eventType, data);
      return;
    }

    try {
      await this.eventsRef.add({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        eventType,
        data,
        offline: !navigator.onLine
      });

      console.log(`📝 Logged event: ${eventType}`);

    } catch (error) {
      console.error(`❌ Error logging event ${eventType}:`, error);
      this.queueOfflineEvent(eventType, data);
    }
  }

  /**
   * Log state transitions in the game flow
   */
  async logStateTransition(fromState, toState) {
    // Track tutorial time
    if (fromState && fromState.includes('TUTORIAL')) {
      this.calculateTutorialTime();
    }
    if (toState && toState.includes('TUTORIAL')) {
      this.tutorialStartTime = Date.now();
    }

    await this.logEvent('state_transition', {
      from: fromState,
      to: toState,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log game start with timestamp
   */
  async logGameStart(gameNumber) {
    this.gameStartTimes[gameNumber] = Date.now();

    await this.logEvent('game_start', {
      game: gameNumber,
      startTime: new Date().toISOString()
    });
  }

  /**
   * Log game completion with score and duration
   */
  async logGameEnd(gameNumber, score, duration) {
    const actualDuration = this.gameStartTimes[gameNumber]
      ? Math.floor((Date.now() - this.gameStartTimes[gameNumber]) / 1000)
      : duration;

    await this.logEvent('game_end', {
      game: gameNumber,
      score,
      duration: actualDuration,
      endTime: new Date().toISOString()
    });

    // Update session metadata
    if (this.sessionRef) {
      const updateData = {
        [`metadata.game${gameNumber}Score`]: score,
        [`metadata.game${gameNumber}Duration`]: actualDuration,
        completedGames: firebase.firestore.FieldValue.arrayUnion(`game${gameNumber}`)
      };

      await this.sessionRef.update(updateData);
    }
  }

  /**
   * Log points increment (batched for performance)
   */
  logPointsIncrement(points) {
    this.pendingPointsUpdates.push({
      timestamp: new Date(),
      points: points
    });

    // Auto-flush if 10 seconds have passed
    if (Date.now() - this.lastPointsSync >= this.BATCH_INTERVAL) {
      this.flushPointsUpdates();
    }
  }

  /**
   * Flush batched points updates to Firestore
   */
  async flushPointsUpdates() {
    if (this.pendingPointsUpdates.length === 0) return;

    const batch = [...this.pendingPointsUpdates];
    this.pendingPointsUpdates = [];
    this.lastPointsSync = Date.now();

    const totalIncrement = batch.reduce((sum, u) => sum + u.points, 0);

    try {
      // Log batched points event
      await this.logEvent('points_update', {
        updates: batch,
        totalIncrement,
        batchSize: batch.length
      });

      console.log(`📊 Flushed ${batch.length} points updates (total: +${totalIncrement})`);

    } catch (error) {
      console.error('❌ Error flushing points:', error);
      // Re-add to queue
      this.pendingPointsUpdates.unshift(...batch);
    }
  }

  /**
   * Log help button click
   */
  async logHelpRequest(game, timeInGame) {
    this.helpClickCount++;

    await this.logEvent('help_requested', {
      game,
      timeInGame,
      totalHelpClicks: this.helpClickCount
    });
  }

  /**
   * Log sound toggle
   */
  async logSoundToggle(enabled) {
    this.soundToggleCount++;

    await this.logEvent('sound_toggle', {
      enabled,
      totalToggles: this.soundToggleCount
    });
  }

  /**
   * Calculate tutorial time spent
   */
  calculateTutorialTime() {
    if (this.tutorialStartTime) {
      const timeSpent = Math.floor((Date.now() - this.tutorialStartTime) / 1000);
      this.tutorialTimeSpent += timeSpent;
      this.tutorialStartTime = null;
    }
  }

  /**
   * Finalize session when game is complete
   */
  async finalizeSession(finalData = {}) {
    try {
      // Flush any pending points updates
      await this.flushPointsUpdates();

      // Stop batching interval
      if (this.batchingInterval) {
        clearInterval(this.batchingInterval);
        this.batchingInterval = null;
      }

      // Calculate total duration
      const totalDuration = this.sessionStartTime
        ? Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000)
        : 0;

      // Update session document with final data
      const updateData = {
        endTime: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        totalPoints: finalData.totalPoints || 0,
        metadata: {
          ...finalData,
          tutorialTimeSpent: this.tutorialTimeSpent,
          helpButtonClicks: this.helpClickCount,
          soundToggleCount: this.soundToggleCount,
          totalDuration
        }
      };

      await this.sessionRef.update(updateData);

      // Log final event
      await this.logEvent('session_complete', {
        totalPoints: finalData.totalPoints,
        duration: totalDuration,
        completedGames: finalData.completedGames || []
      });

      console.log(`✅ Session finalized: ${this.sessionId}`);

    } catch (error) {
      console.error('❌ Error finalizing session:', error);
    }
  }

  /**
   * Start automatic batching interval (flushes every 10 seconds)
   */
  startBatchingInterval() {
    this.batchingInterval = setInterval(() => {
      if (this.pendingPointsUpdates.length > 0) {
        this.flushPointsUpdates();
      }
    }, this.BATCH_INTERVAL);
  }

  /**
   * Queue events offline when Firestore is unavailable
   */
  queueOfflineEvent(eventType, data) {
    const offlineEvent = {
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    this.offlineQueue.push(offlineEvent);

    // Store in localStorage as backup
    try {
      const existingQueue = JSON.parse(localStorage.getItem('offlineEventQueue') || '[]');
      existingQueue.push(offlineEvent);
      localStorage.setItem('offlineEventQueue', JSON.stringify(existingQueue));
    } catch (e) {
      console.warn('⚠️  Could not save to localStorage:', e);
    }
  }

  /**
   * Sync offline events when connection restored
   */
  async syncOfflineEvents() {
    if (this.offlineQueue.length === 0) return;

    console.log(`🔄 Syncing ${this.offlineQueue.length} offline events...`);

    for (const event of this.offlineQueue) {
      try {
        await this.logEvent(event.eventType, event.data);
      } catch (error) {
        console.error('❌ Failed to sync offline event:', error);
        break; // Stop if still offline
      }
    }

    // Clear queue on successful sync
    this.offlineQueue = [];
    localStorage.removeItem('offlineEventQueue');

    console.log('✅ Offline events synced');
  }

  /**
   * Handle page unload (close/refresh) - finalize session gracefully
   */
  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      // Flush pending updates before page closes
      if (this.pendingPointsUpdates.length > 0) {
        // Use synchronous approach for unload
        const batch = [...this.pendingPointsUpdates];
        const totalIncrement = batch.reduce((sum, u) => sum + u.points, 0);

        // Mark session as potentially abandoned
        this.sessionRef.update({
          status: 'abandoned',
          'metadata.lastPointsIncrement': totalIncrement
        });
      }
    });
  }
}

// Make DataLogger available globally
window.DataLogger = DataLogger;
