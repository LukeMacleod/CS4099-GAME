// ==========================================================
// GAME CONTROLLER
// Overall game state machine and screen rendering
// ==========================================================
class GameFlowController {
  constructor() {
    this.currentState = 'LOGIN';
    this.gameContainer = document.getElementById('game-container');
    this.participantCode = null;
    this.gameData = {};
    this.tutorialStep = 0;
    this.game1Board = null;
    this.totalPoints = 0;
    this.layoutTutorialStep = 0;
    this.game1TutorialStep = 0;
    this.gameTimer = null;
    this.timeRemaining = 300;
    this.game2TutorialStep = 0;
    this.game2Board = null;
  }

  // Spotlight helper used in layout tutorial screens
  updateLayoutSpotlightPosition(elementId) {
    const element = document.getElementById(elementId);
    const overlay = document.getElementById('layout-overlay');
    if (element && overlay) {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      overlay.style.setProperty('--spotlight-x', x + 'px');
      overlay.style.setProperty('--spotlight-y', y + 'px');
    }
  }

  // Layout tutorial step progression for intro banner/help/cairn
  advanceLayoutTutorialStep() {
    if (this.layoutTutorialStep === 0) {
      this.layoutTutorialStep = 1;
      this.updateLayoutSpotlightPosition('layout-help-btn');
      this.renderGameIntro_LayoutStep2();
    } else if (this.layoutTutorialStep === 1) {
      this.layoutTutorialStep = 2;
      this.renderGameIntro_LayoutStep3();
    }
  }

  // Main state machine for the whole game flow
  setGameFlowState(newState) {
    console.log(`Transitioning: ${this.currentState} → ${newState}`);
    this.currentState = newState;
    this.gameContainer.innerHTML = '';
    switch (newState) {
      case 'LOGIN':
        this.renderLoginScreen();
        break;
      case 'RUAIRIDH_INTRO':
        this.renderIntroduction_RuairidhIntro();
        break;
      case 'PREGAME_TUTORIAL':
        this.renderGameIntro_LayoutStep1();
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
      case 'RESULTS':
        this.renderResultsScreen();
        break;
    }
  }

  // ----------------------------------------------------------
  // 1 - LOGIN
  // ----------------------------------------------------------
  renderLoginScreen() {
    const html = `
      <div class="login-screen">
        <h1>Fàilte!</h1>
        <div class="form-group">
          <label for="participant-code">Còd an cluicheadar:</label>
          <input type="text" id="participant-code" placeholder="Cuir a-steach do chòd an seo" autocomplete="off" />
        </div>
        <button class="play-button" onclick="gameController.handleLoginSubmit()">Tòisich</button>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  handleLoginSubmit() {
    const code = document.getElementById('participant-code').value.trim();
    if (code.length > 0) {
      this.participantCode = code;
      this.gameData = { participantCode: code, score: 0, gameStartTime: new Date() };
      this.setGameFlowState('RUAIRIDH_INTRO');
    } else {
      alert('Feuch gun cuir thu a-steach an còd ceart agad!');
    }
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Ruairidh speaks, single page)
  // ----------------------------------------------------------
  renderIntroduction_RuairidhIntro() {
    const html = `
      <div class="ruairidh-intro-screen">
        <div class="ruairidh-container">
          <div class="seal-icon-wrapper">
            <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
          </div>
          <div class="speech-bubble">
            <p>Is mise Ruairidh an Ròn! Tha mi an seo airson do chuideachadh leis a' gheama seo.</p>
          </div>
        </div>
        <div class="arrow-buttons centered">
          <button class="arrow-btn" onclick="gameController.setGameFlowState('PREGAME_TUTORIAL')">Air adhart ➜</button>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 1)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep1() {
    const html = `
      <div class="game-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-help-button" onclick="gameController.advanceLayoutTutorialStep()" id="layout-help-btn">?</button>
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon pulsing" id="cairn-spotlight" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div class="layout-tutorial-overlay" id="layout-overlay"></div>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen" style="max-width: 700px;">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Nise, tha mise a' cumail sùil air na puingean. Nuair a gheibh thu puing, gheibh thu clach air an càirn agad.<br><br>Cuimhich, nithear càirn mòr bho chlachan bheaga.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('RUAIRIDH_INTRO')">⬅ Air ais</button>
              <button class="arrow-btn" onclick="gameController.advanceLayoutTutorialStep()">Air adhart ➜</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.layoutTutorialStep = 0;
    this.updateLayoutSpotlightPosition('cairn-spotlight');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 2)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep2() {
    const html = `
      <div class="game-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-help-button glowing" onclick="gameController.advanceLayoutTutorialStep()" id="layout-help-btn">?</button>
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" id="cairn-spotlight" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div class="layout-tutorial-overlay" id="layout-overlay"></div>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen" style="max-width: 700px;">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Seo putan airson cuideachadh, nuair nach eil fios agad mu dheidhinn ruideihgin, brùth seo airson barrachd fios.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('RUAIRIDH_INTRO')">⬅ Air ais</button>
              <button class="arrow-btn" onclick="gameController.advanceLayoutTutorialStep()">Air adhart ➜</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.updateLayoutSpotlightPosition('layout-help-btn');
  }

