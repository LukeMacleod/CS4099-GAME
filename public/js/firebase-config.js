/**
 * Firebase Configuration and Initialization
 *
 * This file initializes the Firebase SDK and configures Firestore with
 * offline persistence for the Gaelic Games research project.
 *
 * IMPORTANT: Replace the firebaseConfig object with your actual Firebase
 * project credentials from the Firebase Console:
 * https://console.firebase.google.com/project/cs4099-game/settings/general
 */

// Firebase SDK configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyjz1MYryIUimQjj2h7cPvdnYqi9z9j04",
  authDomain: "cs4099-game.firebaseapp.com",
  projectId: "cs4099-game",
  storageBucket: "cs4099-game.firebasestorage.app",
  messagingSenderId: "644574148588",
  appId: "1:644574148588:web:1890c268c38c1d8a3c72c9",
  measurementId: "G-MYPRHWJFBY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase service instances
const db = firebase.firestore();
const auth = firebase.auth();
const functions = firebase.functions();

// Enable Firestore offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
      console.error('Offline persistence error:', err);
    }
  });

// Uncomment this line for local development with Firebase Emulator
// Connects to localhost instead of production Firebase
// functions.useEmulator('localhost', 5001);
// db.useEmulator('localhost', 8080);
// auth.useEmulator('http://localhost', 9099);

// Export for use in other modules
window.firebaseDb = db;
window.firebaseAuth = auth;
window.firebaseFunctions = functions;
