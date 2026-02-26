
// ------------------------------------------------------------
// GEAMAICHEAN GÀIDHLIG - (GAELIC GAMES)
// ------------------------------------------------------------
//
// This JavaScript file contains the main game controller and logic for the Gaelic
// Games web app. It manages everything from the game's flow to audio playback,
// and user interactions. The code is structured to be modular and maintainable, with
// clear separation of different game parts.
//
// Note that some areas are not fully developed (CS4099 Interim Demo Submission), and
// I normally makrk things i need to do with 'TBD, and just cntrl F for those tags to
// filter out my work to be done
//
// I havce added commenst to explain sections and, where necessary, some of the
// challenges and tradeoffs that led to some decisions.
//
// ----------------------------------------------------------------
// GAME FLOW:
// LOGIN → INTRO → TUTORIAL → GAME1 → GAME2 → GAME3 → RESULTS
// ----------------------------------------------------------------
//
// TABLE OF CONTENTS:
//
// 1. CONFIGURATION
// 2. UTILITY FUNCTIONS & AUDIO MANAGER
// 3. HELP SYSTEM (SmartHelpSystem)
// 4. GAME 1 - Glac an Giomach (Catch the Lobster)
// 5. GAME 2 - Cho Coltach Ris an Dà Sgadan (Memory Card Game)
// 6. GAME 3 - Cho Luath ris a' Bhradan (Fish catching Game)
// 7. MAIN GAME CONTROLLER (GameFlowController)
// 8. INITIALISATION
//
// --------------------------------------------------------------------


// ------------------------------------------------------------
// 1. CONFIGURATION
// ------------------------------------------------------------
const GAME_SETTINGS = {

  // Audio volumes (0.0 to 1.0) - This just centralises all volume settings in one place
  //  for easy tweaking
  AUDIO: {
    backgroundMusic: 0.3,
    game1TutorialMusic: 0.1,
    game1Music: 0.15,
    game2Music: 0.15,
    game3Music: 0.15,
    oceanWaves: 0.06, // Only used in Glac an Giomach beach scene
    seagulls: 0.07, // Only used in Glac an Giomach beach scene
    pointSound: 0.4 // Played when player earns points (catching lobster, matching cards, etc.)
  },

  // Game timing ( - its in seconds for durations, but  milliseconds for animations)
  TIMING: {
    // Game durations (seconds)
    game1Duration: 240,
    game3Duration: 180,

    // Animation durations (milliseconds)
    pointsAnimationDuration: 800,
    rewardAnimationDuration: 600,
    stateTransitionDelay: 500,
    messageDisplayDuration: 2000,  // 2 seconds for lobster voice to finish
    cairnPulsingDuration: 800,
    pointsTextDuration: 1000,
    flashRemoveDuration: 1500,
    gameCompleteDelay: 500
  },

  // Lobster animation timing (millliseconds)
  // Lobster moves in 3 stages so it doesn't just teleport around
  // It turns and then wiggles before jumping
  LOBSTER: {
    moveStepDelay: 120,
    jumpDuration: 280
  },

  // Game 3 specific timings(milliseconds)
  GAME3: {
    orderChangeMinInterval: 8000, // Minimum time before Ruairidh asks for a different fish
    orderChangeRandomRange: 7000, // I added a random time so that the order changes aren't too predictable
  },

  // Grid dimensions for Game 1
  GRID: {
    tutorialWidth: 7,
    tutorialHeight: 6, // The tutorial uses a bigger 7×6 grid so there's room to show how to catch the lobster
    hexRowHeightRatio: 0.85,
    hexSizeRatio: 0.9, // atio settings make ensured that the hexagons fitted nicely andscale properly on different screen sizes.
    hexMinSize: 12,
    hexPaddingRatio: 0.15 // just keeps spacing consistent as hexagons size changes
  }

  // ---------------------------------------------------------------
  // STORAGE KEYS (commented out - analytics not used for submission)
  // ---------------------------------------------------------------
  // These localStorage keys would be used to persist player stats
  // across sessions. The help system could then adapt suggestions
  // based on whether someone's played before, how many lobsters
  // they've caught/lost, etc. Useful for a smarter help system.
  //
  // STORAGE_KEYS: {
  //   playedBefore: 'glac_played_before',
  //   lastPlayed: 'glac_last_played',
  //   lobstersCaught: 'glac_lobsters_caught',
  //   lobstersEscaped: 'glac_lobsters_escaped',
  //   gamesPlayed: 'glac_games_played'
  // }
};

// Inline SVG icons for pause/play button - these swap when you pause the game
// Using currentColor so they inherit the button's text colour
// Useful linl: https://www.tutorialpedia.org/blog/css-svg-play-button/
const SVG_ICONS = {
  // Two vertical bars for pause ⏸
  pause: `<svg viewBox="0 0 24 24" width="24" height="24">
    <rect x="7" y="5" width="3" height="14" fill="currentColor"/>
    <rect x="14" y="5" width="3" height="14" fill="currentColor"/>
  </svg>`,
  // Triangle pointing right for play ▶
  play: `<svg viewBox="0 0 24 24" width="24" height="24">
    <polygon points="8,5 8,19 19,12" fill="currentColor"/>
  </svg>`
};

// --------------------------------------------------------------------
// 1b. GAME LAYOUT TUTORIAL STEP CONFIGURATIONS - 5 steps to go through
// ---------------------------------------------------------------------
// This defines all layout tutorial steps, so at the start, Ruairidh the seal
// walks the player through the UI elements one by one. Each step has its own config
// which controls which buttons glow/pulsate as Ruairidh explains them.

const LAYOUT_TUTORIAL_STEPS = {
  SOUND_BUTTON: {
    step: 0,
    soundButtonGlowing: true,
    pauseButtonGlowing: false,
    helpButtonGlowing: false,
    cairnGlowing: false,
    speechText: 'Seo am putan airson an fhuaim a chur air agus dheth.',
    backAction: "gameController.setGameFlowState('RUAIRIDH_INTRO')",
    forwardAction: 'gameController.advanceLayoutTutorialStep()'
  },
  PAUSE_BUTTON: {
    step: 1,
    soundButtonGlowing: false,
    pauseButtonGlowing: true,
    helpButtonGlowing: false,
    cairnGlowing: false,
    speechText: 'Ma tha thu ag iarraidh stad a chur air a\' gheama, brùth air "pause" an seo.',
    backAction: 'gameController.renderLayoutTutorialStep(0)',
    forwardAction: 'gameController.advanceLayoutTutorialStep()'
  },
  HELP_BUTTON: {
    step: 2,
    soundButtonGlowing: false,
    pauseButtonGlowing: false,
    helpButtonGlowing: true,
    cairnGlowing: false,
    speechText: 'Seo am putan airson barrachd fiosrachadh fhaighinn, ma tha thu mì-chinnteach mu dad sam bith.',
    backAction: 'gameController.renderLayoutTutorialStep(1)',
    forwardAction: 'gameController.advanceLayoutTutorialStep()'
  },
  CAIRN_POINTS: {
    step: 3,
    soundButtonGlowing: false,
    pauseButtonGlowing: false,
    helpButtonGlowing: false,
    cairnGlowing: true,
    speechText: 'Nise, tha mise a\' cumail sùil air na puingean. Nuair a gheibh thu puing, gheibh thu clach air an càrn agad.<br><br><span class="phrase-underline">Cuimhnich, nithear càrn mòr bho clachan beaga.</span> <button class="phrase-help-btn" onclick="gameController.showPhraseExplanation(\'cairn\')">?</button>',
    backAction: 'gameController.renderLayoutTutorialStep(2)',
    forwardAction: 'gameController.advanceLayoutTutorialStep()'
  },
  READY_TO_PLAY: {
    step: 4,
    soundButtonGlowing: false,
    pauseButtonGlowing: false,
    helpButtonGlowing: false,
    cairnGlowing: false,
    speechText: 'A\' chiad gheama a chluicheas sinn \'s e Glac an Giomach. A bheil thu deiseil?',
    backAction: 'gameController.renderLayoutTutorialStep(3)',
    forwardAction: null,
    showPlayButton: true,
    screenClass: 'layout-step3-beach-bg' // Changed to beach background here, since we introduce the game Glac an Giomach
  }
};

// Tutorial rock positions for Game 1 board demo
const TUTORIAL_ROCK_POSITIONS = ['2,1', '3,1', '4,1', '5,2']; // - no need to randmise rock positions for demo

// --------------------------------------------------------
// 2. UTILITY FUNCTIONS
// --------------------------------------------------------

// Calculate hexagon vertex points (used for SVG polygon rendering)
// Returns array of "x,y" strings for 6 vertices
// https://stackoverflow.com/questions/52172067/create-svg-hexagon-points-with-only-only-a-length
/*
The implementation of the regular hexagon vertices builds on a standard approach found in online resources.
Hexagons are just six points evenly spaced around a circle. I used the standard cos/sin formula to calculate
each corner at 60° intervals, with a -30° offset so the hexagon sits pointy-topped (vertex at top and bottom).
The function returns coordinates ready for SVG polygons.
*/
function calculateHexPoints(centreX, centreY, radius) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    const x = centreX + radius * Math.cos(angle);
    const y = centreY + radius * Math.sin(angle);
    points.push(`${x},${y}`); // takes that string and adds it to the end of the points array
  }
  return points;
}


// ----------------------------------------------------
// 2b. AUDIO MANAGER
// Centralises all audio tracks, playback, and volume control
// ------------------------------------------------------------
class AudioManager {
  constructor() {
    this.enabled = true; // Master on/off flag whcih is used by the mute button)
    this.tracks = {};
    this.volumes = {};
    this.initTracks();
  }

  initTracks() {

    // https://www.kevssite.com/seamless-audio-looping/ - using .ogg over mp3 for beter looping

    // Music tracks - which are looped
    this.tracks.background = this.createTrack('background', './music/non-game.ogg', GAME_SETTINGS.AUDIO.backgroundMusic, true);
    this.tracks.game1Tutorial = this.createTrack('game1Tutorial', './music/game-1-tutorial.ogg', GAME_SETTINGS.AUDIO.game1TutorialMusic, true);
    this.tracks.game1 = this.createTrack('game1', './music/game-1-music.ogg', GAME_SETTINGS.AUDIO.game1Music, true);
    this.tracks.game2 = this.createTrack('game2', './music/game-2-loop.ogg', GAME_SETTINGS.AUDIO.game2Music, true);
    this.tracks.game3 = this.createTrack('game3', './music/game-3.ogg', GAME_SETTINGS.AUDIO.game3Music, true);

    // Ambient sounds
    this.tracks.oceanWaves = this.createTrack('oceanWaves', './music/ocean-waves.ogg', GAME_SETTINGS.AUDIO.oceanWaves, true);
    this.tracks.seagulls = this.createTrack('seagulls', './music/seagulls_short.ogg', GAME_SETTINGS.AUDIO.seagulls, true);

    // Sound effects (not looped)
    this.tracks.point = this.createTrack('point', './music/point-sound.ogg', GAME_SETTINGS.AUDIO.pointSound, false);
  }

  createTrack(name, src, volume, loop) {
    const track = new Audio(src);
    track.volume = volume;
    track.loop = loop;
    if (loop) track.preload = 'auto';
    this.volumes[name] = volume;
    return track;
  }

  // Core play/stop methods
  play(trackName) {
    const track = this.tracks[trackName];
    if (this.enabled && track && track.paused) {
      track.play().catch(() => {});
    }
  }

  stop(trackName) {
    const track = this.tracks[trackName];
    if (track && !track.paused) {
      track.pause();
      track.currentTime = 0;
    }
  }

  pause(trackName) {
    const track = this.tracks[trackName];
    if (track && !track.paused) {
      track.pause();
    }
  }

  resume(trackName) {
    const track = this.tracks[trackName];
    if (this.enabled && track && track.paused) {
      track.play().catch(() => {});
    }
  }

  // Convenience methods for music
  startBackground() { this.play('background'); }
  stopBackground() { this.stop('background'); }

  startGame1Tutorial() { this.play('game1Tutorial'); }
  stopGame1Tutorial() { this.stop('game1Tutorial'); }

  startGame1() { this.play('game1'); }
  stopGame1() { this.stop('game1'); }

  startGame2() { this.play('game2'); }
  stopGame2() { this.stop('game2'); }

  startGame3() { this.play('game3'); }
  stopGame3() { this.stop('game3'); }

  // Ambient sounds for beach atmosphere
  startAmbience() {
    this.play('oceanWaves');
    this.play('seagulls');
  }

  stopAmbience() {
    this.stop('oceanWaves');
    this.stop('seagulls');
  }

  pauseAmbience() {
    this.pause('oceanWaves');
    this.pause('seagulls');
  }

  resumeAmbience() {
    this.resume('oceanWaves');
    this.resume('seagulls');
  }

  // Stop all music and ambience
  stopAll() {
    this.stopBackground();
    this.stopGame1Tutorial();
    this.stopGame1();
    this.stopGame2();
    this.stopGame3();
    this.stopAmbience();
  }

  // Pause game sounds for the current state (for pause menu / help modal)
  // We use the state config to only pause the track that's actually playing
  // This fixes a bug where resuming would accidentally start game3 music during game2
  pauseGameSounds(state) {
    const config = this.getStateAudioConfig(state);
    if (config) {
      this.pause(config.track);
      if (config.ambience) this.pauseAmbience();
    }
  }

  // Resume game sounds for the current state (after pause menu closes)
  // Only resumes the track that should be playing for this state
  resumeGameSounds(state) {
    const config = this.getStateAudioConfig(state);
    if (config) {
      this.resume(config.track);
      if (config.ambience) this.resumeAmbience();
    }
  }

  // This is a map for the game's stateto to audio relationships
  // This eliminated the original repetitive if-else statements
  getStateAudioConfig(state) {
    const configs = {
      'GAME1_TUTORIAL': { track: 'game1Tutorial', ambience: true },
      'GAME1': { track: 'game1', ambience: true },
      'GAME2': { track: 'game2', ambience: false },
      'GAME3': { track: 'game3', ambience: false },
      'RUAIRIDH_INTRO': { track: 'background', ambience: false },
      'PREGAME_TUTORIAL': { track: 'background', ambience: false },
      'GAME2_READY': { track: 'background', ambience: false },
      'GAME2_TUTORIAL': { track: 'background', ambience: false },
      'GAME3_READY': { track: 'background', ambience: false },
      'GAME3_TUTORIAL': { track: 'background', ambience: false },
      'RESULTS': { track: 'background', ambience: false }
    };
    return configs[state] || null;
  }

  // Resume game sounds based on current state
  resumeForState(state) {
    if (!this.enabled) return;
    const config = this.getStateAudioConfig(state);
    if (config) {
      this.resume(config.track);
      if (config.ambience) this.resumeAmbience();
    }
  }

  // Start appropriate music for a game state
  startForState(state) {
    const config = this.getStateAudioConfig(state);
    if (config) {
      this.play(config.track);
      if (config.ambience) this.startAmbience();
    }
    // LOGIN state has no music (silence)
  }

  // Sound effect for scoring - plays the "ding" when points are added to cairn
  // Need to clone the audio each time because some browsers won't replay an Audio element
  // that's already played without properly resetting it. Cloning guarantees a fresh play.
  playPointSound() {
    if (!this.enabled) return;
    const track = this.tracks.point;
    if (track) {
      const clone = track.cloneNode();
      clone.volume = track.volume;
      clone.play().catch(() => {});
    }
  }

  // Toggle sound on/off - (mutes volume, keeps music playing to stay in sync)
  // I had aligned teh music so that the music ends at the same time as the timer runs out.
  // For example, in game 3, as the fish get faster, so too does the music.
  // Without this fuction, if a player mutes the music, then unmutes it later,
  //  the music would be out of sync with the gameplay and impact the experience.

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.unmuteAll();
    } else {
      this.muteAll();
    }
    return this.enabled;
  }

  // Mute all tracks (set volume to 0, music keeps playing silently)
  muteAll() {
    for (const name in this.tracks) {
      this.tracks[name].volume = 0;
    }
  }

  // Unmute all tracks (restore original volumes)
  unmuteAll() {
    for (const name in this.tracks) {
      this.tracks[name].volume = this.volumes[name];
    }
  }

  isEnabled() {
    return this.enabled;
  }
}


// ----------------------------------------------------------------
// 3. HELP SYSTEM
// ----------------------------------------------------------------
// This handles the "?" help button that appears during gameplay.
// When clicked, it shows a modal with the step by step instructions
// in Gaelic explaining how to play the current game.
// The game pauses while reading help so the player doesn't lose time.

class SmartHelpSystem {
  constructor(gameController) {
    this.controller = gameController;
    this.modalElement = null;
    this.isOpen = false;

    // I originally planned to track player stats (lobsters caught/escaped)
    // in localStorage so I could give personalised help tips based on
    // how well they were doing. Ran out of time to implement this properly
    // so it's commented out for now - maybe for a future version.
  }

  // Called when the "?" help button is clicked during gameplay
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Show the help modal - pauses game and stops timer
  open() {
    this.createModal();
    this.isOpen = true;
    document.body.style.overflow = 'hidden';  // stop background from scrolling

    // CRITICAL: Stop the countdown timer (Game 1)
    if (this.controller.gameTimer) {
      clearInterval(this.controller.gameTimer);
    }

    // CRITICAL: Pause game board (freeze animations)
    if (this.controller.game1Board) {
      this.controller.game1Board.isAnimating = true;
    }

    // CRITICAL: Pause all game audio
    this.controller.audio.pauseGameSounds(this.controller.currentState);
  }

  // Hide the modal
  close() {
    // Set isOpen to false immediately to prevent double-close issues
    this.isOpen = false;
    document.body.style.overflow = '';  // restore scrolling immediately

    // CRITICAL: Restore status to 'playing' when closing help modal
    if (this.controller.dataLogger) {
      this.controller.dataLogger.updateStatus('playing');
    }

    // CRITICAL: Resume game board (resume animations)
    if (this.controller.game1Board) {
      this.controller.game1Board.isAnimating = false;
    }

    // CRITICAL: Restart the countdown timer (Game 1 only)
    if (this.controller.currentState === 'GAME1' && this.controller.timeRemaining > 0) {
      if (this.controller.gameTimer) clearInterval(this.controller.gameTimer);
      this.controller.gameTimer = setInterval(() => {
        this.controller.timeRemaining--;
        this.controller.updateGame1TimerDisplay();
        if (this.controller.timeRemaining <= 0) {
          clearInterval(this.controller.gameTimer);
          setTimeout(() => this.controller.setGameFlowState('GAME2_READY'), 500);
        }
      }, 1000);
    }

    // CRITICAL: Resume all game audio
    this.controller.audio.resumeGameSounds(this.controller.currentState);

    if (this.modalElement) {
      const modalToRemove = this.modalElement;  // capture reference to avoid race condition

      // Remove event listeners to prevent any lingering handlers
      if (this._boundKeydownHandler) {
        modalToRemove.removeEventListener('keydown', this._boundKeydownHandler);
      }
      if (this._boundClickHandler) {
        modalToRemove.removeEventListener('click', this._boundClickHandler);
      }

      modalToRemove.classList.remove('active');

      // Clear pointer events immediately to ensure clicks go through to game board
      modalToRemove.style.pointerEvents = 'none';

      setTimeout(() => {
        // Only remove this specific modal, not a newly created one
        if (modalToRemove && modalToRemove.parentNode) {
          modalToRemove.remove();
        }
        // Only clear the reference if it's still the same modal
        if (this.modalElement === modalToRemove) {
          this.modalElement = null;
        }
      }, 300);  // matches CSS transition duration
    }

    // Ensure focus returns to the game by blurring any focused element in the modal
    if (document.activeElement && document.activeElement.closest('.help-modal')) {
      document.activeElement.blur();
    }
  }

  // Builds the modal DOM element and adds it to the page
  createModal() {
    const existing = document.getElementById('smart-help-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'smart-help-modal';
    modal.className = 'help-modal';
    modal.innerHTML = this.generateModalHTML();
    document.body.appendChild(modal);

    this.modalElement = modal;
    this.attachEventListeners();

    // The active class has opacity:1 in CSS, so adding it triggers a fadein.
    // But if I add it immediately after appending to DOM, the browser skips
    // the transition. requestAnimationFrame delays it by one frame so it works
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }

  // Returns the HTML for Game 1's help module
  // "Ciamar a chluicheas tu?" = "How do you play?"
  // The tips explain in Gaelic how to trap the lobster
  generateModalHTML() {
    return `
      <div class="help-modal-content simple-help">
        <button class="modal-close" onclick="gameController.helpSystem.close()">✕</button>

        <h2 class="simple-help-title">Ciamar a chluicheas tu?</h2>

        <div class="simple-help-body">
          <div class="help-tip">
            <span class="help-tip-number">1</span>
            <div class="help-tip-content">
              <strong>Coimhead!</strong> <p>Faic dè an t-oire den bhòrd as fhaisge air a' ghiomach - sin far a bheil e airson a dhol!</p>
            </div>
          </div>

          <div class="help-tip">
            <span class="help-tip-number">2</span>
            <div class="help-tip-content">
              <strong>Tog balla!</strong> <p>Cuir clachan sìos fada air falbh bhon ghiomach. Na tèid ro fhaisg aig an toiseach!</p>
            </div>
          </div>

          <div class="help-tip">
            <span class="help-tip-number">3</span>
            <div class="help-tip-content">
              <strong>Dùin na beàrnan!</strong> <p>Teichidh a' ghiomach tron toll as lugha - cùm ort gus nach bi beàrn sam bith ann!</p>
            </div>
          </div>

          <div class="help-tip">
            <span class="help-tip-number">4</span>
            <div class="help-tip-content">
              <strong>Glac e!</strong> <p>Nuair nach urrainn dha na h-oirean a ruigsinn tuilleadh, tha thu air a' ghiomach a ghlacadh - math fhèin!</p>
            </div>
          </div>
        </div>

        <button class="arrow-btn" onclick="gameController.helpSystem.close()">Dùin</button>
      </div>
    `;
  }

  // Keyboard and mouse shortcuts to close the modal
  attachEventListeners() {
    if (!this.modalElement) return;

    // Store bound handlers so they can be removed later
    this._boundKeydownHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    this._boundClickHandler = (e) => {
      if (e.target === this.modalElement) this.close();
    };

    // Press Escape to close - Extra feature added when teacher tried to press escape from the pop up
    this.modalElement.addEventListener('keydown', this._boundKeydownHandler);

    // Click the dark background area to close - Extra feature added on top pf the above
    this.modalElement.addEventListener('click', this._boundClickHandler);
  }

  // ---------------------------------------------------------------
  // ANALYTICS (stub functions - full implementation not finished)
  // ---------------------------------------------------------------
  // These functions are called by the game code but the full analytics
  // feature wasn't completed. Keeping as empty stubs to prevent errors.

  recordLobsterCaught() {
    // Stub - would track caught lobsters for personalised help tips
  }

  recordLobsterEscaped() {
    // Stub - would track escaped lobsters for personalised help tips
  }
}

// --------------------------------------------------------
// 4. GAME 1 - GLAC AN GIOMACH (Catch the Lobster)
// ------------------------------------------------------------------------
// This is the game engine implementation of the trap the lobster game. The player
// clicks hexagonal tiles to block the lobster's escape routes. The lobster
// always tries to find the shortest path to the edge of the
// board. If you surround it completely, you catch it, gaining a point.
//
// I chose a hexagonal grid because it looks more interesting than squares,
// and it's a common pattern in strategy games. It was difficult figuring out
// how hexagons connect to each other and then opening up 6 directions for the lobster to move in.

// -------------------------------------------------------
// HexGridSquare - represents one hexagon on the board
// -------------------------------------------------------
// Each hex has an x,y position. The neighbours aren't as straightforward as in a square grid as the
// pattern changes depending on whether you're in an odd or even row
class HexGridSquare {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.blocked = false;  // true if there's a rock here
  }

