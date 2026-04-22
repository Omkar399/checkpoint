import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { createServer } from '../../api/servers'

export default function CreateServerModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)
    try {
      await createServer(name.trim(), description.trim() || undefined)
      setName('')
      setDescription('')
      onClose()
      if (onCreated) onCreated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="NEW SERVER"
      title="Build your group."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--rose)]/10 border border-[var(--rose)]/40 text-[var(--rose)] text-sm">
            {error}
          </div>
        )}

        <Input
          label="Server name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fit 2026, Finals Crew, Book Club…"
          required
          autoFocus
        />

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this group about?"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating…' : 'Create server'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
