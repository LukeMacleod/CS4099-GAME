# Firebase Integration Guide - SIMPLE VERSION

## ✅ Files Created

1. **data-logger-simple.js** - Simplified game-side logging
2. **dashboard-simple.js** - Simplified dashboard real-time updates  
3. **firestore.rules** - Database security rules
4. **firebase-config.js** - Already configured with your credentials

## 📊 Database Structure (KISS!)

ONE collection: `/participants/{code}`

Each participant document:
```javascript
{
  code: "P-01",
  currentGame: "game1",  // "intro" | "game1" | "game2" | "game3" | "completed"
  currentStatus: "playing",  // "playing" | "paused" | "help" | "idle" | "tutorial"
  totalPoints: 45,
  game1Points: 18,
  game2Points: 27,
  game3Points: 0,
  progress: 60,  // 0-100 percentage
  lastUpdate: timestamp,
  helpSeanfhacail: [{ time: "...", phrase: "San Earrach..." }],
  helpCuideachadh: [{ time: "...", game: "game1" }]
}
```

## 🎮 Game Integration (game.js)

### 1. Initialize on Login

```javascript
// In your login handler (around line 3843)
handleLoginSubmit() {
  const code = input.value.trim().toUpperCase();  // e.g., "P-01"
  
  // Validate code format (P-00 to P-50 or T-01 to T-10)
  if (!code.match(/^[PT]-\d{1,2}$/)) {
    alert('Invalid code!');
    return;
  }
  
  // If teacher code, go to dashboard
  if (code.startsWith('T-')) {
    window.location.href = '/dashboard.html';
    return;
  }
  
  // Initialize data logger for participant
  this.dataLogger = new DataLogger(code);
  await this.dataLogger.init();
  
  // Set initial game state
  this.dataLogger.updateGame('intro');
  this.dataLogger.updateStatus('playing');
  
  // Continue with your game flow...
  this.setGameFlowState('RUAIRIDH_INTRO');
}
```

### 2. Update Game State Transitions

```javascript
// In setGameFlowState() function (around line 3690)
setGameFlowState(newState) {
  const oldState = this.currentState;
  this.currentState = newState;
  
  // Map game states to simple game names
  if (this.dataLogger) {
    if (newState === 'GAME1') {
      this.dataLogger.updateGame('game1');
      this.dataLogger.updateStatus('playing');
      this.dataLogger.updateProgress(33);
    } else if (newState === 'GAME2') {
      this.dataLogger.updateGame('game2');
      this.dataLogger.updateStatus('playing');
      this.dataLogger.updateProgress(66);
    } else if (newState === 'GAME3') {
      this.dataLogger.updateGame('game3');
      this.dataLogger.updateStatus('playing');
      this.dataLogger.updateProgress(90);
    } else if (newState === 'RESULTS') {
      this.dataLogger.updateGame('completed');
      this.dataLogger.updateProgress(100);
    }
    
    // Track tutorial states
    if (newState.includes('TUTORIAL')) {
      this.dataLogger.updateStatus('tutorial');
    }
  }
  
  // ... rest of your code
}
```

### 3. Track Points

```javascript
// In addPointToCairn() (around line 4482)
addPointToCairn() {
  this.totalPoints++;
  
  if (this.dataLogger) {
    this.dataLogger.addPoints(1);
  }
  
  // ... rest of your animation code
}
```

### 4. Track Help Requests

```javascript
// When user clicks ? button beside a phrase (Seanfhacail)
showSeanfhacailHelp(phrase) {
  if (this.dataLogger) {
    this.dataLogger.logHelpSeanfhacail(phrase);
  }
  
  // Show your help modal...
}

// When user clicks ? button during gameplay (Cuideachadh)
toggleInGameHelpModal() {
  if (this.dataLogger) {
    const currentGame = this.currentState.includes('GAME1') ? 'game1' :
                       this.currentState.includes('GAME2') ? 'game2' : 'game3';
    this.dataLogger.logHelpCuideachadh(currentGame);
    this.dataLogger.updateStatus('help');
  }
  
  // Show help modal...
}

// When help modal closes
closeHelpModal() {
  if (this.dataLogger) {
    this.dataLogger.updateStatus('playing');
  }
  
  // Close modal...
}
```

### 5. Track Pause/Resume

```javascript
// If game is paused
pauseGame() {
  if (this.dataLogger) {
    this.dataLogger.updateStatus('paused');
  }
}

// Resume game
resumeGame() {
  if (this.dataLogger) {
    this.dataLogger.updateStatus('playing');
  }
}
```

### 6. Complete Session

```javascript
// In renderResultsScreen() (around line 4808)
renderResultsScreen() {
  if (this.dataLogger) {
    this.dataLogger.complete();
  }
  
  // ... rest of results screen code
}
```

## 🚀 Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 🔍 Testing

1. Open game at http://localhost:5000 (or your hosted URL)
2. Log in with code "P-01"
3. Play for a bit
4. Open dashboard.html
5. You should see P-01 appear with live updates!

## 📝 Firebase Console

View your data:
https://console.firebase.google.com/project/cs4099-game/firestore/databases/-default-/data/participants

## 🎯 Summary

**What you NEED to do:**
1. Add DataLogger initialization in login handler
2. Add 5-6 method calls in existing game functions (see above)
3. Deploy Firestore rules: `firebase deploy --only firestore:rules`

**What happens automatically:**
- Data syncs every 10 seconds
- Dashboard updates in real-time
- Help requests show up immediately
- Works offline (syncs when reconnected)

That's it! KISS principle achieved! 🎉
