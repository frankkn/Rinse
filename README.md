# Rinse 💦

A procedurally-generated **pressure-washing** web toy. Drag a water jet across a
grimy surface and the clean surface is revealed underneath — oddly satisfying,
zero image assets. Everything (surfaces, dirt, water FX, and even the spray
sound) is drawn or synthesized in code.

Built as a stress-relief toy rather than a twitchy game: there's a **level
progression** mode with 12 curated stages and an endless **zen** mode.

## Play

- **關卡模式 (Levels)** — 12 stages of rising difficulty; each unlocks the next.
  Best times are recorded.
- **禪模式 (Zen)** — an endless stream of random surface × dirt combos. "換一片"
  for a fresh one whenever you like.

Press and drag on the surface to wash. That's it.

## Run it

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # tsc -b && vite build
npm run typecheck   # tsc -b
npm run test:e2e    # Playwright (run: npx playwright install chromium once)
```

## How it works

Pure-TypeScript engine; React is only the UI shell. Coordinates are CSS px and
every canvas is scaled by `devicePixelRatio` so it stays crisp on hi-dpi.

- **`src/engine/`** — the wash engine (three stacked canvases: clean → dirt →
  fx), a `destination-out` soft brush, a water-jet particle system (drops,
  mist, runoff, impact rings), value-noise surface + dirt generators, and
  progress sampling by downscaling the dirt layer and comparing alpha to a
  baseline.
- **`src/audio/sound.ts`** — the spray loop is filtered white noise with an LFO
  wobble; loudness tracks how fast dirt is coming off. Completion plays a
  synthesized major chord. No audio files.
- **`src/data/levels.ts` / `src/play.ts`** — the 12 levels and zen-mode config.
- **`src/components/`, `src/App.tsx`** — the menu → levels → game UI.
- **`src/lib/`** — localStorage progress (source of truth) + a reduced-motion
  helper. `prefers-reduced-motion` thins particles and skips the win flash.

Everything is **local-first**: your progress lives in `localStorage` and the
game never gates play behind login.

## Optional cloud sync (Firebase)

Sign-in is entirely optional. With no configuration the game runs fully and the
login button just hides. To enable Google login + cross-device progress sync:

1. Create a Firebase project with **Google Authentication** and **Firestore**.
2. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values
   from the Firebase console (these are publishable, not secrets).
3. Firestore rules are in [`firestore.rules`](firestore.rules) — each user reads
   and writes only their own `users/{uid}` document.

The Firebase SDK is code-split and loaded lazily, so it's only downloaded when a
configured user actually signs in — the initial bundle stays light.

## Deploy (Vercel)

The repo ships a [`vercel.json`](vercel.json) (Vite preset, SPA rewrite, hashed-
asset caching). To deploy:

1. Import the repo in Vercel.
2. Add the same `VITE_FIREBASE_*` values as Vercel environment variables (only
   needed if you want login online).
3. Deploy, then add the deployed domain (e.g. `rinse.vercel.app`) to Firebase →
   **Authentication → Settings → Authorized domains**, or Google sign-in is
   blocked in production.

## Tech

React 19 · TypeScript · Vite · Tailwind v4 · Canvas 2D · Web Audio · Firebase
(optional) · Playwright.
