import { useState, useEffect } from 'react'
import { getLeaderboard } from '../../api/leaderboard'

export default function Leaderboard({ channelId, onUserClick }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!channelId) return

    setLoading(true)
    getLeaderboard(channelId)
      .then((res) => setEntries(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [channelId])

  if (loading) {
    return (
      <div className="p-5 space-y-2">
        <div className="skeleton h-4 w-28 mb-3" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="p-5 text-center">
        <p className="eyebrow text-[var(--text-muted)] mb-2">THIS MONTH</p>
        <p className="text-[var(--text-muted)] text-sm">
          Leaderboard empty — go be the first.
        </p>
      </div>
    )
  }

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })
  const max = Math.max(...entries.map((e) => e.checkin_count || 0), 1)

  return (
    <div className="p-5 stagger">
      <p className="eyebrow text-[var(--text-muted)] mb-1">LEADERBOARD</p>
      <h3 className="display text-2xl text-[var(--text-primary)] mb-5">
        {monthName}
      </h3>

      <div className="space-y-1.5">
        {entries.map((entry) => {
          const isFirst = entry.rank === 1
          const pct = ((entry.checkin_count || 0) / max) * 100

          return (
            <button
              key={entry.user_id}
              onClick={() => onUserClick?.(entry.user_id)}
              className={`
                relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all overflow-hidden
                ${isFirst
                  ? 'bg-[var(--bg-tertiary)] border border-[var(--coral)]/40'
                  : 'hover:bg-[var(--bg-modifier)] border border-transparent'}
              `}
            >
              {/* Subtle progress fill */}
              <div
                className="absolute left-0 top-0 bottom-0 pointer-events-none opacity-[0.06]"
                style={{
                  width: `${pct}%`,
                  background: isFirst
                    ? 'linear-gradient(90deg, var(--coral), transparent)'
                    : 'linear-gradient(90deg, var(--lime), transparent)',
                }}
              />

              <div className="relative w-7 text-center">
                {isFirst ? (
                  <span className="text-lg">🥇</span>
                ) : entry.rank === 2 ? (
                  <span className="text-base">🥈</span>
                ) : entry.rank === 3 ? (
                  <span className="text-base">🥉</span>
                ) : (
                  <span className="mono text-xs font-bold text-[var(--text-muted)]">
                    {String(entry.rank).padStart(2, '0')}
                  </span>
                )}
              </div>

              <div className={`
                relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${isFirst
                  ? 'bg-[var(--coral)] text-black'
                  : 'bg-[var(--bg-elevated)] text-white'}
              `}>
                {entry.username.charAt(0).toUpperCase()}
              </div>

              <span className="relative flex-1 text-left text-sm text-[var(--text-primary)] truncate font-medium">
                {entry.username}
              </span>

              <span className={`
                relative mono font-bold text-base
                ${isFirst ? 'gradient-heat' : 'text-[var(--lime)]'}
              `}>
                {entry.checkin_count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
