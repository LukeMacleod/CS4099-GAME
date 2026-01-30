// ==========================================================
// MAIN GAME CONTROLLER CLASS
// ==========================================================
// This handles the entire game flow from login all the way through to results
// State machine pattern: LOGIN → INTRO → TUTORIAL → GAME1 → GAME2 → GAME3 → RESULTS
// Each state renders a different screen and transitions to the next when appropriate
// ==========================================================

class GameFlowController {
  constructor() {
    // ===== GAME STATE TRACKING =====
    // Keeps track of where we are in the game flow
    this.currentState = 'LOGIN';

    // Main container element where all screens get rendered
    this.gameContainer = document.getElementById('game-container');

    // ===== PLAYER DATA =====
    // Store participant info and their accumulated points across all games
    this.participantCode = null;  // Their unique code from login screen
    this.gameData = {};           // Misc game data (probably should refactor this later)
    this.totalPoints = 0;         // Running total across all 3 games

    // ===== TUTORIAL PROGRESSION =====
    // Different tutorials have different step counters to track progress
    // This lets us show multi-step tutorials with next/back buttons
    this.tutorialStep = 0;        // General tutorial counter
    this.layoutTutorialStep = 0;  // For the UI layout intro (banner, help button, etc)
    this.game1TutorialStep = 0;   // Game 1 specific tutorial
    this.game2TutorialStep = 0;   // Game 2 specific tutorial

    // ===== GAME BOARD INSTANCES =====
    // We create these when starting each game, null when not active
    this.game1Board = null;  // The cairn building game
    this.game2Board = null;  // The matching game

    // ===== TIMER STUFF =====
    // Game 1 uses a 4 minute countdown timer
    this.gameTimer = null;       // setInterval reference so we can clear it
    this.timeRemaining = 240;    // 240 seconds = 4 mins

    // ===== UI STATE =====
    this.soundEnabled = true;   // Whether audio is on or off (toggled by sound button)
    this.gamePaused = false;    // Pause state for Game 1

    // ===== AUDIO SYSTEM =====
    // We use seperate audio tracks for different parts of the game
    // Note: Using HTML5 Audio elements instead of Web Audio API because of CORS issues
    // with file:// protocol. Web Audio would be better for seamless looping but oh well.

    // Background music that plays during menus and tutorial screens
    this.backgroundMusic = new Audio('./music/non-game.ogg');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3;

    // Game 1 tutorial has its own track, kept quiet so narration can be added later
    this.game1TutorialMusic = new Audio('./music/game-1-tutorial.ogg');
    this.game1TutorialMusic.loop = true;
    this.game1TutorialMusic.volume = 0.1;  // Really low volume
    this.game1TutorialMusic.preload = 'auto';  // Helps reduce gap at loop point

    // Each game has its own music track during gameplay
    this.game1Music = new Audio('./music/game-1-music.ogg');
    this.game1Music.loop = true;
    this.game1Music.volume = 0.25;

    this.game2Music = new Audio('./music/game-2-loop.ogg');
    this.game2Music.loop = true;
    this.game2Music.volume = 0.15;  // This one was too loud initially, reduced it

    this.game3Music = new Audio('./music/game-3.ogg');
    this.game3Music.loop = true;
    this.game3Music.volume = 0.15;

    // Ambient nature sounds for Game 1 (ocean theme)
    // Kept these REALLY quiet so they don't interfere with voice-over narration
    this.oceanWaves = new Audio('./music/ocean-waves.ogg');
    this.oceanWaves.loop = true;
    this.oceanWaves.volume = 0.05;  // Super subtle

    this.seagulls = new Audio('./music/seagulls_short.ogg');
    this.seagulls.loop = true;
    this.seagulls.volume = 0.08;   // Also very quiet

    // Sound effect for earning points (plays in Game 1 when adding stones to cairn)
    // Also plays for milestone bonuses in Game 3
    this.pointSound = new Audio('./music/point-sound.ogg');
    this.pointSound.volume = 0.4;  // Audible but not overpowering
  }

  // ===== SPOTLIGHT TUTORIAL HELPER =====
  // During the layout tutorial, we use a spotlight effect to highlight specific UI elements
  // This updates the CSS custom properties to move the spotlight circle around
  updateLayoutSpotlightPosition(elementId) {
    try {
      const element = document.getElementById(elementId);
      const overlay = document.getElementById('layout-overlay');
      if (element && overlay) {
        // Get the element's position on screen
        const rect = element.getBoundingClientRect();
        // Calculate centre point
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        // Update CSS variables that control the spotlight position
        overlay.style.setProperty('--spotlight-x', x + 'px');
        overlay.style.setProperty('--spotlight-y', y + 'px');
      }
    } catch (error) {
      // Shouldn't happen but just in case
      console.error('Error updating spotlight position:', error);
    }
  }

  // ===== LAYOUT TUTORIAL PROGRESSION =====
  // The layout tutorial walks through the UI elements step by step
  // Steps: 0=banner, 1=cairn, 2=help button, 2.5=pause button, 3=finished
  advanceLayoutTutorialStep() {
    if (this.layoutTutorialStep === 0) {
      // Move to cairn explanation
      this.layoutTutorialStep = 1;
      this.updateLayoutSpotlightPosition('cairn-spotlight');
      this.renderGameIntro_LayoutStep1();
    } else if (this.layoutTutorialStep === 1) {
      // Show the help button
      this.layoutTutorialStep = 2;
      this.updateLayoutSpotlightPosition('layout-help-btn');
      this.renderGameIntro_LayoutStep2();
    } else if (this.layoutTutorialStep === 2) {
      // Show the pause button (this is step 2.5, kinda wierd numbering but it works)
      this.layoutTutorialStep = 2.5;
      this.updateLayoutSpotlightPosition('layout-pause-btn');
      this.renderGameIntro_LayoutStep2_5();
    } else if (this.layoutTutorialStep === 2.5) {
      // Finish the layout tutorial
      this.layoutTutorialStep = 3;
      this.renderGameIntro_LayoutStep3();
    }
  }

  // ===== SOUND TOGGLE =====
  // Handles the speaker button in the top-right corner
  // Turns all audio on/off and updates button icon
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const button = document.getElementById('sound-button');

    if (button) {
      // Update button icon and accessibility label
      button.textContent = this.soundEnabled ? '🔊' : '🔇';
      button.setAttribute('aria-label', this.soundEnabled ? 'Cuir dheth fuaim' : 'Cuir air fuaim');
    }

    // Start or stop music depending on new state
    if (this.soundEnabled) {
      this.startCurrentMusic();  // Resumes whatever music should be playing for current screen
    } else {
      this.stopAllMusic();       // Kills everything
    }

