import { isFirebaseConfigured } from './config'
import { loadProgress, saveProgress, type ProgressData } from '../lib/storage'

// The Firestore SDK is imported lazily inside the async functions below, so it
// only downloads once a signed-in user actually syncs. Pure helpers stay here.

/** Combine two progress records: highest unlock, best (lowest) time per level. */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const bestTimes: Record<number, number> = { ...a.bestTimes }
  for (const [k, v] of Object.entries(b.bestTimes ?? {})) {
    const key = Number(k)
    const t = Number(v)
    if (!Number.isFinite(t)) continue
    bestTimes[key] = bestTimes[key] === undefined ? t : Math.min(bestTimes[key], t)
  }
  return {
    version: 1,
    maxUnlocked: Math.max(a.maxUnlocked, b.maxUnlocked ?? 0),
    bestTimes,
  }
}

function normalizeRemote(data: Record<string, unknown>): ProgressData {
  return {
    version: 1,
    maxUnlocked: typeof data.maxUnlocked === 'number' ? data.maxUnlocked : 0,
    bestTimes:
      data.bestTimes && typeof data.bestTimes === 'object'
        ? (data.bestTimes as Record<number, number>)
        : {},
  }
}

/**
 * On sign-in: merge local progress with whatever is in the cloud, write the
 * merged result to both. Returns the merged progress for the UI to adopt.
 */
export async function syncOnLogin(uid: string): Promise<ProgressData> {
  const local = loadProgress()
  if (!isFirebaseConfigured) return local
  try {
    const [{ db }, { doc, getDoc, setDoc }] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ])
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    const merged = snap.exists()
      ? mergeProgress(local, normalizeRemote(snap.data()))
      : local
    saveProgress(merged)
    await setDoc(ref, { ...merged, updatedAt: Date.now() }, { merge: true })
    return merged
  } catch (e) {
    console.warn('Cloud sync failed; keeping local progress', e)
    return local
  }
}

/** Push local progress to the cloud (caller debounces). */
export async function pushProgress(uid: string, p: ProgressData): Promise<void> {
  if (!isFirebaseConfigured) return
  try {
    const [{ db }, { doc, setDoc }] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ])
    await setDoc(
      doc(db, 'users', uid),
      { ...p, updatedAt: Date.now() },
      { merge: true },
    )
  } catch (e) {
    console.warn('Cloud push failed', e)
  }
}
