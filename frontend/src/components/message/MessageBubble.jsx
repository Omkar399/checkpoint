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

export default function MessageBubble({ message, showAuthor }) {
  const username = message.username || message.user?.username || 'Unknown'

  if (!showAuthor) {
    return (
      <div className="group flex items-center gap-4 px-2 py-0.5 hover:bg-[var(--bg-modifier)] rounded">
        <span className="w-10 shrink-0 text-right text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    )
  }

  return (
    <div className="group flex gap-4 px-2 py-1 mt-4 first:mt-0 hover:bg-[var(--bg-modifier)] rounded">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5">
        {username.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-[var(--text-primary)] text-sm hover:underline cursor-pointer">
            {username}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {formatTimestamp(message.created_at)}
          </span>
        </div>
        <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  )
}
