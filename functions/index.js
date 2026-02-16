const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function: validateAndAuthenticate
 *
 * Validates participant/teacher codes and generates custom authentication tokens.
 * This function is called from the client-side login screen.
 *
 * @param {object} data - Contains the code submitted by the user
 * @param {object} context - Firebase Functions context
 * @returns {object} - Custom token, code type, and sanitized code
 */
exports.validateAndAuthenticate = functions.https.onCall(async (data, context) => {
  const { code } = data;

  // Validate input
  if (!code || typeof code !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Feuch gun cuir thu a-steach an còd ceart agad! (Code is required)'
    );
  }

  // Sanitize and normalize code (uppercase, trim whitespace)
  const sanitizedCode = code.trim().toUpperCase();

  // Validate code format (P-XX or T-XX)
  const participantPattern = /^P-\d+$/;
  const teacherPattern = /^T-\d{2}$/;

  if (!participantPattern.test(sanitizedCode) && !teacherPattern.test(sanitizedCode)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Còd mì-dhligheach. Code must be in format P-XX or T-XX'
    );
  }

  try {
    // Check if code exists in Firestore /codes collection
    const codeDoc = await admin.firestore()
      .collection('codes')
      .doc(sanitizedCode)
      .get();

    if (!codeDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Còd mì-dhligheach. Code not found in database'
      );
    }

    const codeData = codeDoc.data();

    // Check if code is active
    if (!codeData.isActive) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Còd mì-dhligheach. This code has been deactivated'
      );
    }

    // Update code usage metadata
    await codeDoc.ref.update({
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: admin.firestore.FieldValue.increment(1)
    });

    // Create custom token with claims
    // Claims are accessible in security rules via request.auth.token
    const customToken = await admin.auth().createCustomToken(sanitizedCode, {
      code: sanitizedCode,
      type: codeData.type // 'participant' or 'teacher'
    });

    // Log successful authentication (for monitoring)
    console.log(`✅ Authenticated: ${sanitizedCode} (${codeData.type})`);

    return {
      token: customToken,
      type: codeData.type,
      code: sanitizedCode
    };

  } catch (error) {
    // Re-throw HttpsErrors as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Log unexpected errors
    console.error('Authentication error:', error);

    // Return generic error to client
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred during authentication. Please try again.'
    );
  }
});

/**
 * Cloud Function: cleanupOldSessions (optional - for data retention)
 *
 * COMMENTED OUT FOR NOW - Can be enabled later if needed
 *
 * Scheduled function to delete sessions older than 2 years.
 * Implements GDPR data retention policy for research data.
 *
 * Schedule: Runs daily at 2 AM
 * Deploy with: firebase deploy --only functions:cleanupOldSessions
 *
 * Note: This requires Firebase Blaze plan (pay-as-you-go) for Cloud Scheduler
 */
/*
exports.cleanupOldSessions = functions.pubsub
  .schedule('0 2 * * *') // Every day at 2 AM
  .timeZone('Europe/London') // Adjust to your timezone
  .onRun(async (context) => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    try {
      // Query sessions older than 2 years
      const oldSessions = await admin.firestore()
        .collection('sessions')
        .where('startTime', '<', twoYearsAgo)
        .get();

      if (oldSessions.empty) {
        console.log('No old sessions to clean up');
        return null;
      }

      // Delete in batches of 500 (Firestore limit)
      const batches = [];
      let batch = admin.firestore().batch();
      let operationCount = 0;

      for (const doc of oldSessions.docs) {
        batch.delete(doc.ref);
        operationCount++;

        // Commit batch when reaching 500 operations
        if (operationCount === 500) {
          batches.push(batch.commit());
          batch = admin.firestore().batch();
          operationCount = 0;
        }
      }

      // Commit remaining operations
      if (operationCount > 0) {
        batches.push(batch.commit());
      }

      await Promise.all(batches);

      console.log(`🗑️  Deleted ${oldSessions.size} old sessions`);
      return null;

    } catch (error) {
      console.error('Cleanup error:', error);
      return null;
    }
  });
*/
