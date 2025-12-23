// Game Controller - Main application logic
class GameController {
  constructor() {
    this.currentState = 'LOGIN';
    this.gameContainer = document.getElementById('game-container');
    this.participantCode = null;
    this.gameData = {};
    this.tutorialStep = 0;
  }

  setState(newState) {
    console.log(`Transitioning: ${this.currentState} → ${newState}`);
    this.currentState = newState;
    this.gameContainer.innerHTML = '';

    switch (newState) {
      case 'LOGIN':
        this.renderLogin();
        break;
      case 'TUTORIAL':
        this.renderTutorial();
        break;
      case 'GAME1':
        this.renderGame1();
        break;
      case 'RESULTS':
        this.renderResults();
        break;
    }
  }

  renderLogin() {
    const html = `
      <div class="login-screen">
        <h1>Fàilte</h1>
        <p>Glac an Giomach</p>
        <div class="form-group">
          <label for="participant-code">Cuir a-steach do chòd agad:</label>
          <input 
            type="text" 
            id="participant-code" 
            placeholder="e.g. ABC123" 
            aria-label="Participant code input"
          />
        </div>
        <button onclick="game.handleLoginSubmit()" class="play-button">
          Tòisich
        </button>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    
    // Allow Enter key to submit
    document.getElementById('participant-code').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLoginSubmit();
    });
  }

  renderTutorial() {
    const html = `
      <div class="tutorial-screen">
        <h2>Mar a chluicheas tu</h2>
        <div id="tutorial-text"></div>
        <div class="tutorial-nav">
          <button onclick="game.previousTutorial()" class="nav-btn">← Air ais</button>
          <span id="tutorial-counter">1 / 3</span>
          <button onclick="game.nextTutorial()" class="nav-btn">Air adhart →</button>
        </div>
        <button onclick="game.setState('GAME1')" class="play-button">
          Tòisich an Geama
        </button>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.tutorialStep = 0;
    this.showTutorialStep(0);
  }

  renderGame1() {
    const html = `
      <div class="game-screen">
        <canvas id="game-canvas"></canvas>
        <div id="hud">
          <p>Score: <span id="score">0</span></p>
        </div>
      </div>
    `;
    this.gameContainer.innerHTML = html;
    this.initializeGame1();
  }

  renderResults() {
    const html = `
      <div class="tutorial-screen">
        <h2>Tapadh leibh!</h2>
        <div id="tutorial-text">
          <p>Your score: <strong>${this.gameData.score || 0}</strong></p>
        </div>
        <button onclick="game.setState('LOGIN')" class="play-button">
          Ath-thòisich
        </button>
      </div>
    `;
    this.gameContainer.innerHTML = html;
  }

  handleLoginSubmit() {
    const code = document.getElementById('participant-code').value;
    if (code.trim()) {
      this.participantCode = code;
      this.gameData = { participantCode: code };
      this.setState('TUTORIAL');
    } else {
      alert('Cuir a-steach do chòd, le do thoil');
    }
  }

  nextTutorial() {
    this.tutorialStep++;
    if (this.tutorialStep >= 3) this.tutorialStep = 2;
    this.showTutorialStep(this.tutorialStep);
  }

  previousTutorial() {
    this.tutorialStep--;
    if (this.tutorialStep < 0) this.tutorialStep = 0;
    this.showTutorialStep(this.tutorialStep);
  }

  showTutorialStep(step) {
    const steps = [
      'Ceum 1: Slaod an uidheam-glacaidh gus an giomach a ghlacadh',
      'Ceum 2: Briog air a\' phutan nuair a bhios an giomach a-staigh',
      'Ceum 3: Feuch an cuir thu barrachd giomachdan ann do do bharaille!'
    ];
    document.getElementById('tutorial-text').textContent = steps[step];
    document.getElementById('tutorial-counter').textContent = `${step + 1} / 3`;
  }

  initializeGame1() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;

    // Placeholder game loop
    let score = 0;
    document.getElementById('score').textContent = score;

    // Simple game placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(50, 50, 200, 100);
    ctx.fillStyle = '#fff5d1';
    ctx.font = 'bold 24px system-ui';
    ctx.fillText('Game 1 Canvas - Ready for implementation', 60, 100);
  }
}

// Initialize game when page loads
const game = new GameController();
window.addEventListener('load', () => {
  game.setState('LOGIN');
});

// Handle window resize for canvas
window.addEventListener('resize', () => {
  if (game.currentState === 'GAME1') {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
    }
  }
});
