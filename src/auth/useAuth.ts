import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { isFirebaseConfigured } from './config'

/**
 * Google sign-in state. The Firebase SDK is loaded lazily (dynamic import) the
 * first time it's needed, so unconfigured / signed-out users never download it.
 * All actions no-op when Firebase isn't configured.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    let alive = true
    let unsub: () => void = () => {}
    void (async () => {
      const [{ auth }, { onAuthStateChanged }] = await Promise.all([
        import('./firebase'),
        import('firebase/auth'),
      ])
      if (!alive) return
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setReady(true)
      })
    })()
    return () => {
      alive = false
      unsub()
    }
  }, [])

  const signIn = async () => {
    if (!isFirebaseConfigured) return
    const [{ auth, googleProvider }, { signInWithPopup }] = await Promise.all([
      import('./firebase'),
      import('firebase/auth'),
    ])
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      console.warn('Sign-in failed or cancelled', e)
    }
  }

  const signOutUser = async () => {
    if (!isFirebaseConfigured) return
    const [{ auth }, { signOut }] = await Promise.all([
      import('./firebase'),
      import('firebase/auth'),
    ])
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