    console.log(`Sound ${this.soundEnabled ? 'enabled' : 'disabled'}`);
  }

  // ===== MUSIC CONTROL FUNCTIONS =====
  // These functions start/stop different audio tracks
  // Each screen has its own audio context (or silence)

  // Background music for menu screens and tutorials (except Game 1 tutorial which has its own)
  startBackgroundMusic() {
    if (this.soundEnabled && this.backgroundMusic.paused) {
      this.backgroundMusic.play().catch(err => {
        console.log('Background music play failed:', err);
      });
    }
  }

  // Game 1 tutorial music (quieter than normal background music for narration)
  startGame1TutorialMusic() {
    if (this.soundEnabled && this.game1TutorialMusic.paused) {
      this.game1TutorialMusic.play().catch(err => {
        console.log('Game 1 tutorial music play failed:', err);
      });
    }
  }

  stopGame1TutorialMusic() {
    if (!this.game1TutorialMusic.paused) {
      this.game1TutorialMusic.pause();
      this.game1TutorialMusic.currentTime = 0;  // Rewind to start
    }
  }

  // Game 1 actual gameplay music
  startGame1Music() {
    if (this.soundEnabled && this.game1Music.paused) {
      this.game1Music.play().catch(err => {
        console.log('Game 1 music play failed:', err);
      });
    }
  }

  stopGame1Music() {
    if (!this.game1Music.paused) {
      this.game1Music.pause();
      this.game1Music.currentTime = 0;
    }
  }

  // Game 2 music (the matching game)
  startGame2Music() {
    if (this.soundEnabled && this.game2Music.paused) {
      this.game2Music.play().catch(err => {
        console.log('Game 2 music play failed:', err);
      });
    }
  }

  stopGame2Music() {
    if (!this.game2Music.paused) {
      this.game2Music.pause();
      this.game2Music.currentTime = 0;
    }
  }

  // Game 3 music (the fishing game)
  startGame3Music() {
    if (this.soundEnabled && this.game3Music.paused) {
      this.game3Music.play().catch(err => {
        console.log('Game 3 music play failed:', err);
      });
    }
  }

  stopGame3Music() {
    if (!this.game3Music.paused) {
      this.game3Music.pause();
      this.game3Music.currentTime = 0;
    }
  }

  // Kill switch - stops everything
  stopAllMusic() {
    if (!this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
    }
    this.stopGame1TutorialMusic();
    this.stopGame1Music();
    this.stopGame2Music();
    this.stopGame3Music();
    this.stopGame1Ambience();
  }

  // ===== AMBIENT SOUND CONTROLS =====
  // Game 1 has ocean waves and seagulls playing alongside the music
  // These are kept really quiet so they just add atmosphere

  startGame1Ambience() {
    if (this.soundEnabled) {
      if (this.oceanWaves.paused) {
        this.oceanWaves.play().catch(err => {
          console.log('Ocean waves play failed:', err);
        });
      }
      if (this.seagulls.paused) {
        this.seagulls.play().catch(err => {
          console.log('Seagulls play failed:', err);
        });
      }
    }
  }

  stopGame1Ambience() {
    if (!this.oceanWaves.paused) {
      this.oceanWaves.pause();
      this.oceanWaves.currentTime = 0;
    }
    if (!this.seagulls.paused) {
      this.seagulls.pause();
      this.seagulls.currentTime = 0;
    }
  }

  // ===== SOUND EFFECTS =====
  // Point sound plays when you earn points (cairn stones in Game 1, milestones in Game 3)
  playPointSound() {
    if (this.soundEnabled) {
      // Clone the audio node so we can play overlapping sounds
      // Otherwise rapid clicks would restart the same sound instead of stacking
      const sound = this.pointSound.cloneNode();
      sound.volume = this.pointSound.volume;
      sound.play().catch(err => {
        console.log('Point sound play failed:', err);
      });
    }
  }

  // ===== SMART MUSIC STARTER =====
  // Figures out what music should be playing based on current game state
  // Called when sound is re-enabled after being muted
  startCurrentMusic() {
    if (this.currentState === 'GAME1_TUTORIAL') {
      // Tutorial has its own quieter music plus ambient sounds
      this.startGame1TutorialMusic();
      this.startGame1Ambience();
    } else if (this.currentState === 'GAME1') {
      // Actual gameplay has different music plus ambience
      this.startGame1Music();
      this.startGame1Ambience();
    } else if (this.currentState === 'GAME2') {
      // Matching game music
      this.startGame2Music();
    } else if (this.currentState === 'GAME3') {
      // Fishing game music
      this.startGame3Music();
    } else if (['RUAIRIDH_INTRO', 'PREGAME_TUTORIAL', 'GAME2_READY', 'GAME2_TUTORIAL', 'GAME3_READY', 'RESULTS'].includes(this.currentState)) {
      // Menu/tutorial screens use the generic background music
      this.startBackgroundMusic();
    }
    // LOGIN screen has no music (silence)
  }

  // ===== SOUND BUTTON HTML GENERATOR =====
  // Returns the HTML for the sound toggle button with correct icon and label
  getSoundButtonHTML() {
    const icon = this.soundEnabled ? '🔊' : '🔇';
    const label = this.soundEnabled ? 'Cuir dheth fuaim' : 'Cuir air fuaim';
    return `<button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="${label}">${icon}</button>`;
  }

  // ===== PAUSE/PLAY CONTROLS =====

  // Game 1 pause functionality
  // Freezes the timer, stops lobster movement, shows pause modal
  togglePause() {
    this.gamePaused = !this.gamePaused;
    const button = document.getElementById('pause-button');
    const modal = document.getElementById('pause-modal');

    if (this.gamePaused) {
      // Entering pause state
      if (this.gameTimer) clearInterval(this.gameTimer);  // Stop the countdown
      if (this.game1Board) {
        // Bit of a hack - we use isAnimating=true to freeze the lobster
        // Not the most intuitive naming but it works
        this.game1Board.isAnimating = true;
      }
      // Change button to play icon
      if (button) {
        button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="#000000"/></svg>';
        button.setAttribute('aria-label', 'Cluich an geama');
      }
      // Show the pause overlay modal
      if (modal) {
        modal.classList.add('active');
      }
    } else {
      // Resuming from pause
      if (this.game1Board) {
        this.game1Board.isAnimating = false;  // Let lobster move again
      }

      // Restart the timer from wherever it was
      // Important: we DON'T reset timeRemaining here, just continue counting down
      if (this.gameTimer) clearInterval(this.gameTimer);  // Clear any existing timer first
      this.gameTimer = setInterval(() => {
        this.timeRemaining--;
        this.updateGame1TimerDisplay();

        // Check if time's up
        if (this.timeRemaining <= 0) {
          clearInterval(this.gameTimer);
          this.playTimerEndSoundEffect();
          // Small delay before transitioning to next screen
          setTimeout(() => {
            this.setGameFlowState('GAME2_READY');
          }, 500);
        }
      }, 1000);  // Tick every second

      // Change button back to pause icon
      if (button) {
        button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg>';
        button.setAttribute('aria-label', 'Cuir stad air a\' gheama');
      }
      // Hide pause modal
      if (modal) {
        modal.classList.remove('active');
      }
    }
    console.log(`Game ${this.gamePaused ? 'paused' : 'resumed'}`);
  }

  // Game 3 pause is simpler - no timer to worry about
  // Just freezes fish movement
  toggleGame3Pause() {
    if (!this.game3Board) return;  // Bail if game isn't running

    this.game3Board.isPaused = !this.game3Board.isPaused;
    const button = document.getElementById('pause-button');

    if (this.game3Board.isPaused) {
      // Update button to show play icon
      if (button) {
        button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="#000000"/></svg>';
        button.setAttribute('aria-label', 'Cluich an geama');
      }
      console.log('Game 3 paused');
    } else {
      // Resume - change back to pause icon
      if (button) {
        button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg>';
        button.setAttribute('aria-label', 'Cuir na stad');
      }
      console.log('Game 3 resumed');
    }
  }

  // ===== MAIN STATE MACHINE =====
  // This is the heart of the app - controls which screen is showing
  // Flow: LOGIN → RUAIRIDH_INTRO → PREGAME_TUTORIAL → GAME1_TUTORIAL →
  //       GAME1 → GAME2_READY → GAME2_TUTORIAL → GAME2 → GAME3_READY →
  //       GAME3 → RESULTS
  setGameFlowState(newState) {
    console.log(`Transitioning: ${this.currentState} → ${newState}`);
    this.currentState = newState;

    // Clear out whatever was on screen before
    this.gameContainer.innerHTML = '';

    // ===== AUDIO MANAGEMENT =====
    // Each state has different audio requirements
    // First, kill everything that's currently playing
    this.stopAllMusic();

    // Then start the appropriate tracks for this new state
    if (newState === 'GAME1_TUTORIAL') {
      // Tutorial has quiet music + ocean ambience
      this.startGame1TutorialMusic();
      this.startGame1Ambience();
    } else if (newState === 'GAME1') {
      // Actual gameplay has slightly louder music + ambience
      this.startGame1Music();
      this.startGame1Ambience();
    } else if (newState === 'GAME2') {
      // Matching game music
      this.startGame2Music();
    } else if (newState === 'GAME3') {
      // Fishing game music
      this.startGame3Music();
    } else if (['RUAIRIDH_INTRO', 'PREGAME_TUTORIAL', 'GAME2_READY', 'GAME2_TUTORIAL', 'GAME3_READY', 'RESULTS'].includes(newState)) {
      // Menu and tutorial screens use generic background music
      this.startBackgroundMusic();
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
        this.renderGameIntro_LayoutStep0();
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
      case 'GAME3':
        this.renderGame3_Main();
        break;
      case 'RESULTS':
        this.renderResultsScreen();
        break;
      default:
        console.error(`Unknown game state: ${newState}`);
    }

    // Update sound button icon to match current sound state
    this.updateSoundButtonIcon();
  }

  // Update sound button icon after state transitions
  updateSoundButtonIcon() {
    const button = document.getElementById('sound-button');
    if (button) {
      button.textContent = this.soundEnabled ? '🔊' : '🔇';
      button.setAttribute('aria-label', this.soundEnabled ? 'Cuir dheth fuaim' : 'Cuir air fuaim');
    }
  }

  // ----------------------------------------------------------
  // 1 - LOGIN
  // ----------------------------------------------------------
  renderLoginScreen() {
    const html = `
      <div class="login-screen" role="main" aria-label="Sgrìn logadh a-steach">
        <h1>Fàilte!</h1>
        <div class="form-group">
          <label for="participant-code">Còd an cluicheadar:</label>
          <input
            type="text"
            id="participant-code"
            placeholder="Cuir a-steach do chòd an seo"
            autocomplete="off"
            aria-required="true"
            aria-describedby="code-help"
          />
          <span id="code-help" class="visually-hidden">Cuir a-steach do chòd cluicheadair gus tòiseachadh</span>
        </div>
        <button class="play-button" onclick="gameController.handleLoginSubmit()" aria-label="Tòisich an geama">Tòisich</button>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  handleLoginSubmit() {
    const input = document.getElementById('participant-code');
    if (!input) return;

    const code = input.value.trim();

    // Validate input: alphanumeric and basic punctuation only, max 50 chars
    const sanitizedCode = code.replace(/[^a-zA-Z0-9\-_]/g, '');

    if (sanitizedCode.length === 0) {
      alert('Feuch gun cuir thu a-steach an còd ceart agad!');
      return;
    }

    if (sanitizedCode.length > 50) {
      alert('Tha an còd ro fhada. Feuch còd nas giorra.');
      return;
    }

    this.participantCode = sanitizedCode;
    this.gameData = { participantCode: sanitizedCode, score: 0, gameStartTime: new Date() };
    this.setGameFlowState('RUAIRIDH_INTRO');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Ruairidh speaks, single page)
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
        <div class="arrow-buttons centered">
          <button class="arrow-btn" onclick="gameController.setGameFlowState('PREGAME_TUTORIAL')">Air adhart →</button>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 0 - sound button)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep0() {
    this.layoutTutorialStep = 0; // Set state for this step
    const html = `
      <div class="game-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button glowing" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <button class="ruairidh-pause-button" disabled><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg></button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" disabled aria-label="Cuideachadh - chan eil ri fhaighinn fhathast">?</button> -->
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div class="layout-tutorial-overlay" id="layout-overlay"></div>
        <div class="intro-screen-wrapper" style="position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Seo am putan airson an fhuaim a chur air agus dheth.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('RUAIRIDH_INTRO')">← Air ais</button>
              <button class="arrow-btn" onclick="gameController.advanceLayoutTutorialStep()">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.updateLayoutSpotlightPosition('sound-button');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 1 - cairn/points)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep1() {
    this.layoutTutorialStep = 1; // Set state for this step
    const html = `
      <div class="game-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <button class="ruairidh-pause-button" disabled><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg></button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" disabled aria-label="Cuideachadh - chan eil ri fhaighinn fhathast">?</button> -->
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon pulsing" id="cairn-spotlight" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div class="layout-tutorial-overlay" id="layout-overlay"></div>
        <div class="intro-screen-wrapper" style="position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Nise, tha mise a' cumail sùil air na puingean. Nuair a gheibh thu puing, gheibh thu clach air an càirn agad.<br><br>Cuimhich, nithear càirn mòr bho chlachan bheaga.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.renderGameIntro_LayoutStep0()">← Air ais</button>
              <button class="arrow-btn" onclick="gameController.advanceLayoutTutorialStep()">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.updateLayoutSpotlightPosition('cairn-spotlight');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 2 - help button)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep2() {
    this.layoutTutorialStep = 2; // Set state for this step
    const html = `
      <div class="game-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <button class="ruairidh-pause-button" disabled><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg></button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button glowing" disabled style="cursor: default;" id="layout-help-btn">?</button> -->
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" id="cairn-spotlight" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div class="layout-tutorial-overlay" id="layout-overlay"></div>
        <div class="intro-screen-wrapper" style="position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Seo putan airson cuideachadh, nuair nach eil fios agad mu dheidhinn rudeigin, brùth seo airson barrachd fios.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.renderGameIntro_LayoutStep1()">← Air ais</button>
              <button class="arrow-btn" onclick="gameController.advanceLayoutTutorialStep()">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.updateLayoutSpotlightPosition('layout-help-btn');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 2.5 - pause button)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep2_5() {
    this.layoutTutorialStep = 2.5; // Set state for this step
    const html = `
      <div class="game-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <button class="ruairidh-pause-button glowing" disabled style="cursor: default;" id="layout-pause-btn"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg></button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" disabled aria-label="Cuideachadh - chan eil ri fhaighinn fhathast">?</button> -->
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" id="cairn-spotlight" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div class="layout-tutorial-overlay" id="layout-overlay"></div>
        <div class="intro-screen-wrapper" style="position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Ma tha thu ag iarraidh stad a chur air geama, brùth pause an seo.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.renderGameIntro_LayoutStep2()">← Air ais</button>
              <button class="arrow-btn" onclick="gameController.advanceLayoutTutorialStep()">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.updateLayoutSpotlightPosition('layout-pause-btn');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 3 - ready to play)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep3() {
    this.layoutTutorialStep = 3; // Set state for this step
    const html = `
      <div class="game-screen layout-step3-beach-bg">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <button class="ruairidh-pause-button" disabled><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg></button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" disabled aria-label="Cuideachadh - chan eil ri fhaighinn fhathast" id="layout-help-btn">?</button> -->
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" id="cairn-spotlight" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div class="intro-screen-wrapper">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>A chiad gheama a chluicheas sinn se Glac an Giomach. A bheil thu deiseil?</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.renderGameIntro_LayoutStep2_5()">← Air ais</button>
              <button class="play-green-btn" onclick="gameController.setGameFlowState('GAME1_TUTORIAL')">Cluich an Geama</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  // ----------------------------------------------------------
  // 3 - GAME 1 TUTORIAL (multi-step)
  // ----------------------------------------------------------
  renderGame1TutorialFlow() {
    this.game1TutorialStep = 0;
    this.renderGame1Tutorial_Step1();
  }

  // Helper to clean up tutorial Step 1 before navigation
  cleanupAndNavigateToStep2() {
    // Stop the lobster animation
    if (this.game1TutorialBoard) {
      this.game1TutorialBoard.stopTutorialAnimation();
    }
    // Clear the spotlight timeout
    if (this.tutorialSpotlightTimeout) {
      clearTimeout(this.tutorialSpotlightTimeout);
      this.tutorialSpotlightTimeout = null;
    }
    // Navigate to Step 2
    this.game1TutorialStep = 1;
    this.renderGame1Tutorial_Step2();
  }

  renderGame1Tutorial_Step1() {
  this.game1TutorialStep = 0; // Set state for this step
  const html = `
    <div class="game1-screen game1-tutorial-step1">
      <div class="ruairidh-banner">
        <div class="ruairidh-banner-left">
          <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
          <!-- TEMPORARILY DISABLED FOR DEMO -->
          <!-- <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button> -->
        </div>
        <div class="banner-title-container">
          <div class="game1-title-fun">Glac an Giomach</div>
        </div>
        <div class="ruairidh-banner-right">
          <div class="points-box">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
            <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">0</span>
          </div>
        </div>
      </div>

      <div class="game1-tutorial-content-wrapper">
        <div class="game1-tutorial-text-section">
          <div class="ruairidh-intro-screen game1-tutorial-box">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 150px; height: 150px;" />
              </div>
              <div class="speech-bubble">
                <p>Fàilte dhan tràigh, a charaid!<br><br>Bidh iad ag ràdh… San Earrach, nuair a bhios a chaora caol, bidh am maorach reamhar.<br><br>'S fìor thoil leam giomaich, ach tha iad cho duilich an glacadh!<br><br>Le sin, tha mi ag iarraidh do chuideachadh.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('PREGAME_TUTORIAL')">← Air ais</button>
              <button class="arrow-btn" onclick="gameController.cleanupAndNavigateToStep2();">Air adhart →</button>
            </div>
          </div>
        </div>

        <div class="game1-tutorial-board-section">
          <div id="game1-board-tutorial"></div>
        </div>
      </div>
    </div>
  `;
  this.gameContainer.innerHTML = html;

  this.game1TutorialBoard = new Game1Board(5, this);
  this.game1TutorialBoard.isAnimating = true;
  this.game1TutorialBoard.gridWidth = 7;
  this.game1TutorialBoard.gridHeight = 6;
  this.game1TutorialBoard.boardSquares.clear();
  this.game1TutorialBoard.initializeBoard();
  this.game1TutorialBoard.spawnLobster();
  this.game1TutorialBoard.blockedSet.clear();
  this.game1TutorialBoard.renderTutorialOnlyLobster('game1-board-tutorial');

  this.game1TutorialBoard.startSlowLobsterAnimation(1000);

  // Store timeout reference for cleanup
  if (this.tutorialSpotlightTimeout) clearTimeout(this.tutorialSpotlightTimeout);
  this.tutorialSpotlightTimeout = setTimeout(() => {
    const board = document.querySelector('.game1-board');
    if (board) {
      const board1 = document.getElementById('game1-board-tutorial');
      if (board1) {
        const lobsterTile = board1.querySelector('[data-lobster="true"]');
        if (lobsterTile) {
          const rect = lobsterTile.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          document.documentElement.style.setProperty('--spotlight-x', x + 'px');
          document.documentElement.style.setProperty('--spotlight-y', y + 'px');
        }
      }
    }
  }, 100);
}

renderGame1Tutorial_Step2() {
  this.game1TutorialStep = 1; // Set state for this step
  const html = `
    <div class="game1-screen game1-tutorial-step2">
      <div class="ruairidh-banner">
        <div class="ruairidh-banner-left">
          <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
          <!-- TEMPORARILY DISABLED FOR DEMO -->
          <!-- <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button> -->
        </div>
        <div class="banner-title-container">
          <div class="game1-title-fun">Glac an Giomach</div>
        </div>
        <div class="ruairidh-banner-right">
          <div class="points-box">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
            <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">0</span>
          </div>
        </div>
      </div>

      <div class="game1-tutorial-content-wrapper game1-tutorial-step2">
        <div class="game1-tutorial-text-section">
          <div class="ruairidh-intro-screen game1-tutorial-box">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 150px; height: 150px;" />
              </div>
              <div class="speech-bubble">
                <p>Ri mo thaobh chì thu giomach agus blocaichean gainmhich bhuidhe. Seo far a bheil sinn a' dol a dh' fheuchainn giomaich a ghlacadh!</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.game1TutorialStep = 0; gameController.renderGame1Tutorial_Step1();">← Air ais</button>
              <button class="arrow-btn" onclick="gameController.game1TutorialStep = 2; gameController.renderGame1Tutorial_Step3();">Air adhart →</button>
            </div>
          </div>
        </div>

        <div class="game1-tutorial-board-section-right">
          <div id="game1-board-tutorial"></div>
        </div>
      </div>
    </div>
  `;
  this.gameContainer.innerHTML = html;

  this.game1TutorialBoard = new Game1Board(5, this);
  this.game1TutorialBoard.isAnimating = true;
  this.game1TutorialBoard.gridWidth = 7;
  this.game1TutorialBoard.gridHeight = 6;
  this.game1TutorialBoard.boardSquares.clear();
  this.game1TutorialBoard.initializeBoard();
  this.game1TutorialBoard.spawnLobster();
  this.game1TutorialBoard.blockedSet.clear();
  this.game1TutorialBoard.renderTutorial('game1-board-tutorial');
}

renderGame1Tutorial_Step3() {
  this.game1TutorialStep = 2; // Set state for this step
  const html = `
    <div class="game1-screen game1-tutorial-step3">
      <div class="ruairidh-banner">
        <div class="ruairidh-banner-left">
          <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
          <!-- TEMPORARILY DISABLED FOR DEMO -->
          <!-- <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button> -->
        </div>
        <div class="banner-title-container">
          <div class="game1-title-fun">Glac an Giomach</div>
        </div>
        <div class="ruairidh-banner-right">
          <div class="points-box">
            <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
            <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">0</span>
          </div>
        </div>
      </div>

      <div class="game1-tutorial-content-wrapper game1-tutorial-step3">
        <div class="game1-tutorial-text-section">
          <div class="ruairidh-intro-screen game1-tutorial-box">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 150px; height: 150px;" />
              </div>
              <div class="speech-bubble">
                <p>Nuair a bhrùthas tu air an gainmheach bhuidhe, 's urrainn dhut clach a chur sìos. Cha toil leis na giomaich a dhol thairis air na clachan!<br><br>Airson a h-uile giomach a gheibh thu thèid clach a chur air an càirn.<br><br>Cuimhich tha na giomaich ann an Leòdhas gu math seòlta!<br><br>Chan eil ach còig mionaidean againn! Steall ort!</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.game1TutorialStep = 1; gameController.renderGame1Tutorial_Step2();">← Air ais</button>
              <button class="play-green-btn" onclick="gameController.setGameFlowState('GAME1');">Cluich an Geama</button>
            </div>
          </div>
        </div>

        <div class="game1-tutorial-board-section-right">
          <div id="game1-board-tutorial"></div>
        </div>
      </div>
    </div>
  `;
  this.gameContainer.innerHTML = html;

  this.game1TutorialBoard = new Game1Board(5, this);
  this.game1TutorialBoard.isAnimating = true;
  this.game1TutorialBoard.gridWidth = 7;
  this.game1TutorialBoard.gridHeight = 6;
  this.game1TutorialBoard.boardSquares.clear();
  this.game1TutorialBoard.initializeBoard();
  this.game1TutorialBoard.spawnLobster();

  // Add rocks, ensuring they don't overlap with lobster position
  const lobsterKey = `${this.game1TutorialBoard.lobster.position.x},${this.game1TutorialBoard.lobster.position.y}`;
  const rockPositions = ['2,1', '3,1', '4,1', '5,2'];
  rockPositions.forEach(pos => {
    if (pos !== lobsterKey) {
      this.game1TutorialBoard.blockedSet.add(pos);
    }
  });

  this.game1TutorialBoard.renderTutorial('game1-board-tutorial');
}




  // ----------------------------------------------------------
  // 4 - GAME 1 - GLAC AN GIOMACH (actual gameplay)
  // ----------------------------------------------------------
  renderGame1_Main() {
    const html = `
      <div class="game1-screen" role="main">
        <div class="ruairidh-banner" role="banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <button class="ruairidh-pause-button" id="pause-button" onclick="gameController.togglePause()" aria-label="Cuir stad air a' gheama"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg></button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" onclick="gameController.toggleInGameHelpModal()" aria-label="Fosgail am modal cuideachaidh">?</button> -->
          </div>
          <div class="banner-title-container">
            <h1 class="game1-title-fun">Glac an Giomach</h1>
          </div>
          <div class="ruairidh-banner-right">
            <div class="timer-box" role="timer" aria-live="polite">
              <img src="./svgs/all-games/clock.svg" alt="Uaireadair" class="timer-icon" />
              <div class="timer-text">ÙINE:</div>
              <span id="timer-display" style="color: white;" aria-label="Ùine air fhàgail">5:00</span>
            </div>
            <div class="points-box" role="status" aria-live="polite">
              <img src="./svgs/all-games/cairn.svg" alt="Càrn" class="cairn-icon" id="cairn-spotlight" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;" aria-label="Puingean agad">${this.totalPoints}</span>
            </div>
          </div>
        </div>

        <div class="game1-board" id="game1-board" role="application" aria-label="Bòrd geama Glac an Giomach"></div>
        <div class="game1-footer">
          <div id="round-status" role="status" aria-live="assertive"></div>
          <button class="nav-btn dev-skip-btn" onclick="gameController.skipToGame2()" aria-label="[DEV] Skip to Game 2" style="background: linear-gradient(135deg, #ff4444, #cc0000); margin-right: 1rem;">[DEV] Skip to Game 2</button>
          <button class="nav-btn" onclick="gameController.resetGame1Round()" aria-label="Ath-thòisich an cuairt seo">Tòisich a-rithist</button>
        </div>
      </div>
      <div class="help-modal" id="help-modal" role="dialog" aria-labelledby="help-title" aria-modal="true">
        <div class="help-modal-content">
          <button class="modal-close" onclick="gameController.toggleInGameHelpModal()" aria-label="Dùin am modal cuideachaidh">✕</button>
          <h2 id="help-title">Ciamar a chluicheas tu</h2>
          <ul>
            <li><strong>Amas:</strong> Glac an giomach le bhith a' togail càidse de chlachan</li>
            <li><strong>Smachd:</strong> Briog air na ceàrnan airson clachan a chur sìos</li>
            <li><strong>Teicheadh:</strong> Ma ruigeas an giomach an oir, teichidh e agus caillidh tu!</li>
            <li><strong>Ro-innleachd:</strong> Tòisich fada air falbh bhon ghiomach, tog càidse, is an uair sin glac e</li>
            <li><strong>Puingean:</strong> Gach giomach a ghlacas tu = 1 phuing. Faigh uiread 's a ghabhas!</li>
          </ul>
        </div>
      </div>
      <div class="pause-modal" id="pause-modal" role="dialog" aria-labelledby="pause-title" aria-modal="true">
        <div class="pause-modal-content">
          <h2 id="pause-title">Geama air stad</h2>
          <button class="pause-resume-btn" onclick="gameController.togglePause()" aria-label="Tòisich an geama a-rithist">Tòisich</button>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
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
    this.timeRemaining = 240;  // 4 minutes (240 seconds)
    this.updateGame1TimerDisplay();

    // Tell the help system that game has started
    // This prevents help popups during active gameplay
    if (this.helpSystem) {
      this.helpSystem.markAsPlayed();
    }

    // Clear any existing timer first (safety check)
    if (this.gameTimer) clearInterval(this.gameTimer);

    // Start the countdown - ticks every second
    this.gameTimer = setInterval(() => {
      this.timeRemaining--;
      this.updateGame1TimerDisplay();  // Update the visual display

      // Check if time's up
      if (this.timeRemaining <= 0) {
        clearInterval(this.gameTimer);  // Stop the timer
        this.playTimerEndSoundEffect();  // Satisfying "ding" sound
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
      // Format as MM:SS (e.g., "3:45")
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Remove any existing warning classes first
      display.classList.remove('warning-yellow', 'warning-orange', 'warning-red', 'warning');

      if (this.timeRemaining <= 10) {
        display.classList.add('warning-red');
      } else if (this.timeRemaining <= 30) {
        display.classList.add('warning-orange');
      } else if (this.timeRemaining <= 60) {
        display.classList.add('warning-yellow');
      }
    }
  }

  playTimerEndSoundEffect() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  // ----------------------------------------------------------
  // 5 - INTERVAL 1 (transition between games)
  // ----------------------------------------------------------
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
            <div class="arrow-buttons centered">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('GAME2_TUTORIAL')">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  // ----------------------------------------------------------
  // 6 - GAME 2 TUTORIAL
  // ----------------------------------------------------------
  renderGame2TutorialScreen() {
    this.game2TutorialStep = 0;
    // Generate random tweed numbers for tutorial cards
    const tweed1 = Math.floor(Math.random() * 9) + 1;
    const tweed2 = Math.floor(Math.random() * 9) + 1;

    const html = `
      <div class="game2-tutorial-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" disabled aria-label="Cuideachadh - chan eil ri fhaighinn fhathast">?</button> -->
          </div>
          <div class="banner-title-container">
            <div class="game1-title-fun">Cho Coltrach ris an Dà Sgadan</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="points-box">
              <img src="./svgs/all-games/cairn.svg" alt="Cairn" class="cairn-icon" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">${this.totalPoints}</span>
            </div>
          </div>
        </div>

        <div class="game2-tutorial-content-wrapper">
          <div class="game2-tutorial-text-section">
            <div class="ruairidh-intro-screen" style="max-width: 600px;">
              <div class="ruairidh-container" style="flex-direction: column; gap: 1.5rem;">
                <div class="seal-icon-wrapper">
                  <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 120px; height: 120px;" />
                </div>
                <div class="speech-bubble tutorial-top-left">
                  <p>Anns an geama seo, feumaidh tu mo chuideachadh paidhrichean a dhèanamh de rudan as urrainn dhut a lorg timcheall orm aig muir. Bidh pìosan clò Hearaich air a' bhòrd ri mo thaobh agus feumaidh tu paidhrichean a dhèanamh asta.</p>
                </div>
              </div>
              <div class="arrow-buttons">
                <button class="arrow-btn" onclick="gameController.setGameFlowState('GAME2_READY')">← Air ais</button>
                <button class="play-green-btn" onclick="gameController.setGameFlowState('GAME2')">Cluich an Geama</button>
              </div>
            </div>
          </div>

          <div class="game2-tutorial-cards-section">
            <div class="tutorial-card-grid">
              <div class="tutorial-card">
                <div class="tutorial-card-inner">
                  <div class="tutorial-card-face">
                    <img src="./svgs/game-2/tweeds/tweed-${tweed1}.svg" alt="Card back" />
                  </div>
                </div>
              </div>
              <div class="tutorial-card">
                <div class="tutorial-card-inner">
                  <div class="tutorial-card-face">
                    <img src="./svgs/game-2/tweeds/tweed-${tweed2}.svg" alt="Card back" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  // ----------------------------------------------------------
  // 7 - GAME 2 - CARD MATCHING GAME
  // ----------------------------------------------------------
  renderGame2_Main() {
    const html = `
      <div class="game2-screen" role="main">
        <div class="ruairidh-banner" role="banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" onclick="gameController.toggleGame2HelpModal()" aria-label="Fosgail am modal cuideachaidh">?</button> -->
          </div>
          <div class="banner-title-container">
            <h1 class="game1-title-fun">Cho Coltrach ris an Dà Sgadan</h1>
            <button class="nav-btn dev-skip-btn"
                    onclick="gameController.skipToGame3()"
                    style="background: linear-gradient(135deg, #ff4444, #cc0000); margin-left: 1rem; font-size: 0.8rem; padding: 0.4rem 0.8rem;">
              [DEV] Skip to Game 3
            </button>
          </div>
          <div class="ruairidh-banner-right">
            <div class="points-box" role="status" aria-live="polite">
              <img src="./svgs/all-games/cairn.svg" alt="Càrn" class="cairn-icon" id="cairn-spotlight" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;" aria-label="Puingean agad">${this.totalPoints}</span>
            </div>
          </div>
        </div>

        <div class="game2-content-wrapper">
          <div class="game2-board" id="game2-board" role="application" aria-label="Bòrd geama cairtean-mhaidseadh"></div>
        </div>
      </div>

      <div class="help-modal" id="game2-help-modal" role="dialog" aria-labelledby="help-title-game2" aria-modal="true">
        <div class="help-modal-content">
          <button class="modal-close" onclick="gameController.toggleGame2HelpModal()" aria-label="Dùin am modal cuideachaidh">✕</button>
          <h2 id="help-title-game2">Ciamar a chluicheas tu</h2>
          <ul>
            <li><strong>Amas:</strong> Lorg a h-uile paidhir de chairtean mhaidsichte</li>
            <li><strong>Smachd:</strong> Briog air cairt airson a thionndadh</li>
            <li><strong>Riaghailtean:</strong> Tionndaidh dà chairt. Ma tha iad co-ionann, fuirichidh iad fosgailte</li>
            <li><strong>Mearachdan:</strong> Ma tha iad eadar-dhealaichte, tionndaidhidh iad air ais</li>
            <li><strong>Buannachadh:</strong> Lorg a h-uile paidhir gus a' gheama a bhuannachadh!</li>
          </ul>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.game2Board = new CardMatchingGame(this);
    this.game2Board.render();
  }

  toggleGame2HelpModal() {
    const modal = document.getElementById('game2-help-modal');
    if (modal) modal.classList.toggle('active');
  }

  resetGame2Board() {
    if (this.game2Board) {
      this.game2Board.reset();
      this.game2Board.render();
    }
  }

  // ----------------------------------------------------------
  // Shared helpers: Enhanced help system, points, game 1 round reset, results
  // ----------------------------------------------------------
  toggleInGameHelpModal() {
    if (!this.helpSystem) {
      this.helpSystem = new SmartHelpSystem(this);
    }
    this.helpSystem.toggle();
  }

  resetGame1Round() {
    if (this.game1Board) {
      this.game1Board.reset();
      this.game1Board.render();
    }
  }

  skipToGame2() {
    // Dev function to skip Game 1 timer and go straight to Game 2
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    this.setGameFlowState('GAME2_READY');
  }

  // ===== POINTS TRACKING =====
  // Updates the visual display of total points across all games
  // This just refreshes the UI, doesn't actually modify the point value
  updatePointsDisplayOnly() {
    const counter = document.getElementById('points-counter');
    if (counter) {
      counter.textContent = `${this.totalPoints}`;
    }
  }

  // ===== CAIRN POINT SYSTEM =====
  // Called whenever player places a stone on the board in Game 1
  // Each stone = 1 point, keeps things simple and fair
  // Originally tried more complex scoring but this works best
  addPointToCairn() {
    this.totalPoints++;  // Increment running total
    this.updatePointsDisplayOnly();  // Refresh display
    this.playPointSound();  // Satisfying click sound - important for feedback!
  }

  skipToGame3() {
    // Dev function to skip Game 2 and go straight to Game 3
    this.setGameFlowState('GAME3_READY');
  }

  // ----------------------------------------------------------
  // 8 - INTERVAL 2 (transition to Game 3)
  // ----------------------------------------------------------
  renderInterval_TransitionToGame3() {
    const html = `
      <div class="game3-ready-screen">
        <div class="intro-screen-wrapper">
          <div class="ruairidh-intro-screen">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>'S e an ath gheama:<br><strong>"Cho luath ris a' bhradan!"</strong><br><br>Anns a gheama seo tha feum agad aire a chumail air a mhulach oir bidh dealbh ann ag innse dè an t-iasg a tha mi ag iarraidh. Ma ma gheibh sibh an fhear cheart gheibh sibh puing… cum do shùil a-mach airson rudan eile a tha ri lorg bhon mhuir, 's dòcha gum faigh sibh torr puingean!<br><br>Cliog air an iasg agus gheibh sibh na puingean. Ach na cliog air an ola neo bidh na h-èisg air falbh!</p>
              </div>
            </div>
            <div class="arrow-buttons centered">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('GAME3')">Air adhart →</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  // ----------------------------------------------------------
  // 9 - GAME 3 MAIN (Cho luath ris a' bhradan)
  // ----------------------------------------------------------
  renderGame3_Main() {
    const html = `
      <div class="game3-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-sound-button" id="sound-button" onclick="gameController.toggleSound()" aria-label="Cuir dheth fuaim">🔊</button>
            <!-- TEMPORARILY DISABLED FOR DEMO -->
            <!-- <button class="ruairidh-help-button" onclick="gameController.toggleInGameHelpModal()" aria-label="Fosgail cuideachadh">?</button> -->
            <button class="ruairidh-pause-button" id="pause-button" onclick="gameController.toggleGame3Pause()" aria-label="Cuir na stad"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="3" height="14" fill="#000000"/><rect x="14" y="5" width="3" height="14" fill="#000000"/></svg></button>
          </div>
          <div class="banner-title-container">
            <div class="game3-title">Cho luath ris a' bhradan</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="timer-box">
              <span id="timer-display" class="timer-display" role="timer" aria-label="Ùine air fhàgail">3:00</span>
            </div>
            <div class="points-box">
              <img src="./svgs/all-games/cairn.svg" alt="Càrn" class="cairn-icon" id="cairn-spotlight" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;" aria-label="Puingean agad">${this.totalPoints}</span>
            </div>
          </div>
        </div>

        <!-- Ruairidh with Speech Bubble showing target fish -->
        <div class="game3-ruairidh-section">
          <div class="ruairidh-container">
            <div class="seal-icon-wrapper">
              <img src="./svgs/game-1/seal-2.svg" alt="Ruairidh" class="seal-icon" />
            </div>
            <div class="speech-bubble">
              <div id="target-fish-display" class="target-fish-display">
                <!-- Fish image and name will be inserted here -->
              </div>
            </div>
          </div>
        </div>

        <div class="game3-canvas-container" id="game3-canvas">
          <!-- Fish and bubbles appear here -->
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;

    // Initialize Game 3
    this.game3Board = new Game3FishingGame(this);
    this.game3Board.init();
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
  renderResultsScreen() {
    if (this.gameTimer) clearInterval(this.gameTimer);
    
    const html = `
      <div class="login-screen">
        <h1>Deiseil!</h1>
        <p>Cluicheadair: ${this.participantCode}</p>
        <div style="font-size: 3rem; margin: 2rem 0;">🦞</div>
        <p style="font-size: 1.5rem; font-weight: bold; color: #1f4bff;">Puingean: ${this.totalPoints} Giomaich</p>
        <p style="color: #666;">Ceud taing airson an geama seo a' chluich, tha na puingean agad air a' shàbhaladh.</p>
        <button class="play-button" onclick="location.reload()">Cluich a-rithist!</button>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }
}

// ==========================================================
// BOARD & ACTOR CLASSES FOR GAME 1 (Glac an Giomach)
// ==========================================================
class HexGridSquare {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.blocked = false;
  }

  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  // Get all 6 neighboring hexagons
  // Hexagonal grids have offset rows - odd/even rows have different neighbor patterns
  getNeighbors() {
    const oddRow = this.y % 2 === 1;

    // Direction offsets for odd vs even rows in offset hexagonal grid
    // Each hex has 6 neighbors: left, right, upper-left, upper-right, lower-left, lower-right
    const directions = oddRow
      ? [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]]
      : [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]];

    return directions.map(([dx, dy]) => new HexGridSquare(this.x + dx, this.y + dy));
  }

  hash() {
    return `${this.x},${this.y}`;
  }
}

