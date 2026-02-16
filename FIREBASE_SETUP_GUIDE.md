# Firebase Data Logging System - Setup Guide
## Geamaichean Gàidhlig Research Project

This guide will walk you through setting up the Firebase backend for participant tracking and the teacher dashboard.

---

## Prerequisites

Before starting, you need to install:

1. **Node.js and npm** (required for Firebase CLI)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Firebase CLI**
   ```bash
     npm install -g firebase-tools
     ```

---

## Step 1: Configure Firebase Project Settings

### 1.1 Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **cs4099-game**
3. Click the gear icon (⚙️) → **Project settings**
4. Scroll to "Your apps" section
5. If you don't have a web app, click "Add app" (</> icon) and register a web app
6. Copy the `firebaseConfig` object

### 1.2 Update firebase-config.js

Open `public/js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "cs4099-game.firebaseapp.com",
  projectId: "cs4099-game",
  storageBucket: "cs4099-game.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

**Important:** Replace `YOUR_ACTUAL_API_KEY`, `YOUR_ACTUAL_SENDER_ID`, and `YOUR_ACTUAL_APP_ID` with the real values from the Firebase Console.

---

## Step 2: Initialize Firebase in Your Project

### 2.1 Login to Firebase CLI

```bash
cd /Users/lookmacloud/CS4099-GAME/CS4099-GAME
firebase login
```

This will open a browser window for authentication.

### 2.2 Initialize Firestore and Functions

```bash
firebase init firestore functions
```

When prompted:

- **Firestore Rules:**
  - Use existing file: `firestore.rules` ✅
  - Firestore indexes: `firestore.indexes.json` ✅

- **Cloud Functions:**
  - Language: **JavaScript** ✅
  - ESLint: **No** (optional)
  - Install dependencies: **Yes** ✅
  - Functions directory: Confirm it's `functions/` ✅

---

## Step 3: Deploy Firestore Rules and Indexes

### 3.1 Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

This uploads the security rules that:
- Allow participants to write only their own data
- Allow teachers to read all data
- Protect the codes collection (read-only)

### 3.2 Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

This creates database indexes for efficient querying on the dashboard.

---

## Step 4: Deploy Cloud Functions

### 4.1 Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### 4.2 Deploy Functions

```bash
firebase deploy --only functions
```

This deploys the `validateAndAuthenticate` function that handles login.

**Note:** You may need to upgrade to Firebase's Blaze (pay-as-you-go) plan to deploy Cloud Functions. The free tier should cover your usage with no charges.

---

## Step 5: Populate Participant and Teacher Codes

You need to add the pre-generated codes to Firestore. Choose **Option A** (recommended) or **Option B**:

### Option A: Run Node.js Script (Recommended)

1. Install firebase-admin:
   ```bash
   npm install firebase-admin
   ```

2. Download service account key:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Project settings → Service accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root
   - **⚠️ KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT**

3. Update `populate-codes.js`:
   ```javascript
   const serviceAccount = require('./serviceAccountKey.json');
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   ```

4. Run the script:
   ```bash
   node populate-codes.js
   ```

### Option B: Manual Creation via Firebase Console

1. Go to [Firestore Database](https://console.firebase.google.com/project/cs4099-game/firestore) in Firebase Console
2. Click "Start collection"
3. Collection ID: `codes`
4. Add documents manually:

   **Participant Codes (P-0 to P-50):**
   - Document ID: `P-0`
   - Fields:
     - `type` (string): `participant`
     - `isActive` (boolean): `true`
     - `createdAt` (timestamp): (click "Use server timestamp")
     - `usageCount` (number): `0`

   Repeat for P-1, P-2, ... P-50

   **Teacher Codes (T-01 to T-10):**
   - Document ID: `T-01`
   - Fields:
     - `type` (string): `teacher`
     - `isActive` (boolean): `true`
     - `createdAt` (timestamp): (click "Use server timestamp")
     - `usageCount` (number): `0`

   Repeat for T-02, T-03, ... T-10

### Option C: Browser Console Script (Fast)

1. Go to your game URL (e.g., https://cs4099-game.web.app)
2. Open browser developer console (F12 or Cmd+Option+I)
3. Paste this code:

```javascript
const db = firebase.firestore();
const batch = db.batch();

// Create participant codes
for (let i = 0; i <= 50; i++) {
  const code = `P-${i}`;
  batch.set(db.collection('codes').doc(code), {
    type: 'participant',
    isActive: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    usageCount: 0,
    lastUsedAt: null
  });
}

// Create teacher codes
for (let i = 1; i <= 10; i++) {
  const code = `T-${i.toString().padStart(2, '0')}`;
  batch.set(db.collection('codes').doc(code), {
    type: 'teacher',
    isActive: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    usageCount: 0,
    lastUsedAt: null
  });
}

// Commit
batch.commit().then(() => console.log('✅ 61 codes created!'));
```

4. Press Enter and wait for "✅ 61 codes created!"

---

## Step 6: Deploy to Firebase Hosting

### 6.1 Build and Deploy

```bash
firebase deploy --only hosting
```

This uploads your updated game files (with Firebase integration) to Firebase Hosting.

---

## Step 7: Test the System

### 7.1 Test Participant Login

1. Go to your game URL: `https://cs4099-game.web.app`
2. Enter a participant code (e.g., `P-17`)
3. You should be redirected to the game intro
4. Play through a bit of the game
5. Check Firestore Console:
   - A session document should appear in the `/sessions` collection
   - Events should appear in `/sessions/{sessionId}/events`

