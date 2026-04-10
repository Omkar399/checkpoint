import { useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import CheckInCard from '../checkin/CheckInCard'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function MessageFeed({ messages, loading, onLoadMore, hasMore, onUsernameClick }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const prevMessageCountRef = useRef(0)

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added at the end
    if (messages.length > prevMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-2">
      {/* Load more button */}
      {hasMore && (
        <div className="text-center py-2">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-[var(--text-muted)] text-lg mb-1">
              No messages yet
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              Be the first to send a message!
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
            />
          )
        }

        const prevMessage = index > 0 ? messages[index - 1] : null
        const showAuthor =
          !prevMessage ||
          prevMessage.message_type === 'checkin' ||
          prevMessage.user_id !== message.user_id ||
          (new Date(message.created_at) - new Date(prevMessage.created_at)) > 300000 // 5 min gap
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
