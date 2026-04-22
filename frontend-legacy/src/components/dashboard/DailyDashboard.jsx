import { useState, useEffect } from 'react'
import { getDashboard } from '../../api/checkins'

export default function DailyDashboard({ channelId, onUserClick }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!channelId) return

    setLoading(true)
    getDashboard(channelId)
      .then((res) => setMembers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [channelId])

  if (loading) {
    return (
      <div className="p-5 space-y-3">
        <div className="skeleton h-4 w-28" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="p-5 text-center">
        <p className="eyebrow text-[var(--text-muted)] mb-2">TODAY</p>
        <p className="text-[var(--text-muted)] text-sm">No members yet.</p>
      </div>
    )
  }

  const checkedIn = members.filter((m) => m.checked_in)
  const pct = Math.round((checkedIn.length / members.length) * 100) || 0

  return (
    <div className="p-5 stagger">
      <div className="mb-5">
        <p className="eyebrow text-[var(--text-muted)] mb-2">TODAY'S STATUS</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="display text-4xl mono text-[var(--lime)]">{checkedIn.length}</span>
          <span className="display text-xl text-[var(--text-muted)]">/ {members.length}</span>
          <span className="text-[var(--text-muted)] text-xs ml-auto mono">{pct}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--lime), var(--cyan))',
              boxShadow: '0 0 12px rgba(61,40,23,0.25)',
            }}
          />
        </div>
      </div>

      <div className="rule-dashed mb-4" />

      {/* Checked-in members */}
      {checkedIn.length > 0 && (
        <div className="mb-5">
          <p className="eyebrow text-[var(--cyan)] mb-3">✓ LOGGED IN</p>
          <div className="grid grid-cols-3 gap-2.5">
            {checkedIn.map((m) => (
              <MemberTile key={m.user_id} member={m} onClick={() => onUserClick?.(m.user_id)} done />
            ))}
          </div>
        </div>
      )}

      {/* Still to go */}
      {members.filter((m) => !m.checked_in).length > 0 && (
        <div>
          <p className="eyebrow text-[var(--text-muted)] mb-3">STILL TO SHOW UP</p>
          <div className="grid grid-cols-3 gap-2.5">
            {members.filter((m) => !m.checked_in).map((m) => (
              <MemberTile key={m.user_id} member={m} onClick={() => onUserClick?.(m.user_id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MemberTile({ member, onClick, done }) {
  return (
    <button
      onClick={onClick}
      title={member.username}
      className={`
        group flex flex-col items-center gap-1.5 py-2.5 rounded-xl
        transition-all
        ${done
          ? 'bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 hover:bg-[var(--cyan)]/15'
          : 'bg-[var(--bg-tertiary)]/60 border border-[var(--border-subtle)] hover:border-[var(--border-strong)]'}
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
          transition-transform group-hover:scale-105
          ${done
            ? 'bg-[var(--cyan)] text-black'
            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}
        `}
      >
        {member.username.charAt(0).toUpperCase()}
      </div>
      <span className={`text-[10px] truncate max-w-full px-1 mono ${done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        {member.username}
      </span>
    </button>
  )
}
