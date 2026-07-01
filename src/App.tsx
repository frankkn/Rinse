import { useEffect, useRef, useState } from 'react'
import { MainMenu } from './components/MainMenu'
import { LevelSelect } from './components/LevelSelect'
import { GameScreen } from './components/GameScreen'
import { LoginButton } from './components/LoginButton'
import { LEVELS } from './data/levels'
import { randomZen, type PlayConfig } from './play'
import { sound } from './audio/sound'
import { useAuth } from './auth/useAuth'
import { syncOnLogin, pushProgress } from './auth/sync'
import {
  loadProgress,
  loadSettings,
  saveSettings,
  completeLevel,
} from './lib/storage'

type Scene = 'menu' | 'levels' | 'game'

export default function App() {
  const [scene, setScene] = useState<Scene>('menu')
  const [config, setConfig] = useState<PlayConfig | null>(null)
  const [progress, setProgress] = useState(loadProgress)
  const [muted, setMuted] = useState(() => loadSettings().muted)
  const auth = useAuth()

  // Apply persisted mute to the audio graph once.
  useEffect(() => {
    sound.setMuted(muted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On sign-in: merge local + cloud progress, adopt the result.
  useEffect(() => {
    if (!auth.user) return
    let alive = true
    syncOnLogin(auth.user.uid).then((merged) => {
      if (alive) setProgress(merged)
    })
    return () => {
      alive = false
    }
  }, [auth.user])

  // While signed in, push progress changes to the cloud (debounced).
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!auth.user) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    const uid = auth.user.uid
    pushTimer.current = setTimeout(() => pushProgress(uid, progress), 800)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [progress, auth.user])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    sound.setMuted(next)
    saveSettings({ muted: next })
  }

  const startZen = () => {
    setConfig(randomZen())
    setScene('game')
  }

  const pickLevel = (levelId: number) => {
    setConfig({ mode: 'level', level: LEVELS[levelId] })
    setScene('game')
  }

  const exitGame = () => {
    setScene(config?.mode === 'level' ? 'levels' : 'menu')
  }

  const onLevelComplete = (levelId: number, timeMs: number) => {
    setProgress(completeLevel(levelId, timeMs, LEVELS.length))
  }

  if (scene === 'menu') {
    return (
      <MainMenu
        muted={muted}
        onToggleMute={toggleMute}
        onPlayLevels={() => setScene('levels')}
        onPlayZen={startZen}
        loginSlot={
          <LoginButton
            enabled={auth.enabled}
            user={auth.user}
            onSignIn={auth.signIn}
            onSignOut={auth.signOut}
          />
        }
      />
    )
  }

  if (scene === 'levels') {
    return (
      <LevelSelect
        levels={LEVELS}
        maxUnlocked={progress.maxUnlocked}
        bestTimes={progress.bestTimes}
        onPick={(lv) => pickLevel(lv.id)}
        onBack={() => setScene('menu')}
      />
    )
  }

  // scene === 'game'
  if (!config) return null

  if (config.mode === 'level') {
    const level = config.level
    const hasNext = level.id + 1 < LEVELS.length
    return (
      <GameScreen
        key={`level-${level.id}`}
        config={config}
        muted={muted}
        onToggleMute={toggleMute}
        onExit={exitGame}
        bestMs={progress.bestTimes[level.id]}
        hasNext={hasNext}
        onComplete={(t) => onLevelComplete(level.id, t)}
        onNext={() => hasNext && pickLevel(level.id + 1)}
      />
    )
  }

  return (
    <GameScreen
      key={`zen-${config.seed}`}
      config={config}
      muted={muted}
      onToggleMute={toggleMute}
      onExit={exitGame}
      onNewSurface={startZen}
    />
  )
}
