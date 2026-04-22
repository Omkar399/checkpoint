function formatTimestamp(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today · ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`
}

export default function MessageBubble({ message, showAuthor, onUsernameClick }) {
  const username = message.username || message.user?.username || 'Unknown'
  const isBot = message.message_type === 'bot'

  // Condensed continuation line (no avatar)
  if (!showAuthor) {
    return (
      <div className="group flex items-center gap-3 pl-16 pr-3 py-0.5 hover:bg-[var(--bg-modifier)] rounded-md">
        <span className="mono w-10 shrink-0 text-right text-[9px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 -ml-12">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <p className="text-[var(--text-secondary)] text-[14px] whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
      </div>
    )
  }

  // Bot — uniquely styled (lime/coach)
  if (isBot) {
    return (
      <div className="group flex gap-3 px-3 py-2 mt-5 first:mt-0 anim-enter-up">
        <div className="w-10 h-10 rounded-full bg-[var(--lime)] text-black flex items-center justify-center shrink-0 mt-0.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm text-[var(--lime)]">{username}</span>
            <span className="text-[8px] font-bold bg-[var(--lime)] text-black px-1.5 py-0.5 rounded tracking-wider">COACH</span>
            <span className="mono text-[10px] text-[var(--text-muted)]">{formatTimestamp(message.created_at)}</span>
          </div>
          <div className="mt-1.5 px-4 py-2.5 rounded-xl rounded-tl-sm bg-[var(--lime)]/8 border-l-2 border-[var(--lime)]">
            <p className="text-[var(--text-primary)] text-[14px] whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Regular message
  return (
    <div className="group flex gap-3 px-3 py-1.5 mt-5 first:mt-0 rounded-md hover:bg-[var(--bg-modifier)] anim-enter-up">
      <button
        onClick={() => onUsernameClick?.(message.user_id)}
        className="shrink-0 mt-0.5"
      >
        <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] text-white flex items-center justify-center text-sm font-bold hover:bg-[var(--bg-elevated)] transition-colors">
          {username.charAt(0).toUpperCase()}
        </div>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="font-semibold text-[var(--text-primary)] text-sm hover:text-[var(--lime)] cursor-pointer transition-colors"
            onClick={() => onUsernameClick?.(message.user_id)}
          >
            {username}
          </span>
          <span className="mono text-[10px] text-[var(--text-muted)]">{formatTimestamp(message.created_at)}</span>
        </div>
        <p className="text-[var(--text-secondary)] text-[14px] whitespace-pre-wrap break-words leading-relaxed mt-0.5">
          {message.content}
        </p>
      </div>
    </div>
  )
}
