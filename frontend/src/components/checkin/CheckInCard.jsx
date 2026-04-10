function formatTimestamp(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) {
    return `Today at ${time}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${time}`
  }

  return `${date.toLocaleDateString()} ${time}`
}

const CHECKIN_COLORS = {
  default: 'border-[var(--accent)]',
  success: 'border-[var(--success)]',
}

export default function CheckInCard({ message, onUsernameClick }) {
  const username = message.username || message.user?.username || 'Unknown'
  const checkin = message.checkin_data || {}
  const value = checkin.value
  const unit = checkin.unit || ''
  const note = checkin.note || message.content || ''
  const streak = checkin.streak || 0
  const isDone = checkin.is_boolean

  const displayValue = isDone ? 'Done' : `${value} ${unit}`.trim()
  const borderColor = value || isDone ? CHECKIN_COLORS.success : CHECKIN_COLORS.default

  return (
    <div className={`group flex gap-4 px-2 py-1 mt-4 first:mt-0 hover:bg-[var(--bg-modifier)] rounded`}>
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5 cursor-pointer"
        onClick={() => onUsernameClick?.(message.user_id)}
      >
        {username.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="font-medium text-[var(--text-primary)] text-sm hover:underline cursor-pointer"
            onClick={() => onUsernameClick?.(message.user_id)}
          >
            {username}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        {/* Check-in card body */}
        <div className={`mt-1 border-l-4 ${borderColor} bg-[var(--bg-secondary)] rounded-r-md px-3 py-2`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {isDone ? '\u2705' : '\u{1F4CA}'}
            </span>
            <span className="font-semibold text-[var(--text-primary)] text-sm">
              {displayValue}
            </span>
            {streak > 0 && (
              <span className="text-xs text-[var(--warning)] font-medium ml-auto">
                {'\u{1F525}'} {streak} day streak
              </span>
            )}
          </div>
          {note && (
            <p className="text-[var(--text-secondary)] text-xs mt-1 whitespace-pre-wrap break-words">
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
