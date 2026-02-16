/**
 * Script to Pre-populate Participant and Teacher Codes in Firestore
 *
 * This script creates the initial codes collection with:
 * - P-0 to P-50 (51 participant codes)
 * - T-01 to T-10 (10 teacher codes)
 *
 * Usage:
 * 1. Option A - Run in Firebase Console (Firestore tab):
 *    - Copy the batch operations from this file into the console
 *
 * 2. Option B - Run as Node.js script:
 *    - Install: npm install firebase-admin
 *    - Update serviceAccountKey path below
 *    - Run: node populate-codes.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Option 1: Use service account key (download from Firebase Console > Project Settings > Service Accounts)
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Use default credentials (if running in Google Cloud environment)
admin.initializeApp();

const db = admin.firestore();

async function populateCodes() {
  console.log('🚀 Starting to populate codes...\n');

  const batch = db.batch();
  let count = 0;

  // Create participant codes: P-0 to P-50 (51 codes)
  console.log('📝 Creating participant codes (P-0 to P-50)...');
  for (let i = 0; i <= 50; i++) {
    const code = `P-${i}`;
    const codeRef = db.collection('codes').doc(code);

    batch.set(codeRef, {
      type: 'participant',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: 0,
      lastUsedAt: null
    });

    count++;
    process.stdout.write(`\r   Created ${count} participant codes...`);
  }

  console.log('\n✅ Participant codes created\n');

  // Create teacher codes: T-01 to T-10 (10 codes)
  console.log('📝 Creating teacher codes (T-01 to T-10)...');
  for (let i = 1; i <= 10; i++) {
    const code = `T-${i.toString().padStart(2, '0')}`;
    const codeRef = db.collection('codes').doc(code);

    batch.set(codeRef, {
      type: 'teacher',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: 0,
      lastUsedAt: null
    });

    count++;
    process.stdout.write(`\r   Created ${count - 51} teacher codes...`);
  }

  console.log('\n✅ Teacher codes created\n');

  // Commit batch
  console.log('💾 Committing batch write to Firestore...');
  await batch.commit();

  console.log('✅ All codes successfully written to Firestore!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Participant codes: 51 (P-0 to P-50)`);
  console.log(`   - Teacher codes: 10 (T-01 to T-10)`);
  console.log(`   - Total codes: ${count}`);
  console.log('\n🎉 Done! Codes are ready to use.\n');
}

// Run the script
populateCodes()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

/**
 * Alternative: Firebase Console Version
 *
 * Copy and paste this code into the Firebase Console:
 * 1. Go to Firestore tab in Firebase Console
 * 2. Click "Start collection" and name it "codes"
 * 3. Use the following code in the browser console:
 *
 * // Get Firestore instance
 * const db = firebase.firestore();
 * const batch = db.batch();
 *
 * // Create participant codes
 * for (let i = 0; i <= 50; i++) {
 *   const code = `P-${i}`;
 *   batch.set(db.collection('codes').doc(code), {
 *     type: 'participant',
 *     isActive: true,
 *     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
 *     usageCount: 0,
 *     lastUsedAt: null
 *   });
 * }
 *
 * // Create teacher codes
 * for (let i = 1; i <= 10; i++) {
 *   const code = `T-${i.toString().padStart(2, '0')}`;
 *   batch.set(db.collection('codes').doc(code), {
 *     type: 'teacher',
 *     isActive: true,
 *     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
 *     usageCount: 0,
 *     lastUsedAt: null
 *   });
 * }
 *
 * // Commit
 * batch.commit().then(() => console.log('✅ Codes created!'));
 */
