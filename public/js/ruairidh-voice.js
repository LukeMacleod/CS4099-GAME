/**
 * Ruairidh Voice System
 * Manages voice narration playback for Ruairidh an Ròn's dialog screens
 */

class RuairidhVoice {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.currentAudio = null;
    this.audioMap = {
      'RUAIRIDH_INTRO': 'R1 - Halo is mise Ruairidh an Ròn.mp3',
      'LAYOUT_SOUND': 'R2 - Seo am putan airson an fhuaim a chur.mp3',
      'LAYOUT_PAUSE': 'R3 - Ma tha thu ag iarraidh stad a chur air a gheama.mp3',
      'LAYOUT_HELP': 'R4 - Seo am putan airson barrachd fiosrachadh fhaighinn.mp3',
      'LAYOUT_CAIRN': 'R5 - Nise tha mise a\' cumail sùil air na puingean.mp3',
      'LAYOUT_READY': 'R6 - A chiad gheama a chluicheas sinn \'s e glad an giomach.mp3',
      'GAME1_TUT_STEP1': 'R7 - Fàilte dhan tràigh a charaid.mp3',
      'GAME1_TUT_STEP1B': 'R8 - \'S fìor thoil leam giomaich, ach tha iad cho.mp3',
      'GAME1_TUT_STEP2': 'R9 - Ri mo thaobh chì thu giomach agus blocaichean.mp3',
      'GAME1_TUT_STEP3': 'R10 - Nuair a bhrùthas tu air…càirn agad.mp3',
      'GAME1_TUT_STEP4': 'R11 - Cuimhnich, tha na giomaich…steall ort!.mp3',
      'GAME2_READY': 'R-12 Tapadh leibh airson…an ath gheama?.mp3',
      'GAME2_TUT_STEP1': 'R-13 Anns an geama seo…tràigh neo aig muir.mp3',
      'GAME2_TUT_STEP2': 'R-14 Bidh pìosan clò Hearaich - a dheanmah asta..mp3',
      'GAME3_READY': 'R-15 - \'S e an ath gheama cho luath ris a bhradan…innis mi barrachd dhuibh.mp3',
      'GAME3_TUT_STEP0': 'R-16 - Bidh mise…t-iasg a tha mi ag iarraidh.mp3',
      'GAME3_TUT_STEP1': 'R-17 - Ma gheibh sibh…gheibh sibh puingean.mp3',
      'GAME3_TUT_STEP2': 'R-18 - Cùm do shùil…puingean cuideachd!.mp3'
    };

    this.basePath = './music/voice-recordings/ruairidh/';
    this.onAudioComplete = null;
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

    const audioPath = this.basePath + filename;
    console.log(`Playing Ruairidh voice: ${dialogKey} -> ${audioPath}`);
    this.currentAudio = new Audio(audioPath);

    this.currentAudio.addEventListener('ended', () => {
      console.log(`Ruairidh voice completed: ${dialogKey}`);
      this.handleAudioEnd();
    });

    this.currentAudio.addEventListener('error', (e) => {
      console.error(`Audio playback error for ${dialogKey}:`, e);
      this.handleAudioEnd();
    });

    this.currentAudio.volume = 1.0; // Ensure volume is set

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
        <h2 style="margin: 0 0 20px 0; color: #2c3e50;">🔊 Èist ri Ruairidh</h2>
        <p style="margin: 0 0 30px 0; font-size: 18px; color: #555;">
          Briog an seo airson fuaim Ruairidh a chluinntinn!<br>
          <span style="font-size: 14px; color: #888;">Click here to hear Ruairidh's voice!</span>
        </p>
        <button style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 15px 40px;
          font-size: 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        ">
          Cluich Fuaim / Play Audio
        </button>
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
