/**
 * Ruairidh Voice System
 * Manages voice narration playback for Ruairidh an Ròn's dialog screens
 */

class RuairidhVoice {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.currentAudio = null;
    this.preloadedAudio = new Map(); // Cache of preloaded audio elements
    this.audioMap = {
      'RUAIRIDH_INTRO': 'ruairidh-1.m4a',
      'LAYOUT_SOUND': 'ruairidh-2.m4a',
      'LAYOUT_PAUSE': 'ruairidh-3.m4a',
      'LAYOUT_HELP': 'ruairidh-4.m4a',
      'LAYOUT_CAIRN': 'ruairidh-5.m4a',
      'LAYOUT_READY': 'ruairidh-6.m4a',
      'GAME1_TUT_STEP1': 'ruairidh-7.m4a',
      'GAME1_TUT_STEP1B': 'ruairidh-8.m4a',
      'GAME1_TUT_STEP2': 'ruairidh-9.m4a',
      'GAME1_TUT_STEP3': 'ruairidh-10.m4a',
      'GAME1_TUT_STEP4': 'ruairidh-11.m4a',
      'GAME2_READY': 'ruairidh-12.m4a',
      'GAME2_TUT_STEP1': 'ruairidh-13.m4a',
      'GAME2_TUT_STEP2': 'ruairidh-14.m4a',
      'GAME3_READY': 'ruairidh-15.m4a',
      'GAME3_TUT_STEP0': 'ruairidh-16.m4a',
      'GAME3_TUT_STEP1': 'ruairidh-17.m4a',
      'GAME3_TUT_STEP2': 'ruairidh-18.m4a'
    };

    this.basePath = './music/voice-recordings/ruairidh/';
    this.onAudioComplete = null;

    // Preload all audio files for instant playback
    this.preloadAllAudio();
  }

  /**
   * Preload all Ruairidh audio files to eliminate loading delays
   */
  preloadAllAudio() {
    console.log('Preloading all Ruairidh audio files...');

    Object.entries(this.audioMap).forEach(([dialogKey, filename]) => {
      const audioPath = this.basePath + filename;

      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = audioPath;
      audio.volume = 0.4; // Set to 40% volume for comfortable listening

      this.preloadedAudio.set(dialogKey, audio);
    });

    console.log(`Preloaded ${this.preloadedAudio.size} Ruairidh audio files`);
  }

  /**
   * Play voice audio for a specific dialog screen
   * @param {string} dialogKey - Key identifying which dialog (e.g., 'RUAIRIDH_INTRO')
   * @param {function} onComplete - Callback when audio finishes or is skipped
   */
  play(dialogKey, onComplete = null) {
    this.stop();

    this.onAudioComplete = onComplete;

    // Check if audio is disabled via AudioManager
    if (!this.audioManager || !this.audioManager.enabled) {
      console.log('Audio disabled, skipping narration');
      if (onComplete) onComplete();
      return;
    }

    const filename = this.audioMap[dialogKey];
    if (!filename) {
      console.warn(`No audio mapped for dialog: ${dialogKey}`);
      if (onComplete) onComplete();
      return;
    }

    // Get preloaded audio or create new one as fallback
    let audio = this.preloadedAudio.get(dialogKey);

    if (audio) {
      // Reset preloaded audio to start
      audio.currentTime = 0;
      console.log(`Playing preloaded Ruairidh voice: ${dialogKey}`);
    } else {
      // Fallback: create new audio if not preloaded
      const audioPath = this.basePath + filename;
      audio = new Audio(audioPath);
      audio.volume = 0.4;
      console.log(`Playing non-preloaded Ruairidh voice: ${dialogKey} -> ${audioPath}`);
    }

    this.currentAudio = audio;

    this.currentAudio.addEventListener('ended', () => {
      console.log(`Ruairidh voice completed: ${dialogKey}`);
      this.handleAudioEnd();
    });

    this.currentAudio.addEventListener('error', (e) => {
      console.error(`Audio playback error for ${dialogKey}:`, e);
      this.handleAudioEnd();
    });

    this.currentAudio.play().then(() => {
      console.log(`Successfully started playing: ${dialogKey}`);
    }).catch(err => {
      console.error(`Failed to play audio ${dialogKey}:`, err);

      // If autoplay is blocked, show a prompt to enable audio
      if (err.name === 'NotAllowedError') {
        console.warn('Browser blocked autoplay. User interaction required.');
        this.showAudioPrompt(dialogKey);
      } else {
        // For other errors, just enable the button
        this.handleAudioEnd();
      }
    });
  }

  /**
   * Show prompt when browser blocks autoplay
   */
  showAudioPrompt(dialogKey) {
    const promptDiv = document.createElement('div');
    promptDiv.id = 'audio-prompt-overlay';
    promptDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
    `;

    promptDiv.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      ">
        <h2 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 48px;">TÒISICH...</h2>
      </div>
    `;

    promptDiv.onclick = () => {
      if (this.currentAudio) {
        this.currentAudio.play().then(() => {
          console.log('Audio started after user interaction');
          document.body.removeChild(promptDiv);
        }).catch(err => {
          console.error('Still failed to play:', err);
          document.body.removeChild(promptDiv);
          this.handleAudioEnd();
        });
      }
    };

    document.body.appendChild(promptDiv);
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

    // Remove any audio prompt overlay
    const prompt = document.getElementById('audio-prompt-overlay');
    if (prompt) {
      document.body.removeChild(prompt);
    }

    // CRITICAL: Trigger callback to enable forward button
    if (this.onAudioComplete) {
      this.onAudioComplete();
      this.onAudioComplete = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended;
  }

  /**
   * Handle audio completion
   */
  handleAudioEnd() {
    this.currentAudio = null;
    if (this.onAudioComplete) {
      this.onAudioComplete();
      this.onAudioComplete = null;
    }
  }
}

window.RuairidhVoice = RuairidhVoice;
