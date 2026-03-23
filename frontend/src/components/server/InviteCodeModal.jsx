import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { createInvite } from '../../api/invites'

export default function InviteCodeModal({ serverId, isOpen, onClose }) {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await createInvite(serverId, {})
      setInviteCode(res.data.code)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate invite.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    const url = `${window.location.origin}/join/${inviteCode}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setInviteCode('')
    setError('')
    setCopied(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite People">
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-[var(--danger)]/10 border border-[var(--danger)] text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        {!inviteCode ? (
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              Generate an invite link to share with friends.
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Invite Link'}
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
              Invite Link
            </p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm truncate">
                {window.location.origin}/join/{inviteCode}
              </div>
              <Button onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}
