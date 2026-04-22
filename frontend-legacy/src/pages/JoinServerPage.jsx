import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { joinByInvite } from '../api/invites'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'

export default function JoinServerPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [server, setServer] = useState(null)

  useEffect(() => {
    if (!inviteCode) {
      setStatus('error')
      setError('No invite code provided.')
      return
    }

    joinByInvite(inviteCode)
      .then((res) => {
        setServer(res.data.server || res.data)
        setStatus('success')
        setTimeout(() => {
          const serverId = res.data.server?.id || res.data.server_id || res.data.id
          navigate(serverId ? `/dashboard/server/${serverId}` : '/dashboard', { replace: true })
        }, 1800)
      })
      .catch((err) => {
        setStatus('error')
        setError(err.response?.data?.detail || 'Failed to join server. The invite may be invalid or expired.')
      })
  }, [inviteCode, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60vh 60vh at 50% 40%, rgba(61,40,23,0.06), transparent 60%)',
        }}
      />
      <div className="relative card-surface rounded-3xl p-10 max-w-md w-full text-center shadow-[0_24px_60px_rgba(23,23,28,0.12),0_4px_12px_rgba(23,23,28,0.06)] anim-enter-up">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded bg-[var(--lime)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="display text-lg text-[var(--text-primary)]">Checkpoint</span>
        </div>

        {status === 'loading' && (
          <div>
            <div className="eyebrow text-[var(--lime)] mb-3">VERIFYING</div>
            <h1 className="display text-3xl text-[var(--text-primary)] mb-6">
              Unlocking the room…
            </h1>
            <LoadingSpinner />
          </div>
        )}

        {status === 'success' && (
          <div className="anim-enter-scale">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--lime)] flex items-center justify-center halo-lime anim-bounce-check">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="eyebrow text-[var(--lime)] mb-2">YOU'RE IN</div>
            <h1 className="display text-3xl text-[var(--text-primary)] mb-2">
              Welcome to<br />
              <span className="gradient-lime">{server?.name || 'the team'}</span>
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-4">
              Redirecting…
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--rose)]/15 border border-[var(--rose)]/40 flex items-center justify-center">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="display text-2xl text-[var(--text-primary)] mb-3">
              Invite didn't work
            </h1>
            <p className="text-[var(--text-muted)] mb-6 text-sm">{error}</p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
