/**
 * Giomach (Lobster) Voice System
 * Manages voice playback for the lobster's speech bubbles in Game 1
 */

class GiomachVoice {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.currentAudio = null;
    this.audioContext = null;
    this.gainNode = null;

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

    // Volume boosts for specific quiet recordings
    // Using Web Audio API gain - can exceed 100% (1.5 = 150%)
    this.volumeBoosts = {
      'aidh aidh': 1.5,        // 150% volume boost
      'Seo nis': 1.0,          // 100% standard
      'Dè fo ghrian?': 1.5     // 150% volume boost
    };
  }

  /**
   * Play voice audio for a lobster message
   * @param {string} message - The text message the lobster is saying
   */
  play(message) {
    // Stop any currently playing audio
    this.stop();

    // Check if audio is disabled
    if (!this.audioManager || !this.audioManager.enabled) {
      return;
    }

    const filename = this.audioMap[message];
    if (!filename) {
      console.warn(`No audio mapped for lobster message: "${message}"`);
      return;
    }

    // URL-encode the filename to handle special characters like "?" and "ò"
    // Use NFD normalization for macOS filesystem compatibility (ò = o + combining accent)
    const normalizedFilename = filename.normalize('NFD');
    const encodedFilename = encodeURIComponent(normalizedFilename);
    const audioPath = this.basePath + encodedFilename;

    console.log(`Playing lobster voice: "${message}" -> ${audioPath}`);

    this.currentAudio = new Audio(audioPath);

    // Determine gain level (can exceed 1.0 with Web Audio API)
    const gainLevel = this.volumeBoosts[message] || this.baseVolume;

    // If gain > 1.0, use Web Audio API for boost beyond 100%
    if (gainLevel > 1.0) {
      // Initialize audio context on first use (requires user interaction)
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Create gain node for volume boost
      const source = this.audioContext.createMediaElementSource(this.currentAudio);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = gainLevel;
      source.connect(this.gainNode).connect(this.audioContext.destination);

      console.log(`Volume for "${message}": ${gainLevel} (Web Audio API boost)`);
    } else {
      // Standard volume (≤100%)
      this.currentAudio.volume = gainLevel;
      console.log(`Volume for "${message}": ${gainLevel} (standard)`);
    }

    this.currentAudio.addEventListener('error', (e) => {
      console.error(`Lobster audio playback error for "${message}":`, e);
      console.error('Error details:', e.target.error);
    });

    this.currentAudio.addEventListener('loadeddata', () => {
      console.log(`Audio loaded successfully: "${message}"`);
    });

    this.currentAudio.play().then(() => {
      console.log(`Successfully started playing: "${message}"`);
    }).catch(err => {
      console.error(`Failed to play lobster audio "${message}":`, err);
      console.error('Error name:', err.name, 'Error message:', err.message);
    });
  }

  /**
   * Stop current audio playback
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Clean up gain node
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended;
  }
}

window.GiomachVoice = GiomachVoice;
