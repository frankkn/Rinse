// Firebase SDK initialization. This module pulls in the (heavy) Firebase SDK,
// so it is ONLY ever reached via dynamic import() from useAuth/sync — never at
// the top level. That keeps the SDK out of the initial bundle for users who
// don't sign in. Importers must first check `isFirebaseConfigured` (config.ts).
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from './config'

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