### 7.2 Test Teacher Login

1. Go to your game URL: `https://cs4099-game.web.app`
2. Enter a teacher code (e.g., `T-01`)
3. You should be redirected to the dashboard: `https://cs4099-game.web.app/dashboard.html`
4. You should see:
   - The participant session you just created (if still in progress)
   - Historical session data
   - Aggregate statistics

### 7.3 Test Data Export

1. In the teacher dashboard, play through a complete game session as a participant
2. Return to dashboard as teacher
3. Click "Às-phortaich CSV" or "Às-phortaich JSON"
4. Verify the downloaded file contains session data

---

## Step 8: Distribute Codes

### For Research Participants:
- Assign each participant a unique P-code (P-0 to P-50)
- Provide them with their code on paper or via email
- Codes are reusable (same participant can play multiple sessions)

### For Teaching Staff:
- Distribute T-codes (T-01 to T-10) to authorized teachers only
- Teachers can use these codes to access the dashboard
- T-codes provide read-only access to all participant data

---

## Troubleshooting

### Error: "Firebase not defined"
**Solution:** Make sure you've updated `public/js/firebase-config.js` with your actual Firebase credentials.

### Error: "Permission denied" when logging in
**Solution:**
1. Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Check that codes exist in Firestore `/codes` collection
3. Ensure Cloud Functions are deployed: `firebase deploy --only functions`

### Error: "Functions not found"
**Solution:** Deploy Cloud Functions: `firebase deploy --only functions`

### Sessions not appearing in dashboard
**Solution:**
1. Check browser console for errors (F12 → Console tab)
2. Verify participant played through at least part of the game
3. Check Firestore Console to see if session documents exist
4. Refresh the dashboard page

### Export button does nothing
**Solution:**
1. Ensure you have completed sessions (status = "completed")
2. Check browser console for JavaScript errors
3. Try with a different browser

---

## Firebase Cost Monitoring

Your project should stay within the **free tier** with current usage:

**Free Tier Limits:**
- Firestore: 50k reads/day, 20k writes/day
- Cloud Functions: 125k invocations/day, 2M invocations/month
- Hosting: 10 GB storage, 360 MB/day transfer

**Projected Usage (50 participants × 3 sessions):**
- Writes: ~4,800 (well under 20k limit)
- Reads: ~2,000/day on dashboard (well under 50k limit)
- Functions: ~150 logins (well under 125k limit)

**To Monitor Costs:**
1. Go to Firebase Console → Usage and billing
2. Set up billing alerts (optional but recommended)
3. Check monthly usage reports

---

## Data Privacy & GDPR Compliance

✅ **Pseudonymous Data:** Participant codes (P-XX) don't contain personal information

✅ **Data Minimization:** Only game performance data is collected

✅ **Access Control:** Teachers can only read data, not modify it

✅ **Data Retention:** Sessions are stored indefinitely unless you implement the cleanup function

**Optional: Implement Data Retention Policy**

To auto-delete sessions older than 2 years (GDPR best practice):

1. The `cleanupOldSessions` function is already in `functions/index.js`
2. Deploy it: `firebase deploy --only functions`
3. Requires Firebase Blaze plan for Cloud Scheduler

---

## Advanced: Local Development with Emulators

For testing without affecting production data:

### Install Emulators

```bash
firebase init emulators
```

Select: Firestore, Functions, Authentication

### Start Emulators

```bash
firebase emulators:start
```

### Update Code for Emulator Use

Uncomment these lines in `public/js/firebase-config.js`:

```javascript
functions.useEmulator('localhost', 5001);
db.useEmulator('localhost', 8080);
auth.useEmulator('http://localhost', 9099);
```

**Remember to comment them out again before deploying to production!**

---

## Support

If you encounter issues:

1. **Firebase Console:** Check for error messages in Firestore, Functions logs
2. **Browser Console:** Open DevTools (F12) and check for JavaScript errors
3. **Firebase Documentation:** https://firebase.google.com/docs
4. **Cloud Functions Logs:** `firebase functions:log`

---

## Summary Checklist

- [ ] Node.js and Firebase CLI installed
- [ ] Firebase project configured in `firebase-config.js`
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Cloud Functions deployed
- [ ] Codes (P-0 to P-50, T-01 to T-10) populated in Firestore
- [ ] Game deployed to Firebase Hosting
- [ ] Tested participant login and gameplay
- [ ] Tested teacher dashboard access
- [ ] Tested data export (CSV/JSON)

🎉 **You're all set! Your Firebase data logging system is ready for research data collection.**

---

## Quick Command Reference

```bash
# Login to Firebase
firebase login

# Deploy everything
firebase deploy

# Deploy specific components
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions

# View function logs
firebase functions:log

# Start local emulators
firebase emulators:start

# Check Firebase project
firebase projects:list
```