  // Check if two squares are the same position
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  // This was the hardest part to figure out. In a hex grid, each hexagon
  // touches 6 others, but which 6 depends on whether you're in an odd or
  // even row. I had to draw this out on paper to get it right.
  //
  // Hex grids are "offset" - odd rows are shifted to the right, which
  // changes which hexes count as "neighbours".
  //
  // Here is a diagram shoing the pattern:
  //
  //     [0,0] [1,0] [2,0] [3,0]     <- even row (y=0)
  //        [0,1] [1,1] [2,1] [3,1]  <- odd row (y=1)
  //     [0,2] [1,2] [2,2] [3,2]     <- even row (y=2)
  //
  //      Example of chosingn a partuclar hex and its neighbours:
  //
  // So for hex [1,1] (odd row), its neighbours are:
  //   - left: [0,1], right: [2,1]
  //   - upper-left: [1,0], upper-right: [2,0]
  //   - lower-left: [1,2], lower-right: [2,2]
  //
  // But for hex [1,0] (even row), its neighbours are:
  //   - left: [0,0], right: [2,0]
  //   - upper-left: [0,-1], upper-right: [1,-1]  (would be off grid)
  //   - lower-left: [0,1], lower-right: [1,1]
  //
  getNeighbours() {
    const neighbours = [];

    // First, figure out if we're in an odd or even row
    // This matters because odd rows are shifted to the right!
    const isOddRow = this.y % 2 === 1;

    // -------- HORIZONTAL NEIGHBOURS --------
    // These are easy as the left and right work the same wy regardless of row
    const leftNeighbour = new HexGridSquare(this.x - 1, this.y);
    const rightNeighbour = new HexGridSquare(this.x + 1, this.y);
    neighbours.push(leftNeighbour);
    neighbours.push(rightNeighbour);

    // -------- DIAGONAL NEIGHBOURS --------
    //  Because odd rows are shifted, the diagonal offsets are different depending on which row we're in (Hopefully i explained that aboce clearly)

    if (isOddRow) {
      // ODD ROW: We're shifted right, so our upper-left is directly above,
      // and upper-right is above AND to the right
      const upperLeft = new HexGridSquare(this.x, this.y - 1);
      const upperRight = new HexGridSquare(this.x + 1, this.y - 1);
      const lowerLeft = new HexGridSquare(this.x, this.y + 1);
      const lowerRight = new HexGridSquare(this.x + 1, this.y + 1);

      neighbours.push(upperLeft);
      neighbours.push(upperRight);
      neighbours.push(lowerLeft);
      neighbours.push(lowerRight);

    } else {
      // EVEN ROW: We're not shifted, so upper-left is above AND to the left,
      // and upper-right is directly above
      const upperLeft = new HexGridSquare(this.x - 1, this.y - 1);
      const upperRight = new HexGridSquare(this.x, this.y - 1);
      const lowerLeft = new HexGridSquare(this.x - 1, this.y + 1);
      const lowerRight = new HexGridSquare(this.x, this.y + 1);

      neighbours.push(upperLeft);
      neighbours.push(upperRight);
      neighbours.push(lowerLeft);
      neighbours.push(lowerRight);
    }

    return neighbours;
  }

  // Turn the position into a string like "3,5" so I can use it as a key.
  // JS's Map and Set can't compare objects properly. But strings work fine, "3,5" = "3,5" is true
  hash() {
    return `${this.x},${this.y}`;
  }
}

// -------------------------------------------------------
// LobsterToken - represents the lobster moving around the board
// -------------------------------------------------------
// The lobster uses pathfinding algorithm (BFS) to find the quickest escape route.
class LobsterToken {
  constructor(startSquare) {
    this.position = startSquare;
    this.rotation = 0;  // degrees, for facing the right direction when moving
  }

  // Chose BFS over DFS because we want the shortest path to freedom, not just any path.
  // BFS explores all options level by level, so the first time it hits the edge, we know it's the quickest escape route.
  //
  // BFS Steps:
  // 1. Start at current position, add to queue
  // 2. Take first item from queue, check if it's at the edge
  // 3. If not, add all unvisited neighbours to the queue
  // 4. Repeat until we find an edge or run out of options
  // 5. If we find an edge, trace back to build the path
  findShortestEscapePath(blockedSet, boardSquares, gridWidth, gridHeight) {
    const start = this.position;
    const startKey = start.hash();
    const queue = [startKey];  // BFS uses a queue (first-in-first-out)
    const parent = new Map(); // To reconstruct the path, we keep track of where we came from for each visited square
    parent.set(startKey, null);  // Starting point has no "came from" - it's where we began

    // Keep searching until we've checked everywhere OR found exit
    while (queue.length > 0) {
      // Take the next square to explore (taking from the front, i,e
      //  we will then check all of the squares 1 step away before any squares 2 steps away)
      const key = queue.shift();

      // Since we now need an actual HexGridSquare object so we can check its
      // neighbours and see if it's at the edge, split so "3,5" becomes i.e x=3, y=5
      const [cx, cy] = key.split(',').map(Number);
      const current = new HexGridSquare(cx, cy);

      // Have we reached the edge of the board?
      if (current.x === 0 || current.x === gridWidth - 1 || current.y === 0 || current.y === gridHeight - 1) {
        // Found esapce, Now trace back to build the full path
        const path = [];
        let k = key;
        while (k) {
          const [px, py] = k.split(',').map(Number);
          path.unshift(new HexGridSquare(px, py));  // Add to front as we're going backwards)
          k = parent.get(k);
        }
        return path;
      }

      // Not at edge yet - check all neighbouring hexegons
      for (const neighbour of current.getNeighbours()) {
        const nk = neighbour.hash();
        // Only explore if: we haven't been there, it's on the board, AND it's not blocked by a rock
        if (!parent.has(nk) && boardSquares.has(nk) && !blockedSet.has(nk)) {
          parent.set(nk, key);  // Remember where we came from
          queue.push(nk);  // Add to back of queue
        }
      }
    }

    // If reaching thsi point, the queue has been emptied without finding an edge.
    //that means the lobster is completely surrounded and has been caught by the user
    return null;
  }

  // Figure out what angle the lobster should face when moving to a new hex.
  // This took a lot of trial and error to get right, as te angles are in degrees
  // I wanted the lobster to look like it's actually walking in the direction
  // it's going, not just sliding sideways as it was at the beginning

  //
  // The angles work like a clock:
  //        0° (up)
  //         |
  //  270° --|-- 90°
  //  (left) |  (right)
  //        180°
  //       (down)

  // But because hex grids have 6 directions (not 4), we also use
  // 30°, 150°, 210°, and 330° for the diagonals.
  //
  // The reason why this took so long to get right because the diagonal angles are different
  // depending on whether you're in an odd or even row (the offset thing again)

  getRotationForDirection(newPos) {
    // Figure out which direction we're moving
    const dx = newPos.x - this.position.x;  // +1 = right, -1 = left
    const dy = newPos.y - this.position.y;  // +1 = down, -1 = up
    const oddRow = this.position.y % 2 === 1;

    // -------- HORIZONTAL (easy as its the same for all rows) --------
    if (dx === 1 && dy === 0) return 90;   // going right
    if (dx === -1 && dy === 0) return 270; // going left

    // -------- MOVING UP (dy = -1) --------
    if (dy === -1) {
      if (oddRow) {
        // From an odd row, "up-right" means x stays same or increases
        if (dx === 1) return 30;   // top right
        if (dx === 0) return 330;  // top left
      } else {
        // From an even row, the diagonal offsets are shifted
        if (dx === 0) return 30;   // top right
        if (dx === -1) return 330; // top left
      }
    }

    // -------- MOVING DOWN (dy = 1) --------
    if (dy === 1) {
      if (oddRow) {
        if (dx === 1) return 150;  // bottom right
        if (dx === 0) return 210;  // bottom left
      } else {
        if (dx === 0) return 150;  // bottom right
        if (dx === -1) return 210; // bottom left
      }
    }

    // If somehow none matched, just keep facing the same way rather than have it stick
    return this.rotation;
  }

  // This is what the game calls each turn to ask the lobster wher eit wnats to move next
  // It returns two things:
  //   - nextPos: the hexagon the lobster wants to move to - also or null if trapped)
  //   - escapedIfMove: true if that move would reach the edge (game over for player)
  getNextStep(blockedSet, boardSquares, gridWidth, gridHeight) {
    // Ask the BFS algorithm for the best route to freedom
    const path = this.findShortestEscapePath(blockedSet, boardSquares, gridWidth, gridHeight);

    // If there's no path at all, lobster is completely trapped
    if (!path || path.length === 0) {
      return { nextPos: null, escapedIfMove: false };  // Signals lobster has been caught
    }

    // Special case: path length of 1 means lobster is already at current position
    // Check if it's already ON the edge - if so, it escapes!
    if (path.length === 1) {
      const currentPos = path[0];
      const alreadyOnEdge = (currentPos.x === 0) ||
                            (currentPos.x === gridWidth - 1) ||
                            (currentPos.y === 0) ||
                            (currentPos.y === gridHeight - 1);

      if (alreadyOnEdge) {
        // Lobster is on the edge and can escape right now!
        return { nextPos: null, escapedIfMove: true };
      }
      // Not on edge but no moves available - truly trapped
      return { nextPos: null, escapedIfMove: false };
    }



    // So path[0] where the current position is, path[1] is where we want to go next
    const nextPos = path[1];

    // Check if this next move lands us on the edge of the grid
    // The grid edges are: left side (x=0), right side (x=max), top (y=0), bottom (y=max)
    // If we're stepping onto any edge tile, that means we can escape this turn
    const isAtEdge = (nextPos.x === 0) ||
                     (nextPos.x === gridWidth - 1) ||
                     (nextPos.y === 0) ||
                     (nextPos.y === gridHeight - 1);

    // Return both pieces of info the game needs:
    // - nextPos: where the lobster should move to
    // - escapedIfMove: true if this move means the lobster gets away
    return { nextPos: nextPos, escapedIfMove: isAtEdge };
  }
}

// -------------------------------------------------------
// Game1Board - the main game board controller
// -------------------------------------------------------
// This manages everything for Game 1: the hex grid, the lobster,
// blocked tiles, animations, and the lobster's idioamtic Gaelic speech


class Game1Board {
  constructor(radius, controller) {
    this.controller = controller;

    // ===== GAME STATE FLAGS =====
    this.blockedSet = new Set();  // Set of "x,y" strings for blocked tiles
    this.lobster = null;
    this.gameOver = false;    // true when lobster is caught
    this.gameLost = false;    // true when lobster escapes
    this.isAnimating = false; // prevents clicks during animations - bug fixed due to mouse going over other thinsg in foreground and affecting animations
    this.isEscaping = false;  // true during escape animation
    this.isOnEdge = false;    // true when lobster reached the edge
    this.tutorialAnimationInterval = null;

    // 11x10 grid gives a nice board size. To small was actually quite challenging
    this.gridWidth = 11;
    this.gridHeight = 10;

    // ===== LOBSTER DIALOGUE =====
    // The lobster says things when caught or while moving around.
    // Adds personality and also encorporates one of the priamry goals of the project
    // to include idioamtic Gaelic phrases

    // What the lobster says when caught:
    // English translation - "You caught me!", "What on earth?", "Terrible!", "Oh dear...", "Help me!", "I'll get you!"
    this.caughtMessages = [
      'Ghlac thu mi!', 'Dè fo ghrian?', 'Sgriosail!',
      'Oh bhròinean...', 'Cuidich mi!', 'Beiridh mise ort!'
    ];

    // What the lobster says while hopping (casual exclamations):
    // "hey!", "what?", "get out of my way", "oh no", "ay ay", "thin porridge" (just an expression from a song),
    // "fishing boys (another famous song)", "Get out of here!", "Here now", "So tricky", "run!", "That was close!"
    this.movementMessages = [
      'haoi', 'duda?', 'mach às mo rathad', 'obh obh', 'aidh aidh',
      'brochan lom', 'balaich an iasgaich', 'Mach a seo!',
      'Seo nis', 'Cho carach', 'teich!', 'Bha sin faisg!'
    ];
    this.caughtMessageIndex = 0;
    this.movementMessageIndex = 0;

    // Chose not to show a message every single jump
    // Instead, show one every 3-4 jumps randomly
    this.jumpCounter = 0;
    this.jumpsUntilMessage = this.getRandomJumps();

    this.activeBubble = null;  // Currently showing speech bubble

    // Initialize lobster voice system
    this.giomachVoice = new GiomachVoice(this.controller.audio);

    // Set up the board
    this.boardSquares = new Map();  // All hexagons on the board
    this.initialiseBoard();
    this.spawnLobster();
    this.placeRandomRocks();
  }

  // Randomly choose 3 or 4 - used for message frequency
  getRandomJumps() {
    return Math.random() < 0.5 ? 3 : 4;
  }

  // ===== GIOMACH SPEECH BUBBLE SYSTEM =====
  // The lobster can "say" things via a speech bubble that appears
  // above it and disappears after the duration.

  // Show a message above the lobster for a certain duration (in ms)
  showSpeechBubble(message, duration) {
    this.activeBubble = {
      message: message,
      startTime: Date.now(),
      duration: duration,
      hasBeenRendered: false  // So we know if this is a fresh bubble
    };

    // Play the lobster's voice for this message
    if (this.giomachVoice) {
      this.giomachVoice.play(message);
    }

    // Auto-remove the bubble after the duration
    setTimeout(() => {
      // Check it's still the same bubble (in case another was shown)
      if (this.activeBubble && this.activeBubble.message === message) {
        this.activeBubble = null;
        this.render();  // Redraw to remove the bubble
      }
    }, duration);
  }

  // Called by render() to check if we need to  draw a bubble
  shouldShowBubble() {
    if (!this.activeBubble) return null;

    const elapsed = Date.now() - this.activeBubble.startTime;
    if (elapsed < this.activeBubble.duration) {
      const isFirstRender = !this.activeBubble.hasBeenRendered;
      this.activeBubble.hasBeenRendered = true;
      return { message: this.activeBubble.message, isFirstRender };
    }

    this.activeBubble = null;  // Expired
    return null;
  }

  // ===== BOARD SETUP METHODS =====