  // ----------------------------------------------------------
  // 2 - INTRODUCTION (Pre-game layout tutorial, step 3)
  // ----------------------------------------------------------
  renderGameIntro_LayoutStep3() {
    const html = `
      <div class="game-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-help-button" onclick="gameController.toggleInGameHelpModal()" id="layout-help-btn">?</button>
          </div>
          <div class="ruairidh-banner-right">
            <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" id="cairn-spotlight" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
          </div>
        </div>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1000;">
          <div class="ruairidh-intro-screen" style="max-width: 700px;">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>A chiad gheama a chluicheas sinn se Glac an Giomach. A bheil thu deiseil?</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.renderGameIntro_LayoutStep2()">⬅ Air ais</button>
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

  renderGame1Tutorial_Step1() {
  const html = `
    <div class="game1-screen game1-tutorial-step1">
      <div class="ruairidh-banner">
        <div class="ruairidh-banner-left">
          <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button>
        </div>
        <div class="banner-title-container">
          <div class="game1-title-fun">Glac an Giomach</div>
        </div>
        <div class="ruairidh-banner-right">
          <div class="points-box">
            <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
            <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">0</span>
          </div>
        </div>
      </div>

      <div class="game1-tutorial-content-wrapper">
        <div class="game1-tutorial-text-section">
          <div class="ruairidh-intro-screen game1-tutorial-box">
            <div class="ruairidh-container" style="flex-direction: column; gap: 1.5rem;">
              <div class="seal-icon-wrapper">
                <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 150px; height: 150px;" />
              </div>
              <div class="speech-bubble">
                <p>Fàilte dhan tràigh, a charaid!<br><br>Bidh iad ag ràdh… San Earrach, nuair a bhios a chaora caol, bidh am maorach reamhar.<br><br>'S fìor thoil leam giomaich, ach tha iad cho duilich an glacadh!<br><br>Le sin, tha mi ag iarraidh do chuideachadh.</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('PREGAME_TUTORIAL')">⬅ Air ais</button>
              <button class="arrow-btn" onclick="gameController.game1TutorialStep = 1; gameController.renderGame1Tutorial_Step2();">Air adhart ➜</button>
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

  setTimeout(() => {
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
  const html = `
    <div class="game1-screen game1-tutorial-step2">
      <div class="ruairidh-banner">
        <div class="ruairidh-banner-left">
          <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button>
        </div>
        <div class="banner-title-container">
          <div class="game1-title-fun">Glac an Giomach</div>
        </div>
        <div class="ruairidh-banner-right">
          <div class="points-box">
            <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
            <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">0</span>
          </div>
        </div>
      </div>

      <div class="game1-tutorial-content-wrapper game1-tutorial-step2">
        <div class="game1-tutorial-text-section">
          <div class="ruairidh-intro-screen game1-tutorial-box">
            <div class="ruairidh-container" style="flex-direction: column; gap: 1.5rem;">
              <div class="seal-icon-wrapper">
                <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 150px; height: 150px;" />
              </div>
              <div class="speech-bubble">
                <p>Ri mo thaobh chì thu giomach agus blocaichean gainmhich bhuidhe. Seo far a bheil sinn a' dol a dh' fheuchainn giomaich a ghlacadh!</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.game1TutorialStep = 0; gameController.renderGame1Tutorial_Step1();">⬅ Air ais</button>
              <button class="arrow-btn" onclick="gameController.game1TutorialStep = 2; gameController.renderGame1Tutorial_Step3();">Air adhart ➜</button>
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
  const html = `
    <div class="game1-screen game1-tutorial-step3">
      <div class="ruairidh-banner">
        <div class="ruairidh-banner-left">
          <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button>
        </div>
        <div class="banner-title-container">
          <div class="game1-title-fun">Glac an Giomach</div>
        </div>
        <div class="ruairidh-banner-right">
          <div class="points-box">
            <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" />
            <div class="ruairidh-banner-text">PUINGEAN:</div>
            <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">0</span>
          </div>
        </div>
      </div>

      <div class="game1-tutorial-content-wrapper game1-tutorial-step3">
        <div class="game1-tutorial-text-section">
          <div class="ruairidh-intro-screen game1-tutorial-box">
            <div class="ruairidh-container" style="flex-direction: column; gap: 1.5rem;">
              <div class="seal-icon-wrapper">
                <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 150px; height: 150px;" />
              </div>
              <div class="speech-bubble">
                <p>Nuair a bhrùthas tu air an gainmheach bhuidhe, 's urrainn dhut clach a chur sìos. Cha toil leis na giomaich a dhol thairis air na clachan!<br><br>Airson a h-uile giomach a gheibh thu thèid clach a chur air an càirn.<br><br>Cuimhich tha na giomaich ann an Leòdhas gu math seòlta!<br><br>Chan eil ach còig mionaidean againn! Steall ort!</p>
              </div>
            </div>
            <div class="arrow-buttons">
              <button class="arrow-btn" onclick="gameController.game1TutorialStep = 1; gameController.renderGame1Tutorial_Step2();">⬅ Air ais</button>
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
  
  this.game1TutorialBoard.blockedSet.add('2,1');
  this.game1TutorialBoard.blockedSet.add('3,1');
  this.game1TutorialBoard.blockedSet.add('4,1');
  this.game1TutorialBoard.blockedSet.add('5,2');
  
  this.game1TutorialBoard.renderTutorial('game1-board-tutorial');
}




  // ----------------------------------------------------------
  // 4 - GAME 1 - GLAC AN GIOMACH (actual gameplay)
  // ----------------------------------------------------------
  renderGame1_Main() {
    const html = `
      <div class="game1-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-help-button" onclick="gameController.toggleInGameHelpModal()">?</button>
          </div>
          <div class="banner-title-container">
            <div class="game1-title-fun">Glac an Giomach</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="timer-box">
              <img src="./svgs/clock.svg" alt="Clock" class="timer-icon" />
              <div class="timer-text">ÙINE:</div>
              <span id="timer-display" style="color: white;">5:00</span>
            </div>
            <div class="points-box">
              <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" id="cairn-spotlight" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">${this.totalPoints}</span>
            </div>
          </div>
        </div>

        <div class="game1-board" id="game1-board"></div>
        <div class="game1-footer">
          <div id="round-status"></div>
          <button class="nav-btn" onclick="gameController.resetGame1Round()">Tòisich a-rithist</button>
          <!-- DEV TOOL: Remove before production -->
          <button class="dev-skip-btn" onclick="gameController.skipGame1TimerForDev()" style="background: #ff6b6b; color: white; padding: 0.8rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; margin-left: 1rem;">⏩ Skip Timer (DEV)</button>
        </div>
      </div>
      <div class="help-modal" id="help-modal">
        <div class="help-modal-content">
          <button class="modal-close" onclick="gameController.toggleInGameHelpModal()">✕</button>
          <h2>How to Play</h2>
          <ul>
            <li><strong>Goal:</strong> Trap the lobster by building a cage, then fill it in</li>
            <li><strong>Controls:</strong> Click squares to place rock barriers</li>
            <li><strong>Escape:</strong> If the lobster reaches the edge, it escapes and you lose!</li>
            <li><strong>Strategy:</strong> Start far away from the lobster, build a cage, then trap it</li>
            <li><strong>Points:</strong> Each successful trap = 1 point. Get as many as you can!</li>
          </ul>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.game1Board = new Game1Board(5, this);
    this.game1Board.render();
    this.updatePointsDisplayOnly();
    this.startGame1Timer();
  }

  // Dev-only helper: skip 5-minute block and move to Game 2
  skipGame1TimerForDev() {
    if (this.gameTimer) clearInterval(this.gameTimer);
    this.playTimerEndSoundEffect();
    setTimeout(() => {
      this.setGameFlowState('GAME2_READY');
    }, 500);
  }

  startGame1Timer() {
    this.timeRemaining = 300;
    this.updateGame1TimerDisplay();
    
    if (this.gameTimer) clearInterval(this.gameTimer);
    
    this.gameTimer = setInterval(() => {
      this.timeRemaining--;
      this.updateGame1TimerDisplay();
      
      if (this.timeRemaining <= 0) {
        clearInterval(this.gameTimer);
        this.playTimerEndSoundEffect();
        setTimeout(() => {
          this.setGameFlowState('GAME2_READY');
        }, 500);
      }
    }, 1000);
  }

  updateGame1TimerDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (this.timeRemaining <= 10) {
        display.classList.add('warning');
      } else {
        display.classList.remove('warning');
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
        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
          <div class="ruairidh-intro-screen" style="max-width: 700px;">
            <div class="ruairidh-container">
              <div class="seal-icon-wrapper">
                <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" />
              </div>
              <div class="speech-bubble">
                <p>Tapadh leibh airson mo chuideachadh! A bheil sibh deiseil airson an ath gheama?</p>
              </div>
            </div>
            <div class="arrow-buttons centered">
              <button class="arrow-btn" onclick="gameController.setGameFlowState('GAME2_TUTORIAL')">Air adhart ➜</button>
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
    const html = `
      <div class="game2-tutorial-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button>
          </div>
          <div class="banner-title-container">
            <div class="game1-title-fun">Cho Coltrach ris an Dà Sgadan</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="points-box">
              <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" />
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
                  <img src="./svgs/seal-2.svg" alt="Ruairidh the Seal" class="seal-icon" style="width: 120px; height: 120px;" />
                </div>
                <div class="speech-bubble">
                  <p>Anns an ath ghema tha feum agad mo chuideachadh paidhireachdan a dhèanamh bho rudan a's urrainn dhut a lorg timcheall orm aig muir. Tha gach rud air falach air cùl pìos cleòdh hearach.</p>
                </div>
              </div>
              <div class="arrow-buttons">
                <button class="arrow-btn" onclick="gameController.setGameFlowState('GAME2_READY')">⬅ Air ais</button>
                <button class="play-green-btn" onclick="gameController.setGameFlowState('GAME2')">Cluich an Geama</button>
              </div>
            </div>
          </div>

          <div class="game2-tutorial-cards-section">
            <div class="tutorial-card-grid">
              <div class="tutorial-card">
                <div class="tutorial-card-inner">
                  <div class="tutorial-card-face">
                    <img src="./svgs/tweed.svg" alt="Card back" />
                  </div>
                </div>
              </div>
              <div class="tutorial-card">
                <div class="tutorial-card-inner">
                  <div class="tutorial-card-face">
                    <img src="./svgs/tweed.svg" alt="Card back" />
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
      <div class="game2-screen">
        <div class="ruairidh-banner">
          <div class="ruairidh-banner-left">
            <button class="ruairidh-help-button" disabled style="opacity: 0.5; cursor: not-allowed;">?</button>
          </div>
          <div class="banner-title-container">
            <div class="game1-title-fun">Cho Coltrach ris an Dà Sgadan</div>
          </div>
          <div class="ruairidh-banner-right">
            <div class="points-box">
              <img src="./svgs/cairn.svg" alt="Cairn" class="cairn-icon" id="cairn-spotlight" />
              <div class="ruairidh-banner-text">PUINGEAN:</div>
              <span id="points-counter" style="color: white; font-size: clamp(1.3rem, 4vw, 1.8rem); font-weight: 800;">${this.totalPoints}</span>
            </div>
          </div>
        </div>

        <div class="game2-board" id="game2-board"></div>
        
        <div class="game2-footer">
          <div class="game2-message" id="game2-message"></div>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.game2Board = new CardMatchingGame(this);
    this.game2Board.render();
  }

  resetGame2Board() {
    if (this.game2Board) {
      this.game2Board.reset();
      this.game2Board.render();
    }
  }

  // ----------------------------------------------------------
  // Shared helpers: Help modal, points, game 1 round reset, results
  // ----------------------------------------------------------
  toggleInGameHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) modal.classList.toggle('active');
  }

