import { useState } from 'react'

function formatTimestamp(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) return `Today · ${time}`

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`
}

const QUICK_EMOJIS = ['\u{1F44D}', '\u{1F525}', '\u{1F4AA}', '\u{1F389}', '❤️', '\u{1F60D}']

export default function CheckInCard({ message, onUsernameClick, onReact, onUnreact }) {
  const [showPicker, setShowPicker] = useState(false)
  const username = message.username || message.user?.username || 'Unknown'
  const value = message.value
  const note = message.note || ''
  const isDone = value === null || value === undefined
  const reactions = message.reactions || []

  const displayValue = isDone ? 'DONE' : `${value}`

  const handleReact = (emoji) => {
    const existing = reactions.find((r) => r.emoji === emoji && r.reacted_by_me)
    if (existing) onUnreact?.(message.checkin_id || message.id, emoji)
    else onReact?.(message.checkin_id || message.id, emoji)
    setShowPicker(false)
  }

  return (
    <div className="group flex gap-3 px-3 py-2 mt-6 first:mt-0 anim-enter-up">
      {/* Avatar with cyan ring (check-in accent) */}
      <button
        onClick={() => onUsernameClick?.(message.user_id)}
        className="shrink-0 mt-1"
      >
        <div className="w-10 h-10 rounded-full bg-[var(--lime)] text-black flex items-center justify-center text-sm font-bold hover:scale-105 transition-transform">
          {username.charAt(0).toUpperCase()}
        </div>
      </button>

      {/* Card body */}
      <div className="min-w-0 flex-1">
        {/* Header: name + timestamp + CHECK-IN eyebrow */}
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
          <span
            className="font-semibold text-[var(--text-primary)] text-sm hover:text-[var(--cyan)] cursor-pointer transition-colors"
            onClick={() => onUsernameClick?.(message.user_id)}
          >
            {username}
          </span>
          <span className="eyebrow text-[var(--cyan)] text-[9px]">· CHECKED IN</span>
          <span className="mono text-[10px] text-[var(--text-muted)] ml-auto">
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        {/* Check-in tile */}
        <div
          className="mt-2 relative overflow-hidden rounded-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(15,117,102,0.06) 0%, rgba(107,78,168,0.04) 100%), var(--bg-tertiary)',
            border: '1px solid rgba(15,117,102,0.22)',
          }}
        >
          {/* Left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: 'linear-gradient(180deg, var(--cyan), var(--lime))' }}
          />

          <div className="pl-4 pr-4 py-3">
            <div className="flex items-baseline gap-3">
              <div
                className="display text-3xl leading-none"
                style={{
                  color: isDone ? 'var(--cyan)' : 'var(--lime)',
                }}
              >
                {displayValue}
              </div>
              {!isDone && message.channel?.target_unit && (
                <div className="eyebrow text-[var(--text-muted)]">
                  {message.channel.target_unit}
                </div>
              )}
              {isDone && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="anim-bounce-check">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            {note && (
              <p className="text-[var(--text-secondary)] text-sm mt-2 whitespace-pre-wrap break-words italic leading-relaxed">
                "{note}"
              </p>
            )}

            {/* Reactions row */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => handleReact(r.emoji)}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                    transition-all
                    ${r.reacted_by_me
                      ? 'bg-[var(--violet)]/20 border border-[var(--violet)]/60 text-[var(--text-primary)]'
                      : 'bg-[var(--bg-primary)]/50 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--violet)]/50'}
                  `}
                  title={r.users.join(', ')}
                >
                  <span>{r.emoji}</span>
                  <span className="mono text-[10px] font-semibold">{r.count}</span>
                </button>
              ))}

              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--violet)] hover:bg-[var(--bg-modifier)] transition-all opacity-60 group-hover:opacity-100"
                  title="React"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </button>

                {showPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                    <div className="absolute bottom-full left-0 mb-2 z-50 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-xl p-1.5 flex gap-0.5 anim-enter-scale">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(emoji)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-modifier)] transition-colors text-lg hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
