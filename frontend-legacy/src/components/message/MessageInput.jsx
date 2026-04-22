import { useState, useRef, useEffect } from 'react'

export default function MessageInput({
  onSend,
  channelName,
  onCheckinClick,
  isBooleanChannel,
  onQuickCheckin,
  alreadyCheckedInToday,
}) {
  const [content, setContent] = useState('')
  const [justChecked, setJustChecked] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 5 * 24
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

  const handleQuickTap = () => {
    if (!onQuickCheckin) return
    onQuickCheckin()
    setJustChecked(true)
    setTimeout(() => setJustChecked(false), 2000)
  }

  return (
    <div className="px-5 pb-5 pt-2 relative">
      {/* Frictionless row: one-tap Done (if boolean) or Check-in CTA */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isBooleanChannel && onQuickCheckin && (
            <button
              onClick={handleQuickTap}
              className={`
                relative group flex items-center gap-2.5 px-5 py-3 rounded-full
                font-bold text-[15px] tracking-tight
                transition-all duration-200 active:scale-[0.97]
                ${alreadyCheckedInToday
                  ? 'bg-[var(--cyan)]/15 border border-[var(--cyan)]/40 text-[var(--cyan)] cursor-default'
                  : 'bg-[var(--lime)] text-black halo-lime anim-pulse-lime hover:bg-[#1ed775] hover:scale-[1.04]'}
              `}
              disabled={alreadyCheckedInToday || justChecked}
              title={alreadyCheckedInToday ? 'Already done for today' : 'Tap to mark today done'}
            >
              {alreadyCheckedInToday ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Done for today
                </>
              ) : justChecked ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="anim-bounce-check">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Nice. Logged.
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Mark today done
                  <span className="eyebrow text-[9px] opacity-70">· ONE TAP</span>
                </>
              )}
            </button>
          )}

          {onCheckinClick && !isBooleanChannel && (
            <button
              onClick={onCheckinClick}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--lime)] hover:bg-[var(--lime-soft)] text-black font-bold text-sm transition-all halo-lime active:scale-[0.97]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Log a check-in
            </button>
          )}

          {onCheckinClick && isBooleanChannel && (
            <button
              onClick={onCheckinClick}
              className="eyebrow text-[var(--text-muted)] hover:text-[var(--lime)] transition-colors"
              title="Log with a number or a note instead"
            >
              + ADD DETAIL
            </button>
          )}
        </div>

        <div className="eyebrow text-[var(--text-dim)] hidden sm:flex items-center gap-2">
          <kbd className="mono px-1.5 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded text-[9px] text-[var(--text-muted)]">
            ↵
          </kbd>
          SEND
        </div>
      </div>

      {/* Message textarea */}
      <div className="flex items-end gap-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-2xl px-4 py-3 focus-within:border-[var(--lime)]/60 focus-within:shadow-[0_0_0_3px_rgba(61,40,23,0.08)] transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName || 'channel'}`}
          rows={1}
          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-dim)] text-[15px] resize-none focus:outline-none leading-6 max-h-[120px] tracking-tight"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--lime)] text-black disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-dim)] disabled:cursor-not-allowed hover:bg-[var(--lime-soft)] transition-all active:scale-90"
          aria-label="Send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
