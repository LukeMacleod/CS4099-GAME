/**
 * Giomach (Lobster) Voice System
 * Manages voice playback for the lobster's speech bubbles in Game 1
 */

class GiomachVoice {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.currentAudio = null;

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

    // Volume boosts for specific quiet recordings (+50% = capped at 100%)
    this.volumeBoosts = {
      'aidh aidh': 1.0,
      'Seo nis': 1.0,
      'Dè fo ghrian?': 1.0
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
    const encodedFilename = encodeURIComponent(filename);
    const audioPath = this.basePath + encodedFilename;

    // Extra debugging for "Oh bhròinean..." which has special character ò
    if (message === 'Oh bhròinean...') {
      console.log(`DEBUGGING Oh bhròinean:`);
      console.log(`  Original filename: "${filename}"`);
      console.log(`  Encoded filename: "${encodedFilename}"`);
      console.log(`  Full path: "${audioPath}"`);
    }

    console.log(`Playing lobster voice: "${message}" -> ${audioPath}`);

    this.currentAudio = new Audio(audioPath);

    // Apply volume boost if specified, otherwise use base volume
    const volume = this.volumeBoosts[message] || this.baseVolume;
    this.currentAudio.volume = volume;

    console.log(`Volume for "${message}": ${this.currentAudio.volume} (boosted: ${!!this.volumeBoosts[message]})`);

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
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended;
  }
}

window.GiomachVoice = GiomachVoice;
