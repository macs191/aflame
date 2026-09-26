'use strict';

const admin = require('firebase-admin');
const uid = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!uid || uid.startsWith('-')) {
  console.error('Usage: node grant-admin.cjs <firebase-auth-uid> [--revoke]');
  process.exit(2);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a private service-account JSON file outside this repository.');
  process.exit(2);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'voip17',
});

(async () => {
  try {
    const user = await admin.auth().getUser(uid);
    const claims = { ...(user.customClaims || {}) };
    if (revoke) delete claims.admin;
    else claims.admin = true;
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(revoke ? `Admin claim revoked for UID ${uid}.` : `Admin claim granted to UID ${uid}. Sign out and sign back in to refresh the token.`);
  } catch (error) {
    console.error(`Could not update admin claim: ${error.code || error.message}`);
    process.exitCode = 1;
  } finally {
    await admin.app().delete();
  }
})();