  // Create all the hexagons squares for the grid
  initialiseBoard() {
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const square = new HexGridSquare(x, y);
        this.boardSquares.set(square.hash(), square);
      }
    }
  }

  // Put the lobster in the middle of the board (Every time)
  spawnLobster() {
    const centreX = Math.floor(this.gridWidth / 2);
    const centreY = Math.floor(this.gridHeight / 2);
    const startPos = new HexGridSquare(centreX, centreY);
    this.lobster = new LobsterToken(startPos);
  }

  // Scatter some rocks around to make it more interesting
  // Chose 15% coverage which felt about right
  // Important: can never let the user put rocks on the lobster or spawn in the exact centre
  placeRandomRocks() {
    const squareArray = Array.from(this.boardSquares.values());
    const rockCount = Math.floor(squareArray.length * 0.15);  // 15% of tiles
    const lobsterPosHash = this.lobster.position.hash();

    // Avoid the centre ( for when we reset the board)
    const centreX = Math.floor(this.gridWidth / 2);
    const centreY = Math.floor(this.gridHeight / 2);
    const centrePosHash = `${centreX},${centreY}`;

    for (let i = 0; i < rockCount; i++) {
      let square;
      let squareHash;

      // Keep picking random squares until we find a valid one
      do {
        square = squareArray[Math.floor(Math.random() * squareArray.length)];
        squareHash = square.hash();
      } while (squareHash === lobsterPosHash || squareHash === centrePosHash || this.blockedSet.has(squareHash));

      this.blockedSet.add(squareHash);
    }
  }

  // ===== MAIN GAME LOGIC =====
  // This is called when the player clicks a hex tile.
  // It blocks that tile, then the lobster responds

  clickHexTile(x, y) {
    // Ignore clicks if in the middle of something - change of game state / animation
    if (this.gameOver || this.gameLost || this.isAnimating || this.isEscaping || this.isOnEdge) return;

    const square = new HexGridSquare(x, y);
    const key = square.hash();

    // Can't click on the lobster itself
    if (key === this.lobster.position.hash()) return;

    // Can't click an already blocked tile
    if (this.blockedSet.has(key)) return;



    // Block this tile (place a rock)
    this.blockedSet.add(key);

    // Just like asking lobster where do you want to go now
    const { nextPos, escapedIfMove } = this.lobster.getNextStep(
      this.blockedSet, this.boardSquares, this.gridWidth, this.gridHeight
    );

    // If nextPos is null, either lobster is trapped OR already on edge
    if (!nextPos) {
      // Check if lobster is already on edge - that means it escapes!
      if (escapedIfMove) {
        // Lobster is on the edge and escapes immediately
        if (this.controller.helpSystem) {
          this.controller.helpSystem.recordLobsterEscaped();
        }
        // Always call triggerEscapeAnimation even if tile is null
        // (the function now handles null gracefully)
        const lobsterTile = this.getCurrentLobsterTile();
        this.triggerEscapeAnimation(lobsterTile);
        return;
      }

      // Otherwise lobster is truly trapped - Win Condition for player
      this.gameOver = true;

      // Analytics tracking (TBD)
      if (this.controller.helpSystem) {
        this.controller.helpSystem.recordLobsterCaught();
      }

      // Lobster says something when caught (cycles through messages)
      const message = this.caughtMessages[this.caughtMessageIndex];
      this.caughtMessageIndex = (this.caughtMessageIndex + 1) % this.caughtMessages.length;
      this.showSpeechBubble(message, 2500);  // 2.5 seconds to ensure voice finishes

      this.render();  // Show the bubble

      // After a moment, animate the point and reset for next round
      const lobsterTile = this.getCurrentLobsterTile();
      if (lobsterTile) {
        const tileRect = lobsterTile.getBoundingClientRect();
        setTimeout(() => {
          // Stone flies to cairn, then we reset the board
          this.controller.animateStoneToCairn(tileRect.left, tileRect.top, () => {
            setTimeout(() => {
              this.reset();
              this.render();
            }, 400);
          });
        }, 1200);  // Wait a bit so player can see the caught lobster
      } else {
        // Fallback: if tile not found, still add point and reset after delay
        // This prevents the game from getting stuck
        setTimeout(() => {
          this.controller.addPointToCairn();
          this.reset();
          this.render();
        }, 1600);
      }
      return;
    }

    // Lobster found a path - animate it moving to the next tile
    this.animateTurnWiggleJump(nextPos, escapedIfMove);
  }

  // Animates the lobster's three-phase movement: turn, wiggle, jump
  animateTurnWiggleJump(nextPos, escapedIfMove) {
    this.isAnimating = true;
    this.jumpCounter++;

    this.lobster.rotation = this.lobster.getRotationForDirection(nextPos);
    this.render();
    const tile = this.getCurrentLobsterTile();
    if (tile) {
      tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);
      tile.classList.add('lobster-turn');
    }

    setTimeout(() => {
      this.render();
      const tile2 = this.getCurrentLobsterTile();
      if (tile2) {
        tile2.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);
        tile2.classList.remove('lobster-turn');
        tile2.classList.add('lobster-wiggle');
      }

      setTimeout(() => {
        this.lobster.position = nextPos;
        this.render();
        const tile3 = this.getCurrentLobsterTile();
        if (tile3) {
          tile3.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);
          tile3.classList.remove('lobster-wiggle');
          tile3.classList.add('lobster-jump');
        }

        setTimeout(() => {
          const tile4 = this.getCurrentLobsterTile();
          if (tile4) tile4.classList.remove('lobster-jump');
          this.isAnimating = false;

          // Show movement message every 3-4 jumps
          if (this.jumpCounter >= this.jumpsUntilMessage && !escapedIfMove) {
            const message = this.movementMessages[this.movementMessageIndex];
            this.movementMessageIndex = (this.movementMessageIndex + 1) % this.movementMessages.length;
            this.showSpeechBubble(message, GAME_SETTINGS.TIMING.messageDisplayDuration);
            this.jumpCounter = 0;
            this.jumpsUntilMessage = this.getRandomJumps();
          }

          if (escapedIfMove) {
            // Lobster reached edge - trigger escape animation
            const lobsterTile = this.getCurrentLobsterTile();
            this.triggerEscapeAnimation(lobsterTile);
          }
        }, 280);
      }, 120);
    }, 120);
  }

  // Helper to find which tile the lobster is currently on
  // I mark the lobster's tile with data-lobster="true" in the HTML, so just search for that
  getCurrentLobsterTile() {
    const container = document.querySelector('.hex-board-container');
    if (!container) return null;  // Board hasn't been rendered yet
    return document.querySelector('.hex-tile[data-lobster="true"]') || null;
  }

  // Resets everything for a fresh round - called when starting a new game or after win/loss
  reset() {
    // Clear all the blocked tiles from last round
    this.blockedSet.clear();

    // Set up the board with lobster in centre and random rock obstacles
    this.spawnLobster();
    this.placeRandomRocks();

    // Reset all the game state flags
    this.gameOver = false;
    this.gameLost = false;
    this.isAnimating = false;
    this.isEscaping = false;
    this.isOnEdge = false;

    // Reset jump counter for movement messages
    this.jumpCounter = 0;
    this.jumpsUntilMessage = this.getRandomJumps();

    // Clear any active speech bubble
    this.activeBubble = null;

    // Stop any playing lobster voice
    if (this.giomachVoice) {
      this.giomachVoice.stop();
    }

    // Clear the "Lobster escaped!" or "Lobster caught!" message from last round
    const status = document.getElementById('round-status');
    if (status) status.innerHTML = '';

    // Quick fade animation to make the board reset feel smoother
    const board = document.getElementById('game1-board');
    if (board) {
      const fade = document.createElement('div');
      fade.classList.add('board-fade');
      board.appendChild(fade);
      fade.addEventListener('animationend', () => fade.remove());
    }
  }

  // Creates a golden hexagon SVG for the tile background
  // Similar approach to SVG_ICONS but we need to size it dynamically
  createHexagon(size) {
    // Create SVG container - needs the 'http://www.w3.org/2000/svg' namespace for SVG elements
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';  // let clicks pass through to the tile

    // Calculate the 6 corner points of the hexagon
    const radius = size / 2;
    const points = calculateHexPoints(radius, radius, radius);

    // Draw the hexagon shape - golden fill (#ffd700)YELLOW SAND with slightly darker border (#e6c200)
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', '#ffd700');
    polygon.setAttribute('stroke', '#e6c200');
    polygon.setAttribute('stroke-width', '2');

    svg.appendChild(polygon);
    return svg;
  }

  // Main render function -
  // draws the hexagon board with lobster, rocks, and click handelers
  render() {
    const board = document.getElementById('game1-board');
    if (!board) return;

    // Figure out how big to can make the hexagons while still fitting in the container
    const availableWidth = board.clientWidth;
    const availableHeight = board.clientHeight;

    const rowHeight = GAME_SETTINGS.GRID.hexRowHeightRatio;
    const hexSizeW = (availableWidth * GAME_SETTINGS.GRID.hexSizeRatio) / (this.gridWidth + 0.5);  // +0.5 accounts for odd row offset
    const hexSizeH = (availableHeight * GAME_SETTINGS.GRID.hexSizeRatio) / (this.gridHeight * rowHeight + GAME_SETTINGS.GRID.hexPaddingRatio);
    const hexSize = Math.max(GAME_SETTINGS.GRID.hexMinSize, Math.min(hexSizeW, hexSizeH));  // pick smaller of the two but never below minimum

    // Container holds all the hex tiles, centred on screen
    const container = document.createElement('div');
    container.classList.add('hex-board-container');
    container.style.position = 'relative';
    container.style.width = (this.gridWidth * hexSize + hexSize / 2) + 'px';
    container.style.height = (this.gridHeight * hexSize * rowHeight + hexSize * 0.15) + 'px';
    container.style.margin = '0 auto';

    // Loop through every cell in the grid and create a tile for it
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const key = `${x},${y}`;

        const tile = document.createElement('div');
        tile.classList.add('hex-tile');
        tile.style.width = hexSize + 'px';
        tile.style.height = hexSize + 'px';
        tile.style.position = 'absolute';
        tile.style.left = (x * hexSize + (y % 2 ? hexSize / 2 : 0)) + 'px';  // odd rows shifted right by half a hex
        tile.style.top = (y * (hexSize * rowHeight)) + 'px';
        tile.style.cursor = 'pointer';
        tile.style.transition = 'transform 150ms ease-out, filter 150ms ease-out';

        // Add the golden hexagon background
        const hexBg = this.createHexagon(hexSize);
        hexBg.classList.add('hex-sand');
        tile.appendChild(hexBg);

        const isLobsterPosition = this.lobster.position.x === x && this.lobster.position.y === y;

        // Show rock if this tile is blocked (but not if the lobster is there)
        if (this.blockedSet.has(key) && !isLobsterPosition) {
          tile.classList.add('has-rock');
          const rock = document.createElement('img');
          rock.src = './svgs/game-1/rock-wall.svg';
          rock.classList.add('hex-rock');
          rock.style.width = '100%';
          rock.style.height = '100%';
          rock.style.objectFit = 'cover';
          rock.style.position = 'absolute';
          rock.style.top = '0';
          rock.style.left = '0';
          rock.style.zIndex = '2';
          rock.style.pointerEvents = 'none';  // clicks should go through to the tile
          tile.appendChild(rock);
        }

        // Show lobster if this is where the lobster is
        if (isLobsterPosition) {
          tile.setAttribute('data-lobster', 'true');  // so we can find this tile later with querySelector
          tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);
          tile.style.zIndex = '1000';  // lobster always on top (to-front)

          const lobster = document.createElement('img');
          lobster.src = './svgs/game-1/lobster.svg';
          lobster.classList.add('lobster-svg');
          lobster.style.width = '100%';
          lobster.style.height = '100%';
          lobster.style.objectFit = 'cover';
          lobster.style.position = 'absolute';
          lobster.style.top = '0';
          lobster.style.left = '0';
          lobster.style.zIndex = '3';
          tile.appendChild(lobster);

          // Add speech bubble if lobster has something to say
          const bubbleData = this.shouldShowBubble();
          if (bubbleData) {
            const bubble = document.createElement('div');
            bubble.classList.add('lobster-speech');
            if (!bubbleData.isFirstRender) {
              bubble.classList.add('persistent-bubble');  // no animation if bubble already existed
            }
            bubble.textContent = bubbleData.message;
            tile.appendChild(bubble);
          }
        }

        // Click handler - place a rock if tile is empty
        tile.addEventListener('click', () => {
          if (!this.blockedSet.has(key) && !(this.lobster.position.x === x && this.lobster.position.y === y)) {
            this.clickHexTile(x, y);
          }
        });

        // Hover effect - show preview of where rock will go
        // added during teacher session 1, used a combination of mosue and touch screen
        // for mouse and stylus pen teh hover can be done
        tile.addEventListener('mouseenter', () => {
          if (!this.blockedSet.has(key) && !(this.lobster.position.x === x && this.lobster.position.y === y)) {
            tile.classList.add('hover-preview');
          }
        });

        tile.addEventListener('mouseleave', () => {
          tile.classList.remove('hover-preview');
        });

        container.appendChild(tile);
      }
    }

    // Replace what was in the board with the newly built grid
    board.innerHTML = '';
    board.appendChild(container);
  }

  // Same as render() but for tutorial screens - no click handlers, just for display purposes only
  renderTutorial(elementId) {
    const board = document.getElementById(elementId);
    if (!board) return;

    const availableWidth = board.clientWidth;
    const availableHeight = board.clientHeight;

    const rowHeight = GAME_SETTINGS.GRID.hexRowHeightRatio;
    const hexSizeW = (availableWidth * GAME_SETTINGS.GRID.hexSizeRatio) / (this.gridWidth + 0.5);
    const hexSizeH = (availableHeight * GAME_SETTINGS.GRID.hexSizeRatio) / (this.gridHeight * rowHeight + GAME_SETTINGS.GRID.hexPaddingRatio);
    const hexSize = Math.max(GAME_SETTINGS.GRID.hexMinSize, Math.min(hexSizeW, hexSizeH));

    const container = document.createElement('div');
    container.classList.add('hex-board-container');
    container.style.position = 'relative';
    container.style.width = (this.gridWidth * hexSize + hexSize / 2) + 'px';
    container.style.height = (this.gridHeight * hexSize * rowHeight + hexSize * 0.15) + 'px';
    container.style.margin = '0 auto';

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const key = `${x},${y}`;

        const tile = document.createElement('div');
        tile.classList.add('hex-tile');
        tile.style.width = hexSize + 'px';
        tile.style.height = hexSize + 'px';
        tile.style.position = 'absolute';
        tile.style.left = (x * hexSize + (y % 2 ? hexSize / 2 : 0)) + 'px';
        tile.style.top = (y * (hexSize * rowHeight)) + 'px';
        tile.style.cursor = 'default';
        tile.style.pointerEvents = 'none';  // tutorial board is just for show

        const hexBg = this.createHexagon(hexSize);
        hexBg.classList.add('hex-sand');
        tile.appendChild(hexBg);

        const isLobsterPosition = this.lobster.position.x === x && this.lobster.position.y === y;

        if (this.blockedSet.has(key) && !isLobsterPosition) {
          tile.classList.add('has-rock');
          const rock = document.createElement('img');
          rock.src = './svgs/game-1/rock-wall.svg';
          rock.classList.add('hex-rock');
          rock.style.width = '100%';
          rock.style.height = '100%';
          rock.style.objectFit = 'cover';
          rock.style.position = 'absolute';
          rock.style.top = '0';
          rock.style.left = '0';
          rock.style.zIndex = '2';
          rock.style.pointerEvents = 'none';
          tile.appendChild(rock);
        }

        if (isLobsterPosition) {
          tile.setAttribute('data-lobster', 'true');
          tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);
          tile.style.zIndex = '1000';

          const lobster = document.createElement('img');
          lobster.src = './svgs/game-1/lobster.svg';
          lobster.classList.add('lobster-svg');
          lobster.style.width = '100%';
          lobster.style.height = '100%';
          lobster.style.objectFit = 'cover';
          lobster.style.position = 'absolute';
          lobster.style.top = '0';
          lobster.style.left = '0';
          lobster.style.zIndex = '3';
          tile.appendChild(lobster);

          const bubbleData = this.shouldShowBubble();
          if (bubbleData) {
            const bubble = document.createElement('div');
            bubble.classList.add('lobster-speech');
            if (!bubbleData.isFirstRender) {
              bubble.classList.add('persistent-bubble');
            }
            bubble.textContent = bubbleData.message;
            tile.appendChild(bubble);
          }
        }

        container.appendChild(tile);
      }
    }

    board.innerHTML = '';
    board.appendChild(container);
  }

  // Mostly copy&pasted from render() above,  not ideal but
  // trying to make a shared function with different options
  // got messy. This version just shows the lobster, nothing else.

  renderTutorialOnlyLobster(elementId) {
    const board = document.getElementById(elementId);
    if (!board) return;

    const availableWidth = board.clientWidth;
    const availableHeight = board.clientHeight;

    const rowHeight = GAME_SETTINGS.GRID.hexRowHeightRatio;
    const hexSizeW = (availableWidth * GAME_SETTINGS.GRID.hexSizeRatio) / (this.gridWidth + 0.5);
    const hexSizeH = (availableHeight * GAME_SETTINGS.GRID.hexSizeRatio) / (this.gridHeight * rowHeight + GAME_SETTINGS.GRID.hexPaddingRatio);
    const hexSize = Math.max(GAME_SETTINGS.GRID.hexMinSize, Math.min(hexSizeW, hexSizeH));

    const container = document.createElement('div');
    container.classList.add('hex-board-container');
    container.style.position = 'relative';
    container.style.width = (this.gridWidth * hexSize + hexSize / 2) + 'px';
    container.style.height = (this.gridHeight * hexSize * rowHeight + hexSize * 0.15) + 'px';
    container.style.margin = '0 auto';

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tile = document.createElement('div');
        tile.classList.add('hex-tile');
        tile.style.width = hexSize + 'px';
        tile.style.height = hexSize + 'px';
        tile.style.position = 'absolute';
        tile.style.left = (x * hexSize + (y % 2 ? hexSize / 2 : 0)) + 'px';
        tile.style.top = (y * (hexSize * rowHeight)) + 'px';
        tile.style.cursor = 'default';
        tile.style.pointerEvents = 'none';

        // Only render the lobster, nothing else
        if (this.lobster.position.x === x && this.lobster.position.y === y) {
          tile.setAttribute('data-lobster', 'true');
          tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);

          const lobster = document.createElement('img');
          lobster.src = './svgs/game-1/lobster.svg';
          lobster.classList.add('lobster-svg');
          lobster.style.width = hexSize + 'px';
          lobster.style.height = hexSize + 'px';
          lobster.style.objectFit = 'cover';
          lobster.style.position = 'absolute';
          lobster.style.top = '0';
          lobster.style.left = '0';
          lobster.style.zIndex = '3';
          tile.appendChild(lobster);
        }

        container.appendChild(tile);
      }
    }

    board.innerHTML = '';
    board.appendChild(container);
  }

  // Makes the lobster move slowly on its own during the tutorial demo
  // Default 2 second interval between moves so the user can see what's happening
  startSlowLobsterAnimation(interval = 2000) {
    if (this.tutorialAnimationInterval) clearInterval(this.tutorialAnimationInterval);

    this.tutorialAnimationInterval = setInterval(() => {
      const { nextPos } = this.lobster.getNextStep(
        this.blockedSet, this.boardSquares, this.gridWidth, this.gridHeight
      );

      if (nextPos) {
        this.lobster.rotation = this.lobster.getRotationForDirection(nextPos);
        this.lobster.position = nextPos;
        this.renderTutorialOnlyLobster('game1-board-tutorial');
      }
    }, interval);
  }

  // Stops the slow lobster animation when leaving the tutorial
  // Bug fix - was leaving the interval running and it would keep moving the lobster around even when not in tutorial,
  // causing nothing to appear on the next screens for the tutorial
  stopTutorialAnimation() {
    if (this.tutorialAnimationInterval) {
      clearInterval(this.tutorialAnimationInterval);
      this.tutorialAnimationInterval = null;
    }
  }

  // Plays the animation where lobster runs off the edge and escapes
  triggerEscapeAnimation(tile) {
    // Always set game state, even if tile is null (defensive programming)
    // This ensures the game doesn't get stuck if the DOM is in an unexpected state
    this.isEscaping = true;
    this.gameLost = true;  // Mark that lobster escaped (player loses this round)
    this.activeBubble = null;  // Hide speech bubble during escape

    // If we don't have a tile, skip the animation but still reset
    if (!tile) {
      setTimeout(() => {
        this.isEscaping = false;
        this.isOnEdge = false;
        this.reset();
        this.render();
      }, 500);  // shorter delay since no animation to wait for
      return;
    }

    // Remove any existing speech bubble from the tile
    const existingBubble = tile.querySelector('.lobster-speech');
    if (existingBubble) {
      existingBubble.remove();
    }

    const { x, y } = this.lobster.position;
    let rotation = 0;
    let dx = 0, dy = 0;
    const distance = 1200;  // how far to move off screen in pixels

    // Point lobster in the right direction depending on which edge its escaping from
    // Only 4 edges - N/S/E/W - so straightforward choice to make

    if (y === 0) {                          // top edge - run upwards
      rotation = 0;
      dx = 0; dy = -distance;
    } else if (y === this.gridHeight - 1) { // bottom edge - run downwards
      rotation = 180;
      dx = 0; dy = distance;
    } else if (x === 0) {                   // left edge - run left
      rotation = 270;
      dx = -distance; dy = 0;
    } else if (x === this.gridWidth - 1) {  // right edge - run right
      rotation = 90;
      dx = distance; dy = 0;
    } else {
      // fallback - shouldn't happen but just in case, use current direction
      const ang = (this.lobster.rotation % 360) * (Math.PI / 180);
      dx = Math.cos(ang) * distance;
      dy = -Math.sin(ang) * distance;
      rotation = this.lobster.rotation % 360;
    }

    // In line iwth CSS variables that the lobster escapoe uses
    this.lobster.rotation = rotation;
    tile.style.setProperty('--lobster-rotation', `${rotation}deg`);
    tile.style.setProperty('--escape-x', `${dx}px`);
    tile.style.setProperty('--escape-y', `${dy}px`);
    tile.classList.add('lobster-escape');  // triggers the CSS animation

    // Once animation finishes, reset for the next round
    setTimeout(() => {
      this.isEscaping = false;
      this.isOnEdge = false;
      this.reset();
      this.render();
    }, 1600);  // animation is 1.5s so wait a bit longer to be safe

    // Additional failsafe: if still escaping after 3 seconds, force reset
    setTimeout(() => {
      if (this.isEscaping) {
        console.warn('Escape animation failsafe triggered - forcing reset');
        this.isEscaping = false;
        this.isOnEdge = false;
        this.gameLost = false;
        this.reset();
        this.render();
      }
    }, 3000);
  }
}

// --------------------------------------------------------------------
// 5. GAME 2 - CHO COLTACH RIS AN DÀ SGADAN (Memory Card Game)
// ------------------------------------------------
//
// Memory game with Scottish Gaelic sea themed cards.
// 12 cards total (6 pairs) - flip two at a time to find matches
// Each card shows a different tweed pattern on the back (THIS MAY CHANGE TBD)
// When you find a match, those cards stay face-up
// Points awarded when pairs are matched and also No time limit.
//
// ----------------------------------------------------------------

class CardMatchingGame {
  constructor(controller) {
    this.controller = controller;  // Reference to main game controller

    // ===== GAME STATE =====
    this.cards = [];              // Array of card objects (will be shuffled)
    this.flipped = new Set();     // Indices of currently face-up cards
    this.matched = new Set();     // Indices of cards that have been successfully matched
    this.attempts = 0;            // Total number of pair flips (for stats)
    this.moves = 0;               // Number of valid moves made
    this.isProcessing = false;    // Prevents clicking during card flip/match checking
    this.totalPairs = 6;          // 6 pairs = 12 cards total
  }

  render() {
    const board = document.getElementById('game2-board');
    if (!board) return;

    // Crd images, and their names in english are the filenames
    const cardImages = [
      { name: 'Guga', src: './svgs/game-2/card-items/gannet.svg' },
      { name: 'Portan', src: './svgs/game-2/card-items/shorecrab.svg' },
      { name: 'Cliabh', src: './svgs/game-2/card-items/creel.svg' },
      { name: 'Easgann', src: './svgs/game-2/card-items/eel.svg' },
      { name: 'Crosgag', src: './svgs/game-2/card-items/starfish.svg' },
      { name: 'Sgadan', src: './svgs/game-2/card-items/herring.svg' }
    ];

    // Duplicate the cards (need 2 of each for matching pairs) then shuffle randomly
    // The [...arr, ...arr] spreads the array twice, sort(() => Math.random() - 0.5) shuffles it
    this.cards = [...cardImages, ...cardImages].sort(() => Math.random() - 0.5);

    // Each card back shows a random  tweed pattern - only using 2, 5, 6 - TBD theyre lowest filesizes
    const availableTweeds = [2, 5, 6];

    // Build the HTML for all cards
    const cardsHTML = this.cards.map((card, index) => {
      const tweedNumber = availableTweeds[Math.floor(Math.random() * availableTweeds.length)];
      return `
      <div class="card" data-index="${index}">
        <div class="card-inner">
          <!-- Back of card - tweed pattern (what you see before flipping) -->
          <div class="card-face card-back">
            <img src="./svgs/game-2/tweeds/tweed-${tweedNumber}.svg" alt="Cùl na cairt" loading="lazy">
          </div>
          <!-- Front of card - the sea creature image and Gaelic name -->
          <div class="card-face card-front">
            <img src="${card.src}" alt="${card.name}" class="card-image" loading="lazy">
            <div class="card-label">${card.name}</div>
          </div>
        </div>
      </div>
    `;
    }).join('');

    board.innerHTML = `<div class="card-grid">${cardsHTML}</div>`;

    // Attach event listeners after render
    this.attachCardListeners();

    // Reset counters
    this.updateMoves();
  }

  // Hook up click handlers to each card after they're rendered
  attachCardListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(cardEl => {
      const index = parseInt(cardEl.dataset.index);
      cardEl.addEventListener('click', () => this.flipCard(index));
    });
  }

  // Called when player clicks a card
  flipCard(index) {
    // NOTE Ignore clicks if we're already checking a match, or if card is already flipped/matched
    if (this.isProcessing || this.flipped.has(index) || this.matched.has(index)) return;

    const cardEl = document.querySelector(`.card[data-index="${index}"]`);
    if (!cardEl) return;

    // Flip the card over
    this.flipped.add(index);
    cardEl.classList.add('flipped');

    // Once two cards are flipped, count it as a move and check if they match
    if (this.flipped.size === 2) {
      this.moves++;
      this.updateMoves();
      this.checkMatch();
    }
  }

  // Updates the moves counter display - TBD not sure if this wll be used
  updateMoves() {
    const movesCounter = document.getElementById('moves-counter');
    if (movesCounter) {
      movesCounter.textContent = this.moves;
    }
  }

  // Checks if the two flipped cards are a matching pair
  checkMatch() {
    this.isProcessing = true;  // block further clicks while we check
    const [index1, index2] = Array.from(this.flipped);
    const cards = document.querySelectorAll('.card');

    // Do the two cards have the same name? (same creature = match)
    if (this.cards[index1].name === this.cards[index2].name) {


      // Match found - wait a moment then mark them as matched
      setTimeout(() => {
        this.matched.add(index1);
        this.matched.add(index2);
        cards[index1].classList.add('matched');
        cards[index2].classList.add('matched');
        this.animateStoneToCairn(cards[index1]);  // visual feedback - stone flies to cairn
        this.flipped.clear();
        this.isProcessing = false;

        // IF All pairs found? Game complete
        if (this.matched.size === this.cards.length) {
          setTimeout(() => this.gameComplete(), GAME_SETTINGS.TIMING.gameCompleteDelay);
        }
      }, 400);
    } else {
      // No match - shake them briefly to indicate bad match then flip them back over
      cards[index1].classList.add('card-mismatch');
      cards[index2].classList.add('card-mismatch');
      setTimeout(() => {
        cards[index1].classList.remove('flipped', 'card-mismatch');
        cards[index2].classList.remove('flipped', 'card-mismatch');
        this.flipped.clear();
        this.isProcessing = false;
      }, 1000);  // give player time to see what they picked
    }
  }

  // Triggers the stone-flying-to-cairn animation starting from the matched card
  animateStoneToCairn(cardElement) {
    let startX, startY;

    // Get the centre point of the card (or fallback to board centre if no card)
    if (cardElement) {
      const cardRect = cardElement.getBoundingClientRect();
      startX = cardRect.left + cardRect.width / 2;
      startY = cardRect.top + cardRect.height / 2;
    } else {
      const board = document.getElementById('game2-board');
      const boardRect = board.getBoundingClientRect();
      startX = boardRect.left + boardRect.width / 2;
      startY = boardRect.top + boardRect.height / 2;
    }

    this.controller.animateStoneToCairn(startX, startY);
  }

  // Called when all pairs are matched - move to game 3 after a short delay
  gameComplete() {
    setTimeout(() => {
      this.controller.setGameFlowState('GAME3_READY');
    }, 3000);
  }

  // Resets everything for a fresh game
  reset() {
    this.flipped.clear();
    this.matched.clear();
    this.attempts = 0;
    this.moves = 0;
    this.isProcessing = false;
    this.updateMoves();
  }
}

// --------------------------------------------------------
// 6. GAME 3 - CHO LUATH RIS A' BHRADAN (Fishing Game)
// --------------------------------------------------------------------
//
// This is a game a bit like fruit ninja but with fish
// you have to catch the right fish that Ruairidh asks for.
// Zones: SHALLOW, MID DEPTH, DEEP and a 3 minute time limit.
//
// --------------------------------------------------------