class LobsterToken {
  constructor(startSquare) {
    this.position = startSquare;
    this.rotation = 0;
  }

  // Find shortest path to escape using Breadth-First Search (BFS)
  // The lobster tries to reach any edge of the board
  // Returns null if trapped (no path exists)
  findShortestEscapePath(blockedSet, boardSquares, gridWidth, gridHeight) {
    const start = this.position;
    const startKey = start.hash();
    const queue = [startKey]; // BFS queue
    const parent = new Map(); // Track path for reconstruction
    parent.set(startKey, null);

    while (queue.length) {
      const key = queue.shift();
      const [cx, cy] = key.split(',').map(Number);
      const current = new HexGridSquare(cx, cy);

      // Check if we've reached an edge (escape!)
      if (current.x === 0 || current.x === gridWidth - 1 || current.y === 0 || current.y === gridHeight - 1) {
        // Reconstruct path from start to edge
        const path = [];
        let k = key;
        while (k) {
          const [px, py] = k.split(',').map(Number);
          path.unshift(new HexGridSquare(px, py));
          k = parent.get(k);
        }
        return path;
      }

      // Explore neighbors
      for (const neighbor of current.getNeighbors()) {
        const nk = neighbor.hash();
        // Only visit unvisited, valid, and unblocked squares
        if (!parent.has(nk) && boardSquares.has(nk) && !blockedSet.has(nk)) {
          parent.set(nk, key);
          queue.push(nk);
        }
      }
    }

    // No path to edge - lobster is trapped!
    return null;
  }

  getRotationForDirection(newPos) {
    const dx = newPos.x - this.position.x;
    const dy = newPos.y - this.position.y;
    const oddRow = this.position.y % 2 === 1;

    if (dx === 1 && dy === 0) return 90;
    if (dx === -1 && dy === 0) return 270;

    if (dy === -1) {
      if (oddRow) {
        if (dx === 1) return 30;
        if (dx === 0) return 330;
      } else {
        if (dx === 0) return 30;
        if (dx === -1) return 330;
      }
    }

    if (dy === 1) {
      if (oddRow) {
        if (dx === 1) return 150;
        if (dx === 0) return 210;
      } else {
        if (dx === 0) return 150;
        if (dx === -1) return 210;
      }
    }

    return this.rotation;
  }

  getNextStep(blockedSet, boardSquares, gridWidth, gridHeight) {
    const path = this.findShortestEscapePath(blockedSet, boardSquares, gridWidth, gridHeight);
    if (!path || path.length <= 1) {
      return { nextPos: null, escapedIfMove: false };
    }
    const nextPos = path[1];
    const escapedIfMove =
      nextPos.x === 0 || nextPos.x === gridWidth - 1 || nextPos.y === 0 || nextPos.y === gridHeight - 1;
    return { nextPos, escapedIfMove };
  }
}

