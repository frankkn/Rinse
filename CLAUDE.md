# Rinse — project guide for Claude

A procedurally-generated **pressure-washing web game**. You drag a water jet to
spray grime off a surface; the clean surface is revealed underneath. Oddly
satisfying, zero image assets (everything is drawn/synthesized in code). Stress-
relief toy, not a twitchy game.

Concept locked with the user: **Procedural** art (no images), **both** a
level-progression mode and an endless **zen** mode, **mixed** surfaces/dirt.

## Run it

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # tsc -b && vite build
npm run typecheck   # tsc -b
npm run test:e2e    # Playwright (needs: npx playwright install chromium once)
```

Use the **local** binaries via these npm scripts. `npx tsc` / `npx playwright`
directly can resolve the wrong global package on this setup.

## Architecture

Pure-TS engine, React only for the UI shell. Coordinates are **CSS px**; every
canvas context is scaled by `devicePixelRatio` (hi-dpi crisp).

- `src/engine/WashEngine.ts` — owns 3 stacked canvases (clean → dirt → fx),
  the rAF loop, pointer input, erasing, progress + sound orchestration. All
  erasing happens once per frame from `lastP → pointer` (so holding still keeps
  washing and fast swipes interpolate).
- `src/engine/brush.ts` — `destination-out` soft-brush erase, interpolated
  along the stroke. Strength 1.0, wide full-power core (tuned for "punchy" feel).
- `src/engine/particles.ts` — water jet drops + back-splash + mist + dirt runoff.
- `src/engine/progress.ts` — downscale dirt canvas to 128², sum alpha, compare
  to the initial baseline → "% cleaned" (baseline-relative so 100% is reachable).
- `src/engine/noise.ts` / `rng.ts` — value-noise / fbm + seeded RNG (mulberry32).
- `src/engine/surfaces/*` — clean surface generators: tiles, brick, wood, metal,
  glass, concrete. `src/engine/dirt/*` — grime, mud, moss, dust, rust. Add new
  ones and register in the respective `index.ts`.
- `src/data/levels.ts` — 12 curated levels (surface × dirt × seed, rising
  difficulty). `src/play.ts` — `PlayConfig` + `randomZen()`.
- `src/components/*` — MainMenu, LevelSelect, GameScreen, Hud, CompleteOverlay,
  LoginButton. `src/App.tsx` is the scene router (menu → levels → game).
- `src/hooks/useWashEngine.ts` — mounts the engine; recreates only when
  surface/dirt/seed/target change (callbacks via refs).
- `src/audio/sound.ts` — Web Audio *synthesized* spray loop (filtered noise +
  LFO) and completion chime. No audio files. Singleton `sound`.
- `src/lib/storage.ts` — localStorage: unlocks, best times, mute (source of truth).
- `src/auth/*` — optional Google login + Firestore sync (see below).

## Conventions

- **Zero assets.** Surfaces, dirt, and sound are all generated in code. Keep it
  that way unless the user asks otherwise.
- **Local-first.** localStorage is always the immediate source of truth; cloud
  sync merges on top. Never gate gameplay behind login.
- **Graceful Firebase.** Everything auth-related is behind `isFirebaseConfigured`
  — with no `.env.local`, the app runs fully and the login button just hides.
- Tailwind v4 (via `@tailwindcss/vite`, no config file). Dark theme, sky accents.
- Windows dev: `git` prints harmless LF→CRLF warnings; ignore them.

## Firebase (optional login + cloud sync)

Project already created by the user: **`rinse-8e07b`** (Google auth + Firestore).
Firestore rules are in `firestore.rules` (each user reads/writes only
`users/{uid}`).

`.env.local` holds `VITE_FIREBASE_*` and is **gitignored** — it is NOT in the
repo and must be recreated on each machine (copy `.env.example`, fill from the
Firebase console → Project settings → Web app config). The values are publishable
but kept out of the repo on purpose.

## Status / roadmap

- ✅ M1 core engine + feel tuning (jet strength, particles) — tuned per user.
- ✅ M2 content: 6 surfaces × 5 dirts, 12 levels + zen, menus, CompleteOverlay,
  localStorage progress.
- 🟡 M3a optional Google login + Firestore sync: **code complete & wired**,
  `.env.local` set locally. **Pending: user's manual Google sign-in test**
  (verify `users/{uid}` appears in Firestore; cross-device sync).
- ⬜ M3b polish: dirt-runoff already exists; still want impact rings, sound
  polish (tie loudness to dirt removed), before/after flash, **mobile layout**,
  respect `prefers-reduced-motion`.
- ⬜ M4 deploy: **Vercel** (base is `/`). Steps: import repo → add the same
  `VITE_FIREBASE_*` as Vercel env vars → deploy → add `rinse.vercel.app` to
  Firebase **Authentication → Settings → Authorized domains** (else Google login
  is blocked online). Then tag `v1.0.0`.

## Known follow-ups

- Bundle is ~230 KB gzip (Firebase). Could lazy-load `src/auth/*` so the initial
  load stays light when unused.
- README is still the Vite scaffold default; write a real one during M3b.

## Git

Repo: `https://github.com/frankkn/Rinse` (default branch `main`). Commit identity
for this project: `Frank Yang <frank840629@gmail.com>` (set per-repo; re-set on a
fresh clone if the global identity differs).
