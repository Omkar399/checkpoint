import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { createCheckin } from '../../api/checkins'

export default function CheckInModal({ isOpen, onClose, channelId, channel, onCheckinCreated }) {
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [isBoolean, setIsBoolean] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const unit = channel?.target_unit || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isBoolean && (!value || isNaN(Number(value)))) {
      setError('Please enter a valid number')
      return
    }

    setSubmitting(true)
    try {
      const data = {
        value: isBoolean ? 1 : Number(value),
        is_boolean: isBoolean,
      }
      if (note.trim()) {
        data.note = note.trim()
      }
      const res = await createCheckin(channelId, data)
      onCheckinCreated?.(res.data)
      handleClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit check-in')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setValue('')
    setNote('')
    setIsBoolean(false)
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Check In">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle between numeric and done */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsBoolean(false)}
            className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
              !isBoolean
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
            }`}
          >
            Value {unit ? `(${unit})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setIsBoolean(true)}
            className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
              isBoolean
                ? 'bg-[var(--success)] text-white'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
            }`}
          >
            Done
          </button>
        </div>

        {/* Value input */}
        {!isBoolean && (
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
              Value {unit ? `(${unit})` : ''}
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter value${unit ? ` in ${unit}` : ''}`}
              className="w-full px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              autoFocus
            />
          </div>
        )}

        {isBoolean && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">{'\u2705'}</div>
            <p className="text-[var(--text-secondary)] text-sm">
              Mark as completed for today
            </p>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did it go?"
            rows={2}
            className="w-full px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-[var(--danger)]">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Check In'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