// ==========================================================
// GAME 1: CAIRN BUILDING (LOBSTER TRAPPING)
// ==========================================================
// This is the first game where you trap a lobster by blocking its path
// The lobster moves around the grid trying to escape to the edges
// Player clicks squares to place stones and build a cairn around it
// If you surround it completely, you win. If it reaches an edge, you lose.
// 4 minute time limit, points awarded for each stone placed
// ==========================================================

class Game1Board {
  constructor(radius, controller) {
    this.controller = controller;  // Reference back to main game controller

    // ===== GAME STATE =====
    this.blockedSet = new Set();  // Tracks which squares have stones on them
    this.lobster = null;           // Lobster position {x, y}
    this.gameOver = false;         // Game finished (win or lose)
    this.gameLost = false;         // Did we lose?
    this.isAnimating = false;      // Used to freeze/unfreeze lobster movement (for pause)
    this.isEscaping = false;       // Lobster is currently moving to escape
    this.isOnEdge = false;         // Lobster reached edge, waiting for player acknowledgement
    this.tutorialAnimationInterval = null;  // For tutorial mode animations

    // ===== GRID DIMENSIONS =====
    this.gridWidth = 11;
    this.gridHeight = 10;

    // ===== LOBSTER DIALOG =====
    // The lobster says different things when caught vs. when moving
    // These cycle through in order (not random) to give variety
    this.caughtMessages = [
      'Ghlac thu mi!',     // You caught me!
      'Dè fo ghrian?',     // What on earth?
      'Sgriosail!',        // Destructive!
      'Oh bhròinean...',   // Oh sorrow...
      'Cuidich mi!',       // Help me!
      'Beiridh mise ort!'  // I'll catch you!
    ];
    this.movementMessages = [
      'haoi',              // hey
      'duda?',             // hello?
      'mach às mo rathad', // out of my way
      'obh obh',           // expression of surprise
      'aidh aidh',         // yes yes
      'brochan lom',       // plain porridge (expression)
      'balaich an iasgaich',  // boys of the fishing
      'Mach a seo!',       // Out of here!
      'Seo nis',           // Here now
      'Cho carach',        // So tricky
      'teich!',            // flee!
      'Bha sin faisg!'     // That was close!
    ];

    // Track which message to show next (cycles through arrays)
    this.caughtMessageIndex = 0;
    this.movementMessageIndex = 0;

    // ===== MOVEMENT MESSAGE TIMING =====
    // Don't show a message every single jump - that would be annoying
    // Instead, show one every 3-4 jumps randomly
    this.jumpCounter = 0;
    this.jumpsUntilMessage = this.getRandomJumps();  // Gets 3 or 4

    // ===== SPEECH BUBBLE SYSTEM =====
    // Keeps track of currently displayed bubble so it persists across re-renders
    // Structure: { message, startTime, duration, hasBeenRendered }
    this.activeBubble = null;

    // ===== INITIALIZATION =====
    this.boardSquares = new Map();  // Stores the grid state
    this.initializeBoard();         // Set up empty grid
    this.spawnLobster();            // Place lobster randomly
    this.placeRandomRocks();        // Add some initial obstacles
  }

  // ===== HELPER FUNCTIONS =====

  // Randomly returns 3 or 4 (for varying movement message frequency)
  getRandomJumps() {
    return Math.random() < 0.5 ? 3 : 4;
  }

  // Display a speech bubble above the lobster
  // Bubble persists for the specified duration then auto-clears
  showSpeechBubble(message, duration) {
    this.activeBubble = {
      message: message,
      startTime: Date.now(),
      duration: duration,
      hasBeenRendered: false  // Tracks if we've rendered this bubble yet
    };

    // Set up auto-clear timer
    setTimeout(() => {
      // Only clear if it's still the same bubble (prevents race conditions)
      if (this.activeBubble && this.activeBubble.message === message) {
        this.activeBubble = null;
        this.render();  // Refresh display to remove bubble
      }
    }, duration);
  }

  // Check if there's currently a bubble that should be showing
  // Returns { message, isFirstRender } or null
  shouldShowBubble() {
    if (!this.activeBubble) return null;
    const elapsed = Date.now() - this.activeBubble.startTime;
    if (elapsed < this.activeBubble.duration) {
      const isFirstRender = !this.activeBubble.hasBeenRendered;
      this.activeBubble.hasBeenRendered = true; // Mark as rendered
      return { message: this.activeBubble.message, isFirstRender };
    }
    this.activeBubble = null;
    return null;
  }

