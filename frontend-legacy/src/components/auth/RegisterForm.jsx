import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function RegisterForm() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, username, password)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-5 px-3 py-2.5 rounded-lg bg-[var(--rose)]/8 border border-[var(--rose)]/30 text-[var(--rose)] text-sm">
          {error}
        </div>
      )}

      <div className="space-y-10">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
          required
        />

        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@handle"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6+ characters"
          required
          minLength={6}
        />
      </div>

      <Button type="submit" size="lg" className="w-full mt-7" disabled={loading}>
        {loading ? 'Creating…' : (
          <>
            Create account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </Button>

      <p className="text-sm text-[var(--text-muted)] text-center mt-6">
        Already a member?{' '}
        <Link to="/login" className="text-[var(--lime)] hover:underline font-semibold">
          Log in
        </Link>
      </p>
    </form>
  )
}