  resetGame1Round() {
    if (this.game1Board) {
      this.game1Board.reset();
      this.game1Board.render();
    }
  }

  updatePointsDisplayOnly() {
    const counter = document.getElementById('points-counter');
    if (counter) {
      counter.textContent = `${this.totalPoints}`;
    }
  }

  addPointToCairn() {
    this.totalPoints++;
    this.updatePointsDisplayOnly();
  }

  // ----------------------------------------------------------
  // Final results screen after both games
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

  getNeighbors() {
    const oddRow = this.y % 2 === 1;
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

  findShortestEscapePath(blockedSet, boardSquares, gridWidth, gridHeight) {
    const start = this.position;
    const startKey = start.hash();
    const queue = [startKey];
    const parent = new Map();
    parent.set(startKey, null);

    while (queue.length) {
      const key = queue.shift();
      const [cx, cy] = key.split(',').map(Number);
      const current = new HexGridSquare(cx, cy);

      if (current.x === 0 || current.x === gridWidth - 1 || current.y === 0 || current.y === gridHeight - 1) {
        const path = [];
        let k = key;
        while (k) {
          const [px, py] = k.split(',').map(Number);
          path.unshift(new HexGridSquare(px, py));
          k = parent.get(k);
        }
        return path;
      }

      for (const neighbor of current.getNeighbors()) {
        const nk = neighbor.hash();
        if (!parent.has(nk) && boardSquares.has(nk) && !blockedSet.has(nk)) {
          parent.set(nk, key);
          queue.push(nk);
        }
      }
    }
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

class Game1Board {
  constructor(radius, controller) {
    this.controller = controller;
    this.blockedSet = new Set();
    this.lobster = null;
    this.gameOver = false;
    this.gameLost = false;
    this.isAnimating = false;
    this.isEscaping = false;
    this.tutorialAnimationInterval = null;

    this.gridWidth = 11;
    this.gridHeight = 10;

    this.boardSquares = new Map();
    this.initializeBoard();
    this.spawnLobster();
    this.placeRandomRocks();
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

  placeRandomRocks() {
  const squareArray = Array.from(this.boardSquares.values());
  const rockCount = Math.floor(squareArray.length * 0.15);
  const lobsterPosHash = this.lobster.position.hash();  // ← CACHE the lobster hash once
  
  for (let i = 0; i < rockCount; i++) {
    let square;
    let squareHash;
    
    // Keep selecting random squares until we find one that is NOT the lobster's position
    do {
      square = squareArray[Math.floor(Math.random() * squareArray.length)];
      squareHash = square.hash();
    } while (squareHash === lobsterPosHash);  // ← Direct hash comparison (faster, guaranteed safe)
    
    // Add to blocked set
    this.blockedSet.add(squareHash);
  }
}



  clickHexTile(x, y) {
    if (this.gameOver || this.gameLost || this.isAnimating || this.isEscaping) return;

    const square = new HexGridSquare(x, y);
    const key = square.hash();
    if (key === this.lobster.position.hash()) return;
    if (this.blockedSet.has(key)) return;

    this.blockedSet.add(key);

    const { nextPos, escapedIfMove } = this.lobster.getNextStep(
      this.blockedSet, this.boardSquares, this.gridWidth, this.gridHeight
    );

    if (!nextPos) {
      this.render();
      this.gameOver = true;

      const lobsterTile = this.getCurrentLobsterTile();
      if (lobsterTile) {
        const bubble = document.createElement('div');
        bubble.classList.add('lobster-speech');
        bubble.textContent = 'Ghlac thu mi!';
        lobsterTile.appendChild(bubble);

        setTimeout(() => {
          bubble.remove();

          const stone = document.createElement('img');
          stone.src = './svgs/stone.svg';
          stone.classList.add('stone-fly');
          document.body.appendChild(stone);

          const cairn = document.getElementById('cairn-spotlight');
          if (cairn) {
            const cairnRect = cairn.getBoundingClientRect();
            const tileRect = lobsterTile.getBoundingClientRect();
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
              setTimeout(() => cairn.classList.remove('pulsing'), 1500);

              setTimeout(() => {
                this.controller.addPointToCairn();

                const counter = document.getElementById('points-counter');
                if (counter) {
                  counter.classList.add('points-reward');
                  setTimeout(() => counter.classList.remove('points-reward'), 1200);
                }

                setTimeout(() => {
                  this.reset();
                  this.render();
                }, 1500);
              }, 800);
            });
          }
        }, 2000);
      }
      return;
    }

    this.animateTurnWiggleJump(nextPos, escapedIfMove);
  }

  animateTurnWiggleJump(nextPos, escapedIfMove) {
    this.isAnimating = true;

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

          if (escapedIfMove) {
            this.triggerEscapeAnimation(tile4);
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
        tile.style.cursor = 'pointer';
        tile.style.transition = 'transform 150ms ease-out, filter 150ms ease-out';

        const hexBg = this.createHexagon(hexSize);
        hexBg.classList.add('hex-sand');
        tile.appendChild(hexBg);

        if (this.blockedSet.has(key)) {
          const rock = document.createElement('img');
          rock.src = './svgs/rock-wall.svg';
          rock.classList.add('hex-rock');
          rock.style.width = '100%';
          rock.style.height = '100%';
          rock.style.objectFit = 'cover';
          rock.style.position = 'absolute';
          rock.style.top = '0';
          rock.style.left = '0';
          rock.style.zIndex = '2';
          tile.appendChild(rock);
        }

        if (this.lobster.position.x === x && this.lobster.position.y === y) {
          tile.setAttribute('data-lobster', 'true');
          tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);

          const lobster = document.createElement('img');
          lobster.src = './svgs/lobster.svg';
          lobster.classList.add('lobster-svg');
          lobster.style.width = '100%';
          lobster.style.height = '100%';
          lobster.style.objectFit = 'cover';
          lobster.style.position = 'absolute';
          lobster.style.top = '0';
          lobster.style.left = '0';
          lobster.style.zIndex = '3';
          tile.appendChild(lobster);
        }

        tile.addEventListener('click', () => {
          if (!this.blockedSet.has(key) && !(this.lobster.position.x === x && this.lobster.position.y === y)) {
            this.clickHexTile(x, y);
          }
        });

        tile.addEventListener('mouseenter', () => {
          if (!this.blockedSet.has(key) && !(this.lobster.position.x === x && this.lobster.position.y === y)) {
            tile.style.transform = 'scale(1.06)';
            tile.style.filter = 'brightness(1.15)';
          }
        });

        tile.addEventListener('mouseleave', () => {
          tile.style.transform = 'scale(1)';
          tile.style.filter = 'brightness(1)';
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

        if (this.blockedSet.has(key)) {
          const rock = document.createElement('img');
          rock.src = './svgs/rock-wall.svg';
          rock.classList.add('hex-rock');
          rock.style.width = '100%';
          rock.style.height = '100%';
          rock.style.objectFit = 'cover';
          rock.style.position = 'absolute';
          rock.style.top = '0';
          rock.style.left = '0';
          rock.style.zIndex = '2';
          tile.appendChild(rock);
        }

        if (this.lobster.position.x === x && this.lobster.position.y === y) {
          tile.setAttribute('data-lobster', 'true');
          tile.style.setProperty('--lobster-rotation', `${this.lobster.rotation}deg`);

          const lobster = document.createElement('img');
          lobster.src = './svgs/lobster.svg';
          lobster.classList.add('lobster-svg');
          lobster.style.width = '100%';
          lobster.style.height = '100%';
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
      for (let x = 0; x < this.gridHeight; x++) {
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
          lobster.src = './svgs/lobster.svg';
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

  triggerEscapeAnimation(tile) {
    if (!tile) return;

    this.isEscaping = true;

    const { x, y } = this.lobster.position;
    let rotation = 0;
    let dx = 0, dy = 0;
    const distance = 1200;

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

    setTimeout(() => {
      this.isEscaping = false;
      this.reset();
      this.render();
    }, 3000);
  }
}

// ==========================================================
// CARD MATCHING GAME (GAME 2)
// ==========================================================
class CardMatchingGame {
  constructor(controller) {
    this.controller = controller;
    this.cards = [];
    this.flipped = new Set();
    this.matched = new Set();
    this.attempts = 0;
    this.isProcessing = false;
  }

  render() {
    const board = document.getElementById('game2-board');
    if (!board) return;

    const cardImages = [
  { name: 'Guga', src: './svgs/gannet.svg' },         // Gannet (bird)
  { name: 'Portan', src: './svgs/shorecrab.svg' },    // Shore crab
  { name: 'Cliabh', src: './svgs/creel.svg' },        // Creel (basket)
  { name: 'Easgann', src: './svgs/eel.svg' },         // Eel
  { name: 'Crosgag', src: './svgs/starfish.svg' },    // Starfish 
  { name: 'Sgadan', src: './svgs/herring.svg' },      // Herring
];

    this.cards = [...cardImages, ...cardImages].sort(() => Math.random() - 0.5);

    const grid = document.createElement('div');
    grid.classList.add('card-grid');

    this.cards.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.classList.add('card');
      cardEl.style.cursor = 'pointer';

      const cardInner = document.createElement('div');
      cardInner.classList.add('card-inner');

      const cardBack = document.createElement('div');
      cardBack.classList.add('card-face', 'card-back');
      const backImg = document.createElement('img');
      backImg.src = './svgs/tweed.svg';
      cardBack.appendChild(backImg);

      const cardFront = document.createElement('div');
      cardFront.classList.add('card-face', 'card-front');
      const frontImg = document.createElement('img');
      frontImg.src = card.src;
      frontImg.classList.add('card-image');
      const label = document.createElement('div');
      label.classList.add('card-label');
      label.textContent = card.name;
      cardFront.appendChild(frontImg);
      cardFront.appendChild(label);

      cardInner.appendChild(cardBack);
      cardInner.appendChild(cardFront);
      cardEl.appendChild(cardInner);

      cardEl.addEventListener('click', () => this.flipCard(index, cardEl));

      grid.appendChild(cardEl);
    });

    board.innerHTML = '';
    board.appendChild(grid);
  }

  flipCard(index, cardEl) {
    if (this.isProcessing || this.flipped.has(index) || this.matched.has(index)) return;

    this.flipped.add(index);
    cardEl.classList.add('flipped');

    if (this.flipped.size === 2) {
      this.attempts++;
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isProcessing = true;
    const [index1, index2] = Array.from(this.flipped);

    if (this.cards[index1].name === this.cards[index2].name) {
      this.matched.add(index1);
      this.matched.add(index2);
      this.flipped.clear();
      this.isProcessing = false;

      if (this.matched.size === this.cards.length) {
        this.gameComplete();
      }
    } else {
      setTimeout(() => {
        const cards = document.querySelectorAll('.card');
        cards[index1].classList.remove('flipped');
        cards[index2].classList.remove('flipped');
        this.flipped.clear();
        this.isProcessing = false;
      }, 600);
    }
  }

  gameComplete() {
    const message = document.getElementById('game2-message');
    if (message) {
      message.textContent = `Congratulations! You matched all pairs in ${this.attempts} attempts.`;
    }

    setTimeout(() => {
      this.controller.setGameFlowState('RESULTS');
    }, 2000);
  }

  reset() {
    this.flipped.clear();
    this.matched.clear();
    this.attempts = 0;
    this.isProcessing = false;
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
