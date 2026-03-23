import { useState, useRef, useEffect } from 'react'

export default function MessageInput({ onSend, channelName }) {
  const [content, setContent] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 5 * 24 // ~5 lines
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'
    }
  }, [content])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = content.trim()
    if (!trimmed) return
    onSend(trimmed)
    setContent('')
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="flex items-end gap-2 bg-[var(--bg-secondary)] rounded-lg px-4 py-2.5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName || 'channel'}`}
          rows={1}
          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm resize-none focus:outline-none leading-6 max-h-[120px]"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed transition-colors pb-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
