import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, eyebrow, children, size = 'md' }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidths = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal shell */}
      <div
        className={`
          relative w-full ${maxWidths[size] || maxWidths.md}
          bg-[var(--bg-elevated)]
          rounded-lg
          shadow-[0_8px_24px_rgba(0,0,0,0.5)]
        `}
      >
        {/* Top accent bar */}
        <div
          className="h-[2px] mx-10 rounded-full bg-[var(--lime)] opacity-80"
          style={{ marginTop: 0 }}
        />

        {/* Content */}
        <div className="px-10 pt-8 pb-10">
          {eyebrow && <div className="eyebrow mb-3 text-[var(--lime)]">{eyebrow}</div>}
          {title && (
            <h2 className="display text-3xl text-[var(--text-primary)] mb-7 pr-10">
              {title}
            </h2>
          )}
          {children}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-modifier)] transition-colors"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
