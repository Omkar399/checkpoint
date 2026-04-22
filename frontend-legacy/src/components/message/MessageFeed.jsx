import { useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import CheckInCard from '../checkin/CheckInCard'

export default function MessageFeed({
  messages,
  loading,
  onLoadMore,
  hasMore,
  onUsernameClick,
  onReact,
  onUnreact,
}) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const prevMessageCountRef = useRef(0)

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-4">
      {hasMore && (
        <div className="text-center py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-2 text-[var(--text-muted)]">
              <div className="w-3 h-3 border-2 border-[var(--border-subtle)] border-t-[var(--lime)] rounded-full animate-spin" />
              <span className="eyebrow">LOADING</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="eyebrow text-[var(--text-muted)] hover:text-[var(--lime)] transition-colors"
            >
              ↑ LOAD OLDER
            </button>
          )}
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[var(--bg-tertiary)] flex items-center justify-center relative">
              <div
                className="absolute inset-0 rounded-3xl opacity-30"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, var(--lime), transparent 60%)',
                }}
              />
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="eyebrow text-[var(--lime)] mb-2">FRESH CHANNEL</div>
            <h3 className="display text-2xl text-[var(--text-primary)] mb-2">
              Make the first move.
            </h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              Drop a message — or, better, tap <span className="text-[var(--lime)] font-semibold">CHECK IN</span> below to log the first one.
            </p>
          </div>
        </div>
      )}

      {messages.map((message, index) => {
        if (message.message_type === 'checkin') {
          return (
            <CheckInCard
              key={message.id}
              message={message}
              onUsernameClick={onUsernameClick}
              onReact={onReact}
              onUnreact={onUnreact}
            />
          )
        }

        const prevMessage = index > 0 ? messages[index - 1] : null
        const showAuthor =
          !prevMessage ||
          prevMessage.message_type === 'checkin' ||
          prevMessage.message_type === 'bot' ||
          prevMessage.user_id !== message.user_id ||
          (new Date(message.created_at) - new Date(prevMessage.created_at)) > 300000

        return (
          <MessageBubble
            key={message.id}
            message={message}
            showAuthor={showAuthor}
            onUsernameClick={onUsernameClick}
          />
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
