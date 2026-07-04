// Shared prefers-reduced-motion signal. When the user asks the OS to reduce
// motion we thin out particles, skip the completion flash, and drop non-
// essential animation. The value is read live (media query state can change),
// so callers just call reducedMotion() each time they need it.

const query =
  typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

/** True when the OS/user has requested reduced motion. */
export function reducedMotion(): boolean {
  return query?.matches ?? false
}
