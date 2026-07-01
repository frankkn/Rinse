import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from './firebase'

/** Google sign-in state. All actions no-op when Firebase isn't configured. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!isFirebaseConfigured)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
  }, [])

  const signIn = async () => {
    if (!auth) return
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      console.warn('Sign-in failed or cancelled', e)
    }
  }

  const signOutUser = async () => {
    if (!auth) return
    try {
      await signOut(auth)
    } catch (e) {
      console.warn('Sign-out failed', e)
    }
  }

  return {
    user,
    ready,
    signIn,
    signOut: signOutUser,
    enabled: isFirebaseConfigured,
  }
}
