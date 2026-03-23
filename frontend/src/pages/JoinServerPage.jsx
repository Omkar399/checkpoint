import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { joinByInvite } from '../api/invites'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'

export default function JoinServerPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
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
        // Redirect after a short delay
        setTimeout(() => {
          const serverId = res.data.server?.id || res.data.server_id || res.data.id
          if (serverId) {
            navigate(`/dashboard/server/${serverId}`, { replace: true })
          } else {
            navigate('/dashboard', { replace: true })
          }
        }, 2000)
      })
      .catch((err) => {
        setStatus('error')
        setError(
          err.response?.data?.detail || 'Failed to join server. The invite may be invalid or expired.'
        )
      })
  }, [inviteCode, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="bg-[var(--bg-secondary)] rounded-lg p-8 shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Checkpoint
        </h1>

        {status === 'loading' && (
          <div>
            <p className="text-[var(--text-muted)] mb-4">
              Joining server...
            </p>
            <LoadingSpinner />
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[var(--text-primary)] text-lg font-semibold mb-1">
              Successfully joined{server?.name ? ` ${server.name}` : ''}!
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              Redirecting you to the server...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--danger)]/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="text-[var(--danger)] mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