class Game3FishingGame {
  constructor(controller) {
    this.controller = controller;

    // Cached DOM element store this so I dont always call getElementById
    this.canvasElement = null;

    // ===== GAME STATE =====
    this.gameActive = false;
    this.isPaused = false;
    this.timeRemaining = 180;  // 2 minutes 15 seconds total
    this.elapsedTime = 0;      // tracks how long user has been playing (for zone transitions)
    this.currentDepth = 'SHALLOW';  // starts in shallow water, goes deeper as time passes

    // ===== SCORING =====
    this.points = 0;
    this.correctCatches = 0;   // how many times player caught the right fish
    this.totalAttempts = 0;    // total clicks (for accuracy tracking) - TBD may not use

    // ===== ENCOURAGEMENT SYSTEM =====
    // Ruairidh says some encouraging colloqiual Galeic terms when you catch 5 correct fish in a row
    // "Sin thu fhèin!" = "Well done yourself!", "Sgoinneil!" = "Brilliant!", "Fìor Mhath!" = "Very good!"
    this.encouragementMessages = ["Sin thu fhèin!", "Sgoinneil!", "Fìor Mhath!"];
    this.currentMessageIndex = 0;
    this.correctStreakCount = 0;

    // ===== FISH SPAWNING =====
    this.activeFish = [];      // array of fish CURRENTLY swimming on screen
    this.lastSpawnTime = 0;
    this.spawnInterval = 400;  // milliseconds between spawns
    this.maxFish = 8;          // dont want too many fish cluttering the screen

    // ===== ZONE TRANSITIONS =====
    // The game waters gets deeper as time passes - this tracks when we're transitioning
    this.isZoneTransitioning = false;
    this.transitionFishCount = 0;

    // ===== DECORATIVE BUBBLES =====
    // Just for visual effect - bubbles float up in the background
    this.activeBubbles = [];
    this.lastBubbleSpawn = 0;
    this.bubbleInterval = 300;

    // ===== SHOALING FISH =====
    // Some fish swim in groups (i.e for shrimp)
    this.shrimpShoal = [];
    this.lastShoalSpawn = 0;

    // ===== ANIMATION LOOPS =====
    // requestAnimationFrame IDs so we can cancel them when game ends
    this.animationFrameId = null;
    this.timerIntervalId = null;

    // Load all the fish data
    this.fishList = this.getFishList();

    // ===== ORDER SYSTEM =====
    // Ruairidh asks for specific fish - player needs to catch what he wants
    this.currentOrder = null;
    this.lastOrderChange = 0;
    this.orderChangeInterval = 8000;  // Ruairidh changes his mind every 8-15 seconds

    // ===== GAELIC FISH NAMES =====
    // English translations for reference:
    // Carran=Shrimp,
    // Crùbag=Crab,
    //  Giomach=Lobster,
    //  Banag= Trout,
    // Creachann=Scallop,
    // Stroilleag=Cuttlefish,
    // Creagag=Rock fish,
    //  Cuiteag=Cuddies,
    //  Cùdan=Cudden,
    // Sgadan=Herring,
    // Leòbag=Flounder,
    //  Breac Geal=White Trout,
    // Sgeit=Skate,
    // Breac Garbh=Brown Trout,
    // Trosg=Cod,
    // Cat-mara=Catfish,
    //  Manach=Monkfish,
    // Muc-mhara=whale,
    // Tùna=Tuna

    this.fishNames = {
      shrimp: "Carran", crubag: "Crùbag", giomach_side: "Giomach",
      banag_beag: "Banag Beag", banag_mor: "Banag Mòr", creachann: "Creachann",
      stroilleag: "Stroilleag", creagag: "Creagag",
      cuiteag: "Cuiteag", cudan: "Cùdan", sgadan: "Sgadan", leobag: "Leòbag",
      breac_geal: "Breac Geal", iasg_galldach: "Sgeit", breac_garbh: "Breac Garbh",
      trosg: "Trosg", cat_mara: "Cat-mara", manach: "Manach",
      muc_mara: "Muc-mhara", tuna: "Tùna"
    };
  }
// FISH ATTRIBUTES
  // All the fish in the game - each one has properties like:
  // - zone: which depth they appear at (SHALLOW, MID_DEPTH, DEEP)
  // - basePoints: how many points you get for catching it
  // - speed: how fast it swims across the screen
  // - size: how big it appears (in pixels)
  // - spawnWeight: higher = more likely to spawn (makes common fish appear more often)
  // - special behaviours: isShoaling (swims in groups), isDarting (sudden speed bursts), etc.
  // - isValid: true for real fish, false for garbage items
  getFishList() {
    return {
      // ===== SHALLOW ZONE (0-45 seconds) =====
      // Small creatures near the shore - shrimp, crabs, small fish
      shrimp: { id: 'shrimp', svg: './svgs/game-3/game-3-fish/shrimp-L.svg', zone: 'SHALLOW', direction: 'EITHER', svgFaces: 'L', basePoints: 1, speed: 8.0, size: 85, spawnWeight: 5, isShoaling: true, isScurrying: true, isValid: true },
      crubag: { id: 'crubag', svg: './svgs/game-3/game-3-fish/crùbag-either.svg', zone: 'SHALLOW', direction: 'EITHER', basePoints: 1, speed: 4.5, size: 115, spawnWeight: 4, isValid: true },
      giomach_side: { id: 'giomach_side', svg: './svgs/game-3/game-3-fish/giomach-side-R.svg', zone: 'SHALLOW', direction: 'EITHER', svgFaces: 'R', basePoints: 2, speed: 4.0, size: 170, spawnWeight: 3, isValid: true },
      banag_beag: { id: 'banag_beag', svg: './svgs/game-3/game-3-fish/bànag beag-R.svg', zone: 'SHALLOW', direction: 'EITHER', svgFaces: 'R', basePoints: 2, speed: 5.5, size: 155, spawnWeight: 4, isDarting: true, isValid: true },
      banag_mor: { id: 'banag_mor', svg: './svgs/game-3/game-3-fish/bànag mòr-R.svg', zone: 'SHALLOW', direction: 'EITHER', svgFaces: 'R', basePoints: 2, speed: 5.5, size: 175, spawnWeight: 3, isDarting: true, isValid: true },
      creachann: { id: 'creachann', svg: './svgs/game-3/game-3-fish/creachann.svg', zone: 'SHALLOW', direction: 'EITHER', basePoints: 2, speed: 3.0, size: 110, spawnWeight: 2, isValid: true },
      stroilleag: { id: 'stroilleag', svg: './svgs/game-3/game-3-fish/stròilleag.svg', zone: 'SHALLOW', direction: 'UP', basePoints: 3, speed: 5.0, size: 185, spawnWeight: 3, isMultiDirectional: true, isValid: true },
      creagag: { id: 'creagag', svg: './svgs/game-3/game-3-fish/creagag-R.svg', zone: 'SHALLOW', direction: 'EITHER', svgFaces: 'R', basePoints: 3, speed: 5.0, size: 120, spawnWeight: 3, isValid: true },

      // ===== GARBAGE ITEMS =====
      // These float around and the player should catch them for extra points
      // isValid: false means catching these is wrong
      garbage_bag: { id: 'garbage_bag', svg: './svgs/game-3/game-3-garbage/garbage-bag-1.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.0, size: 100, spawnWeight: 2, isFloater: true, isValid: false },
      plastic_bag: { id: 'plastic_bag', svg: './svgs/game-3/game-3-garbage/plastic bag.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.5, size: 90, spawnWeight: 2, isFloater: true, isValid: false },
      plastic_bottle_1: { id: 'plastic_bottle_1', svg: './svgs/game-3/game-3-garbage/plastic-bottle-1.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.0, size: 80, spawnWeight: 2, isFloater: true, isValid: false },
      plastic_bottle_2: { id: 'plastic_bottle_2', svg: './svgs/game-3/game-3-garbage/plastic bottle-2.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.2, size: 85, spawnWeight: 2, isFloater: true, isValid: false },
      straw: { id: 'straw', svg: './svgs/game-3/game-3-garbage/straw.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.8, size: 70, spawnWeight: 1, isFloater: true, isValid: false },
      welly: { id: 'welly', svg: './svgs/game-3/game-3-garbage/welly-either.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.0, size: 100, spawnWeight: 1, isFloater: true, isValid: false },

      // ===== MID-DEPTH ZONE (45-90 seconds) =====
      // Medium sized fish - worth more points but swim faster
      cuiteag: { id: 'cuiteag', svg: './svgs/game-3/game-3-fish/cuiteag-R.svg', zone: 'MID_DEPTH', direction: 'EITHER', svgFaces: 'R', basePoints: 5, speed: 7.0, size: 210, spawnWeight: 4, isDarting: true, isValid: true },
      cudan: { id: 'cudan', svg: './svgs/game-3/game-3-fish/cudan-R.svg', zone: 'MID_DEPTH', direction: 'EITHER', svgFaces: 'R', basePoints: 5, speed: 7.0, size: 210, spawnWeight: 4, isWavy: true, isValid: true },
      sgadan: { id: 'sgadan', svg: './svgs/game-3/game-3-fish/sgadan-L.svg', zone: 'MID_DEPTH', direction: 'EITHER', svgFaces: 'L', basePoints: 6, speed: 7.5, size: 220, spawnWeight: 4, isWavy: true, isValid: true },
      leobag: { id: 'leobag', svg: './svgs/game-3/game-3-fish/leòbag-L.svg', zone: 'MID_DEPTH', direction: 'EITHER', svgFaces: 'L', basePoints: 7, speed: 6.0, size: 240, spawnWeight: 3, isValid: true },
      breac_geal: { id: 'breac_geal', svg: './svgs/game-3/game-3-fish/breac-geal-R.svg', zone: 'MID_DEPTH', direction: 'EITHER', svgFaces: 'R', basePoints: 8, speed: 7.5, size: 270, spawnWeight: 3, isValid: true },
      iasg_galldach: { id: 'iasg_galldach', svg: './svgs/game-3/game-3-fish/sgeit.svg', zone: 'MID_DEPTH', direction: 'EITHER', svgFaces: 'L', basePoints: 10, speed: 7.5, size: 280, spawnWeight: 3, isValid: true },
      breac_garbh: { id: 'breac_garbh', svg: './svgs/game-3/game-3-fish/breac-garbh-R.svg', zone: 'MID_DEPTH', direction: 'EITHER', svgFaces: 'R', basePoints: 12, speed: 7.0, size: 300, spawnWeight: 2, isValid: true },

      // ===== DEEP ZONE (90-135 seconds) =====
      // Big fish worth lots of points - fast and harder to catch - TBD
      // Tuna only appears in the last 15 seconds and is worth 50 points
      trosg: { id: 'trosg', svg: './svgs/game-3/game-3-fish/trosg-R.svg', zone: 'DEEP', direction: 'EITHER', svgFaces: 'R', basePoints: 15, speed: 8.5, size: 220, spawnWeight: 4, isValid: true },
      cat_mara: { id: 'cat_mara', svg: './svgs/game-3/game-3-fish/cat-mara-R.svg', zone: 'DEEP', direction: 'EITHER', svgFaces: 'R', basePoints: 18, speed: 9.0, size: 230, spawnWeight: 3, isValid: true },
      manach: { id: 'manach', svg: './svgs/game-3/game-3-fish/mànach.svg', zone: 'DEEP', direction: 'EITHER', svgFaces: 'R', basePoints: 22, speed: 8.0, size: 250, spawnWeight: 3, isValid: true },
      muc_mara: { id: 'muc_mara', svg: './svgs/game-3/game-3-fish/muc-mara-R.svg', zone: 'DEEP', direction: 'EITHER', svgFaces: 'R', basePoints: 28, speed: 7.5, size: 280, spawnWeight: 2, isValid: true },
      tuna: { id: 'tuna', svg: './svgs/game-3/game-3-fish/tùna-L.svg', zone: 'DEEP', direction: 'EITHER', svgFaces: 'L', basePoints: 50, speed: 10.0, size: 300, spawnWeight: 1, isValid: true, onlyAfter: 165 }
    };
  }

  // Called when game 3 starts - sets everything up
  init() {
    // Cache the canvas element so we dont keep querying the DOM
    this.canvasElement = document.getElementById('game3-canvas');
    if (!this.canvasElement) {
      console.error('Game3Board: Canvas element not found');
      return;
    }

    this.gameActive = true;
    this.timeRemaining = GAME_SETTINGS.TIMING.game3Duration;
    this.elapsedTime = 0;
    this.updateZone('SHALLOW');  // start in shallow water
    this.generateNewOrder();     // Ruairidh asks for first fish
    this.startTimerLoop();       // start the countdown
    this.startGameLoop();        // start the animation loop
  }

  // Helper to get the canvas element  this aslo uses cached version if available)
  getCanvas() {
    return this.canvasElement || document.getElementById('game3-canvas');
  }

  // Ruairidh asks for a new fish & picks a random valid fish from the current zone
  generateNewOrder() {
    // Filter to only fish that can be caught (isValid=true) and are in the current zone
    const validFish = Object.keys(this.fishList).filter(key => {
      const fish = this.fishList[key];
      return fish.isValid && fish.zone === this.currentDepth;
    });

    // Pick one at random
    const targetFish = validFish[Math.floor(Math.random() * validFish.length)];

    this.currentOrder = {
      type: 'fish',
      target: targetFish
    };

    this.updateOrderDisplay();

    // I need to immediatley spawn the fish Ruairidh asked for
    // Otherwise the player might be waiting forever for it to appear randomly
    this.spawnOrderedFish(targetFish);

    // Ruairidh changes his mind every 8 to  15 seconds
    this.orderChangeInterval = 8000 + Math.random() * 7000;
    this.lastOrderChange = Date.now();
  }

  // Forces the requested fish to spawn  so the player can catch it
  spawnOrderedFish(fishId) {
    const fishData = this.fishList[fishId];
    if (!fishData) return;

    // Shoaling fish normally spawn in groups, but just spawn one here (some extra varierty in gameplay)
    if (fishData.isShoaling) {
      this.createFishElement(fishData, 0, 1);
    } else {
      this.createFishElement(fishData);
    }
  }

  // Shows what fish Ruairidh wants in the UI (image + Gaelic name)
  updateOrderDisplay() {
    const targetFishDisplay = document.getElementById('target-fish-display');
    if (!targetFishDisplay) return;

    const fishId = this.currentOrder.target;
    const fishData = this.fishList[fishId];
    const fishName = this.fishNames[fishId];

    targetFishDisplay.innerHTML = `
      <img src="${fishData.svg}" alt="${fishName}" class="target-fish-image" />
      <div class="target-fish-name">${fishName}</div>
    `;
  }

  // Checks if Ruairidh should ask for a different fish
  checkOrderChangeNeeded() {
    if (Date.now() - this.lastOrderChange >= this.orderChangeInterval) {
      this.generateNewOrder();
    }
  }

  // The countdown timer, goes down in  every second
  startTimerLoop() {
    this.controller.timeRemaining = this.timeRemaining;
    this.controller.updateGame1TimerDisplay();

    this.timerIntervalId = setInterval(() => {
      if (!this.gameActive || this.isPaused) return;

      this.timeRemaining--;
      this.elapsedTime++;
      this.controller.timeRemaining = this.timeRemaining;
      this.controller.updateGame1TimerDisplay();

      // Give the player a warning 5 seconds before we go deeper

      if (this.elapsedTime === 40 && this.currentDepth === 'SHALLOW') {
        this.showZoneWarning('MID_DEPTH', 5);
      } else if (this.elapsedTime === 85 && this.currentDepth === 'MID_DEPTH') {
        this.showZoneWarning('DEEP', 5);
      }

      // Zone transitions happen at 45s and 90s
      // Originally was 60s and 120s but that felt too slow in testing
      if (this.elapsedTime === 45 && this.currentDepth !== 'MID_DEPTH') {
        this.transitionZone('MID_DEPTH');
      } else if (this.elapsedTime === 90 && this.currentDepth !== 'DEEP') {
        this.transitionZone('DEEP');
      }

      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  // Main animation loop - runs every frame using requestAnimationFrame
  // This is what makes the fish swim, bubbles float, etc.
  startGameLoop() {
    const gameLoop = (timestamp) => {
      if (!this.gameActive) return;
      if (!this.isPaused) {
        this.updateFish();              // move fish across screen
        this.spawnFishIfNeeded(timestamp);
        this.spawnBubblesIfNeeded(timestamp);
        this.updateBubbles();           // move bubbles upward
        this.updateBackgroundDimming(); // gets darker as we go deeper
        this.checkOrderChangeNeeded();  // does Ruairidh want something different? cant have same each time
      }
      this.animationFrameId = requestAnimationFrame(gameLoop);
    };
    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Changes the current depth zone - affects which fish spawn and the visuals
  updateZone(zone) {
    this.currentDepth = zone;
    const canvas = this.getCanvas();
    const label = document.getElementById('depth-label');

    // Update the CSS class for background colour changes
    if (canvas) {
      canvas.className = `game3-canvas-container zone-${zone.toLowerCase()}`;
    }
    if (label) {
      label.textContent = zone.replace('_', ' ');
    }

    // Spawn rate - deeper zones spawn fish slightly faster
    if (zone === 'SHALLOW') this.spawnInterval = 400;
    else if (zone === 'MID_DEPTH') this.spawnInterval = 350;
    else if (zone === 'DEEP') this.spawnInterval = 350;

    // Max fish on screen at once - fewer in deep zone because they're bigger
    // Too many big fish made the screen feel cluttered
    if (zone === 'SHALLOW') this.maxFish = 5;
    else if (zone === 'MID_DEPTH') this.maxFish = 4;
    else if (zone === 'DEEP') this.maxFish = 3;
  }

  // ===== DEPTH ZONE TRANSITIONS =====
  // As the game progresses, you decend deeper into the ocean
  // SHALLOW (0-45s) THEN
  // MID_DEPTH (45-90s) THEN
  // DEEP (90-135s)
  // Each zone has different fish species and difficulty
  // Transitions are animated to feel natural rather than jarring
  transitionZone(newZone) {
    const canvas = this.getCanvas();
    if (!canvas) return;

    // First, make all the old fish swim away
    // They escape upward (towards shallower water) - looks natural
    this.animateFishExitForZoneChange(this.currentDepth, newZone);

    // Set flags for transition state
    // This makes new fish spawn from the bottom instead of sides
    this.isZoneTransitioning = true;
    this.transitionFishCount = 0;

    // Brief dim effect during transition for visual feedback
    canvas.style.opacity = '0.5';
    setTimeout(() => {
      // Actually change the zone
      this.updateZone(newZone);

      //  Change the fish order immediately
      // Otherwise Ruairidh might be asking for a fish that doesn't exist in the zone
      this.generateNewOrder();

      canvas.style.opacity = '1';  // Restore brightness

      // After a couple seconds, go back to normal spawning behaviour
      setTimeout(() => {
        this.isZoneTransitioning = false;
      }, 2000);
    }, 200);
  }

    // TBD THIS FEELS CLUNKY STILL
  // Makes old fish swim away during zone change
  // They head upwards to "escape" to shallower water
  // This looks way more natural than just deleteing them instantly
  animateFishExitForZoneChange(oldZone, newZone) {
    this.activeFish.forEach((fish) => {
      // Only affect fish from the zone we're leaving
      if (fish.data.zone === oldZone && !fish.caught) {
        fish.isExiting = true;
        fish.exitSpeed = -8;  // Negative Y = upward movement

        // Fade them out gradually as they leave
        fish.element.style.transition = 'opacity 1s ease-out';
        fish.element.style.opacity = '0.4';
      }
    });
  }

  // ===== ZONE TRANSITION WARNING =====
  // Shows a 5-second countdown before zone changes
  // Gives player time to prepare for new fish types
  showZoneWarning(nextZone, countdownSeconds) {
    const canvas = this.getCanvas();
    if (!canvas) return;

    // Zone transition messages in Scottish Gaelic
    const zoneMessages = {
      'MID_DEPTH': "A' dol sìos gu domhainn!",
      'DEEP': "A' dol sìos gu grunn na mara!"
    };
    const message = zoneMessages[nextZone] || nextZone;

    const warning = document.createElement('div');
    warning.className = 'zone-warning';
    warning.textContent = `${message} ${countdownSeconds}...`;
    canvas.appendChild(warning);

    let countdown = countdownSeconds;
    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        warning.textContent = `${message} ${countdown}...`;
      } else {
        clearInterval(interval);
        warning.remove();
      }
    }, 1000);
  }

  // Decides whether to spawn a new fish based on timing and screen capacity
  // Called every frame by the game loop - timestamp comes from requestAnimationFrame
  spawnFishIfNeeded(timestamp) {
    // Don't overcrowd the screen - maxFish varies by zone (shallow=8, mid=6, deep=4)
    // Fewer fish in deeper zones makes it harder since they're also faster
    if (this.activeFish.length >= this.maxFish) return;

    // Only spawn if enough time has passed since the last fish appeared
    // spawnInterval controls the pacing so fish don't all appear at once
    if (timestamp - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnFish();
      this.lastSpawnTime = timestamp;
    }
  }

  spawnFish() {
    // Allow fish from previous zones as distractions + garbage anytime
    const validFish = Object.values(this.fishList).filter(f => {
      // Garbage can appear at any time
      if (f.zone === 'GARBAGE') {
        return Math.random() < 0.25; // 25% chance to include garbage
      }

      // Always include fish from current zone
      if (f.zone === this.currentDepth) {
        if (f.onlyAfter && this.elapsedTime < f.onlyAfter) return false;
        return true;
      }

      // In MID_DEPTH, allow 55% chance of SHALLOW fish as distractions
      if (this.currentDepth === 'MID_DEPTH' && f.zone === 'SHALLOW') {
        return Math.random() < 0.55;
      }

      // In DEEP, allow 55% chance of MID_DEPTH fish as distractions
      if (this.currentDepth === 'DEEP' && f.zone === 'MID_DEPTH') {
        return Math.random() < 0.55;
      }

      // In DEEP, also allow 30% chance of SHALLOW fish for maximum variety
      if (this.currentDepth === 'DEEP' && f.zone === 'SHALLOW') {
        return Math.random() < 0.3;
      }

      return false;
    });

    if (validFish.length === 0) return;

    // Pick a random fish using weighted selection
    // Each fish has a spawnWeight so ahigher weight is more likely to appear
    // e.g. common fish like herring have weight 5, rare tuna has weight 1
    const totalWeight = validFish.reduce((sum, f) => sum + f.spawnWeight, 0);
    let random = Math.random() * totalWeight;
    let selectedFish = validFish[0];

    // Walk through fish, subtracting their weights until we hit zero
    // This is just a standard weighted random algorithm
    for (const fish of validFish) {
      random -= fish.spawnWeight;
      if (random <= 0) {
        selectedFish = fish;
        break;
      }
    }

    // Scarcity mechanic: Sometimes skip spawning the fish Ruairidh wants
    // This stops the target fish from appearing constantly, making it more rewarding to catch
    if (this.currentOrder && selectedFish.id === this.currentOrder.target) {
      const timeSinceOrder = Date.now() - this.lastOrderChange;

      // Be generous at first (only skip 20%) so the player can find the fish
      // After 5 seconds, increase scarcity (skip 40%) to add challenge
      const skipRate = timeSinceOrder < 5000 ? 0.2 : 0.4;

      if (Math.random() < skipRate) {
        return; //  try again next cycle
      }
    }

    // Shoaling behaviour. i.e spawn shrimp in groups
    if (selectedFish.isShoaling) {
      const shoalSize = 3 + Math.floor(Math.random() * 3); // 3-5 shrimp
      for (let i = 0; i < shoalSize; i++) {
        setTimeout(() => {
          this.createFishElement(selectedFish, i, shoalSize);
        }, i * 150); // Stagger spawning by 150ms
      }
    } else {
      this.createFishElement(selectedFish);
    }
  }

  // -------------------------------------------------------
  // FISH CREATION
  // -------------------------------------------------------
  // This is tehe main factory function that spawns a fish onto the screen.
  // It handles all the different fish types
  createFishElement(fishData, shoalIndex = 0, shoalSize = 1) {
    const canvas = this.getCanvas();
    if (!canvas) return;

    // Create the fish container div and load its SVG image
    const fish = document.createElement('div');
    fish.className = 'game3-fish';

    const img = document.createElement('img');
    img.src = fishData.svg;
    img.alt = fishData.id;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';  // clicks go to parent div, not the image - avoids weird click issues with transparent parts of the SVG when clicling on the fish - BUG REMOVED
    fish.appendChild(img);

    // Figure out which direction the fish should swim
    // Some fish can go either way - if so, pick randomly
    let dir = fishData.direction;
    if (dir === 'EITHER') {
      dir = Math.random() < 0.5 ? 'L' : 'R';
    }

    // The SVG files are drawn facing a specific direction (L or R)
    // If the fish is swimming the opposite way, flip the image horizontally
    if (fishData.svgFaces && fishData.svgFaces !== dir) {
      img.style.transform = 'scaleX(-1)';
    }

    const canvasRect = canvas.getBoundingClientRect();
    const fishSize = fishData.size || 70;  // each fish has its own size in the manifest

    // Check what kind of creature this is, I.E  different types spawn and move differently
    // Bottom dwellers like crabs/lobsters that crawl along the seabed
    // Floaters = garbage items that drift upward from below
    const isBottomDweller = (fishData.id === 'shrimp' || fishData.id === 'crubag' || fishData.id === 'giomach_side' || fishData.id === 'creachann');
    const isFloater = fishData.isFloater || false;

    let verticalPos;
    let actualSpeed;
    let speedVariation = (Math.random() - 0.5) * 2;  // adds randomness so fish don't all move identically

    // ===== GARBAGE / FLOATERS =====
    if (isFloater) {
      // Spawn at bottom and float upward (like rubbish rising in water)
      fish.style.left = `${Math.random() * (canvasRect.width - 100)}px`;
      verticalPos = canvasRect.height + 50; // Start below screen
      actualSpeed = -(2 + Math.random()); // Negative = upward movement (will be applied to Y)



    // ===== BOTTOM DWELLERS (crabs, lobsters, limpets) =====
    } else if (isBottomDweller) {
      // These crawl along the seabed from one side to the other
      if (dir === 'L') {
        fish.style.left = '-120px';
      } else {
        fish.style.left = `${canvasRect.width + 20}px`;
      }
      verticalPos = canvasRect.height - fishSize - 10;  // sit on the bottom



      // Speed increases as game progresses - same formula as regular fish
      let baseSpeed;
      const zoneProgress = this.elapsedTime % 45;
      const progressFactor = zoneProgress / 45;

      if (this.currentDepth === 'SHALLOW') {
        baseSpeed = 5 + progressFactor * 2;
      } else if (this.currentDepth === 'MID_DEPTH') {
        baseSpeed = 7 + progressFactor * 3;
      } else if (this.currentDepth === 'DEEP') {
        baseSpeed = 10 + progressFactor * 4;
      } else {
        baseSpeed = fishData.speed;
      }

      actualSpeed = baseSpeed + speedVariation;
      if (dir === 'R') {
        actualSpeed = -actualSpeed;
      }
    } else if (fishData.isMultiDirectional) {
      // Multi-directional fish (squids/jellyfish) - start from bottom or sides
      const spawnPosition = Math.floor(Math.random() * 3); // 0=bottom, 1=left side, 2=right side

      if (spawnPosition === 0) {
        // Spawn from bottom
        fish.style.left = `${Math.random() * (canvasRect.width - 100)}px`;
        verticalPos = canvasRect.height + 50; // Start below screen
      } else if (spawnPosition === 1) {
        // Spawn from left side
        fish.style.left = '-120px';
        verticalPos = 200 + Math.random() * (canvasRect.height - 300); // Middle area
      } else {
        // Spawn from right side
        fish.style.left = `${canvasRect.width + 20}px`;
        verticalPos = 200 + Math.random() * (canvasRect.height - 300);
      }

      // Normal speed for multi-directional movement
      actualSpeed = fishData.speed + speedVariation;
    } else {
      // Regular fish - swim
      // in middle area
      const topMargin = 150;
      const bottomMargin = 20; // Small padding from bottom
      const availableHeight = canvasRect.height - topMargin - fishSize - bottomMargin;

      // During zone transition, spawn new deeper zone fish from bottom (emerging effect TBD)
      if (this.isZoneTransitioning &&
          this.transitionFishCount < 4 &&
          (fishData.zone === 'MID_DEPTH' || fishData.zone === 'DEEP')) {

        // Spawn from bottom centre area, swimming upward initially
        fish.style.left = `${canvasRect.width * 0.3 + Math.random() * (canvasRect.width * 0.4)}px`;
        verticalPos = canvasRect.height + 100; // Start below screen

        // Mark fish as emerging from depths with fade-in effect (TBD)
        fish.dataset.emerging = 'true';
        fish.style.opacity = '0.3'; // Start faded
        fish.style.transition = 'opacity 1.5s ease-in';

        this.transitionFishCount++;
      } else {
        // Normal spawn from sides
        if (dir === 'L') {
          fish.style.left = '-120px';
        } else {
          fish.style.left = `${canvasRect.width + 20}px`;
        }

        if (fishData.isShoaling && shoalSize > 1) {
          const baseY = topMargin + Math.random() * Math.max(100, availableHeight);
          const offset = (shoalIndex - shoalSize / 2) * 40;
          verticalPos = Math.max(topMargin, Math.min(baseY + offset, canvasRect.height - fishSize - bottomMargin));
        } else {
          verticalPos = topMargin + Math.random() * Math.max(100, availableHeight);
        }
      }

      // Trying to achieve smoother difficulty progression
      let baseSpeed;
      const zoneProgress = this.elapsedTime % 45; // 0-44 within current zone
      const progressFactor = zoneProgress / 45;    // 0.0 to 1.0

      if (this.currentDepth === 'SHALLOW') {
        baseSpeed = 5 + progressFactor * 2;  // 5 to 7 over 45 seconds
      } else if (this.currentDepth === 'MID_DEPTH') {
        baseSpeed = 7 + progressFactor * 3;  // 7to10 over 45 seconds
      } else if (this.currentDepth === 'DEEP') {
        baseSpeed = 10 + progressFactor * 4; // 10 to 14 over 45 seconds
      } else {
        baseSpeed = fishData.speed; // Fallback optiob
      }

      actualSpeed = baseSpeed + speedVariation;
      if (dir === 'R') {
        actualSpeed = -actualSpeed;
      }
    }

    fish.style.top = `${verticalPos}px`;
    fish.style.width = `${fishSize}px`;
    fish.style.height = `${fishSize}px`;
    fish.style.transform = 'scale(1)';

    // H hitbox padding based on fish size to reduce finger errors
    // Also made it easier for children
    const paddingSize = Math.max(5, Math.min(15, fishSize * 0.05));
    fish.style.padding = `${paddingSize}px`;
    fish.style.margin = `-${paddingSize}px`;

    const fishObj = {
      element: fish,
      x: parseFloat(fish.style.left),
      y: parseFloat(fish.style.top),
      speed: actualSpeed,
      data: fishData,
      caught: false,
      isWavy: fishData.isWavy || false,
      isSpinning: fishData.isSpinning || false,
      isFloater: isFloater,
      isBottomDweller: isBottomDweller,
      isMultiDirectional: fishData.isMultiDirectional || false,
      isScurrying: fishData.isScurrying || false,
      isDarting: fishData.isDarting || false,
      isEmerging: fish.dataset.emerging === 'true',
      rotation: 0,
      wavyOffset: Math.random() * Math.PI * 2, // Random start phase
      direction: dir,
      baseScale: 1.0,
      // Crab-specific timid behaviour
      crabPhase: Math.random() * Math.PI * 2, // Random start phase for side-to-side
      crabTimer: 0,
      crabPauseTime: 0, // Track pause duration
      // Multi-directional movement timers
      multidirTimer: 0,
      multidirPhase: 0,
      // Scurrying movement timers
      scurryTimer: 0,
      scurrySpeed: actualSpeed,
      // Darting movement timers
      dartTimer: 0,
      dartPhase: 0
    };

    fish.onclick = () => this.catchFish(fishObj);

    canvas.appendChild(fish);
    this.activeFish.push(fishObj);
  }

  updateFish() {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    for (let i = this.activeFish.length - 1; i >= 0; i--) {
      const fish = this.activeFish[i];

      // Safety cleanup: Remove caught fish older than 2 seconds
      if (fish.caught && fish.caughtTime && (Date.now() - fish.caughtTime > 2000)) {
        if (fish.element && fish.element.parentNode) {
          fish.element.remove();
        }
        this.activeFish.splice(i, 1);
        continue;
      }

      if (fish.caught) continue;

      // Handle fish exiting during zone transition (swim upward rapidly)
      if (fish.isExiting) {
        fish.y += fish.exitSpeed; // Negative speed = upward
        fish.element.style.top = `${fish.y}px`;

        // Remove if swam off top of screen
        if (fish.y < -200) {
          fish.element.remove();
          this.activeFish.splice(i, 1);
        }
        continue;
      }

      // Handle fish emerging from bottom during zone transition
      if (fish.isEmerging) {
        // Swim upward from bottom
        fish.y -= 6; // Move upward

        // Add a slight horizontal drifting effedct
        fish.x += Math.sin(fish.wavyOffset) * 2;
        fish.wavyOffset += 0.08;

        fish.element.style.left = `${fish.x}px`;
        fish.element.style.top = `${fish.y}px`;

        // Once fish reaches normal depth (around 300px from top), switch to normal movement
        if (fish.y < 300) {
          fish.isEmerging = false;
          fish.element.style.opacity = '1'; // Full opacity
          fish.element.style.transition = 'opacity 0.5s ease-in';
        }
        continue;
      }

      // Special movement for all garbage items (floating upward)
      if (fish.isFloater) {
        // All garbage floats upward from bottom to top
        fish.y += fish.speed; // Negative speed = upward
        fish.rotation = (fish.rotation || 0) + 3;
        fish.element.style.transform = `rotate(${fish.rotation}deg)`;

        // Slight horizontal drift
        fish.wavyOffset += 0.08;
        fish.x += Math.sin(fish.wavyOffset) * 1.5;

        fish.element.style.left = `${fish.x}px`;
        fish.element.style.top = `${fish.y}px`;

        // Remove if floated off top
        if (fish.y < -100) {
          fish.element.remove();
          this.activeFish.splice(i, 1);
        }
        continue;
      }

      // Special movement for bottom dwellers (crabs/lobsters)
      if (fish.isBottomDweller) {
        if (fish.data.id === 'crubag') {
          // Crabs:Timid side-to-side movement with pauses and darts
          fish.crabTimer++;

          // Phase 1: Pause (30 frames 0.5 seconds)
          if (fish.crabTimer < 30) {
            // Stationary, slight wobble
            fish.crabPhase += 0.1;
            fish.y += Math.sin(fish.crabPhase) * 0.5;
          }
          // Phase 2: Side-to-side movement (60 frames)
          else if (fish.crabTimer < 90) {
            fish.x += fish.speed * 0.3; // Slow sideways
            fish.crabPhase += 0.15;
            fish.y += Math.sin(fish.crabPhase) * 2; // Side-to-side wobble
          }
          // Phase 3: Quick dart (20 frames)
          else if (fish.crabTimer < 110) {
            fish.x += fish.speed * 3; // Fast darting
          }
          // Reset cycle
          else {
            fish.crabTimer = 0;
          }
        } else {
          // Lobsters: Steady-ish crawl along bottom
          fish.x += fish.speed;
          // Minimal vertical movement (crawling effect)
          fish.wavyOffset += 0.05;
          fish.y += Math.sin(fish.wavyOffset) * 0.8;
        }

        // Clamp Y position to prevent bottom dwellers from going off-screen
        const fishHeight = fish.data.size || 70;
        fish.y = Math.max(0, Math.min(fish.y, canvasRect.height - fishHeight));

        fish.element.style.left = `${fish.x}px`;
        fish.element.style.top = `${fish.y}px`;

        // Remove if off-screen horizontally
        if (fish.x < -180 || fish.x > canvasRect.width + 180) {
          fish.element.remove();
          this.activeFish.splice(i, 1);
        }
        continue;
      }

      // Multi-directional movement (squids/jellyfish) - swim head-first in various directions (TBD)
      if (fish.isMultiDirectional) {
        // Initialise movement variables if not set
        if (!fish.multidirTimer) {
          fish.multidirTimer = 0;
          fish.multidirPhase = Math.floor(Math.random() * 4); // 0=up, 1=down, 2=diagonal-up, 3=diagonal-down
        }

        fish.multidirTimer++;

        // Change direction every 60-120 frames
        if (fish.multidirTimer > 60 + Math.random() * 60) {
          fish.multidirTimer = 0;
          fish.multidirPhase = Math.floor(Math.random() * 4);
        }

        // Tentacles at bottom, head at top - always swim head-first (upward bias -current fix for bad directionlity bug)
        if (fish.multidirPhase === 0) {
          // Straight up
          fish.y -= fish.speed * 0.8;
          fish.x += Math.sin(fish.wavyOffset) * 2; // Slight drift
        } else if (fish.multidirPhase === 1) {
          // Down (less common, swimming backward briefly)
          fish.y += fish.speed * 0.4;
          fish.x += Math.sin(fish.wavyOffset) * 2;
        } else if (fish.multidirPhase === 2) {
          // Diagonal up-right
          fish.y -= fish.speed * 0.5;
          fish.x += fish.speed * 0.7;
        } else {
          // Diagonal up-left
          fish.y -= fish.speed * 0.5;
          fish.x -= fish.speed * 0.7;
        }

        // Pulsing motion (like jellyfish/squid)
        fish.wavyOffset += 0.12;
        const pulseFactor = Math.sin(fish.wavyOffset) * 0.1 + 1;
        fish.element.style.transform = `scale(${pulseFactor})`;

        // Clamp position
        const fishHeight = fish.data.size || 70;
        fish.y = Math.max(0, Math.min(fish.y, canvasRect.height - fishHeight));

        fish.element.style.left = `${fish.x}px`;
        fish.element.style.top = `${fish.y}px`;

        // Remove if off-screen (any direction)
        if (fish.x < -180 || fish.x > canvasRect.width + 180 || fish.y < -100) {
          fish.element.remove();
          this.activeFish.splice(i, 1);
        }
        continue;
      }

      // Scurrying movement (shrimp) to achieve that fast and erratic swim
      if (fish.isScurrying) {
        // Initialise scurry variables
        if (!fish.scurryTimer) {
          fish.scurryTimer = 0;
          fish.scurrySpeed = fish.speed;
        }

        fish.scurryTimer++;

        // Random speed bursts every 10-20 frames
        if (fish.scurryTimer % (10 + Math.floor(Math.random() * 10)) === 0) {
          fish.scurrySpeed = fish.speed * (0.5 + Math.random() * 1.5); // 0.5x to 2x speed
        }

        // Quick movement
        fish.x += fish.scurrySpeed;

        //  vertical movement
        fish.wavyOffset += 0.25;
        fish.y += Math.sin(fish.wavyOffset) * 4 + (Math.random() - 0.5) * 3;

        // Occasional quick dart
        if (Math.random() < 0.05) {
          fish.x += fish.speed * 2;
        }

        // Clamp position
        const fishHeight = fish.data.size || 70;
        fish.y = Math.max(0, Math.min(fish.y, canvasRect.height - fishHeight));

        fish.element.style.left = `${fish.x}px`;
        fish.element.style.top = `${fish.y}px`;

        // Remove if off-screen
        if (fish.x < -180 || fish.x > canvasRect.width + 180) {
          fish.element.remove();
          this.activeFish.splice(i, 1);
        }
        continue;
      }

      // Darting movement (small agile fish) - outburst of speed then glide
      if (fish.isDarting) {
        if (!fish.dartTimer) {
          fish.dartTimer = 0;
          fish.dartPhase = 0; // 0 = burst, 1 = glide
        }

        fish.dartTimer++;

        if (fish.dartPhase === 0) {
          // outbrust phase - fast movement (30 frames)
          fish.x += fish.speed * 1.5;
          fish.wavyOffset += 0.2;
          fish.y += Math.sin(fish.wavyOffset) * 2;

          if (fish.dartTimer > 30) {
            fish.dartTimer = 0;
            fish.dartPhase = 1;
          }
        } else {
          // Glide phase - slightly slower, smooth (40 frames)
          fish.x += fish.speed * 0.6;
          fish.wavyOffset += 0.05;
          fish.y += Math.sin(fish.wavyOffset) * 0.8;

          if (fish.dartTimer > 40) {
            fish.dartTimer = 0;
            fish.dartPhase = 0;
          }
        }

        // Clamp position
        const fishHeight = fish.data.size || 70;
        fish.y = Math.max(0, Math.min(fish.y, canvasRect.height - fishHeight));

        fish.element.style.left = `${fish.x}px`;
        fish.element.style.top = `${fish.y}px`;

        // Remove if off-screen
        if (fish.x < -180 || fish.x > canvasRect.width + 180) {
          fish.element.remove();
          this.activeFish.splice(i, 1);
        }
        continue;
      }

      // Regular fish movement
      fish.x += fish.speed;

      // Realistic swimming motion
      if (fish.isWavy) {
        // Squid/octopus - dramatic wavy movement
        fish.wavyOffset += 0.15;
        fish.y += Math.sin(fish.wavyOffset) * 3.5;
      } else {
        // Natural swimming - subtle up/down bobbing
        fish.wavyOffset += 0.08;
        fish.y += Math.sin(fish.wavyOffset) * 1.2;
      }

      // Clamp Y position to prevent fish from going off-screen (top or bottom)
      const fishHeight = fish.data.size || 70;
      fish.y = Math.max(0, Math.min(fish.y, canvasRect.height - fishHeight));

      // Apply position updates
      fish.element.style.left = `${fish.x}px`;
      fish.element.style.top = `${fish.y}px`;

      // Remove if off-screen
      if (fish.x < -180 || fish.x > canvasRect.width + 180) {
        fish.element.remove();
        this.activeFish.splice(i, 1);
      }
    }
  }

  catchFish(fishObj) {
    if (fishObj.caught) return;
    fishObj.caught = true;
    fishObj.caughtTime = Date.now(); // Track when caught for cleanup

    // Handle garbage specially - always gives 1 point, (doesn't affect combo) as dont ant to make trash the focus
    if (fishObj.data.zone === 'GARBAGE') {
      this.handleGarbageCatch(fishObj);
      return;
    }

    this.totalAttempts++;

    // Validate against current order
    const isCorrect = this.validateCatch(fishObj);

    if (isCorrect) {
      this.handleCorrectCatch(fishObj);
    } else {
      this.handleWrongCatch(fishObj);
    }
  }

  validateCatch(fishObj) {
    if (!this.currentOrder) return false;

    // Check if fish ID  =  target order
    return fishObj.data.id === this.currentOrder.target;
  }

  handleCorrectCatch(fishObj) {
    this.correctCatches++;

    // Award base points only (no multipliers)
    const pointsEarned = fishObj.data.basePoints;
    this.points += pointsEarned;
    this.controller.totalPoints += pointsEarned;
    this.controller.updatePointsDisplayOnly();

    // Track consecutive correct catches
    this.correctStreakCount++;

    // ONLY show encouragement message after 5 in a row
    if (this.correctStreakCount >= 5) {
      this.showEncouragementMessage();
      this.correctStreakCount = 0;  // Reset streak after showing message
    }

    this.animateCorrectCatch(fishObj, pointsEarned);

    // THEN change order after successful catch
    this.generateNewOrder();
  }

  handleWrongCatch(fishObj) {
    const penalty = Math.abs(fishObj.data.basePoints);
    this.points = Math.max(0, this.points - penalty);
    this.controller.totalPoints = Math.max(0, this.controller.totalPoints - penalty);
    this.controller.updatePointsDisplayOnly();

    // RESET streak counter on wrong catch
    this.correctStreakCount = 0;

    this.animateWrongCatch(fishObj, penalty);

    // Special squid ink effect when clicking wrong squid (TBD - THIS seems to only work sometimes)
    if (fishObj.data.id === 'stroilleag') {
      this.triggerSquidInkEffect();
    }
  }

  triggerSquidInkEffect() {
    const canvas = this.getCanvas();
    if (!canvas) return;

    // Find all squids on screen
    const squids = this.activeFish.filter(f => f.data.id === 'stroilleag' && !f.caught);

    // Create ink bubbles from each squid
    squids.forEach(squid => {
      const squidX = squid.x;
      const squidY = squid.y;

      // Spawn 8-12 ink bubbles
      const bubbleCount = 8 + Math.floor(Math.random() * 5);

      for (let i = 0; i < bubbleCount; i++) {
        setTimeout(() => {
          this.createInkBubble(squidX, squidY, canvas);
        }, i * 50); // Stagger bubble creation
      }
    });
  }

  createInkBubble(originX, originY, canvas) {
    const bubble = document.createElement('div');
    bubble.className = 'ink-bubble';

    // Random size (40-120px)
    const size = 40 + Math.random() * 80;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;

    // Start at squid position
    bubble.style.left = `${originX}px`;
    bubble.style.top = `${originY}px`;

    canvas.appendChild(bubble);

    // Random direction for bubble to expand
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 200;
    const targetX = originX + Math.cos(angle) * distance;
    const targetY = originY + Math.sin(angle) * distance;

    // Animate bubble expansion and fade
    setTimeout(() => {
      bubble.style.left = `${targetX}px`;
      bubble.style.top = `${targetY}px`;
      bubble.style.transform = `scale(${1.5 + Math.random()})`;
      bubble.style.opacity = '0.7';
    }, 10);

    // Fade out
    setTimeout(() => {
      bubble.style.opacity = '0';
    }, 800 + Math.random() * 400);

    // Remove
    setTimeout(() => {
      bubble.remove();
    }, 2000);
  }

  handleGarbageCatch(fishObj) {
    // Garbage always gives 1 point, but resets the streak - Not sure whether to chaneg or not TBD
    const pointsEarned = 1;
    this.points += pointsEarned;
    this.controller.totalPoints += pointsEarned;
    this.controller.updatePointsDisplayOnly();

    // Reset streak counter when catching garbage
    this.correctStreakCount = 0;

    // Animate garbage catch with green points
    this.animateGarbageCatch(fishObj, pointsEarned);
  }

  showEncouragementMessage() {
    const canvas = this.getCanvas();
    if (!canvas) return;

    // Get the next message in rotation
    const message = this.encouragementMessages[this.currentMessageIndex];

    // Create a new popup element (it just reuses the milestone-flash CSS styling)
    const flash = document.createElement('div');
    flash.className = 'milestone-flash';
    flash.textContent = message;

    // Add it to the canvas so it appears centre-screen
    canvas.appendChild(flash);

    // Move to next message for next time
    this.currentMessageIndex = (this.currentMessageIndex + 1) % this.encouragementMessages.length;

    // Remove the popup after 1.5 seconds
    setTimeout(() => flash.remove(), GAME_SETTINGS.TIMING.flashRemoveDuration);
  }

  updateBackgroundDimming() {
    const screen = document.querySelector('.game3-screen');
    if (!screen) return;

    // Progressive dimming based on current depth zone
    // SHALLOW: 40% darkness (starting level)
    // MID_DEPTH: 55% darkness
    // DEEP: 70% darkness

    if (this.currentDepth === 'DEEP') {
      screen.className = 'game3-screen zone-deep';
    } else if (this.currentDepth === 'MID_DEPTH') {
      screen.className = 'game3-screen zone-mid';
    } else {
      screen.className = 'game3-screen zone-shallow';
    }
  }

  // TBD - Agin this could be altered
  animateCorrectCatch(fishObj, points) {
    const fish = fishObj.element;

    fish.style.transition = 'transform 0.1s ease';
    fish.style.transform = 'scale(1.4)';

    // Show points text
    const pointsText = document.createElement('div');
    pointsText.className = 'points-text';
    pointsText.textContent = `+${points}`;
    pointsText.style.left = fish.style.left;
    pointsText.style.top = fish.style.top;
    this.getCanvas().appendChild(pointsText);

    setTimeout(() => pointsText.remove(), GAME_SETTINGS.TIMING.pointsTextDuration);

    setTimeout(() => {
      fish.style.transition = 'all 0.6s ease-out';
      fish.style.transform = 'scale(0) translateY(-200px)';
      fish.style.opacity = '0';
      setTimeout(() => {
        fish.remove();
        // BUG FIX: Remove from activeFish array
        const index = this.activeFish.indexOf(fishObj);
        if (index > -1) {
          this.activeFish.splice(index, 1);
        }
      }, 600);
    }, 100);
  }

  animateWrongCatch(fishObj, penalty) {
    const fish = fishObj.element;

    fish.style.transition = 'none';
    fish.style.filter = 'brightness(2) hue-rotate(90deg) drop-shadow(0 0 10px red)';

    let wobbleCount = 0;
    const wobbleInterval = setInterval(() => {
      const wobbleX = wobbleCount % 2 === 0 ? -15 : 15;
      fish.style.transform = `translateX(${wobbleX}px) rotate(${wobbleX}deg)`;
      wobbleCount++;
      if (wobbleCount >= 4) {
        clearInterval(wobbleInterval);
        fish.style.transform = 'scale(1)';
        setTimeout(() => {
          fish.remove();
          // Same Bug FIX: Remove from activeFish array
          const index = this.activeFish.indexOf(fishObj);
          if (index > -1) {
            this.activeFish.splice(index, 1);
          }
        }, 300);
      }
    }, 50);

    // Show penalty
    const penaltyText = document.createElement('div');
    penaltyText.className = 'points-text penalty';
    penaltyText.textContent = `-${penalty}`;
    penaltyText.style.left = fish.style.left;
    penaltyText.style.top = fish.style.top;
    this.getCanvas().appendChild(penaltyText);

    setTimeout(() => penaltyText.remove(), GAME_SETTINGS.TIMING.pointsTextDuration);
  }

  animateGarbageCatch(fishObj, points) {
    const fish = fishObj.element;

    fish.style.transition = 'transform 0.1s ease';
    fish.style.transform = 'scale(1.3)';

    // Show points text in green for rubbish collection
    const pointsText = document.createElement('div');
    pointsText.className = 'points-text garbage';
    pointsText.textContent = `+${points} ♻️`;
    pointsText.style.left = fish.style.left;
    pointsText.style.top = fish.style.top;
    this.getCanvas().appendChild(pointsText);

    setTimeout(() => pointsText.remove(), GAME_SETTINGS.TIMING.pointsTextDuration);

    setTimeout(() => {
      fish.style.transition = 'all 0.5s ease-out';
      fish.style.transform = 'scale(0) rotate(360deg)';
      fish.style.opacity = '0';
      setTimeout(() => {
        fish.remove();
        const index = this.activeFish.indexOf(fishObj);
        if (index > -1) {
          this.activeFish.splice(index, 1);
        }
      }, 500);
    }, 100);
  }

  // Bubble effects
  // Decorative bubbles float up to make the scene feel more alive
  // Frequency and size adjust based on depth for realistic effect

  spawnBubblesIfNeeded(timestamp) {
    // Deeper water = more bubbles (bit counterintuitive but looks better)
    let frequency = this.bubbleInterval;
    if (this.currentDepth === 'MID_DEPTH') frequency = 400;
    else if (this.currentDepth === 'DEEP') frequency = 350;

    // Check if it's time to spawn another bubble
    if (timestamp - this.lastBubbleSpawn >= frequency) {
      this.spawnBubble();
      this.lastBubbleSpawn = timestamp;
    }
  }

  spawnBubble() {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    // Create bubble element
    const bubble = document.createElement('div');
    bubble.className = 'underwater-bubble';

    // Random starting position (horizontal across screen, bottom edge)
    const x = Math.random() * canvasRect.width;
    const y = canvasRect.height + 20;  // Start just below visible area

    // Bubble size - smaller in deeper water (less air pressure or somthing)
    let size = 8 + Math.random() * 12;
    if (this.currentDepth === 'MID_DEPTH') size *= 0.8;
    else if (this.currentDepth === 'DEEP') size *= 0.6;

    bubble.style.left = `${x}px`;
    bubble.style.bottom = `-20px`;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;

    canvas.appendChild(bubble);

    // Speed varies by depth (slower rise in deeper water - (physics))
    let riseSpeed = 2.5 + Math.random() * 1.5;
    if (this.currentDepth === 'MID_DEPTH') riseSpeed *= 0.8;
    else if (this.currentDepth === 'DEEP') riseSpeed *= 0.6;

    this.activeBubbles.push({
      element: bubble,
      x: x,
      y: y,
      speed: riseSpeed,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.05
    });
  }

  updateBubbles() {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    for (let i = this.activeBubbles.length - 1; i >= 0; i--) {
      const bubble = this.activeBubbles[i];

      // Rise upward
      bubble.y -= bubble.speed;

      // Wobble horizontally for realistic effect
      bubble.wobble += bubble.wobbleSpeed;
      const wobbleX = Math.sin(bubble.wobble) * 15;

      bubble.element.style.bottom = `${canvasRect.height - bubble.y}px`;
      bubble.element.style.left = `${bubble.x + wobbleX}px`;

      // Remove if off-screen
      if (bubble.y < -30) {
        bubble.element.remove();
        this.activeBubbles.splice(i, 1);
      }
    }
  }


  endGame() {
    this.gameActive = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);

    setTimeout(() => {
      this.controller.setGameFlowState('RESULTS');
    }, 500);
  }
}

// ================================================================
// 7. MAIN GAME CONTROLLER (GameFlowController)
// ================================================================
// This is the main state machine that controls the entire game flow.
// It manages transitions between screens, handles audio, and
// coordinates all three games.
//
// The game flow goes like this:
//   LOGIN → RUAIRIDH_INTRO → PREGAME_TUTORIAL
//         → GAME1_TUTORIAL → GAME1
//         → GAME2_READY → GAME2_TUTORIAL → GAME2
//         → GAME3_READY → GAME3_TUTORIAL → GAME3 → RESULTS

class GameFlowController {
  constructor() {
    // State tracking
    this.currentState = 'LOGIN';
    this.gameContainer = document.getElementById('game-container');

    // Player data
    // TBD - Player information will record info such as their participant code,
    // whetehr they clicked for help, took interest in finding out mroe about Gaelic phrases etc.
    // Another throught was tracking navigation of tutorials, do they have to go back, why? Could
    // the cognitive load be too high? Are they getting lost/confused at certain points etc.
    this.participantCode = null;
    this.gameData = {};
    this.totalPoints = 0;

    // Tutorial step counters - Just Tracks progress through each tutorial section
    this.layoutTutorialStep = 0;
    this.game1TutorialStep = 0;
    this.game2TutorialStep = 0;
    this.game3TutorialStep = 0;

    // Game board instances (created when each game starts)
    this.game1Board = null;
    this.game2Board = null;

    // Timer (4 minute countdown for Game 1)
    this.gameTimer = null;
    this.timeRemaining = GAME_SETTINGS.TIMING.game1Duration;

    // state
    this.gamePaused = false;

    // Centralised audio management
    this.audio = new AudioManager();

    // Ruairidh voice narration system
    this.ruairidhVoice = new RuairidhVoice(this.audio);
  }

  // Builds the top banner (buttons, timer, points) - options control what's shown
  // This fucntion was used to replace duplicate banner implementations which beagn to
  // show technical debt when making changes to the banner
  buildBannerHTML(options = {}) {
    const {
      showPause = true,
      pauseDisabled = true,
      pauseButtonGlowing = false,
      pauseHandler = null,
      showHelp = true,
      helpDisabled = true,
      helpButtonGlowing = false,
      helpHandler = 'gameController.toggleInGameHelpModal()',
      showTimer = false,
      timerDisplay = '5:00',
      showTitle = false,
      title = '',
      titleClass = 'game1-title-fun',
      cairnGlowing = false,
      cairnId = '',
      soundButtonGlowing = false
    } = options;

    // Build the sound button - adds 'glowing' class if it should pulsate during tutorial
    let soundBtnClass = 'ruairidh-sound-button';
    if (soundButtonGlowing) {
      soundBtnClass = 'ruairidh-sound-button glowing';
    }

    // CRITICAL: Set red X overlay display based on ACTUAL current audio state
    const isAudioEnabled = this.audio.isEnabled();
    const muteOverlayDisplay = isAudioEnabled ? 'none' : 'block';

    const soundBtn = `<button class="${soundBtnClass}" id="sound-button" onclick="gameController.toggleSound()">
      <img src="./svgs/all-games/speaker-icon.svg" alt="Speaker" class="sound-icon" />
      <img src="./svgs/all-games/red-x.svg" alt="Muted" class="sound-mute-overlay" id="sound-mute-overlay" style="display: ${muteOverlayDisplay};" />
    </button>`;

    // Build pause button - this one's a bit more complex because it behaves differently
    // during the tutorial (glowing, not clickable) vs during actual gameplay (clickable)
    let pauseBtn = '';
    if (showPause) {
      let pauseBtnClass = 'ruairidh-pause-button'; // start with defaults, then override
      let pauseStyle = '';
      let pauseIdAttr = '';
      let disabledAttr = '';
      let onclickAttr = '';

      // During tutorial, the button glows but shouldn't be clickable
      if (pauseButtonGlowing) {
        pauseBtnClass = 'ruairidh-pause-button glowing';
        pauseStyle = ' style="cursor: default;"';
        pauseIdAttr = ' id="layout-pause-btn"';
      } else if (pauseHandler) {
        pauseIdAttr = ' id="pause-button"'; // different ID so togglePause can find it
      }

      if (pauseDisabled) {
        disabledAttr = ' disabled';
      }

      // Only add the click handler if the pausebutton should actually be doing smething
      if (pauseHandler && !pauseDisabled) {
        onclickAttr = ` onclick="${pauseHandler}"`;
      }

      pauseBtn = `<button class="${pauseBtnClass}"${pauseIdAttr}${disabledAttr}${pauseStyle}${onclickAttr}>${SVG_ICONS.pause}</button>`;
    }

    // Build help button - similar logic to pause, but simpler
    let helpBtn = '';
    if (showHelp) {
      let helpBtnClass = 'ruairidh-help-button';
      let helpIdAttr = '';
      let disabledAttr = '';
      let onclickAttr = '';

      // Glowing during tutorial to draw attention
      if (helpButtonGlowing) {
        helpBtnClass = 'ruairidh-help-button glowing';
        helpIdAttr = ' id="layout-help-btn"';
      }

      // Either disabled (no click) or enabled (shows help box) aferr click
      if (helpDisabled) {
        disabledAttr = ' disabled';
      } else {
        onclickAttr = ` onclick="${helpHandler}"`;
      }

      helpBtn = `<button class="${helpBtnClass}"${helpIdAttr}${disabledAttr}${onclickAttr}>?</button>`;
    }

    // Build timer section - only shown during timed games (Game 1 and Game 3)
    let timerSection = '';
    if (showTimer) {
      timerSection = `
            <div class="timer-box">
              <img src="./svgs/all-games/clock.svg" alt="Uaireadair" class="timer-icon" />
              <div class="timer-text">ÙINE:</div>
              <span id="timer-display">${timerDisplay}</span>
            </div>`;
    }

    // Build title section - shows the game name like "Glac an Giomach"
    let titleSection = '';
    if (showTitle && title) {
      titleSection = `
          <div class="banner-title-container">
            <div class="${titleClass}">${title}</div>
          </div>`;
    }

    // Build cairn/points section - the cairn icon pulsates when Ruairidh explains it
    let cairnClass = 'cairn-icon';
    if (cairnGlowing) {
      cairnClass = cairnClass + ' pulsing';
    }
    let cairnIdAttr = '';
    if (cairnId) {
      cairnIdAttr = ` id="${cairnId}"`;
    }

    return `
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            ${soundBtn}
            ${pauseBtn}
            ${helpBtn}
          </div>
          ${titleSection}
          <div class="ruairidh-banner-right">
            ${timerSection}
            <div class="points-box">
              <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="${cairnClass}"${cairnIdAttr} />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter" class="points-counter-text">${this.totalPoints}</span>
            </div>
          </div>
        </div>`;
  }

  // Builds the speech bubble with Ruairidh the seal
  buildSpeechBubbleHTML(speechText, sealSize = null) {
    let sealStyle = '';
    if (sealSize) {
      sealStyle = ` style="width: ${sealSize}px; height: ${sealSize}px;"`;
    }
    return `
          <div class="ruairidh-container">
            <div class="seal-icon-wrapper">
              <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon"${sealStyle} />
            </div>
            <div class="speech-bubble">
              <p>${speechText}</p>
            </div>
          </div>`;
  }

  // Builds the back/forward arrow buttons (or the green "play" button on the final tutorial step)
  buildNavButtonsHTML(backAction, forwardAction, showPlayButton = false, playAction = null, forwardDisabled = false) {
    let buttons = '';

    if (backAction) {
      buttons += `<button class="arrow-btn" onclick="${backAction}">← Air ais</button>`;
    }

    if (showPlayButton) {
      let action = "gameController.setGameFlowState('GAME1_TUTORIAL')";
      if (playAction) {
        action = playAction;
      }
      const disabledAttr = forwardDisabled ? ' disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
      buttons += `<button id="forward-btn" class="play-green-btn"${disabledAttr} onclick="${action}">Cluich an Geama</button>`;
    } else if (forwardAction) {
      const disabledAttr = forwardDisabled ? ' disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
      buttons += `<button id="forward-btn" class="arrow-btn"${disabledAttr} onclick="${forwardAction}">Air adhart →</button>`;
    }

    // Centre the buttons if there's only a play button (no back arrow)
    let containerClass = 'arrow-buttons';
    if (showPlayButton && !backAction) {
      containerClass = 'arrow-buttons centred';
    }

    return `<div class="${containerClass}">${buttons}</div>`;
  }

  // --------------------------------------------------------
  // UNIFIED LAYOUT TUTORIAL RENDERER
  // Avoids duplication of renderGameIntro_LayoutStep functions
  // ------------------------------------------------------------
  renderLayoutTutorialStep(stepIndex) {
    // Look up which tutorial step to show (e.g. stepIndex 0 = SOUND_BUTTON, 1 = PAUSE_BUTTON, etc)
    const stepKeys = Object.keys(LAYOUT_TUTORIAL_STEPS);
    const stepKey = stepKeys[stepIndex];
    const config = LAYOUT_TUTORIAL_STEPS[stepKey];

    // Safety check in case something goes wrong (tessted)
    if (!config) {
      console.error(`Invalid layout tutorial step index: ${stepIndex}`);
      return;
    }

    this.layoutTutorialStep = config.step;

    // Build banner with appropriate glowing states
    const bannerHTML = this.buildBannerHTML({
      soundButtonGlowing: config.soundButtonGlowing,
      showPause: true,
      pauseDisabled: true,
      pauseButtonGlowing: config.pauseButtonGlowing,
      showHelp: true,
      helpDisabled: true,
      helpButtonGlowing: config.helpButtonGlowing,
      cairnGlowing: config.cairnGlowing
    });

    // Build speech bubble
    const speechHTML = this.buildSpeechBubbleHTML(config.speechText);

    // Build navigation buttons (start with forward button disabled)
    const navHTML = this.buildNavButtonsHTML(
      config.backAction,
      config.forwardAction,
      config.showPlayButton || false,
      null,
      true  // forwardDisabled = true initially
    );

    // Some steps have a special background class (e.g. beach background on the final step)
    let screenClass = '';
    if (config.screenClass) {
      screenClass = ` ${config.screenClass}`;
    }

    // Put it all together and render to the page
    const html = `
      <div class="game-screen${screenClass}">
        ${bannerHTML}
        <div class="intro-screen-wrapper" style="position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen">
            ${speechHTML}
            ${navHTML}
          </div>
        </div>
      </div>
    `;

    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // Play audio based on layout step and enable forward button when complete
    const audioKeys = ['LAYOUT_SOUND', 'LAYOUT_PAUSE', 'LAYOUT_HELP', 'LAYOUT_CAIRN', 'LAYOUT_READY'];
    const audioKey = audioKeys[this.layoutTutorialStep];

    this.ruairidhVoice.play(audioKey, () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // Called when player clicks "Air adhart" (forward) during the layout tutorial
  advanceLayoutTutorialStep() {
    // Find where we are in the tutorial steps
    const stepKeys = Object.keys(LAYOUT_TUTORIAL_STEPS);
    let currentIndex = -1;
    for (let i = 0; i < stepKeys.length; i++) {
      const key = stepKeys[i];
      if (LAYOUT_TUTORIAL_STEPS[key].step === this.layoutTutorialStep) {
        currentIndex = i;
        break;
      }
    }

    // If we're not at the last step, go to the next one
    if (currentIndex < stepKeys.length - 1) {
      this.renderLayoutTutorialStep(currentIndex + 1);
    }
  }

  // Called when player clicks the sound button
  toggleSound() {
    const nowEnabled = this.audio.toggle(); // flips audio on/off and returns new state

    // Firebase Data Logging: Track sound toggles
    if (this.dataLogger) {
      this.dataLogger.logSoundToggle(nowEnabled);
    }

    // CRITICAL: Stop Ruairidh voice narration when muting
    if (!nowEnabled && this.ruairidhVoice) {
      this.ruairidhVoice.stop();
    }

    // Update red X overlay - find ALL instances on the page
    const muteOverlays = document.querySelectorAll('.sound-mute-overlay, #sound-mute-overlay');
    muteOverlays.forEach(overlay => {
      if (nowEnabled) {
        overlay.style.display = 'none'; // Hide red X when sound is ON
      } else {
        overlay.style.display = 'block'; // Show red X when sound is OFF
      }
    });

    if (nowEnabled) {
      this.audio.startForState(this.currentState); // restart music for current screen
    }
  }

  // When the player clicks the "?" next to one of the seleted idiomatic Gaelic phrases, this shows a popup
  // explaining what the phrase means (with Ruairidh the seal)
  showPhraseExplanation(phraseId) {
    // The phrases used in the game and their explanations
    const phrases = {
      cairn: {
        phrase: "Nithear càirn mòr bho chlachan bheaga", // "Big cairns are made from small stones"
        explanation: "Tha an abairt seo a' ciallachadh gun urrainn dhut rudeigin mòr a choileanadh le bhith a' cur ris, beag air bheag. Tha na ceumannan beaga cudromach!"
      },
      earrach: {
        phrase: "San Earrach, nuair a bhios a chaora caol, bidh am maorach reamhar", // "In Spring, when the sheep is thin, the shellfish is fat"
        explanation: "Tha an abairt seo a' ciallachadh gur e àm math a th' anns an earrach dhuinn. Aig toiseach na bliadhna, tha na caoraich caol, ach tha na maoraich, 's e sin na giomaich is na crùbagan, gu math reamhar. Tha a' mhuir agus an tìr a' toirt biadh dhuinn fad na bliadhna, fiù 's ma tha rudeigin eile lag no gann!"
      }
    };

    const data = phrases[phraseId];
    if (!data) return; // just in case an invalid phraseId is passed

    // CRITICAL: Log Seanfhacail help request to Firebase
    if (this.dataLogger) {
      this.dataLogger.logHelpSeanfhacail(data.phrase);
    }

    // Create the  popup box
    const modal = document.createElement('div');
    modal.className = 'phrase-modal active';
    modal.id = 'phrase-modal';
    modal.innerHTML = `
      <div class="phrase-modal-content">
        <h3 class="phrase-modal-title">"${data.phrase}"</h3>
        <div class="phrase-modal-seal">
          <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh" />
        </div>
        <div class="phrase-modal-explanation">
          <p>${data.explanation}</p>
        </div>
        <button class="arrow-btn" onclick="gameController.closePhraseExplanation()">Dùin</button>
      </div>
    `;
    document.body.appendChild(modal); // add it to the page
  }

  closePhraseExplanation() {
    const modal = document.getElementById('phrase-modal');
    if (modal) {
      modal.remove(); // takes it off the page
    }
  }

  // Pauses or resumes Game 1 - stops the timer and freezes the lobster
  togglePause() {
    this.gamePaused = !this.gamePaused;
    const button = document.getElementById('pause-button');
    const modal = document.getElementById('pause-modal');

    if (this.gamePaused) {
      // CRITICAL: Update status to 'paused'
      if (this.dataLogger) {
        this.dataLogger.updateStatus('paused');
      }

      if (this.gameTimer) clearInterval(this.gameTimer); // stop the countdown
      if (this.game1Board) this.game1Board.isAnimating = true; // freeze the lobster
      if (button) button.innerHTML = SVG_ICONS.play;
      if (modal) modal.classList.add('active');
      this.audio.pauseGameSounds(this.currentState);
    } else {
      // CRITICAL: Restore status to 'playing'
      if (this.dataLogger) {
        this.dataLogger.updateStatus('playing');
      }

      if (this.game1Board) {
        this.game1Board.isAnimating = false; // unfreeze the lobster
      }

      // Restart the countdown timer
      if (this.gameTimer) clearInterval(this.gameTimer);
      this.gameTimer = setInterval(() => {
        this.timeRemaining--;
        this.updateGame1TimerDisplay();
        if (this.timeRemaining <= 0) {
          clearInterval(this.gameTimer);
          setTimeout(() => this.setGameFlowState('GAME2_READY'), GAME_SETTINGS.TIMING.stateTransitionDelay);
        }
      }, 1000);

      if (button) button.innerHTML = SVG_ICONS.pause;
      if (modal) modal.classList.remove('active');
      this.audio.resumeForState(this.currentState);
    }
  }

  // Pauses or resumes Game 3 - same idea as togglePause but for the fish sorting game
  // (I kept these separate because Game 1 has the timer logic and Game 3 doesn't)
  toggleGame3Pause() {
    if (!this.game3Board) return;
    this.game3Board.isPaused = !this.game3Board.isPaused;
    const button = document.getElementById('pause-button');
    const modal = document.getElementById('pause-modal');

    if (this.game3Board.isPaused) {
      // CRITICAL: Update status to 'paused'
      if (this.dataLogger) {
        this.dataLogger.updateStatus('paused');
      }

      if (button) button.innerHTML = SVG_ICONS.play;
      if (modal) modal.classList.add('active');
      this.audio.pauseGameSounds(this.currentState);
    } else {
      // CRITICAL: Restore status to 'playing'
      if (this.dataLogger) {
        this.dataLogger.updateStatus('playing');
      }

      if (button) button.innerHTML = SVG_ICONS.pause;
      if (modal) modal.classList.remove('active');
      this.audio.resumeGameSounds(this.currentState);
    }
  }

  // ============================================================================
  //
  //                           MAIN STATE MACHINE
  //
  //   This is the heart of the app. It controls which screen is showing and when
  //   Every screen transition goes through this function
  //
  //   As i stated in the begining, the game flow goes like this:
  //
  //   LOGIN → RUAIRIDH_INTRO → PREGAME_TUTORIAL
  //         → GAME1_TUTORIAL → GAME1
  //         → GAME2_READY → GAME2_TUTORIAL → GAME2
  //         → GAME3_READY → GAME3_TUTORIAL → GAME3 → RESULTS
  //
  // ============================================================================
  setGameFlowState(newState) {
    const oldState = this.currentState;

    // DEFENSIVE: Prevent invalid state transitions
    // Don't allow going back to GAME2_READY if we're already past Game 2
    if (newState === 'GAME2_READY' && ['GAME3', 'GAME3_READY', 'GAME3_TUTORIAL', 'RESULTS', 'COMPLETED'].includes(oldState)) {
      console.warn(`Prevented invalid transition from ${oldState} to ${newState}`);
      return;
    }

    this.currentState = newState;

    // Firebase Data Logging: Track state transitions and game starts
    if (this.dataLogger) {
      this.dataLogger.logStateTransition(oldState, newState);

      // Log game starts
      if (newState === 'GAME1') this.dataLogger.logGameStart(1);
      if (newState === 'GAME2') this.dataLogger.logGameStart(2);
      if (newState === 'GAME3') this.dataLogger.logGameStart(3);

      // Update progress bar based on game flow state (fine-grained progression)
      const progressMap = {
        'LOGIN': 0,
        'RUAIRIDH_INTRO': 5,
        'PREGAME_TUTORIAL': 10,
        'GAME1_TUTORIAL': 15,
        'GAME1': 35,           // +20 for playing Game 1
        'GAME2_READY': 38,     // +3 transition
        'GAME2_TUTORIAL': 43,  // +5 tutorial
        'GAME2': 63,           // +20 for playing Game 2
        'GAME3_READY': 66,     // +3 transition
        'GAME3_TUTORIAL': 71,  // +5 tutorial
        'GAME3': 91,           // +20 for playing Game 3
        'RESULTS': 96,         // +5 viewing results
        'COMPLETED': 100       // +4 complete
      };

      if (progressMap[newState] !== undefined) {
        this.dataLogger.updateProgress(progressMap[newState]);
      }
    }

    // Clear what was on screen before
    this.gameContainer.innerHTML = '';

    // ===== AUDIO MANAGEMENT =====
    // Each state has different audio requirements
    // First anbd foremost kill everything that's currently playing:
    this.audio.stopAll();
    this.ruairidhVoice.stop();

    // Then start the appropriate tracks for this new state
    if (newState === 'GAME1_TUTORIAL') {
      // Tutorial has quieter music + ocean ambience
      this.audio.startGame1Tutorial();
      this.audio.startAmbience();
    } else if (newState === 'GAME1') {
      // Ambiance for game 1 only here
      this.audio.startGame1();
      this.audio.startAmbience();
    } else if (newState === 'GAME2') {
      // Matching game music
      this.audio.startGame2();
    } else if (newState === 'GAME3') {
      // Fishing game music
      this.audio.startGame3();
    } else if (['RUAIRIDH_INTRO', 'PREGAME_TUTORIAL', 'GAME2_READY', 'GAME2_TUTORIAL', 'GAME3_READY', 'GAME3_TUTORIAL', 'RESULTS'].includes(newState)) {
      // Menu and tutorial screens use generic background music
      this.audio.startBackground();
    }
    // LOGIN screen stays silent (no music)

    switch (newState) {
      case 'LOGIN':
        this.renderLoginScreen();
        break;
      case 'RUAIRIDH_INTRO':
        this.renderIntroduction_RuairidhIntro();
        break;
      case 'PREGAME_TUTORIAL':
        this.renderLayoutTutorialStep(0);
        break;
      case 'GAME1_TUTORIAL':
        this.renderGame1TutorialFlow();
        break;
      case 'GAME1':
        this.renderGame1_Main();
        break;
      case 'GAME2_READY':
        this.renderInterval_TransitionToGame2();
        break;
      case 'GAME2_TUTORIAL':
        this.renderGame2TutorialScreen();
        break;
      case 'GAME2':
        this.renderGame2_Main();
        break;
      case 'GAME3_READY':
        this.renderInterval_TransitionToGame3();
        break;
      case 'GAME3_TUTORIAL':
        this.renderGame3_Tutorial();
        break;
      case 'GAME3':
        this.renderGame3_Main();
        break;
      case 'RESULTS':
        this.renderResultsScreen();
        break;
    }

    // Update sound button icon to match current sound state
    this.updateSoundButtonIcon();
  }

  updateSoundButtonIcon() {
    // Update ALL sound button overlays on the page (handles multiple instances)
    const muteOverlays = document.querySelectorAll('.sound-mute-overlay, #sound-mute-overlay');
    const isEnabled = this.audio.isEnabled();
    muteOverlays.forEach(overlay => {
      overlay.style.display = isEnabled ? 'none' : 'block';
    });
  }

  // Sets up a smaller version of the Game 1 board for the tutorial screens
  initGame1TutorialBoard(options = {}) {
    let withRocks = false;
    if (options.withRocks) {
      withRocks = true;
    }

    // Create a new board with smaller dimensions for the tutorial
    this.game1TutorialBoard = new Game1Board(5, this);
    this.game1TutorialBoard.isAnimating = true; // starts frozen so player can read instructions
    this.game1TutorialBoard.gridWidth = GAME_SETTINGS.GRID.tutorialWidth;
    this.game1TutorialBoard.gridHeight = GAME_SETTINGS.GRID.tutorialHeight;
    this.game1TutorialBoard.boardSquares.clear();
    this.game1TutorialBoard.initialiseBoard();
    this.game1TutorialBoard.spawnLobster();

    // Some tutorial steps show rocks, others don't
    if (withRocks) {
      const lobsterX = this.game1TutorialBoard.lobster.position.x;
      const lobsterY = this.game1TutorialBoard.lobster.position.y;
      const lobsterKey = lobsterX + ',' + lobsterY;

      // Add each rock position, but skip if the lobster is there
      // This was a bug fix where a stone would sometimes spawn on top of the lobster during the tutorial,
      //  which was confusing for users given the fact taht isay the lobser can't jump over rocks
      for (let i = 0; i < TUTORIAL_ROCK_POSITIONS.length; i++) {
        const pos = TUTORIAL_ROCK_POSITIONS[i];
        if (pos !== lobsterKey) {
          this.game1TutorialBoard.blockedSet.add(pos);
        }
      }
    } else {
      this.game1TutorialBoard.blockedSet.clear();
    }

    return this.game1TutorialBoard;
  }

  // ----------------------------------------------------------
  // 1 - LOGIN (player enters their participant code before starting)
  // ----------------------------------------------------------
  renderLoginScreen() {
    const html = `
      <div class="login-wrapper">
        <h1 class="game-main-title">Geamaichean Gàidhlig</h1>
        <div class="login-screen">
          <h2>Fàilte!</h2>
          <div class="form-group">
            <label for="participant-code">Còd an cluicheadar:</label>
            <input type="text" id="participant-code" placeholder="Cuir a-steach do chòd an seo" autocomplete="off" />
          </div>
          <button class="play-button" onclick="gameController.handleLoginSubmit()">Tòisich</button>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // Allow Enter key to submit // When being tested by teacher afetr iteration 1 and she
    // tried pressing enter and it didnt work, decided to implement this
    const input = document.getElementById('participant-code');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleLoginSubmit();
        }
      });
    }
  }

  // Handles participant/teacher code login with Firebase authentication
  async handleLoginSubmit() {
    const input = document.getElementById('participant-code');
    if (!input) return;

    const code = input.value.trim().toUpperCase();

    if (!code) {
      alert('Feuch gun cuir thu a-steach an còd ceart agad!');
      return;
    }

    // Simple client-side validation
    const participantPattern = /^P-([0-9]|[1-4][0-9]|50)$/;  // P-0 to P-50
    const teacherPattern = /^T-([1-9]|10)$/;  // T-1 to T-10 (no leading zeros)

    const isParticipant = participantPattern.test(code);
    const isTeacher = teacherPattern.test(code);

    if (!isParticipant && !isTeacher) {
      alert('Còd mì-dhligheach!\n\nFeumaidh an còd a bhith san fhoirm:\nP-0 gu P-50 (com-pàirtichean)\nno T-1 gu T-10 (tidsearan)');
      return;
    }

    // Teacher codes go to dashboard
    if (isTeacher) {
      window.location.href = '/dashboard.html';
      return;
    }

    // Participant flow
    this.participantCode = code;
    this.gameData = { participantCode: code, score: 0, gameStartTime: new Date() };

    // Initialize Firebase data logger (non-blocking - game continues even if logging fails)
    try {
      console.log('Initializing DataLogger for participant:', code);
      this.dataLogger = new window.DataLogger(code);
      await this.dataLogger.init();
      console.log('DataLogger initialized successfully');
    } catch (error) {
      console.warn('DataLogger initialization failed (game will continue without logging):', error);
      this.dataLogger = null;  // Disable logging but allow game to proceed
    }

    // Continue to game intro
    this.setGameFlowState('RUAIRIDH_INTRO');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Ruairidh the seal introduces himself)
  // ----------------------------------------------------------
  renderIntroduction_RuairidhIntro() {
    const html = `
      <div class="ruairidh-intro-screen">
        <div class="ruairidh-container">
          <div class="seal-icon-wrapper">
            <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
          </div>
          <div class="speech-bubble">
            <p>Halo! Is mise Ruairidh an Ròn, 's tha mi an seo airson do chuideachadh leis a' gheama seo.</p>
          </div>
        </div>
        <div class="arrow-buttons centred">
          <button id="start-audio-btn" class="play-green-btn" onclick="gameController.startRuairidhIntroAudio()" style="font-size: 20px; padding: 15px 40px;">
            TÒISICH
          </button>
          <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed; display: none;" onclick="gameController.setGameFlowState('PREGAME_TUTORIAL')">Air adhart →</button>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();
  }

  startRuairidhIntroAudio() {
    const startBtn = document.getElementById('start-audio-btn');
    const forwardBtn = document.getElementById('forward-btn');

    if (startBtn) startBtn.style.display = 'none';
    if (forwardBtn) {
      forwardBtn.style.display = 'inline-block';
      forwardBtn.disabled = true;
      forwardBtn.style.opacity = '0.5';
    }

    this.ruairidhVoice.play('RUAIRIDH_INTRO', () => {
      if (forwardBtn) {
        forwardBtn.disabled = false;
        forwardBtn.style.opacity = '1';
        forwardBtn.style.cursor = 'pointer';
        forwardBtn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // ----------------------------------------------------------
  // 3 - GAME 1 TUTORIAL (Ruairidh explains how to catch lobsters)
  //
  // This is split into multiple steps so the player isn't overwhelmed:
  //   Step 1  - Welcome to the beach + Gaelic phrase
  //   Step 1b - Shows the lobster moving around
  //   Step 2  - Explains the board and sand tiles
  //   Step 3  - Explains rocks and how to trap lobsters
  //   Step 4  - Final tips, then "Play" button
  // ----------------------------------------------------------

  renderGame1TutorialFlow() {
    this.game1TutorialStep = 0;
    this.renderGame1Tutorial_Step1();
  }

  // When moving from Step 1b to Step 2, we need to stop the lobster animation first -
  // this bug actually stopped the gameboard from apeparing in the next step because the lobster animation hadn't finsiehd
// hence the need for this cleanup fucntion
  cleanupAndNavigateToStep2() {
    if (this.game1TutorialBoard) {
      this.game1TutorialBoard.stopTutorialAnimation();
    }
    this.game1TutorialStep = 1;
    this.renderGame1Tutorial_Step2();
  }

  // Step 1: Welcome message with a Gaelic phrase about springtime
  renderGame1Tutorial_Step1() {
    this.game1TutorialStep = 0;
    const banner = this.buildBannerHTML({ showTitle: true, title: 'Glac an Giomach' });
    const html = `
      <div class="game1-screen game1-tutorial-step1">
        ${banner}
        <div class="intro-screen-wrapper">
          <div class="ruairidh-intro-screen">
            ${this.buildSpeechBubbleHTML('Fàilte dhan tràigh, a charaid!<br><br>Bidh iad ag ràdh…<span class="phrase-underline">San Earrach, nuair a bhios a chaora caol, bidh am maorach reamhar.</span> <button class="phrase-help-btn" onclick="gameController.showPhraseExplanation(\'earrach\')">?</button>')}
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('PREGAME_TUTORIAL')">← Air ais</button>
              <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.renderGame1Tutorial_Step1b();">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>`;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.ruairidhVoice.play('GAME1_TUT_STEP1', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // Step 1b: Shows the lobster moving around - just on the sand
  renderGame1Tutorial_Step1b() {
    this.game1TutorialStep = 0;
    const banner = this.buildBannerHTML({ showTitle: true, title: 'Glac an Giomach' });
    const html = `
      <div class="game1-screen game1-tutorial-step1">
        ${banner}
        <div class="game1-tutorial-content-wrapper">
          <div class="game1-tutorial-text-section">
            <div class="ruairidh-intro-screen game1-tutorial-box">
              ${this.buildSpeechBubbleHTML("'S fìor thoil leam giomaich, ach tha iad cho duilich an glacadh!<br><br>Le sin, tha mi ag iarraidh do chuideachadh.", 150)}
              <div class="arrow-buttons">
                <button class="arrow-btn" onclick="gameController.renderGame1Tutorial_Step1();">← Air ais</button>
                <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.cleanupAndNavigateToStep2();">Air adhart →</button>
              </div>
            </div>
          </div>
          <div class="game1-tutorial-board-section">
            <div id="game1-board-tutorial"></div>
          </div>
        </div>
      </div>`;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // Set up the demo board and start the lobster moving slowly
    this.initGame1TutorialBoard();
    this.game1TutorialBoard.renderTutorialOnlyLobster('game1-board-tutorial');
    this.game1TutorialBoard.startSlowLobsterAnimation(1000); // moves every 1 second

    this.ruairidhVoice.play('GAME1_TUT_STEP1B', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // Step 2: Explains what the board looks like (lobster + sand tiles)
  renderGame1Tutorial_Step2() {
    this.game1TutorialStep = 1;
    const banner = this.buildBannerHTML({ showTitle: true, title: 'Glac an Giomach' });
    const html = `
      <div class="game1-screen game1-tutorial-step2">
        ${banner}
        <div class="game1-tutorial-content-wrapper game1-tutorial-step2">
          <div class="game1-tutorial-text-section">
            <div class="ruairidh-intro-screen game1-tutorial-box">
              ${this.buildSpeechBubbleHTML("Ri mo thaobh chì thu giomach agus blocaichean gainmhich buidhe. Seo far a bheil sinn a' dol a dh' fheuchainn giomaich a ghlacadh!", 150)}
              <div class="arrow-buttons">
                <button class="arrow-btn" onclick="gameController.game1TutorialStep = 0; gameController.renderGame1Tutorial_Step1();">← Air ais</button>
                <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.game1TutorialStep = 2; gameController.renderGame1Tutorial_Step3();">Air adhart →</button>
              </div>
            </div>
          </div>
          <div class="game1-tutorial-board-section-right">
            <div id="game1-board-tutorial"></div>
          </div>
        </div>
      </div>`;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.initGame1TutorialBoard();
    this.game1TutorialBoard.renderTutorial('game1-board-tutorial');

    this.ruairidhVoice.play('GAME1_TUT_STEP2', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // Step 3: Explains how placing rocks traps lobsters
  renderGame1Tutorial_Step3() {
    this.game1TutorialStep = 2;
    const banner = this.buildBannerHTML({ showTitle: true, title: 'Glac an Giomach' });
    const html = `
      <div class="game1-screen game1-tutorial-step3">
        ${banner}
        <div class="game1-tutorial-content-wrapper game1-tutorial-step3">
          <div class="game1-tutorial-text-section">
            <div class="ruairidh-intro-screen game1-tutorial-box">
              ${this.buildSpeechBubbleHTML("Nuair a bhrùthas tu air an gainmheach bhuidhe, 's urrainn dhut clach a chur sìos. Chan urrainn do na giomaich a dhol thairis air na clachan!<br><br>Airson a h-uile giomach a gheibh thu, thèid clach a chur air an càrn agad.", 150)}
              <div class="arrow-buttons">
                <button class="arrow-btn" onclick="gameController.game1TutorialStep = 1; gameController.renderGame1Tutorial_Step2();">← Air ais</button>
                <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.game1TutorialStep = 3; gameController.renderGame1Tutorial_Step4();">Air adhart →</button>
              </div>
            </div>
          </div>
          <div class="game1-tutorial-board-section-right">
            <div id="game1-board-tutorial"></div>
          </div>
        </div>
      </div>`;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.initGame1TutorialBoard({ withRocks: true }); // show rocks on this step
    this.game1TutorialBoard.renderTutorial('game1-board-tutorial');

    this.ruairidhVoice.play('GAME1_TUT_STEP3', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // Step 4: Final tips and the "Play" button to start the actual game
  renderGame1Tutorial_Step4() {
    this.game1TutorialStep = 3;
    const banner = this.buildBannerHTML({ showTitle: true, title: 'Glac an Giomach' });
    const html = `
      <div class="game1-screen game1-tutorial-step4">
        ${banner}
        <div class="game1-tutorial-content-wrapper game1-tutorial-step4">
          <div class="game1-tutorial-text-section">
            <div class="ruairidh-intro-screen game1-tutorial-box">
              ${this.buildSpeechBubbleHTML("Cuimhnich, tha na giomaich ann an Leòdhas gu math seòlta!<br><br>Chan eil ach ceithir mionaidean againn! Steall ort!", 150)}
              <div class="arrow-buttons">
                <button class="arrow-btn" onclick="gameController.game1TutorialStep = 2; gameController.renderGame1Tutorial_Step3();">← Air ais</button>
                <button id="forward-btn" class="play-green-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.setGameFlowState('GAME1');">Cluich an Geama</button>
              </div>
            </div>
          </div>
          <div class="game1-tutorial-board-section-right">
            <div id="game1-board-tutorial"></div>
          </div>
        </div>
      </div>`;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.initGame1TutorialBoard({ withRocks: true });
    this.game1TutorialBoard.renderTutorial('game1-board-tutorial');

    this.ruairidhVoice.play('GAME1_TUT_STEP4', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }




  // ----------------------------------------------------------
  // 4 - GAME 1 - GLAC AN GIOMACH (the actual lobster catching game)
  // ----------------------------------------------------------
  renderGame1_Main() {
    const banner = this.buildBannerHTML({
      showTitle: true, title: 'Glac an Giomach',
      showTimer: true, timerDisplay: '4:00',
      pauseDisabled: false, pauseHandler: 'gameController.togglePause()',
      helpDisabled: false, cairnId: 'cairn-points'
    });

    const html = `
      <div class="game1-screen">
        ${banner}
        <div class="game1-board" id="game1-board"></div>
        <div class="game1-footer">
          <div id="round-status"></div>
          <button class="nav-btn" onclick="gameController.resetGame1Round()">Tòisich a-rithist</button>
          <button class="nav-btn dev-skip-btn" onclick="gameController.setGameFlowState('GAME2_READY')" style="background: #ff6b6b; margin-left: 10px;">DEV: Skip to Game 2 →</button>
        </div>
      </div>
      <div class="pause-modal" id="pause-modal">
        <div class="pause-modal-content">
          <h2>Geama air stad</h2>
          <button class="pause-resume-btn" onclick="gameController.togglePause()">Tòisich</button>
        </div>
      </div>`;

    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // Create the game board and start the 4-minute countdown
    this.game1Board = new Game1Board(5, this);
    this.game1Board.render();
    this.updatePointsDisplayOnly();
    this.startGame1Timer();
  }


  // ===== GAME 1 TIMER SYSTEM =====
  // Starts a 4-minute countdown timer for the cairn building game
  // Originally was 5 minutes but that felt too long, so we reduced it
  // Timer shows warnings at 60s, 30s, and 10s to create urgency
  startGame1Timer() {
    this.timeRemaining = GAME_SETTINGS.TIMING.game1Duration;  // 4 minutes (240 seconds)
    this.updateGame1TimerDisplay();

    // Analytics call
    // This would mark the player as having started a game,
    // useful for knowing if they're a returning player
    // if (this.helpSystem) {
    //   this.helpSystem.markAsPlayed();
    // }

    // Clear any existing timer first (safety check)
    if (this.gameTimer) clearInterval(this.gameTimer);

    // Start the countdown - ticks every second
    this.gameTimer = setInterval(() => {
      this.timeRemaining--;
      this.updateGame1TimerDisplay();  // Update the visual display

      // Check if time's up
      if (this.timeRemaining <= 0) {
        clearInterval(this.gameTimer);  // Stop the timer
        // Brief pause before transitioning to next screen
        setTimeout(() => {
          this.setGameFlowState('GAME2_READY');
        }, 500);
      }
    }, 1000);  // Run every 1000ms (1 second)
  }

  // Updates the timer display and adds visual warnings when time is running out
  // Colour-coded warnings help players manage their time effectivly
  updateGame1TimerDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
      // Format as MM:SS (e.g., "4:00")
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Clear any old warning styles before we check again
      display.classList.remove('warning-yellow', 'warning-orange', 'warning-red', 'warning');

      // Traffic light system for time warnings:
      // - Yellow: under 1 minute left
      // - Orange: under 30 second
      // - Red: final 10 seconds, like a panic mode
      if (this.timeRemaining <= 10) {
        display.classList.add('warning-red');  //
      } else if (this.timeRemaining <= 30) {
        display.classList.add('warning-orange');
      } else if (this.timeRemaining <= 60) {
        display.classList.add('warning-yellow');
      }
      // if more than 60 seconds left, no warning class needed
    }
  }

  // Opens the smart help system for Game 1
  toggleInGameHelpModal() {
    if (!this.helpSystem) {
      this.helpSystem = new SmartHelpSystem(this);
    }

    const isOpening = !this.helpSystem.isOpen;

    // CRITICAL: Update status and log help request when OPENING
    if (this.dataLogger && isOpening) {
      this.dataLogger.logHelpCuideachadh('GAME1');
      this.dataLogger.updateStatus('help');
    } else if (this.dataLogger && !isOpening) {
      // CRITICAL: Restore status to playing when CLOSING
      this.dataLogger.updateStatus('playing');
    }

    this.helpSystem.toggle();
  }

  // Resets Game 1 board if player wants to start fresh
  resetGame1Round() {
    if (this.game1Board) {
      this.game1Board.reset();
      this.game1Board.render();
    }
  }

  // ----------------------------------------------------------
  // 5 - INTERVAL 1 (transition between games)
  // ----------------------------------------------------------
  // This is a quick breather screen between Game 1 and Game 2.
  // Ruairidh thanks the player for helping catch lobsters and
  // asks if they're ready for the next challenge. Gives the suers
  // a moment to relax before jumping into the memory game.
  renderInterval_TransitionToGame2() {
    const html = `
      <div class="game2-ready-screen">
        <div class="intro-screen-wrapper">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Tapadh leibh airson mo chuideachadh! A bheil sibh deiseil airson an ath gheama?</p>
              </div>
            </div>
            <div class="arrow-buttons centred">
              <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.setGameFlowState('GAME2_TUTORIAL')">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.ruairidhVoice.play('GAME2_READY', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // ----------------------------------------------------------
  // 6 - GAME 2 TUTORIAL
  // ----------------------------------------------------------
  // Game 2 is "Cho Coltach ris an Dà Sgadan" which translates to
  // "As alike as two herrings", the  Scottish Gaelic saying
  // similar to "like two peas in a pod". Chosen as the name for a memory matching game
  //
  // The tutorial has 2 steps:
  //   Step 1: Ruairidh explains the basic concept
  //   Step 2: Shows example cards with Harris Tweed patterns

  // STEP 1: Introduction to the matching game concept
  renderGame2TutorialScreen() {
    this.game2TutorialStep = 0;
    const banner = this.buildBannerHTML({ showTitle: true, title: 'Cho Coltrach ris an Dà Sgadan' });

    const html = `
      <div class="game2-tutorial-screen">
        ${banner}
        <div class="intro-screen-wrapper">
          <div class="ruairidh-intro-screen">
            ${this.buildSpeechBubbleHTML("Anns an geama seo, feumaidh tu mo chuideachadh paidhrichean a dhèanamh de rudan as urrainn dhuinn a lorg air an tràigh no aig muir.")}
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('GAME2_READY')">← Air ais</button>
              <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.renderGame2TutorialScreen_Step2()">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>`;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.ruairidhVoice.play('GAME2_TUT_STEP1', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // STEP 2: Show example cards so players know what to expect
  renderGame2TutorialScreen_Step2() {
    this.game2TutorialStep = 1;

    const availableTweeds = [2, 5, 6];
    const tweed1 = availableTweeds[Math.floor(Math.random() * availableTweeds.length)];
    const tweed2 = availableTweeds[Math.floor(Math.random() * availableTweeds.length)];

    const banner = this.buildBannerHTML({ showTitle: true, title: 'Cho Coltrach ris an Dà Sgadan' });

    const html = `
      <div class="game2-tutorial-screen">
        ${banner}
        <div class="game2-tutorial-content-wrapper">
          <div class="game2-tutorial-text-section">
            <div class="ruairidh-intro-screen" style="max-width: 600px;">
              ${this.buildSpeechBubbleHTML("Bidh pìosan clò Hearaich air a' bhòrd ri mo thaobh. Brùth orra gus faicinn dè tha air an cùlaibh agus feumaidh sibh paidhrichean a dhèanamh asta.", 120)}
              <div class="arrow-buttons">
                <button class="arrow-btn" onclick="gameController.setGameFlowState('GAME2_TUTORIAL')">← Air ais</button>
                <button id="forward-btn" class="play-green-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.setGameFlowState('GAME2')">Air adhart</button>
              </div>
            </div>
          </div>
          <div class="game2-tutorial-cards-section">
            <div class="tutorial-card-grid">
              <div class="tutorial-card"><div class="tutorial-card-inner"><div class="tutorial-card-face"><img src="./svgs/game-2/tweeds/tweed-${tweed1}.svg" alt="Card back" /></div></div></div>
              <div class="tutorial-card"><div class="tutorial-card-inner"><div class="tutorial-card-face"><img src="./svgs/game-2/tweeds/tweed-${tweed2}.svg" alt="Card back" /></div></div></div>
            </div>
          </div>
        </div>
      </div>`;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.ruairidhVoice.play('GAME2_TUT_STEP2', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // ----------------------------------------------------------
  // 7 - GAME 2 - CARD MATCHING GAME
  // ----------------------------------------------------------
  // The main memory matching game screen. Players will lcikc to flip cards to
  // find matching pairs. This is a classic memory game but with a Hebridean
  // theme. I have chosen not ot hve a time presure as it could negatively impact the
  // memory element for some users, making it feel stressful rather than fun.
  renderGame2_Main() {
    // Note: pause button is disabled because there's no timer in this game
    // CRITICAL: Set red X overlay display based on ACTUAL current audio state
    const isAudioEnabled = this.audio.isEnabled();
    const muteOverlayDisplay = isAudioEnabled ? 'none' : 'block';

    const html = `
      <div class="game2-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()"><img src="./svgs/all-games/speaker-icon.svg" alt="Speaker" class="sound-icon" /><img src="./svgs/all-games/red-x.svg" alt="Muted" class="sound-mute-overlay" id="sound-mute-overlay" style="display: ${muteOverlayDisplay};" /></button>
            <button class="ruairidh-pause-button" disabled>${SVG_ICONS.pause}</button>
            <button class="ruairidh-help-button" onclick="gameController.toggleGame2HelpModal()">?</button>
          </div>
          <div class="banner-title-container">
            <h1 class="game1-title-fun">Cho Coltrach ris an Dà Sgadan</h1>
          </div>
          <div class="ruairidh-banner-right">
            <div class="points-box">
              <img src="./svgs/all-games/cairn.svg" alt="Càrn" class="cairn-icon" id="cairn-points" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter">${this.totalPoints}</span>
            </div>
          </div>
        </div>
        <div class="game2-content-wrapper">
          <div class="game2-board" id="game2-board"></div>
          <div class="game2-footer" style="text-align: center; margin-top: 10px;">
            <button class="nav-btn dev-skip-btn" onclick="gameController.setGameFlowState('GAME3_READY')" style="background: #ff6b6b;">DEV: Skip to Game 3 →</button>
          </div>
        </div>
      </div>

      <!-- Help modal with step-by-step instructions in Gaelic -->
      <!-- "Ciamar a chluicheas tu?" = "How do you play?" -->
      <div class="help-modal" id="game2-help-modal">
        <div class="help-modal-content simple-help">
          <button class="modal-close" onclick="gameController.toggleGame2HelpModal()">✕</button>

          <h2 class="simple-help-title">Ciamar a chluicheas tu?</h2>

          <div class="simple-help-body">
            <div class="help-tip">
              <span class="help-tip-number">1</span>
              <div class="help-tip-content">
                <!-- "Goal: Find all matching pairs of cards" -->
                <strong>Amas:</strong> <p>Lorg gach paidhir chairtean a tha co-ionann.</p>
              </div>
            </div>

            <div class="help-tip">
              <span class="help-tip-number">2</span>
              <div class="help-tip-content">
                <!-- "How to do it: Press a card to flip it" -->
                <strong>Mar a nì thu e:</strong> <p>Brùth air cairt gus a tionndadh.</p>
              </div>
            </div>

            <div class="help-tip">
              <span class="help-tip-number">3</span>
              <div class="help-tip-content">
                <!-- "Flip two cards at the same time" -->
                <p>Tionndaidh dà chairt aig an aon àm.</p>
              </div>
            </div>

            <div class="help-tip">
              <span class="help-tip-number">4</span>
              <div class="help-tip-content">
                <!-- "If they match, you get a point!" -->
                <p>Ma tha iad co-ionann, gheibh thu puing!</p>
              </div>
            </div>

            <div class="help-tip">
              <span class="help-tip-number">5</span>
              <div class="help-tip-content">
                <!-- "If they're different, they flip back over" -->
                <p>Ma tha iad diofraichte, tionndaidhidh iad air ais.</p>
              </div>
            </div>

            <div class="help-tip">
              <span class="help-tip-number">6</span>
              <div class="help-tip-content">
                <!-- "If you find all pairs, you've won the game!" -->
                <p>Ma lorgas tu gach paidhir, tha thu air a' gheama a bhuannachadh!</p>
              </div>
            </div>
          </div>

          <button class="arrow-btn" onclick="gameController.toggleGame2HelpModal()">Dùin</button>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // Create the card game board &  render it
    this.game2Board = new CardMatchingGame(this);
    this.game2Board.render();
  }

  // Opens/closes the help box for Game 2
  // Also pauses/resumes the game so players can read without pressure
  toggleGame2HelpModal() {
    const modal = document.getElementById('game2-help-modal');
    if (modal) {
      const isOpening = !modal.classList.contains('active');
      modal.classList.toggle('active');

      if (isOpening) {
        // CRITICAL: Log help request and update status to 'help'
        if (this.dataLogger) {
          this.dataLogger.logHelpCuideachadh('GAME2');
          this.dataLogger.updateStatus('help');
        }

        // Freeze the game while reading help
        if (this.game2Board) {
          this.game2Board.isPaused = true;
        }
        this.audio.pauseGameSounds(this.currentState);
      } else {
        // CRITICAL: Restore status to 'playing' when closing
        if (this.dataLogger) {
          this.dataLogger.updateStatus('playing');
        }

        if (this.game2Board) {
          this.game2Board.isPaused = false;
        }
        this.audio.resumeGameSounds(this.currentState);
      }
    }
  }

  // ----------------------------------------------------------
  // POINTS & SCORING SYSTEM
  // ----------------------------------------------------------
  // These functions handle the scoring across all games.
  // The cairn (stone pile) is used as the visual points counter,
  // and stones fly to it when players earn points.

  // Just updates the points number on screen - no common animation as:
  // game 1 - merges from centre of board
  // game 2 - comes from midle of card macth
  // game 3, decided it was overstimulating to keep having stones animated along with moving fish
  updatePointsDisplayOnly() {
    const counter = document.getElementById('points-counter');
    if (counter) {
      counter.textContent = `${this.totalPoints}`;
    }
  }

  // -------------------------------------------------------
  // STONE ANIMATION -  visual reward for scoring
  // -------------------------------------------------------
  // When a player earns a point, a stone flies from wherever they
  // scored (like a caught lobster or matched card) up to the cairn
  // in the banner. The cairn pulses and the counter bumps up.
  // This gives a satisfying visual feedback

  animateStoneToCairn(startX, startY, onComplete) {
    // Saved a stone image element to animate
    const stone = document.createElement('img');
    stone.src = './svgs/all-games/stone.svg';
    stone.classList.add('stone-fly');

    // Position it at the starting point (where the point was earned)
    stone.style.position = 'fixed';
    stone.style.width = '50px';
    stone.style.height = '50px';
    stone.style.left = `${startX}px`;
    stone.style.top = `${startY}px`;
    stone.style.zIndex = '9999';  // Make sure it's on top of everything
    stone.style.pointerEvents = 'none';  // Don't block clicks
    document.body.appendChild(stone);

    // Find the cairn icon to fly towards
    const cairn = document.getElementById('cairn-points');
    if (!cairn) {
      // Fallback if cairn not found - just add the point without animation (when resized window had this issue)
      stone.remove();
      this.addPointToCairn();
      if (onComplete) onComplete();
      return;
    }

    // Calculate how far the stone needs to travel
    const cairnRect = cairn.getBoundingClientRect();
    stone.style.setProperty('--fly-x', `${cairnRect.left - startX}px`);
    stone.style.setProperty('--fly-y', `${cairnRect.top - startY}px`);
    stone.classList.add('stone-fly-animate');  // CSS animation takes over

    // When the flying animation finishes:
    stone.addEventListener('animationend', () => {
      stone.remove();  // Clean up the flying stone

      // Make the cairn pulse to show it "received" the stone
      cairn.classList.add('pulsing');
      setTimeout(() => cairn.classList.remove('pulsing'), GAME_SETTINGS.TIMING.cairnPulsingDuration);

      this.addPointToCairn();  //  add the point to the total and update the display

      // Make the counter do a little bounce
      const counter = document.getElementById('points-counter');
      if (counter) {
        counter.classList.add('points-reward');
        setTimeout(() => counter.classList.remove('points-reward'), GAME_SETTINGS.TIMING.rewardAnimationDuration);
      }

      if (onComplete) onComplete();  // Let caller know we're done
    });
  }

  // This increments the score and plays the sound
  addPointToCairn() {
    this.totalPoints++;
    this.updatePointsDisplayOnly();
    this.audio.playPointSound();  // Gives user feedback that theyve recieced thhat point

    // Firebase Data Logging: Track points increment (batched every 10 seconds)
    if (this.dataLogger) {
      this.dataLogger.logPointsIncrement(1);
    }
  }

  // ----------------------------------------------------------
  // 8 - INTERVAL 2 (transition to Game 3)
  // ----------------------------------------------------------
  // Another breather/transiion screen, this time between Game 2 and Game 3.
  // Ruairidh introduces the final game: "Cho luath ris a' bhradan"
  // which means "As fast as the salmon" - a fishing game where
  // players need quick reflexes to catch the right fish

  renderInterval_TransitionToGame3() {
    this.game3TutorialStep = 0;  // Reset tutorial step counter

    // Note: pause and help buttons are disabled on this screen
    // since it's just an intro, not actual gameplay
    // CRITICAL: Set red X overlay display based on ACTUAL current audio state
    const isAudioEnabled = this.audio.isEnabled();
    const muteOverlayDisplay = isAudioEnabled ? 'none' : 'block';

    const html = `
      <div class="game3-ready-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()"><img src="./svgs/all-games/speaker-icon.svg" alt="Speaker" class="sound-icon" /><img src="./svgs/all-games/red-x.svg" alt="Muted" class="sound-mute-overlay" id="sound-mute-overlay" style="display: ${muteOverlayDisplay};" /></button>
            <button class="ruairidh-pause-button" disabled>${SVG_ICONS.pause}</button>
            <button class="ruairidh-help-button" disabled>?</button>
          </div>
          <div class="banner-title-container">
            <!-- "As fast as the salmon" -->
            <div class="game3-title">Cho luath ris a' bhradan</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="points-box">
              <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter">${this.totalPoints}</span>
            </div>
          </div>
        </div>
        <div class="intro-screen-wrapper">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <!-- "The next game is: 'As fast as the salmon!' Come and I'll tell you more!" -->
                <p>'S e an ath gheama: "Cho luath ris a' bhradan!" Trobhad gus an innis mi barrachd dhuibh!</p>
              </div>
            </div>
            <div class="arrow-buttons centred">
              <button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.setGameFlowState('GAME3_TUTORIAL')">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    this.ruairidhVoice.play('GAME3_READY', () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // ----------------------------------------------------------
  // 8b - GAME 3 TUTORIAL (multi-step instructions)
  // ----------------------------------------------------------
  // This tutorial teaches players how the fishing game works.
  // Again, It's split into 3 steps so we don't overwhelm users with info:
  //   Step 0: Shows where Ruairidh appears and that he'll show the target fish (already getting them used to loooking up)
  //   Step 1: Explains that catching the right fish earns points
  //   Step 2: Bonus tip - you can also collect rubbish for extra points (adding that extra ethical dimension about keeping the beaches clean)
  renderGame3_Tutorial() {
    const isLastStep = this.game3TutorialStep >= 2;

    // Each step has:
    // - bubbleContent: what appears in Ruairidh's speech bubble (particular fish image)
    // - the arrow pointing upat the bubble to draw attention (only on step 0 to show where to look)
    // - message i.e the instruction text explaining this step
    const tutorialSteps = [
      // STEP 0: "Look here! I'll be up here at the top. I'll show you what fish I want!"
      {
        bubbleContent: `<img src="./svgs/game-3/game-3-fish/sgadan-L.svg" alt="Sgadan" class="target-fish-image" />`,
        pointer: `↑ Coimhead an seo! ↑`,  // "Look here!"
        message: `Bidh mise an seo aig a' mhullach. Seallaidh mi dhuibh dè an t-iasg a tha mi ag iarraidh!`
      },
      // STEP 1: "If you catch the right fish that I want, you'll get points!"
      {
        bubbleContent: `<img src="./svgs/game-3/game-3-fish/sgadan-L.svg" alt="Sgadan" class="target-fish-image" />`,
        pointer: null,
        message: `Ma gheibh sibh an t-iasg ceart a tha mise ag iarraidh, gheibh sibh puingean!`
      },
      // STEP 2: "Keep an eye out for rubbish! If you tap on rubbish you'll get points too!"
      // This adds an environmental awareness element to the game
      {
        bubbleContent: `<img src="./svgs/game-3/game-3-garbage/plastic-bottle-1.svg" alt="Sgudal" class="target-fish-image" />`,
        pointer: null,
        message: `Cùm do shùil a-mach airson sgudal! Ma bhrùthas tu air sgudal, gheibh sibh puingean cuideachd!`
      }
    ];

    const step = tutorialSteps[this.game3TutorialStep];

    // CRITICAL: Set red X overlay display based on ACTUAL current audio state
    const isAudioEnabled = this.audio.isEnabled();
    const muteOverlayDisplay = isAudioEnabled ? 'none' : 'block';

    const html = `
      <div class="game3-screen game3-tutorial-preview">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()"><img src="./svgs/all-games/speaker-icon.svg" alt="Speaker" class="sound-icon" /><img src="./svgs/all-games/red-x.svg" alt="Muted" class="sound-mute-overlay" id="sound-mute-overlay" style="display: ${muteOverlayDisplay};" /></button>
            <button class="ruairidh-pause-button" disabled>${SVG_ICONS.pause}</button>
            <button class="ruairidh-help-button" disabled>?</button>
          </div>
          <div class="banner-title-container">
            <div class="game3-title">Cho luath ris a' bhradan</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="points-box">
              <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter">${this.totalPoints}</span>
            </div>
          </div>
        </div>

        <!-- On step 0, Ruairidh's section gets a highlight glow to draw the usrs eye in -->
        <div class="game3-ruairidh-section${this.game3TutorialStep === 0 ? ' tutorial-highlight' : ''}">
          <div class="ruairidh-container">
            <div class="seal-icon-wrapper">
              <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh" class="seal-icon" />
            </div>
            <div class="speech-bubble">
              ${step.bubbleContent}
            </div>
          </div>
          ${step.pointer ? `<div class="tutorial-pointer">${step.pointer}</div>` : ''}
        </div>

        <div class="game3-tutorial-explanation">
          <div class="tutorial-message-box">
            <p>${step.message}</p>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.game3TutorialBack()">← Air ais</button>
              ${isLastStep
                ? `<button id="forward-btn" class="play-green-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.setGameFlowState('GAME3')">Cluich an Geama</button>`
                : `<button id="forward-btn" class="arrow-btn" disabled style="opacity: 0.5; cursor: not-allowed;" onclick="gameController.game3TutorialNext()">Air adhart →</button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // Play audio based on game3 tutorial step
    const audioKeys = ['GAME3_TUT_STEP0', 'GAME3_TUT_STEP1', 'GAME3_TUT_STEP2'];
    const audioKey = audioKeys[this.game3TutorialStep];

    this.ruairidhVoice.play(audioKey, () => {
      const btn = document.getElementById('forward-btn');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#4CAF50';
      }
    });
  }

  // Go back a step, or exit to the intro if already at step 0
  game3TutorialBack() {
    if (this.game3TutorialStep > 0) {
      this.game3TutorialStep--;
      this.renderGame3_Tutorial();
    } else {
      this.setGameFlowState('GAME3_READY');
    }
  }

  // Move to the next tutorial step
  game3TutorialNext() {
    this.game3TutorialStep++;
    this.renderGame3_Tutorial();
  }

  // ----------------------------------------------------------
  // 9 - GAME 3 MAIN (Cho luath ris a' bhradan)
  // ----------------------------------------------------------
  // The fishing game, where players tap fish swimming across the screen
  // to catch what Ruairidh asks for and it has a 3-minute timer.


  renderGame3_Main() {
    // CRITICAL: Set red X overlay display based on ACTUAL current audio state
    const isAudioEnabled = this.audio.isEnabled();
    const muteOverlayDisplay = isAudioEnabled ? 'none' : 'block';

    const html = `
      <div class="game3-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()"><img src="./svgs/all-games/speaker-icon.svg" alt="Speaker" class="sound-icon" /><img src="./svgs/all-games/red-x.svg" alt="Muted" class="sound-mute-overlay" id="sound-mute-overlay" style="display: ${muteOverlayDisplay};" /></button>
            <button class="ruairidh-pause-button" id="pause-button" onclick="gameController.toggleGame3Pause()">${SVG_ICONS.pause}</button>
            <button class="ruairidh-help-button" onclick="gameController.toggleGame3HelpModal()">?</button>
          </div>
          <div class="banner-title-container">
            <div class="game3-title">Cho luath ris a' bhradan</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="timer-box">
              <img src="./svgs/all-games/clock.svg" alt="Uaireadair" class="timer-icon" />
              <div class="timer-text">ÙINE:</div>
              <span id="timer-display" class="timer-display">3:00</span>
            </div>
            <div class="points-box">
              <img src="./svgs/all-games/cairn.svg" alt="Càrn" class="cairn-icon" id="cairn-points" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter">${this.totalPoints}</span>
            </div>
          </div>
        </div>
        <div class="game3-ruairidh-section">
          <div class="ruairidh-container">
            <div class="seal-icon-wrapper">
              <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh" class="seal-icon" />
            </div>
            <div class="speech-bubble">
              <!-- This is where Ruairidh shows what fish he wants -->
              <div id="target-fish-display" class="target-fish-display"></div>
            </div>
          </div>
        </div>
        <!-- The Game3FishingGame class renders the swimming fish here -->
        <div class="game3-canvas-container" id="game3-canvas"></div>
        <div class="game3-footer" style="text-align: center; margin-top: 10px; position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); z-index: 100;">
          <button class="nav-btn dev-skip-btn" onclick="gameController.skipToResults()" style="background: #ff6b6b;">DEV: Skip to Results →</button>
        </div>
      </div>

      <!-- Pause modal: "Game paused" / "Start" -->
      <div class="pause-modal" id="pause-modal">
        <div class="pause-modal-content">
          <h2>Geama air stad</h2>
          <button class="pause-resume-btn" onclick="gameController.toggleGame3Pause()">Tòisich</button>
        </div>
      </div>

      <!-- Help modal: "How do you play?" -->
      <div class="help-modal" id="game3-help-modal">
        <div class="help-modal-content simple-help">
          <button class="modal-close" onclick="gameController.toggleGame3HelpModal()">✕</button>

          <h2 class="simple-help-title">Ciamar a chluicheas tu?</h2>

          <div class="simple-help-body">
            <!-- 1: "Look at Ruairidh the Seal: Look at the fish picture Ruairidh shows you" -->
            <div class="help-tip">
              <span class="help-tip-number">1</span>
              <div class="help-tip-content">
                <strong>Coimhead air Ruairidh an Ròn:</strong> <p>Coimhead air an dealbh èisg a sheallas Ruairidh dhut.</p>
              </div>
            </div>

            <!-- 2: "Find the right fish: Tap on the fish in the sea that matches what Ruairidh wants" -->
            <div class="help-tip">
              <span class="help-tip-number">2</span>
              <div class="help-tip-content">
                <strong>Lorg an t-iasg ceart:</strong> <p>Brùth air an t-iasg sa mhuir a tha co-ionann ris an fhear a tha Ruairidh ag iarraidh.</p>
              </div>
            </div>

            <!-- 3: "If you get the right fish, you get points!" -->
            <div class="help-tip">
              <span class="help-tip-number">3</span>
              <div class="help-tip-content">
                <p>Ma tha an t-iasg ceart, gheibh thu puingean!</p>
              </div>
            </div>

            <!-- 4: "If you get the wrong fish, you lose points" -->
            <div class="help-tip">
              <span class="help-tip-number">4</span>
              <div class="help-tip-content">
                <p>Ma tha an t-iasg ceàrr, caillidh sibh puingean.</p>
              </div>
            </div>

            <!-- 5: "You can also pick up rubbish (plastic, bottles) for extra points" -->
            <div class="help-tip">
              <span class="help-tip-number">5</span>
              <div class="help-tip-content">
                <p>Faodaidh tu sgudal a thogail cuideachd (stuthan plastaig, botail) airson barrachd phuingean.</p>
              </div>
            </div>

            <!-- 6: "The fish Ruairidh wants changes all the time, so keep your eye on Ruairidh!" -->
            <div class="help-tip">
              <span class="help-tip-number">6</span>
              <div class="help-tip-content">
                <p>Tha an t-iasg a tha Ruairidh ag iarraidh ag atharrachadh fad na h-ùine, mar sin cùm sùil air Ruairidh!</p>
              </div>
            </div>
          </div>

          <button class="arrow-btn" onclick="gameController.toggleGame3HelpModal()">Dùin</button>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();

    // Create and start the fishing game
    this.game3Board = new Game3FishingGame(this);
    this.game3Board.init();
  }

  // Opens/closes the help module for Game 3
  // Pauses the fishing game while reading so fish don't swim away.
  toggleGame3HelpModal() {
    const modal = document.getElementById('game3-help-modal');
    if (modal) {
      const isOpening = !modal.classList.contains('active');
      modal.classList.toggle('active');

      if (isOpening) {
        // CRITICAL: Log help request and update status to 'help'
        if (this.dataLogger) {
          this.dataLogger.logHelpCuideachadh('GAME3');
          this.dataLogger.updateStatus('help');
        }

        // Freeze the game while reading help module
        if (this.game3Board) {
          this.game3Board.isPaused = true;
        }
        this.audio.pauseGameSounds(this.currentState);
      } else {
        // CRITICAL: Restore status to 'playing' when closing
        if (this.dataLogger) {
          this.dataLogger.updateStatus('playing');
        }

        // Back to gameplay
        if (this.game3Board) {
          this.game3Board.isPaused = false;
        }
        this.audio.resumeGameSounds(this.currentState);
      }
    }
  }

  skipToResults() {
    // Dev function to skip to results
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    this.setGameFlowState('RESULTS');
  }

  // ----------------------------------------------------------
  // Final results screen after all games
  // ----------------------------------------------------------
  async renderResultsScreen() {
    if (this.gameTimer) clearInterval(this.gameTimer);

    // Firebase Data Logging: Finalize session with complete data
    if (this.dataLogger) {
      await this.dataLogger.finalizeSession({
        totalPoints: this.totalPoints,
        completedGames: ['game1', 'game2', 'game3'],
        game1Score: this.game1Board ? this.game1Board.points : 0,
        game2Score: this.game2Board ? this.game2Board.points : 0,
        game3Score: this.game3Board ? this.game3Board.points : 0
      });
    }

    const html = `
      <div class="login-screen">
        <h1>Deiseil!</h1>
        <p>Cluicheadair: ${this.participantCode}</p>
        <p class="game-complete-score">Puingean: ${this.totalPoints}</p>
        <p class="game-complete-message">Ceud taing airson an geama seo a' chluich, tha na puingean agad air a' shàbhaladh.</p>
        <button class="play-button" style="background: #4caf50;" onclick="location.reload()">DEISEIL</button>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // CRITICAL: Sync red X overlay with current audio state after rendering new HTML
    this.updateSoundButtonIcon();
  }
}

// --------------------------------------------------------------------
// 8. INITIALISATION - Entry point for the whole game
// --------------------------------------------------------------------

// Global reference so onclick handlers in HTML can access it
let gameController;

// Start the game once the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing game...');
    gameController = new GameFlowController();
    console.log('GameFlowController created successfully');
    gameController.setGameFlowState('LOGIN');  // show the login screen first
    console.log('Login screen should now be visible');
  } catch (error) {
    console.error('CRITICAL ERROR during game initialization:', error);
    document.getElementById('game-container').innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: Arial;">
        <h1 style="color: red;">Mearachd / Error</h1>
        <p>Failed to initialize game: ${error.message}</p>
        <p style="font-size: 12px; color: #666;">${error.stack}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">Reload Page</button>
      </div>
    `;
  }
});

// Re-render the hex grid if the window is resized during Game 1
// The hexagons are positioned based on screen size, so they need
// to be recalculated if the player resizes their browser
window.addEventListener('resize', () => {
  if (gameController && gameController.game1Board && gameController.currentState === 'GAME1') {
    gameController.game1Board.render();
  }
});
