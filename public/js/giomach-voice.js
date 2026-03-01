/**
 * Giomach (Lobster) Voice System
 * Manages voice playback for the lobster's speech bubbles in Game 1
 * Features audio queueing and preloading for smooth, uninterrupted playback
 */

class GiomachVoice {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.currentAudio = null;
    this.audioQueue = [];           // Queue of pending messages
    this.isCurrentlyPlaying = false; // Track if audio is playing
    this.preloadedAudio = new Map(); // Cache of preloaded audio elements

    // Map lobster messages to audio files
    this.audioMap = {
      // When caught messages
      'Ghlac thu mi!': 'Ghlac Thu mi.m4a',
      'Dè fo ghrian?': 'De fo ghrian.m4a',
      'Sgriosail!': 'Sgriosail.m4a',
      'Oh bhròinean...': 'O bhròinean.m4a',
      'Cuidich mi!': 'Cuidich mi.m4a',
      'Beiridh mise ort!': 'Beiridh mis ort.m4a',

      // While moving messages
      'haoi': 'Haoi.m4a',
      'duda?': 'Duda?.m4a',
      'mach às mo rathad': 'Mach as no rathad.m4a',
      'obh obh': 'Obh Obh.m4a',
      'aidh aidh': 'Aidh Aidh.m4a',
      'brochan lom': 'Brochan Lom.m4a',
      'balaich an iasgaich': 'Balaich an iasgaich.m4a',
      'Mach a seo!': 'Mach a seo.m4a',
      'Seo nis': 'Seo Nis.m4a',
      'Cho carach': 'Cha carach.m4a',
      'teich!': 'Teich.m4a',
      'Bha sin faisg!': 'Bha sin faisg.m4a'
    };

    this.basePath = './music/voice-recordings/giomach/';

    // Base volume for most recordings (85%)
    this.baseVolume = 0.85;

    // Volume boosts for specific quiet recordings (capped at 100%)
    this.volumeBoosts = {
      'aidh aidh': 1.0,        // 100% (max browser allows)
      'Seo nis': 1.0,          // 100% standard
      'Dè fo ghrian?': 1.0     // 100% (max browser allows)
    };

    // Preload all audio files for instant playback
    this.preloadAllAudio();
  }

  /**
   * Preload all lobster audio files to eliminate loading delays
   */
  preloadAllAudio() {
    console.log('Preloading all lobster audio files...');

    Object.entries(this.audioMap).forEach(([message, filename]) => {
      const normalizedFilename = filename.normalize('NFD');
      const encodedFilename = encodeURIComponent(normalizedFilename);
      const audioPath = this.basePath + encodedFilename;

      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = audioPath;

      const volume = this.volumeBoosts[message] || this.baseVolume;
      audio.volume = volume;

      this.preloadedAudio.set(message, audio);
    });

    console.log(`Preloaded ${this.preloadedAudio.size} lobster audio files`);
  }

  /**
   * Queue voice audio for a lobster message (non-interrupting)
   * Messages are queued and played sequentially for smooth playback
   * @param {string} message - The text message the lobster is saying
   * @param {function} onStart - Optional callback when audio actually starts playing
   * @param {function} onComplete - Optional callback when audio finishes playing
   */
  play(message, onStart = null, onComplete = null) {
    // Check if audio is disabled
    if (!this.audioManager || !this.audioManager.enabled) {
      if (onStart) onStart(); // Trigger callback even if audio disabled
      if (onComplete) onComplete(); // Trigger complete callback too
      return;
    }

    if (!this.audioMap[message]) {
      console.warn(`No audio mapped for lobster message: "${message}"`);
      if (onStart) onStart();
      if (onComplete) onComplete();
      return;
    }

    // Add to queue with both callbacks
    this.audioQueue.push({ message, onStart, onComplete });
    console.log(`Queued lobster voice: "${message}" (queue length: ${this.audioQueue.length})`);

    // If not currently playing, start processing queue
    if (!this.isCurrentlyPlaying) {
      this.processQueue();
    }
  }

  /**
   * Process the audio queue sequentially
   * Ensures smooth playback with no interruptions or gaps
   */
  async processQueue() {
    // If queue is empty, stop processing
    if (this.audioQueue.length === 0) {
      this.isCurrentlyPlaying = false;
      this.currentAudio = null;
      return;
    }

    this.isCurrentlyPlaying = true;
    const { message, onStart, onComplete } = this.audioQueue.shift();

    // Get preloaded audio or create new one
    let audio = this.preloadedAudio.get(message);

    if (audio) {
      // Reset preloaded audio to start
      audio.currentTime = 0;
      console.log(`Playing preloaded lobster voice: "${message}"`);
    } else {
      // Fallback: create new audio if not preloaded
      const filename = this.audioMap[message];
      const normalizedFilename = filename.normalize('NFD');
      const encodedFilename = encodeURIComponent(normalizedFilename);
      const audioPath = this.basePath + encodedFilename;

      audio = new Audio(audioPath);
      const volume = this.volumeBoosts[message] || this.baseVolume;
      audio.volume = volume;

      console.log(`Playing non-preloaded lobster voice: "${message}" -> ${audioPath}`);
    }

    this.currentAudio = audio;

    // Set up event listeners for this playback
    const onEnded = () => {
      console.log(`Finished playing lobster voice: "${message}"`);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);

      // Trigger onComplete callback when audio actually finishes
      if (onComplete) onComplete();

      this.processQueue(); // Continue with next in queue
    };

    const onError = (e) => {
      console.error(`Lobster audio error for "${message}":`, e);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);

      // Trigger onComplete even on error
      if (onComplete) onComplete();

      this.processQueue(); // Continue with next in queue despite error
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Play audio
    try {
      await audio.play();
      console.log(`Successfully started playing: "${message}"`);
      // Trigger onStart callback when audio actually begins
      if (onStart) onStart();
    } catch (err) {
      console.error(`Failed to play lobster audio "${message}":`, err);
      // Still trigger callbacks even if playback fails
      if (onStart) onStart();
      if (onComplete) onComplete();
      this.processQueue(); // Continue with next
    }
  }

  /**
   * Stop current audio playback and clear queue
   */
  stop() {
    // Clear the queue
    this.audioQueue = [];
    this.isCurrentlyPlaying = false;

    // Stop current audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    console.log('Lobster voice stopped and queue cleared');
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying() {
    return this.isCurrentlyPlaying &&
           this.currentAudio &&
           !this.currentAudio.paused &&
           !this.currentAudio.ended;
  }

  /**
   * Check if there are queued messages waiting
   */
  hasQueuedMessages() {
    return this.audioQueue.length > 0;
  }
}

window.GiomachVoice = GiomachVoice;
