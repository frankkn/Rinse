<div align="right">

**English** | [繁體中文](README.zh-TW.md)

</div>

# Rinse 💦

> Drag a jet of water across the grime and watch the clean surface emerge underneath. No enemies, no timers — just washing. Surprisingly relaxing.

## Play now

**https://rinse-omega.vercel.app**

No install, no sign-in — start washing right in your browser.

---

## Game modes

### Level mode (12 levels)

Difficulty ramps up gradually. Clear a level (cleanliness ≥ 99%) to unlock the next one; your best time is recorded for each.

| Level | Name | Surface | Dirt | Special stains |
|-------|------|---------|------|----------------|
| 1 | Foggy Window | Glass | Dust | — |
| 2 | Dusty Tiles | Tiles | Dust | — |
| 3 | Greasy Kitchen | Tiles | Grease | — |
| 4 | Dust-Covered Desk | Wood | Dust + grease | — |
| 5 | Muddy Backyard | Concrete | Mud | Tough stains |
| 6 | Mossy Stone Steps | Brick | Moss | Tough stains |
| 7 | Rusted Iron Plate | Metal | Rust | Tough stains |
| 8 | Grimy Brick Wall | Brick | Grease + mud | Tough stains |
| 9 | Damp Bathroom | Tiles | Moss + grease | Tough + chemical stains |
| 10 | Abandoned Driveway | Concrete | Mud + moss | Tough + chemical stains |
| 11 | Seaside Window Grille | Metal | Rust + grease | Tough + chemical stains |
| 12 | Derelict Glasshouse | Glass | Moss + dust | Tough + chemical stains |

### Zen mode

Randomly generated surface-and-dirt combinations. Hit "New surface" anytime for a fresh one. No win condition — pure stress relief.

---

## Special stains

### Tough stains (orange-brown)

Appear in levels 5–12. These are harder to remove than regular dirt:

- Require **3 full scrubbing passes** to clear completely
- Fade a little more with each pass
- How to: scrub back and forth with the hose, three times over

### Chemical stains (yellow-green)

Appear in levels 9–12. These only respond to detergent:

1. Switch to the 🧴 **detergent**, tap the stain to spray it (white foam means it took effect)
2. Switch back to the 🚿 **hose** and rinse the foam away
- Water alone won't remove them — detergent must go on first

> The tool-switch buttons are on the **right side** of the game screen.

---

## Controls

| Action | Description |
|--------|-------------|
| Press and drag | Spray water to clean |
| Tap 🧴 (right side) | Switch to detergent mode (one tap sprays one patch) |
| Tap 🚿 (right side) | Switch back to the hose |
| "Restart" | Reset the current level |
| "New surface" | Get a fresh surface in Zen mode |

---

## Running locally

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # tsc -b && vite build
npm run typecheck   # tsc -b
npm run test:e2e    # Playwright (first run: npx playwright install chromium)
```

---

## Architecture

A pure TypeScript engine with React serving only as the UI shell. Canvas coordinates are in CSS px, multiplied by `devicePixelRatio` throughout for crisp high-DPI rendering.

- **`src/engine/`** — washing engine (4 stacked canvases: clean → dirt → tough → fx), `destination-out` soft brush, water-jet particle system (droplets, spray, runoff, impact rings), value-noise procedural surface and dirt generators, `ToughDirtSystem` for tough stains
- **`src/audio/sound.ts`** — the spray sound is an LFO-modulated white-noise loop whose volume tracks cleaning speed in real time; a synthesized chord plays on level clear. No audio files
- **`src/data/levels.ts`** — configuration for all 12 levels (surface × dirt × seed × special stains)
- **`src/engine/surfaces/`** — real photo surfaces (`public/surfaces/`), with automatic fallback to procedural generation when images are missing
- **`src/lib/`** — localStorage progress (local-first) + `prefers-reduced-motion` support

---

## Optional cloud sync (Firebase)

Signing in is entirely optional. Without configuration the game works as usual and the sign-in button hides itself. To enable Google sign-in and cross-device progress sync:

1. Create a Firebase project and enable **Google Authentication** and **Firestore**
2. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values (from Firebase console → Project settings → Web app)
3. Firestore rules live in [`firestore.rules`](firestore.rules) — each user can only read and write their own `users/{uid}` document

The Firebase SDK is lazy-loaded via dynamic `import()`, downloaded only when someone actually signs in, so the initial bundle is unaffected.

---

## Deployment (Vercel)

The repo ships with [`vercel.json`](vercel.json) (Vite preset, SPA rewrite, static-asset caching). To deploy:

1. Import this repo into Vercel
2. Optional: add the `VITE_FIREBASE_*` environment variables to enable sign-in in production
3. After deploying, add the deployment domain to Firebase → **Authentication → Settings → Authorized domains**

---

## Built with

React 19 · TypeScript · Vite · Tailwind v4 · Canvas 2D · Web Audio API · Firebase (optional) · Playwright
