import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

/**
 * Firebase web configuration is public by design, but it must still be present
 * at build time. Vite replaces import.meta.env values during the build; when a
 * deployment does not define them they become undefined, which causes the
 * opaque auth/invalid-api-key error during getAuth().
 */
const defaultFirebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyC9cmh_bzA4ZeV8bYlbqaGrmIri2PUGx2A',
  authDomain: 'voip17.firebaseapp.com',
  projectId: 'voip17',
  storageBucket: 'voip17.firebasestorage.app',
  messagingSenderId: '608379006778',
  appId: '1:608379006778:web:51fe8032d09fbd5b556a03',
  databaseURL: 'https://voip17-default-rtdb.firebaseio.com',
};

const env = import.meta.env;
const value = (name: keyof typeof defaultFirebaseConfig): string | undefined => {
  const configured = env[`VITE_FIREBASE_${name.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`];
  return typeof configured === 'string' && configured.trim() ? configured.trim() : undefined;
};

const firebaseConfig: FirebaseOptions = {
  apiKey: value('apiKey') ?? defaultFirebaseConfig.apiKey,
  authDomain: value('authDomain') ?? defaultFirebaseConfig.authDomain,
  projectId: value('projectId') ?? defaultFirebaseConfig.projectId,
  storageBucket: value('storageBucket') ?? defaultFirebaseConfig.storageBucket,
  messagingSenderId: value('messagingSenderId') ?? defaultFirebaseConfig.messagingSenderId,
  appId: value('appId') ?? defaultFirebaseConfig.appId,
  databaseURL: value('databaseURL') ?? defaultFirebaseConfig.databaseURL,
};

const requiredKeys: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    throw new Error(`Firebase configuration is missing: ${String(key)}. Add the VITE_FIREBASE_* variables to the deployment environment.`);
  }
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;
