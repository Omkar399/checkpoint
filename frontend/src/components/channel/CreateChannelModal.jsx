import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { createChannel } from '../../api/channels'

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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-[var(--danger)]/10 border border-[var(--danger)] text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        <Input
          label="Channel Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="general"
          required
        />

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this channel for?"
        />

        <Input
          label="Target Unit (optional)"
          value={targetUnit}
          onChange={(e) => setTargetUnit(e.target.value)}
          placeholder="e.g., miles, hours, pages"
        />

        <Input
          label="Target Label (optional)"
          value={targetLabel}
          onChange={(e) => setTargetLabel(e.target.value)}
          placeholder="e.g., Run 5 miles, Read 30 pages"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Channel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
