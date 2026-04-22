import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { createChannel } from '../../api/channels'

const PRESETS = [
  { label: 'Done / Not Done', unit: '', lbl: '', hint: 'One-tap boolean goal' },
  { label: 'Miles', unit: 'miles', lbl: '', hint: 'Running, cycling' },
  { label: 'Pages', unit: 'pages', lbl: '', hint: 'Reading goal' },
  { label: 'Minutes', unit: 'min', lbl: '', hint: 'Meditation, focus' },
]

export default function CreateChannelModal({ serverId, isOpen, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetUnit, setTargetUnit] = useState('')
  const [targetLabel, setTargetLabel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)
    try {
      const data = { name: name.trim() }
      if (description.trim()) data.description = description.trim()
      if (targetUnit.trim()) data.target_unit = targetUnit.trim()
      if (targetLabel.trim()) data.target_label = targetLabel.trim()

      await createChannel(serverId, data)
      setName('')
      setDescription('')
      setTargetUnit('')
      setTargetLabel('')
      onClose()
      if (onCreated) onCreated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="NEW CHANNEL"
      title="What's the goal?"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--rose)]/10 border border-[var(--rose)]/40 text-[var(--rose)] text-sm">
            {error}
          </div>
        )}

        <Input
          label="Channel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="running, reading, water…"
          required
          autoFocus
        />

        <div>
          <label className="eyebrow block mb-2 text-[var(--text-secondary)]">
            PICK A TARGET
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const active = targetUnit === p.unit && targetLabel === p.lbl
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setTargetUnit(p.unit)
                    setTargetLabel(p.lbl)
                  }}
                  className={`
                    text-left p-3 rounded-xl transition-all
                    ${active
                      ? 'bg-[var(--lime)]/10 border border-[var(--lime)]/50'
                      : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]'}
                  `}
                >
                  <div className={`font-semibold text-sm ${active ? 'text-[var(--lime)]' : 'text-[var(--text-primary)]'}`}>
                    {p.label}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.hint}</div>
                </button>
              )
            })}
          </div>
        </div>

        <Input
          label="Custom unit (optional)"
          value={targetUnit}
          onChange={(e) => setTargetUnit(e.target.value)}
          placeholder="e.g. reps, kg, glasses"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating…' : 'Create channel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
