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

    this.currentAudio.play().then(() => {
      console.log(`Successfully started playing: ${dialogKey}`);
    }).catch(err => {
      console.error(`Failed to play audio ${dialogKey}:`, err);
      this.handleAudioEnd();
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
