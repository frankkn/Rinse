import type { User } from 'firebase/auth'

interface LoginButtonProps {
  enabled: boolean
  user: User | null
  onSignIn: () => void
  onSignOut: () => void
}

/** Low-key "sign in to sync" control. Renders nothing if Firebase is off. */
export function LoginButton({
  enabled,
  user,
  onSignIn,
  onSignOut,
}: LoginButtonProps) {
  if (!enabled) return null

  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/70">
        <span className="truncate">
          {user.displayName ?? user.email ?? '已登入'} · 進度已同步
        </span>
        <button
          onClick={onSignOut}
          className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20"
        >
          登出
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onSignIn}
      className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 hover:bg-white/20"
    >
      ☁️ 登入以同步進度
    </button>
  )
}
