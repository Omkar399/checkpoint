import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <div
          role="alert"
          className="rounded-3xl border border-[var(--rose)]/20 bg-[var(--rose)]/8 px-4 py-3.5 text-sm leading-6 text-[var(--rose)]"
        >
          {error}
        </div>
      )}

      <div>
        <div className="mb-8">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            autoComplete="email"
            required
          />
        </div>

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="space-y-4">
        <Button type="submit" size="xl" className="min-h-14 w-full" disabled={loading}>
          {loading ? 'Signing in…' : (
            <>
              Log in
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </Button>

        <p className="text-sm leading-7 text-[var(--text-muted)]">
          Access your servers, channels, streak dashboard, and today&apos;s check-ins in one place.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/6 pt-5 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>New here?</span>
        <Link to="/register" className="font-semibold text-[var(--lime)] transition-colors hover:text-[var(--text-primary)]">
          Create an account
        </Link>
      </div>
    </form>
  )
}
