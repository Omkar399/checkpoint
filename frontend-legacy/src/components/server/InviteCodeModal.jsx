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
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setInviteCode('')
    setError('')
    setCopied(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      eyebrow="INVITE"
      title="Bring the crew."
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--rose)]/10 border border-[var(--rose)]/40 text-[var(--rose)] text-sm">
            {error}
          </div>
        )}

        {!inviteCode ? (
          <div className="text-center py-4">
            <p className="text-[var(--text-secondary)] mb-5 text-sm leading-relaxed">
              One link, as many people as you want.<br />
              Expires when you close this tab.
            </p>
            <Button onClick={handleGenerate} size="lg" disabled={loading}>
              {loading ? 'Generating…' : 'Generate invite link'}
            </Button>
          </div>
        ) : (
          <div>
            <div className="eyebrow text-[var(--lime)] mb-2">SHARE THIS LINK</div>
            <div className="flex gap-2 items-stretch">
              <div className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm truncate mono">
                {window.location.origin}/join/{inviteCode}
              </div>
              <Button onClick={handleCopy} variant={copied ? 'cyan' : 'primary'}>
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </>
                ) : 'Copy'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)] text-center">
              Code: <span className="mono text-[var(--lime)]">{inviteCode}</span>
            </p>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="ghost" onClick={handleClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}
