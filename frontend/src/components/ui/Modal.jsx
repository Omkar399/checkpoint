import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--bg-secondary)] rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {title && (
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
