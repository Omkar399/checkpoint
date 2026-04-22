import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { createCheckin } from '../../api/checkins'

export default function CheckInModal({ isOpen, onClose, channelId, channel, onCheckinCreated }) {
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [mode, setMode] = useState('value') // 'value' | 'done'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const unit = channel?.target_unit || ''
  const targetLabel = channel?.target_label

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'value' && (!value || isNaN(Number(value)))) {
      setError('Enter a number — even 0 counts.')
      return
    }

    setSubmitting(true)
    try {
      const data = {
        value: mode === 'done' ? 1 : Number(value),
        is_boolean: mode === 'done',
      }
      if (note.trim()) data.note = note.trim()
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
    setMode('value')
    setError('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      eyebrow="LOG A CHECK-IN"
      title={targetLabel ? targetLabel : `#${channel?.name || 'channel'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mode toggle — segmented */}
        <div className="flex gap-1 p-1 bg-[var(--bg-primary)] rounded-full border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setMode('value')}
            className={`
              flex-1 py-2 rounded-full text-sm font-semibold transition-all
              ${mode === 'value'
                ? 'bg-[var(--lime)] text-black shadow-[0_6px_16px_rgba(30,215,96,0.22)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
            `}
          >
            Log a number
          </button>
          <button
            type="button"
            onClick={() => setMode('done')}
            className={`
              flex-1 py-2 rounded-full text-sm font-semibold transition-all
              ${mode === 'done'
                ? 'bg-[var(--cyan)] text-black shadow-[0_6px_16px_rgba(83,157,245,0.22)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
            `}
          >
            Mark done
          </button>
        </div>

        {/* Value input */}
        {mode === 'value' && (
          <div className="anim-enter-up">
            <div className="flex items-end gap-3 p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]">
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                autoFocus
                className="flex-1 bg-transparent display text-5xl text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none mono"
              />
              {unit && (
                <span className="eyebrow text-[var(--lime)] pb-3 text-sm">{unit}</span>
              )}
            </div>
          </div>
        )}

        {mode === 'done' && (
          <div className="anim-enter-up">
            <div className="py-8 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[var(--cyan)] flex items-center justify-center anim-bounce-check" style={{ boxShadow: '0 8px 28px rgba(15,117,102,0.28), 0 0 0 1px rgba(15,117,102,0.3) inset' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="mt-5 text-[var(--text-primary)] display text-2xl">
                Mark as done
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-1 eyebrow">
                ONE TAP · SERVER-STAMPED
              </p>
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="eyebrow block mb-2 text-[var(--text-secondary)]">
            ADD A NOTE (OPTIONAL)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How did it go?"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-dim)] text-[15px] focus:outline-none focus:border-[var(--lime)] focus:shadow-[0_0_0_4px_rgba(61,40,23,0.12)] transition-all resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--rose)]">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={mode === 'done' ? 'cyan' : 'primary'}
            disabled={submitting}
          >
            {submitting ? 'Logging…' : 'Check in'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