  initializeBoard() {
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const square = new HexGridSquare(x, y);
        this.boardSquares.set(square.hash(), square);
      }
    }
  }

  spawnLobster() {
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    const startPos = new HexGridSquare(centerX, centerY);
    this.lobster = new LobsterToken(startPos);
  }

  // Place random rock obstacles on the board (15% coverage)
  // Ensures no rocks are placed on the lobster's position or the centre position
  placeRandomRocks() {
    const squareArray = Array.from(this.boardSquares.values());
    const rockCount = Math.floor(squareArray.length * 0.15);
    const lobsterPosHash = this.lobster.position.hash(); // Cache for performance

    // Explicitly calculate centre position to avoid placing rocks there (critical for tutorials)
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    const centerPosHash = `${centerX},${centerY}`;

    for (let i = 0; i < rockCount; i++) {
      let square;
      let squareHash;

      // Select random squares until we find one that's not the lobster's position OR the centre
      do {
        square = squareArray[Math.floor(Math.random() * squareArray.length)];
        squareHash = square.hash();
      } while (squareHash === lobsterPosHash || squareHash === centerPosHash);

      this.blockedSet.add(squareHash);
    }
  }



  clickHexTile(x, y) {
    if (this.gameOver || this.gameLost || this.isAnimating || this.isEscaping || this.isOnEdge) return;

    const square = new HexGridSquare(x, y);
    const key = square.hash();
    if (key === this.lobster.position.hash()) return;
    if (this.blockedSet.has(key)) return;

    this.blockedSet.add(key);

    const { nextPos, escapedIfMove } = this.lobster.getNextStep(
      this.blockedSet, this.boardSquares, this.gridWidth, this.gridHeight
    );

    if (!nextPos) {
      this.gameOver = true;

      // Track lobster caught for smart help system
      if (this.controller.helpSystem) {
        this.controller.helpSystem.recordLobsterCaught();
      }

      // Show caught message using tracked bubble system
      const message = this.caughtMessages[this.caughtMessageIndex];
      this.caughtMessageIndex = (this.caughtMessageIndex + 1) % this.caughtMessages.length;
      this.showSpeechBubble(message, 2000);

      // Render to display the bubble
      this.render();

      const lobsterTile = this.getCurrentLobsterTile();
      if (lobsterTile) {
        // Capture position BEFORE setTimeout to prevent position drift
        const tileRect = lobsterTile.getBoundingClientRect();

        setTimeout(() => {

          const stone = document.createElement('img');
          stone.src = './svgs/all-games/stone.svg';
          stone.classList.add('stone-fly');
          document.body.appendChild(stone);

          const cairn = document.getElementById('cairn-spotlight');
          if (cairn) {
            const cairnRect = cairn.getBoundingClientRect();
            // Use captured tileRect from before setTimeout
            const dx = cairnRect.left - tileRect.left;
            const dy = cairnRect.top - tileRect.top;

            stone.style.position = 'fixed';
            stone.style.left = tileRect.left + 'px';
            stone.style.top = tileRect.top + 'px';
            stone.style.zIndex = '9999';
            stone.style.display = 'block';
            stone.style.setProperty('--fly-x', `${dx}px`);
            stone.style.setProperty('--fly-y', `${dy}px`);
            stone.classList.add('stone-fly-animate');

            stone.addEventListener('animationend', () => {
              stone.remove();

              cairn.classList.add('pulsing');
              setTimeout(() => cairn.classList.remove('pulsing'), 800);

              this.controller.addPointToCairn();

              const counter = document.getElementById('points-counter');
              if (counter) {
                counter.classList.add('points-reward');
                setTimeout(() => counter.classList.remove('points-reward'), 600);
              }

              setTimeout(() => {
                this.reset();
                this.render();
              }, 400);
            });
          }
        }, 1200);
      }
      return;
    }

    this.animateTurnWiggleJump(nextPos, escapedIfMove);
  }

  animateTurnWiggleJump(nextPos, escapedIfMove) {
    this.isAnimating = true;

    // Increment jump counter for movement messages
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
            this.showSpeechBubble(message, 1500);

            // Reset counter and set new random target
            this.jumpCounter = 0;
            this.jumpsUntilMessage = this.getRandomJumps();
          }

          if (escapedIfMove) {
            // Track lobster escaped for smart help system
            if (this.controller.helpSystem) {
              this.controller.helpSystem.recordLobsterEscaped();
            }

            // Lobster reached edge - trigger escape animation immediately
            const lobsterTile = this.getCurrentLobsterTile();
            if (lobsterTile) {
              this.triggerEscapeAnimation(lobsterTile);
            }
          }
        }, 280);
      }, 120);
    }, 120);
  }

  getCurrentLobsterTile() {
    const container = document.querySelector('.hex-board-container');
    if (!container) return null;
    return document.querySelector('.hex-tile[data-lobster="true"]') || null;
  }

  reset() {
    this.blockedSet.clear();
    this.spawnLobster();
    this.placeRandomRocks();
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

    const status = document.getElementById('round-status');
    if (status) status.innerHTML = '';

    const board = document.getElementById('game1-board');
    if (board) {
      const fade = document.createElement('div');
      fade.classList.add('board-fade');
      board.appendChild(fade);
      fade.addEventListener('animationend', () => fade.remove());
    }
  }

  createHexagon(size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    const radius = size / 2;
    const centerX = radius;
    const centerY = radius;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * (Math.PI / 180);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', '#ffd700');
    polygon.setAttribute('stroke', '#e6c200');
    polygon.setAttribute('stroke-width', '2');

    svg.appendChild(polygon);
    return svg;
  }

  render() {
    const board = document.getElementById('game1-board');
    if (!board) {
      console.warn('Game board element not found');
      return;
    }

    const availableWidth = board.clientWidth;
    const availableHeight = board.clientHeight;

    const rowHeight = 0.85;
    const hexSizeW = (availableWidth * 0.9) / (this.gridWidth + 0.5);
    const hexSizeH = (availableHeight * 0.9) / (this.gridHeight * rowHeight + 0.15);
    const hexSize = Math.max(12, Math.min(hexSizeW, hexSizeH));

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
        tile.style.cursor = 'pointer';
        tile.style.transition = 'transform 150ms ease-out, filter 150ms ease-out';

        const hexBg = this.createHexagon(hexSize);
        hexBg.classList.add('hex-sand');
        tile.appendChild(hexBg);

        // Check if this is the lobster position
        const isLobsterPosition = this.lobster.position.x === x && this.lobster.position.y === y;

        // Only render rock if position is blocked AND not the lobster position
        if (this.blockedSet.has(key) && !isLobsterPosition) {
          tile.classList.add('has-rock'); // Mark tile as containing a rock
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
          rock.style.pointerEvents = 'none'; // Prevent rock from intercepting events
          tile.appendChild(rock);
        }

        if (isLobsterPosition) {
          tile.setAttribute('data-lobster', 'true');
          tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);
          tile.style.zIndex = '1000'; // Ensure lobster tile is above other tiles

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

          // Re-create speech bubble if one is active
          const bubbleData = this.shouldShowBubble();
          if (bubbleData) {
            const bubble = document.createElement('div');
            bubble.classList.add('lobster-speech');
            // Only add persistent-bubble class if this is NOT the first render (prevents animation on re-renders)
            if (!bubbleData.isFirstRender) {
              bubble.classList.add('persistent-bubble');
            }
            bubble.textContent = bubbleData.message;
            tile.appendChild(bubble);
          }
        }

        tile.addEventListener('click', () => {
          if (!this.blockedSet.has(key) && !(this.lobster.position.x === x && this.lobster.position.y === y)) {
            this.clickHexTile(x, y);
          }
        });

        tile.addEventListener('mouseenter', () => {
          if (!this.blockedSet.has(key) && !(this.lobster.position.x === x && this.lobster.position.y === y)) {
            // Add preview class for rock placement affordance
            tile.classList.add('hover-preview');
          }
        });

        tile.addEventListener('mouseleave', () => {
          // Remove preview class when mouse leaves
          tile.classList.remove('hover-preview');
        });

        container.appendChild(tile);
      }
    }

    board.innerHTML = '';
    board.appendChild(container);
  }

  renderTutorial(elementId) {
    const board = document.getElementById(elementId);
    if (!board) return;

    const availableWidth = board.clientWidth;
    const availableHeight = board.clientHeight;

    const rowHeight = 0.85;
    const hexSizeW = (availableWidth * 0.9) / (this.gridWidth + 0.5);
    const hexSizeH = (availableHeight * 0.9) / (this.gridHeight * rowHeight + 0.15);
    const hexSize = Math.max(12, Math.min(hexSizeW, hexSizeH));

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
        tile.style.pointerEvents = 'none';

        const hexBg = this.createHexagon(hexSize);
        hexBg.classList.add('hex-sand');
        tile.appendChild(hexBg);

        // Check if this is the lobster position
        const isLobsterPosition = this.lobster.position.x === x && this.lobster.position.y === y;

        // Only render rock if position is blocked AND not the lobster position
        if (this.blockedSet.has(key) && !isLobsterPosition) {
          tile.classList.add('has-rock'); // Mark tile as containing a rock
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
          rock.style.pointerEvents = 'none'; // Prevent rock from intercepting events
          tile.appendChild(rock);
        }

        if (isLobsterPosition) {
          tile.setAttribute('data-lobster', 'true');
          tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);
          tile.style.zIndex = '1000'; // Ensure lobster tile is above other tiles

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

          // Re-create speech bubble if one is active
          const bubbleData = this.shouldShowBubble();
          if (bubbleData) {
            const bubble = document.createElement('div');
            bubble.classList.add('lobster-speech');
            // Only add persistent-bubble class if this is NOT the first render (prevents animation on re-renders)
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

  renderTutorialOnlyLobster(elementId) {
    const board = document.getElementById(elementId);
    if (!board) return;

    const availableWidth = board.clientWidth;
    const availableHeight = board.clientHeight;

    const rowHeight = 0.85;
    const hexSizeW = (availableWidth * 0.9) / (this.gridWidth + 0.5);
    const hexSizeH = (availableHeight * 0.9) / (this.gridHeight * rowHeight + 0.15);
    const hexSize = Math.max(12, Math.min(hexSizeW, hexSizeH));

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

  stopTutorialAnimation() {
    if (this.tutorialAnimationInterval) {
      clearInterval(this.tutorialAnimationInterval);
      this.tutorialAnimationInterval = null;
    }
  }

  triggerEscapeAnimation(tile) {
    if (!tile) return;

    this.isEscaping = true;

    // Clear the speech bubble immediately - no need to show it during escape
    this.activeBubble = null;

    // Remove any existing speech bubbles from the tile
    const existingBubble = tile.querySelector('.lobster-speech');
    if (existingBubble) {
      existingBubble.remove();
    }

    const { x, y } = this.lobster.position;
    let rotation = 0;
    let dx = 0, dy = 0;
    const distance = 1200;

    // Calculate escape direction based on which edge the lobster is on
    if (y === 0) {
      rotation = 0;
      dx = 0; dy = -distance;
    } else if (y === this.gridHeight - 1) {
      rotation = 180;
      dx = 0; dy = distance;
    } else if (x === 0) {
      rotation = 270;
      dx = -distance; dy = 0;
    } else if (x === this.gridWidth - 1) {
      rotation = 90;
      dx = distance; dy = 0;
    } else {
      const ang = (this.lobster.rotation % 360) * (Math.PI / 180);
      dx = Math.cos(ang) * distance;
      dy = -Math.sin(ang) * distance;
      rotation = this.lobster.rotation % 360;
    }

    this.lobster.rotation = rotation;
    tile.style.setProperty('--lobster-rotation', `${rotation}deg`);
    tile.style.setProperty('--escape-x', `${dx}px`);
    tile.style.setProperty('--escape-y', `${dy}px`);
    tile.classList.add('lobster-escape');

    // Wait for animation to complete, then reset
    setTimeout(() => {
      this.isEscaping = false;
      this.isOnEdge = false;
      this.reset();
      this.render();
    }, 1600); // Slightly longer than 1.5s animation to ensure it completes
  }
}

// ==========================================================
// GAME 2: CARD MATCHING GAME
// ==========================================================
// Classic memory/concentration game with Scottish Gaelic sea creature cards
// 12 cards total (6 pairs) - flip two at a time to find matches
// Each card shows a different tweed pattern on the back
// When you find a match, those cards stay face-up
// Points awarded when all pairs are matched
// No time limit - take as long as you need
// ==========================================================

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
    if (!board) {
      console.warn('Game 2 board element not found');
      return;
    }

    const cardImages = [
      { name: 'Guga', src: './svgs/game-2/card-items/gannet.svg' },
      { name: 'Portan', src: './svgs/game-2/card-items/shorecrab.svg' },
      { name: 'Cliabh', src: './svgs/game-2/card-items/creel.svg' },
      { name: 'Easgann', src: './svgs/game-2/card-items/eel.svg' },
      { name: 'Crosgag', src: './svgs/game-2/card-items/starfish.svg' },
      { name: 'Sgadan', src: './svgs/game-2/card-items/herring.svg' }
    ];

    this.cards = [...cardImages, ...cardImages].sort(() => Math.random() - 0.5);

    // Use template string for faster rendering
    const cardsHTML = this.cards.map((card, index) => {
      // Random tweed pattern for each card (1-9)
      const tweedNumber = Math.floor(Math.random() * 9) + 1;
      return `
      <div class="card"
           data-index="${index}"
           role="button"
           tabindex="0"
           aria-label="Cairt ${index + 1} - falaichte">
        <div class="card-inner">
          <div class="card-face card-back">
            <img src="./svgs/game-2/tweeds/tweed-${tweedNumber}.svg" alt="Cùl na cairt" loading="lazy">
          </div>
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
    this.updatePairsFound();
  }

  attachCardListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(cardEl => {
      const index = parseInt(cardEl.dataset.index);

      cardEl.addEventListener('click', () => this.flipCard(index));
      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.flipCard(index);
        }
      });
    });
  }

  flipCard(index) {
    // Prevent clicking same card, already matched, or during processing
    if (this.isProcessing || this.flipped.has(index) || this.matched.has(index)) {
      this.showFeedback('Chan urrainn dhut an cairt sin a thaghadh!', 'error');
      return;
    }

    const cardEl = document.querySelector(`.card[data-index="${index}"]`);
    if (!cardEl) return;

    this.flipped.add(index);
    cardEl.classList.add('flipped');
    cardEl.setAttribute('aria-label', `Cairt ${index + 1} - ${this.cards[index].name}`);

    if (this.flipped.size === 2) {
      this.moves++;
      this.updateMoves();
      this.checkMatch();
    }
  }

  updateMoves() {
    const movesCounter = document.getElementById('moves-counter');
    if (movesCounter) {
      movesCounter.textContent = this.moves;
    }
  }

  updatePairsFound() {
    const pairsFound = document.getElementById('pairs-found');
    if (pairsFound) {
      const found = this.matched.size / 2;
      pairsFound.textContent = `${found}/${this.totalPairs}`;
    }
  }

  showFeedback(message, type = 'info') {
    // Feedback messages disabled for cleaner gameplay experience
    return;
  }

  checkMatch() {
    this.isProcessing = true;
    const [index1, index2] = Array.from(this.flipped);
    const cards = document.querySelectorAll('.card');

    if (this.cards[index1].name === this.cards[index2].name) {
      // Match found! 🎉
      setTimeout(() => {
        this.matched.add(index1);
        this.matched.add(index2);
        cards[index1].classList.add('matched');
        cards[index2].classList.add('matched');
        cards[index1].setAttribute('aria-label', `Cairt ${index1 + 1} - ${this.cards[index1].name} - air a mhaidseadh`);
        cards[index2].setAttribute('aria-label', `Cairt ${index2 + 1} - ${this.cards[index2].name} - air a mhaidseadh`);
        cards[index1].setAttribute('aria-disabled', 'true');
        cards[index2].setAttribute('aria-disabled', 'true');

        // Update UI
        this.updatePairsFound();

        // Show encouraging feedback
        const encouragement = this.getEncouragementMessage();
        this.showFeedback(encouragement, 'success');

        // Trigger stone animation to cairn from first matched card
        this.animateStoneTocairn(cards[index1]);

        this.flipped.clear();
        this.isProcessing = false;

        if (this.matched.size === this.cards.length) {
          setTimeout(() => this.gameComplete(), 500);
        }
      }, 400);
    } else {
      // No match - show wiggle animation and flip back
      cards[index1].classList.add('card-mismatch');
      cards[index2].classList.add('card-mismatch');

      this.showFeedback('Feuch a-rithist!', 'mismatch');

      setTimeout(() => {
        cards[index1].classList.remove('flipped', 'card-mismatch');
        cards[index2].classList.remove('flipped', 'card-mismatch');
        cards[index1].setAttribute('aria-label', `Cairt ${index1 + 1} - falaichte`);
        cards[index2].setAttribute('aria-label', `Cairt ${index2 + 1} - falaichte`);
        this.flipped.clear();
        this.isProcessing = false;
      }, 1000);
    }
  }

  getEncouragementMessage() {
    const pairsFound = this.matched.size / 2;
    const messages = [
      'Math thu! 🌟',
      'Sàr-mhath! ⭐',
      'Tha thu math air seo! 💫',
      'Glè mhath! ✨',
      'Taghta! 🎯',
      "A' dol gu math! 👏"
    ];

    if (pairsFound === 1) return "A' chiad phaidhir! Math thu! 🌟";
    if (pairsFound === this.totalPairs - 1) return 'Aon phaidhir eile! 💪';

    return messages[Math.floor(Math.random() * messages.length)];
  }

  animateStoneTocairn(cardElement) {
    // Create flying stone element (matching Game 1 style)
    const stone = document.createElement('img');
    stone.src = './svgs/all-games/stone.svg';
    stone.classList.add('stone-fly');
    stone.style.position = 'fixed';
    stone.style.width = '50px';
    stone.style.height = '50px';
    stone.style.zIndex = '9999';
    stone.style.pointerEvents = 'none';
    stone.style.display = 'block';

    // Start position: centre of the matched card
    let startX, startY;
    if (cardElement) {
      const cardRect = cardElement.getBoundingClientRect();
      startX = cardRect.left + cardRect.width / 2;
      startY = cardRect.top + cardRect.height / 2;
    } else {
      // Fallback: centre of the game board
      const board = document.getElementById('game2-board');
      const boardRect = board.getBoundingClientRect();
      startX = boardRect.left + boardRect.width / 2;
      startY = boardRect.top + boardRect.height / 2;
    }

    stone.style.left = `${startX}px`;
    stone.style.top = `${startY}px`;

    document.body.appendChild(stone);

    // End position: cairn icon
    const cairn = document.getElementById('cairn-spotlight');
    if (!cairn) {
      console.warn('Cairn element not found');
      stone.remove();
      this.controller.addPointToCairn();
      return;
    }

    const cairnRect = cairn.getBoundingClientRect();
    const dx = cairnRect.left - startX;
    const dy = cairnRect.top - startY;

    // Set custom properties for CSS animation (same as Game 1)
    stone.style.setProperty('--fly-x', `${dx}px`);
    stone.style.setProperty('--fly-y', `${dy}px`);
    stone.classList.add('stone-fly-animate');

    // Wait for animation to complete
    setTimeout(() => {
      stone.remove();

      // Pulse cairn (same timing as Game 1)
      cairn.classList.add('pulsing');
      setTimeout(() => cairn.classList.remove('pulsing'), 800);

      this.controller.addPointToCairn();

      const counter = document.getElementById('points-counter');
      if (counter) {
        counter.classList.add('points-reward');
        setTimeout(() => counter.classList.remove('points-reward'), 600);
      }
    }, 800);
  }

  gameComplete() {
    let compliment = 'Sàr-mhath!';
    if (this.moves <= 8) {
      compliment = 'Air leth! Tha cuimhne sgoinneil agad! 🌟';
    } else if (this.moves <= 12) {
      compliment = 'Glè mhath! 🎉';
    }

    this.showFeedback(`${compliment} Lorg thu na paidhrichean uile ann an ${this.moves} gluasadan!`, 'success');

    setTimeout(() => {
      this.controller.setGameFlowState('GAME3_READY');
    }, 3000);
  }

  reset() {
    this.flipped.clear();
    this.matched.clear();
    this.attempts = 0;
    this.moves = 0;
    this.isProcessing = false;

    // Reset UI counters
    this.updateMoves();
    this.updatePairsFound();

    // Clear message
    const message = document.getElementById('game2-message');
    if (message) {
      message.className = 'game2-message';
      message.textContent = '';
    }
  }
}

// ==========================================================
// GAME 3: UNDERWATER FISHING GAME
// ==========================================================
// "Cho luath ris a' bhradan" (As fast as the salmon)
// Dynamic fishing game with depth zones that change over time
// Click on the fish that Ruairidh asks for to score points
// Three zones: SHALLOW → MID_DEPTH → DEEP (with different fish species)
// Combo system rewards consecutive correct catches
// Milestone bonuses at 5, 10, 15 combo streaks
// Also collect garbage for bonus points
// 135 second time limit (2 mins 15 secs)
// Point values carefully balanced to keep totals under 300 across all 3 games
// ==========================================================

class Game3FishingGame {
  constructor(controller) {
    this.controller = controller;  // Reference to main controller

    // ===== GAME STATE =====
    this.gameActive = false;  // Is the game currently running?
    this.isPaused = false;    // Pause state

    // ===== TIMING =====
    // Originally was 180s (3 mins) but reduced for better pacing
    this.timeRemaining = 135;  // 2 minutes 15 seconds
    this.elapsedTime = 0;      // Tracks how long game has been running
    this.currentDepth = 'SHALLOW';  // Starts shallow, goes deeper over time

    // ===== SCORING =====
    this.points = 0;           // Points earned THIS game (seperate from total)
    this.correctCatches = 0;   // Total correct fish caught
    this.totalAttempts = 0;    // Total clicks (correct + wrong)

    // ===== ENCOURAGEMENT MESSAGES =====
    // Rotating positive feedback messages in Gaelic
    // Only shown after 5 correct catches in a row
    this.encouragementMessages = [
      "Sin thu fhèin!",  // That's yourself! (Well done!)
      "Sgoinneil!",      // Excellent!
      "Fìor Mhath!"      // Very good!
    ];
    this.currentMessageIndex = 0;  // Track which message to show next
    this.correctStreakCount = 0;   // Track consecutive correct catches

    // ===== FISH SPAWNING =====
    this.activeFish = [];      // Array of fish currently swimming on screen
    this.lastSpawnTime = 0;    // Timestamp of last fish spawn
    this.spawnInterval = 400;  // Milliseconds between spawns (adjusts dynamically)

    // Fish density varies by zone - deeper = fewer but more valuable fish
    this.maxFish = 8;  // SHALLOW=8, MID_DEPTH=6, DEEP=4

    // ===== ZONE TRANSITIONS =====
    // When transitioning between depths, we need special handling
    this.isZoneTransitioning = false;  // Currently in transition animation?
    this.transitionFishCount = 0;      // Tracks transition fish spawning

    // ===== BUBBLES (DECORATIVE) =====
    this.activeBubbles = [];    // Bubbles floating up for atmosphere
    this.lastBubbleSpawn = 0;
    this.bubbleInterval = 300;  // Spawn rate for bubbles

    // ===== SHRIMP SHOALING =====
    // Shrimp move in groups (shoals) rather than individually
    this.shrimpShoal = [];      // Current shoal of shrimp
    this.lastShoalSpawn = 0;

    // ===== ANIMATION LOOPS =====
    this.animationFrameId = null;  // requestAnimationFrame ID
    this.timerIntervalId = null;   // setInterval ID for countdown timer

    // ===== FISH CATALOG =====
    // Load all the fish types and their properties
    this.fishManifest = this.getFishManifest();

    // ===== ORDER SYSTEM =====
    // Ruairidh tells you which fish to catch
    // Changes every 8-15 seconds to keep it interesting
    this.currentOrder = null;      // { type: 'fish', target: 'giomach' }
    this.lastOrderChange = 0;
    this.orderChangeInterval = 8000;  // Base interval, gets randomized

    // ===== FISH NAME TRANSLATIONS =====
    // Maps fish IDs to their Scottish Gaelic display names
    // These show up in Ruairidh's speech bubble when he asks for a fish
    this.fishNames = {
      // SHALLOW water species (tiny creatures)
      shrimp: "Carran",          // Shrimp
      crubag: "Crùbag",          // Hermit crab
      giomach_side: "Giomach",   // Lobster
      banag_beag: "Banag Beag",  // Small lumpfish
      banag_mor: "Banag Mòr",    // Large lumpfish
      creachann: "Creachann",    // Scallop
      stroilleag: "Stroilleag",  // Jellyfish
      creagag: "Creagag",        // Cuckoo wrasse
      // MID_DEPTH species (medium fish)
      cuiteag: "Cuiteag",              // Whiting
      cudan: "Cùdan",                  // Haddock
      sgadan: "Sgadan",                // Herring
      leobag: "Leòbag",                // Plaice
      breac_geal: "Breac Geal",        // White trout
      iasg_galldach: "Sgeit",  // Skate/Ray
      breac_garbh: "Breac Garbh",      // Rough trout
      // DEEP water species (big fish)
      trosg: "Trosg",            // Cod
      cat_mara: "Cat-mara",      // Catfish
      manach: "Manach",          // Monkfish
      muc_mara: "Muc-mhara",     // Porpoise
      tuna: "Tùna"               // Tuna
    };
  }

  // ===== FISH DATABASE =====
  // This is where we define every fish type in the game
  // Each fish has properties that control its behaviour:
  // - zone: which depth it appears at (SHALLOW/MID_DEPTH/DEEP)
  // - direction: which way it swims (L/R/EITHER/UP)
  // - basePoints: how many points it's worth (before multipliers)
  // - speed: how fast it moves across screen
  // - size: visual size in pixels
  // - spawnWeight: how likely it is to spawn (higher = more common)
  // - special flags: isShoaling, isDarting, isWavy, isFloater, etc.
  //
  // IMPORTANT: Point values have been carefully rebalanced to prevent students
  // from going over 300 total points across all 3 games. Don't increase these
  // without checking the overall point economy!
  getFishManifest() {
    return {
      // ===== SHALLOW ZONE (0-60 seconds) =====
      // Small critters, low points, fast movement
      // Sizes increased to make them easier to click on mobile
      shrimp: { id: 'shrimp', svg: './svgs/game-3/game-3-fish/shrimp-L.svg', zone: 'SHALLOW', direction: 'L', basePoints: 1, speed: 8.0, size: 85, spawnWeight: 5, isShoaling: true, isScurrying: true, isValid: true },
      crubag: { id: 'crubag', svg: './svgs/game-3/game-3-fish/crùbag-either.svg', zone: 'SHALLOW', direction: 'EITHER', basePoints: 1, speed: 4.5, size: 115, spawnWeight: 4, isValid: true },
      giomach_side: { id: 'giomach_side', svg: './svgs/game-3/game-3-fish/giomach-side-R.svg', zone: 'SHALLOW', direction: 'R', basePoints: 2, speed: 4.0, size: 170, spawnWeight: 3, isValid: true },
      banag_beag: { id: 'banag_beag', svg: './svgs/game-3/game-3-fish/bànag beag-R.svg', zone: 'SHALLOW', direction: 'R', basePoints: 2, speed: 5.5, size: 155, spawnWeight: 4, isDarting: true, isValid: true },
      banag_mor: { id: 'banag_mor', svg: './svgs/game-3/game-3-fish/bànag mòr-R.svg', zone: 'SHALLOW', direction: 'R', basePoints: 2, speed: 5.5, size: 175, spawnWeight: 3, isDarting: true, isValid: true },
      creachann: { id: 'creachann', svg: './svgs/game-3/game-3-fish/creachann.svg', zone: 'SHALLOW', direction: 'EITHER', basePoints: 2, speed: 3.0, size: 110, spawnWeight: 2, isValid: true },
      stroilleag: { id: 'stroilleag', svg: './svgs/game-3/game-3-fish/stròilleag.svg', zone: 'SHALLOW', direction: 'UP', basePoints: 3, speed: 5.0, size: 185, spawnWeight: 3, isMultiDirectional: true, isValid: true },
      creagag: { id: 'creagag', svg: './svgs/game-3/game-3-fish/creagag-R.svg', zone: 'SHALLOW', direction: 'R', basePoints: 3, speed: 5.0, size: 120, spawnWeight: 3, isValid: true },

      // GARBAGE (can appear anytime, floats upward)
      garbage_bag: { id: 'garbage_bag', svg: './svgs/game-3/game-3-garbage/garbage-bag-1.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.0, size: 100, spawnWeight: 2, isFloater: true, isValid: false },
      plastic_bag: { id: 'plastic_bag', svg: './svgs/game-3/game-3-garbage/plastic bag.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.5, size: 90, spawnWeight: 2, isFloater: true, isValid: false },
      plastic_bottle_1: { id: 'plastic_bottle_1', svg: './svgs/game-3/game-3-garbage/plastic-bottle-1.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.0, size: 80, spawnWeight: 2, isFloater: true, isValid: false },
      plastic_bottle_2: { id: 'plastic_bottle_2', svg: './svgs/game-3/game-3-garbage/plastic bottle-2.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.2, size: 85, spawnWeight: 2, isFloater: true, isValid: false },
      straw: { id: 'straw', svg: './svgs/game-3/game-3-garbage/straw.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.8, size: 70, spawnWeight: 1, isFloater: true, isValid: false },
      welly: { id: 'welly', svg: './svgs/game-3/game-3-garbage/welly-either.svg', zone: 'GARBAGE', direction: 'EITHER', basePoints: 1, speed: 2.0, size: 100, spawnWeight: 1, isFloater: true, isValid: false },

      // MID_DEPTH ZONE (60-120s) - Medium fish (20-60cm real size) - MUCH BIGGER AGAIN
      cuiteag: { id: 'cuiteag', svg: './svgs/game-3/game-3-fish/cuiteag-R.svg', zone: 'MID_DEPTH', direction: 'R', basePoints: 5, speed: 7.0, size: 210, spawnWeight: 4, isDarting: true, isValid: true },
      cudan: { id: 'cudan', svg: './svgs/game-3/game-3-fish/cudan-R.svg', zone: 'MID_DEPTH', direction: 'R', basePoints: 5, speed: 7.0, size: 210, spawnWeight: 4, isWavy: true, isValid: true },
      sgadan: { id: 'sgadan', svg: './svgs/game-3/game-3-fish/sgadan-L.svg', zone: 'MID_DEPTH', direction: 'L', basePoints: 6, speed: 7.5, size: 220, spawnWeight: 4, isWavy: true, isValid: true },
      leobag: { id: 'leobag', svg: './svgs/game-3/game-3-fish/leòbag-L.svg', zone: 'MID_DEPTH', direction: 'L', basePoints: 7, speed: 6.0, size: 240, spawnWeight: 3, isValid: true },
      breac_geal: { id: 'breac_geal', svg: './svgs/game-3/game-3-fish/breac-geal-R.svg', zone: 'MID_DEPTH', direction: 'R', basePoints: 8, speed: 7.5, size: 270, spawnWeight: 3, isValid: true },
      iasg_galldach: { id: 'iasg_galldach', svg: './svgs/game-3/game-3-fish/sgeit.svg', zone: 'MID_DEPTH', direction: 'EITHER', basePoints: 10, speed: 7.5, size: 280, spawnWeight: 3, isValid: true },
      breac_garbh: { id: 'breac_garbh', svg: './svgs/game-3/game-3-fish/breac-garbh-R.svg', zone: 'MID_DEPTH', direction: 'R', basePoints: 12, speed: 7.0, size: 300, spawnWeight: 2, isValid: true },

      // DEEP ZONE (120-180s) - Large predators but not too easy to catch
      trosg: { id: 'trosg', svg: './svgs/game-3/game-3-fish/trosg-R.svg', zone: 'DEEP', direction: 'R', basePoints: 15, speed: 8.5, size: 220, spawnWeight: 4, isValid: true },
      cat_mara: { id: 'cat_mara', svg: './svgs/game-3/game-3-fish/cat-mara-R.svg', zone: 'DEEP', direction: 'R', basePoints: 18, speed: 9.0, size: 230, spawnWeight: 3, isValid: true },
      manach: { id: 'manach', svg: './svgs/game-3/game-3-fish/mànach.svg', zone: 'DEEP', direction: 'R', basePoints: 22, speed: 8.0, size: 250, spawnWeight: 3, isValid: true },
      muc_mara: { id: 'muc_mara', svg: './svgs/game-3/game-3-fish/muc-mara-R.svg', zone: 'DEEP', direction: 'R', basePoints: 28, speed: 7.5, size: 280, spawnWeight: 2, isValid: true },
      tuna: { id: 'tuna', svg: './svgs/game-3/game-3-fish/tùna-L.svg', zone: 'DEEP', direction: 'L', basePoints: 50, speed: 10.0, size: 300, spawnWeight: 1, isValid: true, onlyAfter: 150 }
    };
  }

  init() {
    this.gameActive = true;
    this.timeRemaining = 180;
    this.elapsedTime = 0;
    this.updateZone('SHALLOW');
    this.generateNewOrder(); // Start with first order
    this.startTimerLoop();
    this.startGameLoop();
  }

  generateNewOrder() {
    // Always generate fish orders (no phrase orders)
    // Pick a random valid fish from current zone (not welly)
    const validFish = Object.keys(this.fishManifest).filter(key => {
      const fish = this.fishManifest[key];
      return fish.isValid && fish.zone === this.currentDepth;
    });

    const targetFish = validFish[Math.floor(Math.random() * validFish.length)];

    this.currentOrder = {
      type: 'fish',
      target: targetFish
    };

    this.updateOrderDisplay();

    // CRITICAL: Immediately spawn the ordered fish to guarantee it appears
    this.spawnOrderedFish(targetFish);

    // Randomize next order change time (8-15 seconds)
    this.orderChangeInterval = 8000 + Math.random() * 7000;
    this.lastOrderChange = Date.now();
  }

  spawnOrderedFish(fishId) {
    // Force spawn the ordered fish immediately
    const fishData = this.fishManifest[fishId];
    if (!fishData) return;

    // If it's a shoaling fish, spawn just one instead of a group
    if (fishData.isShoaling) {
      this.createFishElement(fishData, 0, 1);
    } else {
      this.createFishElement(fishData);
    }
  }

  updateOrderDisplay() {
    // Display fish image and name in centred card format
    const targetFishDisplay = document.getElementById('target-fish-display');

    if (!targetFishDisplay) return;

    const fishId = this.currentOrder.target;
    const fishData = this.fishManifest[fishId];
    const fishName = this.fishNames[fishId];

    targetFishDisplay.innerHTML = `
      <img src="${fishData.svg}" alt="${fishName}" class="target-fish-image" />
      <div class="target-fish-name">${fishName}</div>
    `;
  }


  checkOrderChangeNeeded() {
    if (Date.now() - this.lastOrderChange >= this.orderChangeInterval) {
      this.generateNewOrder();
    }
  }

  startTimerLoop() {
    this.controller.timeRemaining = this.timeRemaining;
    this.controller.updateGame1TimerDisplay();

    this.timerIntervalId = setInterval(() => {
      if (!this.gameActive || this.isPaused) return;

      this.timeRemaining--;
      this.elapsedTime++;
      this.controller.timeRemaining = this.timeRemaining;
      this.controller.updateGame1TimerDisplay();

      // HCI: Zone warnings (5 seconds before transition)
      if (this.elapsedTime === 40 && this.currentDepth === 'SHALLOW') {
        this.showZoneWarning('MID_DEPTH', 5);
      } else if (this.elapsedTime === 85 && this.currentDepth === 'MID_DEPTH') {
        this.showZoneWarning('DEEP', 5);
      }

      // HCI: Faster zone transitions (45s and 90s instead of 60s and 120s)
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

  startGameLoop() {
    const gameLoop = (timestamp) => {
      if (!this.gameActive) return;
      if (!this.isPaused) {
        this.updateFish();
        this.spawnFishIfNeeded(timestamp);
        this.spawnBubblesIfNeeded(timestamp);
        this.updateBubbles();
        this.updateBackgroundDimming();
        this.checkOrderChangeNeeded(); // Check if Ruairidh should change his mind
      }
      this.animationFrameId = requestAnimationFrame(gameLoop);
    };
    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  updateZone(zone) {
    this.currentDepth = zone;
    const canvas = document.getElementById('game3-canvas');
    const label = document.getElementById('depth-label');

    if (canvas) {
      canvas.className = `game3-canvas-container zone-${zone.toLowerCase()}`;
    }
    if (label) {
      label.textContent = zone.replace('_', ' ');
    }

    // Update spawn interval - much faster for lots of fish
    if (zone === 'SHALLOW') this.spawnInterval = 400;
    else if (zone === 'MID_DEPTH') this.spawnInterval = 350;
    else if (zone === 'DEEP') this.spawnInterval = 350; // Plenty of activity

    // Reduced fish density to prevent cluttering
    if (zone === 'SHALLOW') this.maxFish = 5;      // Small fish (140-200px)
    else if (zone === 'MID_DEPTH') this.maxFish = 4; // Medium (210-300px) + some SHALLOW
    else if (zone === 'DEEP') this.maxFish = 3;     // Large (320-500px) + some MID_DEPTH
  }

  // ===== DEPTH ZONE TRANSITIONS =====
  // As the game progresses, you "descend" deeper into the ocean
  // SHALLOW (0-45s) → MID_DEPTH (45-90s) → DEEP (90-135s)
  // Each zone has different fish species and difficulty
  // Transitions are animated to feel natural rather than jarring
  transitionZone(newZone) {
    const canvas = document.getElementById('game3-canvas');
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

      // IMPORTANT: Change the fish order immediately
      // Otherwise Ruairidh might be asking for a fish that doesn't exist in this zone!
      this.generateNewOrder();

      canvas.style.opacity = '1';  // Restore brightness

      // After a couple seconds, go back to normal spawning behaviour
      setTimeout(() => {
        this.isZoneTransitioning = false;
      }, 2000);
    }, 200);
  }

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
    const canvas = document.getElementById('game3-canvas');
    if (!canvas) return;

    // Translate zone names to Scottish Gaelic
    const zoneNames = {
      'MID_DEPTH': 'Meadhan-doimhneachd',
      'DEEP': 'Domhainn'
    };
    const zoneName = zoneNames[nextZone] || nextZone;

    const warning = document.createElement('div');
    warning.className = 'zone-warning';
    warning.textContent = `A' dol sìos gu ${zoneName} ann an ${countdownSeconds}...`;
    canvas.appendChild(warning);

    let countdown = countdownSeconds;
    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        warning.textContent = `A' dol sìos gu ${zoneName} ann an ${countdown}...`;
      } else {
        clearInterval(interval);
        warning.remove();
      }
    }, 1000);
  }

  spawnFishIfNeeded(timestamp) {
    // HCI: Use adaptive maxFish based on zone (8→6→4)
    if (this.activeFish.length >= this.maxFish) return;

    if (timestamp - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnFish();
      this.lastSpawnTime = timestamp;
    }
  }

  spawnFish() {
    // Allow fish from previous zones as distractions + garbage anytime
    const validFish = Object.values(this.fishManifest).filter(f => {
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

    // Weighted random selection
    const totalWeight = validFish.reduce((sum, f) => sum + f.spawnWeight, 0);
    let random = Math.random() * totalWeight;
    let selectedFish = validFish[0];

    for (const fish of validFish) {
      random -= fish.spawnWeight;
      if (random <= 0) {
        selectedFish = fish;
        break;
      }
    }

    // HCI: Time-based fish scarcity (less aggressive than before)
    if (this.currentOrder && selectedFish.id === this.currentOrder.target) {
      const timeSinceOrder = Date.now() - this.lastOrderChange;

      // First 5 seconds: Skip 20% (spawn often to help player)
      // After 5 seconds: Skip 40% (moderate challenge)
      const skipRate = timeSinceOrder < 5000 ? 0.2 : 0.4;

      if (Math.random() < skipRate) {
        return; // Skip spawning to maintain some scarcity
      }
    }

    // Shoaling behaviour: Spawn shrimp in groups
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

  createFishElement(fishData, shoalIndex = 0, shoalSize = 1) {
    const canvas = document.getElementById('game3-canvas');
    if (!canvas) return;

    const fish = document.createElement('div');
    fish.className = 'game3-fish';

    // Create img element for SVG
    const img = document.createElement('img');
    img.src = fishData.svg;
    img.alt = fishData.id;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    fish.appendChild(img);

    // Determine direction based on SVG filename
    // R in filename = travels RIGHT to LEFT (spawn right, negative speed)
    // L in filename = travels LEFT to RIGHT (spawn left, positive speed)
    let dir = fishData.direction;
    if (dir === 'EITHER') {
      dir = Math.random() < 0.5 ? 'L' : 'R';
    }

    const canvasRect = canvas.getBoundingClientRect();

    // Use individual fish size from manifest
    const fishSize = fishData.size || 70;

    // Special handling for bottom-dwelling creatures and floating objects
    const isBottomDweller = (fishData.id === 'shrimp' || fishData.id === 'crubag' || fishData.id === 'giomach_side' || fishData.id === 'creachann');
    const isFloater = fishData.isFloater || false; // Check manifest property for all garbage items

    let verticalPos;
    let actualSpeed;
    let speedVariation = (Math.random() - 0.5) * 2; // +/- 1.0

    if (isFloater) {
      // All garbage items float upward from bottom to top
      fish.style.left = `${Math.random() * (canvasRect.width - 100)}px`;
      verticalPos = canvasRect.height + 50; // Start below screen
      actualSpeed = -(2 + Math.random()); // Negative = upward movement (will be applied to Y)
    } else if (isBottomDweller) {
      // Lobsters and crabs crawl along the very bottom
      // Starting position based on direction
      if (dir === 'L') {
        fish.style.left = '-120px';
      } else {
        fish.style.left = `${canvasRect.width + 20}px`;
      }
      // Position at very bottom - ensure full fish is visible by subtracting fishSize
      verticalPos = canvasRect.height - fishSize - 10; // 10px padding from absolute bottom

      // HCI: Dynamic speed scaling for bottom dwellers too
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
      // Regular fish - swim in middle area
      const topMargin = 150;
      const bottomMargin = 20; // Small padding from bottom
      const availableHeight = canvasRect.height - topMargin - fishSize - bottomMargin;

      // During zone transition, spawn new deeper zone fish from bottom (emerging effect)
      if (this.isZoneTransitioning &&
          this.transitionFishCount < 4 &&
          (fishData.zone === 'MID_DEPTH' || fishData.zone === 'DEEP')) {

        // Spawn from bottom centre area, swimming upward initially
        fish.style.left = `${canvasRect.width * 0.3 + Math.random() * (canvasRect.width * 0.4)}px`;
        verticalPos = canvasRect.height + 100; // Start below screen

        // Mark fish as emerging from depths with fade-in effect
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

      // HCI: Dynamic speed scaling within zones for smooth difficulty progression
      let baseSpeed;
      const zoneProgress = this.elapsedTime % 45; // 0-44 within current zone
      const progressFactor = zoneProgress / 45;    // 0.0 to 1.0

      if (this.currentDepth === 'SHALLOW') {
        baseSpeed = 5 + progressFactor * 2;  // 5→7 over 45 seconds
      } else if (this.currentDepth === 'MID_DEPTH') {
        baseSpeed = 7 + progressFactor * 3;  // 7→10 over 45 seconds
      } else if (this.currentDepth === 'DEEP') {
        baseSpeed = 10 + progressFactor * 4; // 10→14 over 45 seconds
      } else {
        baseSpeed = fishData.speed; // Fallback
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

    // HCI: Scale hitbox padding based on fish size to reduce fat-finger errors
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
    const canvas = document.getElementById('game3-canvas');
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

        // Add slight horizontal drift
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

      // Special movement for all garbage items (float upward)
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
          // Crabs: Timid side-to-side movement with pauses and darts
          fish.crabTimer++;

          // Phase 1: Pause (30 frames = ~0.5 seconds)
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
            fish.x += fish.speed * 3; // Fast dart!
          }
          // Reset cycle
          else {
            fish.crabTimer = 0;
          }
        } else {
          // Lobsters: Steady crawl along bottom
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

      // Multi-directional movement (squids/jellyfish) - swim head-first in various directions
      if (fish.isMultiDirectional) {
        // Initialize movement variables if not set
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

        // Tentacles at bottom, head at top - always swim head-first (upward bias)
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

        // Pulsing motion (like jellyfish)
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

      // Scurrying movement (shrimp) - fast, jittery, erratic
      if (fish.isScurrying) {
        // Initialize scurry variables
        if (!fish.scurryTimer) {
          fish.scurryTimer = 0;
          fish.scurrySpeed = fish.speed;
        }

        fish.scurryTimer++;

        // Random speed bursts every 10-20 frames
        if (fish.scurryTimer % (10 + Math.floor(Math.random() * 10)) === 0) {
          fish.scurrySpeed = fish.speed * (0.5 + Math.random() * 1.5); // 0.5x to 2x speed
        }

        // Quick jittery movement
        fish.x += fish.scurrySpeed;

        // Erratic vertical jitter
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

      // Darting movement (small agile fish) - burst then glide
      if (fish.isDarting) {
        if (!fish.dartTimer) {
          fish.dartTimer = 0;
          fish.dartPhase = 0; // 0 = burst, 1 = glide
        }

        fish.dartTimer++;

        if (fish.dartPhase === 0) {
          // Burst phase - fast movement (30 frames)
          fish.x += fish.speed * 1.5;
          fish.wavyOffset += 0.2;
          fish.y += Math.sin(fish.wavyOffset) * 2;

          if (fish.dartTimer > 30) {
            fish.dartTimer = 0;
            fish.dartPhase = 1;
          }
        } else {
          // Glide phase - slower, smooth (40 frames)
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
        // Natural swimming - subtle up/down bob
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

    // Handle garbage specially - always gives 1 point, doesn't affect combo
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

    // Check if fish ID matches target order
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

    // Only show encouragement message after 5 in a row
    if (this.correctStreakCount >= 5) {
      this.showEncouragementMessage();
      this.correctStreakCount = 0;  // Reset streak after showing message
    }

    this.animateCorrectCatch(fishObj, pointsEarned);

    // Immediately change order after successful catch
    this.generateNewOrder();
  }

  handleWrongCatch(fishObj) {
    const penalty = Math.abs(fishObj.data.basePoints);
    this.points = Math.max(0, this.points - penalty);
    this.controller.totalPoints = Math.max(0, this.controller.totalPoints - penalty);
    this.controller.updatePointsDisplayOnly();

    // Reset streak counter on wrong catch
    this.correctStreakCount = 0;

    this.animateWrongCatch(fishObj, penalty);

    // Special squid ink effect when clicking wrong squid
    if (fishObj.data.id === 'stroilleag') {
      this.triggerSquidInkEffect();
    }
  }

  triggerSquidInkEffect() {
    const canvas = document.getElementById('game3-canvas');
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
    // Garbage always gives 1 point, but resets the streak
    const pointsEarned = 1;
    this.points += pointsEarned;
    this.controller.totalPoints += pointsEarned;
    this.controller.updatePointsDisplayOnly();

    // Reset streak counter when catching garbage
    this.correctStreakCount = 0;

    // Animate garbage catch with green points
    this.animateGarbageCatch(fishObj, pointsEarned);
  }

  // ===== REMOVED: COMBO MULTIPLIER SYSTEM =====
  // Multiplier system removed - now using base points only with encouragement messages
  // Previous system caused score imbalance and was confusing for students
  /*
  getMultiplier(combo) {
    if (combo <= 2) return 1.0;
    if (combo <= 5) return 1.1;
    if (combo <= 10) return 1.15;
    return 1.2;
  }
  */

  // Show rotating encouragement messages when catching correct fish
  // Creates a centre-screen popup that appears and fades out
  showEncouragementMessage() {
    const canvas = document.getElementById('game3-canvas');
    if (!canvas) return;

    // Get the next message in rotation
    const message = this.encouragementMessages[this.currentMessageIndex];

    // Create a new popup element (reuses the milestone-flash CSS styling)
    const flash = document.createElement('div');
    flash.className = 'milestone-flash';
    flash.textContent = message;

    // Add it to the canvas so it appears centre-screen
    canvas.appendChild(flash);

    // Move to next message for next time
    this.currentMessageIndex = (this.currentMessageIndex + 1) % this.encouragementMessages.length;

    // Remove the popup after 1.5 seconds
    setTimeout(() => flash.remove(), 1500);
  }

  updateBackgroundDimming() {
    const screen = document.querySelector('.game3-screen');
    if (!screen) return;

    // Progressive dimming based on elapsed time
    // 0-60s: No dimming
    // 60-120s: Light dimming (20% opacity)
    // 120-150s: Medium dimming (40% opacity)
    // 150-180s: Heavy dimming (60% opacity)

    if (this.elapsedTime >= 150) {
      screen.className = 'game3-screen dimming-heavy';
    } else if (this.elapsedTime >= 120) {
      screen.className = 'game3-screen dimming-medium';
    } else if (this.elapsedTime >= 60) {
      screen.className = 'game3-screen dimming-light';
    } else {
      screen.className = 'game3-screen';
    }
  }

  animateCorrectCatch(fishObj, points) {
    const fish = fishObj.element;

    fish.style.transition = 'transform 0.1s ease';
    fish.style.transform = 'scale(1.4)';

    // HCI: Show points text
    const pointsText = document.createElement('div');
    pointsText.className = 'points-text';
    pointsText.textContent = `+${points}`;
    pointsText.style.left = fish.style.left;
    pointsText.style.top = fish.style.top;
    document.getElementById('game3-canvas').appendChild(pointsText);

    setTimeout(() => pointsText.remove(), 1000);

    setTimeout(() => {
      fish.style.transition = 'all 0.6s ease-out';
      fish.style.transform = 'scale(0) translateY(-200px)';
      fish.style.opacity = '0';
      setTimeout(() => {
        fish.remove();
        // CRITICAL FIX: Remove from activeFish array
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
          // CRITICAL FIX: Remove from activeFish array
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
    document.getElementById('game3-canvas').appendChild(penaltyText);

    setTimeout(() => penaltyText.remove(), 1000);
  }

  animateGarbageCatch(fishObj, points) {
    const fish = fishObj.element;

    fish.style.transition = 'transform 0.1s ease';
    fish.style.transform = 'scale(1.3)';

    // Show points text in green for garbage
    const pointsText = document.createElement('div');
    pointsText.className = 'points-text garbage';
    pointsText.textContent = `+${points} ♻️`;
    pointsText.style.left = fish.style.left;
    pointsText.style.top = fish.style.top;
    document.getElementById('game3-canvas').appendChild(pointsText);

    setTimeout(() => pointsText.remove(), 1000);

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

  // ===== REMOVED: MILESTONE CELEBRATION =====
  // Milestone bonus system removed in favour of simple encouragement messages
  // Previous system created score imbalance across games
  /*
  celebrateMilestone() {
    const milestone = this.comboStreak;
    const bonusPoints = milestone * 100;
    this.points += bonusPoints;
    this.controller.totalPoints += bonusPoints;
    this.controller.updatePointsDisplayOnly();
    this.controller.playPointSound();
    const canvas = document.getElementById('game3-canvas');
    if (!canvas) return;
    const flash = document.createElement('div');
    flash.className = 'milestone-flash';
    flash.textContent = `🎉 ${milestone} COMBO! +${bonusPoints} BONUS`;
    canvas.appendChild(flash);
    setTimeout(() => flash.remove(), 2000);
  }
  */

  // ===== UNDERWATER BUBBLE EFFECTS =====
  // Decorative bubbles float up to make the scene feel more alive
  // Frequency and size adjust based on depth for realism

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
    const canvas = document.getElementById('game3-canvas');
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

    // Speed varies by depth (slower rise in deeper water - physics!)
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
    const canvas = document.getElementById('game3-canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    for (let i = this.activeBubbles.length - 1; i >= 0; i--) {
      const bubble = this.activeBubbles[i];

      // Rise upward
      bubble.y -= bubble.speed;

      // Wobble horizontally for realism
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

// ==========================================================
// SMART HELP SYSTEM - HCI-DRIVEN DESIGN
// ==========================================================
class SmartHelpSystem {
  constructor(gameController) {
    this.controller = gameController;
    this.currentTab = 'quickstart';
    this.modalElement = null;
    this.isOpen = false;

    // Context tracking for smart suggestions
    this.playerContext = {
      isFirstTime: !localStorage.getItem('glac_played_before'),
      lobstersCaught: parseInt(localStorage.getItem('glac_lobsters_caught') || '0'),
      lobstersEscaped: parseInt(localStorage.getItem('glac_lobsters_escaped') || '0'),
      gamesPlayed: parseInt(localStorage.getItem('glac_games_played') || '0'),
      lastPlayedDate: localStorage.getItem('glac_last_played')
    };

    // Interactive demo state
    this.demoState = {
      rockPlacements: [],
      showingPathAnimation: false
    };
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.createModal();
    this.isOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Focus management for accessibility
    setTimeout(() => {
      const firstTab = this.modalElement.querySelector('.help-tab');
      if (firstTab) firstTab.focus();
    }, 100);
  }

  close() {
    if (this.modalElement) {
      this.modalElement.classList.remove('active');
      setTimeout(() => {
        if (this.modalElement && this.modalElement.parentNode) {
          this.modalElement.remove();
        }
        this.modalElement = null;
      }, 300);
    }
    this.isOpen = false;
    document.body.style.overflow = ''; // Restore scrolling
  }

  createModal() {
    // Remove existing modal if any
    const existing = document.getElementById('smart-help-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'smart-help-modal';
    modal.className = 'help-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'help-modal-title');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = this.generateModalHTML();
    document.body.appendChild(modal);

    this.modalElement = modal;
    this.attachEventListeners();

    // Trigger active state for animation
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }

  generateModalHTML() {
    return `
      <div class="help-modal-content">
        <div class="help-modal-header">
          <button class="modal-close" onclick="gameController.helpSystem.close()" aria-label="Close help">✕</button>
          <h2 class="help-modal-title" id="help-modal-title">
            <span class="help-modal-title-icon"><img src="./svgs/game-1/lobster.svg" alt="" style="width: 40px; height: 40px;"></span>
            <span>How to Play: Catch the Lobster</span>
          </h2>
          ${this.generateTabs()}
        </div>
        <div class="help-modal-body">
          ${this.generateTabPanels()}
        </div>
      </div>
    `;
  }

  generateTabs() {
    const tabs = [
      { id: 'quickstart', icon: './svgs/game-1/lobster.svg', label: 'Quick Start', badge: this.playerContext.isFirstTime },
      { id: 'rules', icon: './svgs/game-1/rock-wall.svg', label: 'Rules' },
      { id: 'howto', icon: './svgs/all-games/cairn.svg', label: 'How to Play' },
      { id: 'troubleshoot', icon: './svgs/all-games/clock.svg', label: 'Help' }
    ];

    return `
      <div class="help-tabs" role="tablist">
        ${tabs.map(tab => `
          <button
            class="help-tab ${tab.id === this.currentTab ? 'active' : ''}"
            role="tab"
            aria-selected="${tab.id === this.currentTab}"
            aria-controls="panel-${tab.id}"
            data-tab="${tab.id}"
          >
            <span class="help-tab-icon"><img src="${tab.icon}" alt="" style="width: 20px; height: 20px;"></span>
            <span>${tab.label}</span>
            ${tab.badge ? '<span class="help-tab-badge"></span>' : ''}
          </button>
        `).join('')}
      </div>
    `;
  }

  generateTabPanels() {
    return `
      <div id="panel-quickstart" class="help-tab-panel ${this.currentTab === 'quickstart' ? 'active' : ''}" role="tabpanel">
        ${this.generateQuickStartContent()}
      </div>
      <div id="panel-rules" class="help-tab-panel ${this.currentTab === 'rules' ? 'active' : ''}" role="tabpanel">
        ${this.generateRulesContent()}
      </div>
      <div id="panel-howto" class="help-tab-panel ${this.currentTab === 'howto' ? 'active' : ''}" role="tabpanel">
        ${this.generateHowToContent()}
      </div>
      <div id="panel-troubleshoot" class="help-tab-panel ${this.currentTab === 'troubleshoot' ? 'active' : ''}" role="tabpanel">
        ${this.generateTroubleshootContent()}
      </div>
    `;
  }

  generateQuickStartContent() {
    let content = '';

    // Context-aware suggestion
    if (this.playerContext.isFirstTime) {
      content += `
        <div class="context-suggestion">
          <div class="context-suggestion-title">
            <span class="context-suggestion-icon"><img src="./svgs/game-1/lobster.svg" alt="" style="width: 24px; height: 24px;"></span>
            <span>Welcome!</span>
          </div>
          <div class="context-suggestion-content">
            This is your first time playing. Here's how to get started!
          </div>
        </div>
      `;
    } else if (this.playerContext.lobstersEscaped > this.playerContext.lobstersCaught * 2) {
      content += `
        <div class="context-suggestion">
          <div class="context-suggestion-title">
            <span class="context-suggestion-icon"><img src="./svgs/game-1/rock-wall.svg" alt="" style="width: 24px; height: 24px;"></span>
            <span>Having Trouble?</span>
          </div>
          <div class="context-suggestion-content">
            Try placing rocks far away from the lobster first, then close in slowly.
          </div>
        </div>
      `;
    }

    content += `
      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/game-1/lobster.svg" alt=""></span>
          <span>Game Goal</span>
        </h3>
        <div class="help-section-content">
          <p><strong>Catch as many lobsters as you can in 4 minutes!</strong> Each lobster you catch gives you 1 point.</p>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/game-1/rock-wall.svg" alt=""></span>
          <span>How to Play</span>
        </h3>
        <ol class="help-steps">
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Find the Lobster</div>
              <div class="help-step-description">The red lobster is trying to escape to the edge!</div>
            </div>
          </li>
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Place Rocks</div>
              <div class="help-step-description">Click on yellow tiles to place rocks. Rocks block the lobster.</div>
            </div>
          </li>
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Trap It!</div>
              <div class="help-step-description">Put rocks all around the lobster so it can't escape.</div>
            </div>
          </li>
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Get Points</div>
              <div class="help-step-description">A stone flies to your cairn. A new lobster appears!</div>
            </div>
          </li>
        </ol>
      </div>

      <div class="help-tip">
        <span class="help-tip-icon"><img src="./svgs/all-games/cairn.svg" alt="" style="width: 20px; height: 20px;"></span>
        <p class="help-tip-content"><strong>Tip:</strong> Start placing rocks far away from the lobster, then slowly close in.</p>
      </div>
    `;

    return content;
  }

  generateRulesContent() {
    return `
      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/all-games/clock.svg" alt=""></span>
          <span>Time Limit</span>
        </h3>
        <div class="help-section-content">
          <p>You have <strong>4 minutes</strong> to catch as many lobsters as you can.</p>
          <p>The timer at the top changes color:</p>
          <ul>
            <li><strong style="color: white; background: #666; padding: 2px 8px; border-radius: 4px;">White</strong> - Lots of time left</li>
            <li><strong style="color: #ffeb3b; background: #666; padding: 2px 8px; border-radius: 4px;">Yellow</strong> - Less than 1 minute</li>
            <li><strong style="color: #ff9800; background: #666; padding: 2px 8px; border-radius: 4px;">Orange</strong> - Less than 30 seconds</li>
            <li><strong style="color: #ff4444; background: #666; padding: 2px 8px; border-radius: 4px;">Red</strong> - Only 10 seconds left!</li>
          </ul>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/game-1/rock-wall.svg" alt=""></span>
          <span>Placing Rocks</span>
        </h3>
        <div class="help-section-content">
          <p><strong>Click on yellow tiles</strong> to place rocks.</p>
          <p><strong>Rules:</strong></p>
          <ul>
            <li>You can place rocks on <strong>empty yellow tiles</strong></li>
            <li>You <strong>can't</strong> place rocks where there's already a rock</li>
            <li>You <strong>can't</strong> place rocks on the lobster</li>
            <li>You can place as many rocks as you want</li>
            <li>Once you place a rock, you can't remove it</li>
          </ul>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/game-1/lobster.svg" alt=""></span>
          <span>How the Lobster Moves</span>
        </h3>
        <div class="help-section-content">
          <p>The lobster is smart and tries to escape!</p>
          <ul>
            <li>When you place a rock, the lobster moves one step</li>
            <li>It always looks for the shortest way to the edge</li>
            <li>It will go around your rocks to escape</li>
            <li>If there's no way to the edge, you caught it!</li>
          </ul>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/all-games/cairn.svg" alt=""></span>
          <span>Winning & Scoring</span>
        </h3>
        <div class="help-section-content">
          <p><strong>Catching:</strong> Block all paths to the edge and you catch it!</p>
          <p><strong>Escaping:</strong> If the lobster reaches the edge, it escapes and a new one appears.</p>
          <p><strong>Points:</strong> Each lobster caught = 1 point (1 stone in your cairn)</p>
          <p><strong>Your score:</strong> How many lobsters you caught in 4 minutes</p>
        </div>
      </div>

      <div class="help-tip">
        <span class="help-tip-icon"><img src="./svgs/game-1/rock-wall.svg" alt="" style="width: 20px; height: 20px;"></span>
        <p class="help-tip-content"><strong>Remember:</strong> Make sure there are no gaps! The lobster will find any opening.</p>
      </div>
    `;
  }

  generateHowToContent() {
    return `
      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/game-1/rock-wall.svg" alt=""></span>
          <span>Controls</span>
        </h3>
        <div class="help-section-content">
          <p><strong>Playing the game:</strong></p>
          <ul>
            <li><strong>Click</strong> on yellow tiles to place rocks</li>
            <li><strong>Hover</strong> over tiles to see a preview</li>
          </ul>
          <p><strong>Buttons:</strong></p>
          <ul>
            <li><strong>Sound button</strong> - Turn sound on/off</li>
            <li><strong>Pause button</strong> - Pause/play the game</li>
            <li><strong>? button</strong> - Open this help menu</li>
            <li><strong>"Tòisich a-rithist" button</strong> - Start over with a new lobster</li>
          </ul>
        </div>
      </div>

      <div class="help-demo">
        <div class="help-demo-title"><img src="./svgs/game-1/lobster.svg" alt="" style="width: 24px; height: 24px; vertical-align: middle;"> Try It! Click to Place Rocks</div>
        <div class="help-demo-content">
          <p><strong>Practice here!</strong> Click on the yellow hexagons to place rocks:</p>
          <div id="rock-placement-demo" class="help-demo-grid"></div>
          <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
            <em>Click the yellow tiles to place rocks. The lobster will try to find a way around them!</em>
          </p>
        </div>
      </div>

      <div class="help-section">
        <h3 class="help-section-title">
          <span class="help-section-icon"><img src="./svgs/all-games/cairn.svg" alt=""></span>
          <span>Your First Catch</span>
        </h3>
        <ol class="help-steps">
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Find the Lobster</div>
              <div class="help-step-description">Look for the red lobster. See which edge is closest - that's where it wants to go!</div>
            </div>
          </li>
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Start Far Away</div>
              <div class="help-step-description">Click on tiles <strong>far from the lobster</strong> to make a wall. Don't get too close yet!</div>
            </div>
          </li>
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Build More Walls</div>
              <div class="help-step-description">Put rocks on all sides. Make a box or U-shape around the lobster.</div>
            </div>
          </li>
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">Close the Trap</div>
              <div class="help-step-description">Fill in any gaps. Make sure there's no way to the edge!</div>
            </div>
          </li>
          <li class="help-step">
            <div class="help-step-content">
              <div class="help-step-title">You Did It!</div>
              <div class="help-step-description">The lobster says "Ghlac thu mi!" (You caught me!). Watch the stone fly to your cairn!</div>
            </div>
          </li>
        </ol>
      </div>
    `;
  }

  generateStrategiesContent() {
    return `
      <div class="strategy-card">
        <div class="strategy-card-title">
          <span>🎯</span>
          <span>The "Far Fence" Strategy</span>
        </div>
        <div class="strategy-card-content">
          <p><strong>Best for beginners!</strong> Start by placing rocks FAR away from the lobster to build a fence between it and the nearest edge. This gives you more room to work and prevents the lobster from escaping while you finish your trap.</p>
          <p><strong>Why it works:</strong> The lobster can't surprise you by slipping past if you're working from a safe distance.</p>
        </div>
      </div>

      <div class="strategy-card">
        <div class="strategy-card-title">
          <span>📐</span>
          <span>The "U-Shape Trap"</span>
        </div>
        <div class="strategy-card-content">
          <p>Build three walls in a U-shape, then close the fourth side. This is efficient because you only need to block 3 directions before finishing the trap.</p>
          <p><strong>Pro tip:</strong> Position the opening of the U toward the CENTRE of the board, not toward an edge!</p>
        </div>
      </div>

      <div class="strategy-card">
        <div class="strategy-card-title">
          <span>⚡</span>
          <span>The "Corner Push" Technique</span>
        </div>
        <div class="strategy-card-content">
          <p>If the lobster is near a corner, use the board edges to your advantage! You only need to build 2 walls instead of 4, because the board edges act as natural barriers.</p>
          <p><strong>Advanced:</strong> Try to "herd" the lobster toward a corner by blocking its other escape routes first.</p>
        </div>
      </div>

      <div class="strategy-card">
        <div class="strategy-card-title">
          <span>🧠</span>
          <span>Predict the Path</span>
        </div>
        <div class="strategy-card-content">
          <p>The lobster always takes the <strong>shortest path</strong> to an edge. After placing a rock, mentally trace where it will go next. Place your next rock to block that direction!</p>
          <p><strong>Watch for:</strong> The lobster might change direction if you block its path - stay one step ahead.</p>
        </div>
      </div>

      <div class="strategy-card">
        <div class="strategy-card-title">
          <span>⏱️</span>
          <span>Time Management</span>
        </div>
        <div class="strategy-card-content">
          <p><strong>Early game (5:00-3:00):</strong> Take your time. Build solid, complete traps.</p>
          <p><strong>Mid game (3:00-1:00):</strong> Speed up slightly. Aim for 1 lobster every 30-40 seconds.</p>
          <p><strong>Late game (1:00-0:00):</strong> Go for quick catches! Use corners and edges to trap faster.</p>
        </div>
      </div>

      <div class="help-tip">
        <span class="help-tip-icon">🏆</span>
        <p class="help-tip-content"><strong>Expert Challenge:</strong> Can you catch 10 lobsters in 4 minutes? That's averaging one every 24 seconds - it requires both speed and smart trap placement!</p>
      </div>
    `;
  }

  generateTroubleshootContent() {
    return `
      <div class="troubleshoot-item">
        <div class="troubleshoot-question">
          <span class="troubleshoot-question-text">The lobster keeps escaping! How do I trap it?</span>
          <span class="troubleshoot-toggle">▼</span>
        </div>
        <div class="troubleshoot-answer">
          <p>You need to put rocks all around the lobster with NO gaps:</p>
          <ul>
            <li>Check all sides - did you miss any spaces?</li>
            <li>Start far away, then slowly close in</li>
            <li>If the lobster is near the edge, it can escape faster</li>
          </ul>
        </div>
      </div>

      <div class="troubleshoot-item">
        <div class="troubleshoot-question">
          <span class="troubleshoot-question-text">I can't click on a tile. Why?</span>
          <span class="troubleshoot-toggle">▼</span>
        </div>
        <div class="troubleshoot-answer">
          <p>Check these things:</p>
          <ul>
            <li>Is there already a rock there? You can only click empty yellow tiles</li>
            <li>Is the lobster on that tile? You can't place rocks on the lobster</li>
            <li>Is the game paused? Click the play button</li>
            <li>Wait for the lobster to finish moving</li>
          </ul>
        </div>
      </div>

      <div class="troubleshoot-item">
        <div class="troubleshoot-question">
          <span class="troubleshoot-question-text">The lobster moved a weird way. Why?</span>
          <span class="troubleshoot-toggle">▼</span>
        </div>
        <div class="troubleshoot-answer">
          <p>The lobster is smart! It always looks for the shortest way to the edge.</p>
          <p>If it moved in a different direction than you expected, that path must be shorter. Try blocking both sides!</p>
        </div>
      </div>

      <div class="troubleshoot-item">
        <div class="troubleshoot-question">
          <span class="troubleshoot-question-text">What does "Ghlac thu mi!" mean?</span>
          <span class="troubleshoot-toggle">▼</span>
        </div>
        <div class="troubleshoot-answer">
          <p><strong>"Ghlac thu mi!"</strong> means <strong>"You caught me!"</strong> in Scottish Gaelic.</p>
          <p>When you see this, you won! Watch the stone fly to your cairn.</p>
        </div>
      </div>

      <div class="troubleshoot-item">
        <div class="troubleshoot-question">
          <span class="troubleshoot-question-text">How can I catch lobsters faster?</span>
          <span class="troubleshoot-toggle">▼</span>
        </div>
        <div class="troubleshoot-answer">
          <p>Quick tips:</p>
          <ul>
            <li>Use corners - you need fewer rocks there</li>
            <li>Don't think too much - just block all paths</li>
            <li>Start placing rocks right away</li>
            <li>After a few games, you'll get faster!</li>
          </ul>
        </div>
      </div>

      <div class="troubleshoot-item">
        <div class="troubleshoot-question">
          <span class="troubleshoot-question-text">Can I start over if I make a mistake?</span>
          <span class="troubleshoot-toggle">▼</span>
        </div>
        <div class="troubleshoot-answer">
          <p><strong>Yes!</strong> Click the <strong>"Tòisich a-rithist"</strong> button at the bottom.</p>
          <p>This gives you a new lobster, but your timer keeps going!</p>
        </div>
      </div>

      <div class="help-tip">
        <span class="help-tip-icon"><img src="./svgs/game-1/lobster.svg" alt="" style="width: 20px; height: 20px;"></span>
        <p class="help-tip-content">The lobster sometimes says things like "haoi," "duda?," or "mach às mo rathad" - these are just fun Scottish Gaelic phrases!</p>
      </div>
    `;
  }

  attachEventListeners() {
    if (!this.modalElement) return;

    // Tab switching
    const tabs = this.modalElement.querySelectorAll('.help-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Keyboard navigation
    this.modalElement.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.handleTabKeyboard(e);
      }
    });

    // Click outside to close
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    // Collapsible FAQ functionality
    const faqItems = this.modalElement.querySelectorAll('.troubleshoot-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.troubleshoot-question');
      if (question) {
        question.addEventListener('click', () => {
          item.classList.toggle('open');
        });
        // Keyboard accessibility
        question.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.classList.toggle('open');
          }
        });
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
      }
    });

    // Initialize interactive demo after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeRockPlacementDemo();
    }, 100);
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update tab buttons
    const tabs = this.modalElement.querySelectorAll('.help-tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive.toString());
    });

    // Update tab panels
    const panels = this.modalElement.querySelectorAll('.help-tab-panel');
    panels.forEach(panel => {
      const isActive = panel.id === `panel-${tabId}`;
      panel.classList.toggle('active', isActive);
    });

    // Reinitialize demos if switching to How to Play
    if (tabId === 'howto') {
      setTimeout(() => {
        this.initializeRockPlacementDemo();
      }, 50);
    }
  }

  handleTabKeyboard(e) {
    const tabs = Array.from(this.modalElement.querySelectorAll('.help-tab'));
    const currentIndex = tabs.findIndex(tab => tab.classList.contains('active'));

    let newIndex;
    if (e.key === 'ArrowLeft') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    } else {
      newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    }

    tabs[newIndex].click();
    tabs[newIndex].focus();
    e.preventDefault();
  }

  initializeRockPlacementDemo() {
    const demoContainer = this.modalElement?.querySelector('#rock-placement-demo');
    if (!demoContainer) return;

    // Clear existing content
    demoContainer.innerHTML = '';
    this.demoState.rockPlacements = [];

    // Create a simple 5x4 hex grid demo
    const demoHTML = `
      <div style="position: relative; width: 280px; height: 220px; margin: 0 auto;">
        <svg viewBox="0 0 280 220" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          ${this.generateDemoHexagons()}
        </svg>
        <div style="text-align: center; margin-top: 230px; font-size: 0.9rem; color: #666;">
          The lobster (red tile) will try to escape to the edges!
        </div>
      </div>
    `;

    demoContainer.innerHTML = demoHTML;
    this.attachDemoListeners();
  }

  generateDemoHexagons() {
    const hexSize = 25;
    const hexWidth = hexSize * 2;
    const hexHeight = hexSize * Math.sqrt(3);
    const lobsterPos = { x: 2, y: 2 }; // Centre position

    let svg = '';

    // Create 5x4 grid
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const offsetX = row % 2 === 1 ? hexWidth * 0.75 : 0;
        const x = col * hexWidth * 1.5 + offsetX + 40;
        const y = row * hexHeight * 0.75 + 30;

        const isLobster = (col === lobsterPos.x && row === lobsterPos.y);
        const fillColor = isLobster ? '#ff6b6b' : '#ffd700';
        const dataKey = `${col},${row}`;

        svg += `
          <g class="demo-hex-tile" data-pos="${dataKey}" style="cursor: ${isLobster ? 'not-allowed' : 'pointer'};">
            <polygon
              points="${this.getHexPoints(x, y, hexSize)}"
              fill="${fillColor}"
              stroke="#e6c200"
              stroke-width="2"
              class="demo-hex-bg"
            />
            ${isLobster ? `<image href="./svgs/game-1/lobster.svg" x="${x - hexSize}" y="${y - hexSize}" width="${hexSize * 2}" height="${hexSize * 2}" />` : ''}
          </g>
        `;
      }
    }

    return svg;
  }

  getHexPoints(cx, cy, size) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * (Math.PI / 180);
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  attachDemoListeners() {
    const hexTiles = this.modalElement?.querySelectorAll('.demo-hex-tile');
    if (!hexTiles) return;

    hexTiles.forEach(tile => {
      tile.addEventListener('click', () => {
        const pos = tile.dataset.pos;
        if (pos === '2,2') return; // Can't place on lobster

        // Check if already has rock
        if (this.demoState.rockPlacements.includes(pos)) return;

        // Add rock
        this.demoState.rockPlacements.push(pos);

        // Visual feedback - add rock image
        const polygon = tile.querySelector('.demo-hex-bg');
        const rock = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        rock.setAttribute('href', './svgs/game-1/rock-wall.svg');
        const bounds = polygon.getBBox();
        rock.setAttribute('x', bounds.x);
        rock.setAttribute('y', bounds.y);
        rock.setAttribute('width', bounds.width);
        rock.setAttribute('height', bounds.height);
        tile.appendChild(rock);

        // Disable further clicks on this tile
        tile.style.cursor = 'not-allowed';
        tile.style.opacity = '0.8';
      });

      tile.addEventListener('mouseenter', () => {
        const pos = tile.dataset.pos;
        if (pos === '2,2' || this.demoState.rockPlacements.includes(pos)) return;

        const polygon = tile.querySelector('.demo-hex-bg');
        polygon.setAttribute('fill', '#ffeb3b');
      });

      tile.addEventListener('mouseleave', () => {
        const pos = tile.dataset.pos;
        if (pos === '2,2' || this.demoState.rockPlacements.includes(pos)) return;

        const polygon = tile.querySelector('.demo-hex-bg');
        polygon.setAttribute('fill', '#ffd700');
      });
    });
  }

  // Track player actions for context-aware suggestions
  recordLobsterCaught() {
    const count = parseInt(localStorage.getItem('glac_lobsters_caught') || '0') + 1;
    localStorage.setItem('glac_lobsters_caught', count.toString());
    this.playerContext.lobstersCaught = count;
  }

  recordLobsterEscaped() {
    const count = parseInt(localStorage.getItem('glac_lobsters_escaped') || '0') + 1;
    localStorage.setItem('glac_lobsters_escaped', count.toString());
    this.playerContext.lobstersEscaped = count;
  }

  markAsPlayed() {
    localStorage.setItem('glac_played_before', 'true');
    localStorage.setItem('glac_last_played', new Date().toISOString());
    const gamesPlayed = parseInt(localStorage.getItem('glac_games_played') || '0') + 1;
    localStorage.setItem('glac_games_played', gamesPlayed.toString());
    this.playerContext.isFirstTime = false;
    this.playerContext.gamesPlayed = gamesPlayed;
  }
}

// ==========================================================
// BOOTSTRAP / RESIZE HOOKS
// ==========================================================
let gameController;
document.addEventListener('DOMContentLoaded', () => {
  gameController = new GameFlowController();
  gameController.setGameFlowState('LOGIN');
});

window.addEventListener('resize', () => {
  if (gameController && gameController.game1Board && gameController.currentState === 'GAME1') {
    gameController.game1Board.render();
  }
});
