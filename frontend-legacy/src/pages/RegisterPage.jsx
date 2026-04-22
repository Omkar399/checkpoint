import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RegisterForm from '../components/auth/RegisterForm'

export default function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 sm:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--lime)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="display text-lg text-[var(--text-primary)]">Checkpoint</span>
        </Link>
        <Link
          to="/login"
          className="eyebrow text-[var(--text-muted)] hover:text-[var(--lime)] transition-colors"
        >
          ← LOG IN
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10 anim-enter-up">
            <div className="eyebrow text-[var(--cyan)] mb-4">START · TODAY</div>
            <h1 className="display text-5xl sm:text-6xl text-[var(--text-primary)] leading-[0.95] mb-4">
              Show up. <br />
              <span className="italic gradient-lime">Together.</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Create an account and join a room where 'done' means more than a message.
            </p>
          </div>

          <div className="anim-enter-up" style={{ animationDelay: '0.1s' }}>
            <RegisterForm />
          </div>
        </div>
      </main>

      <footer className="px-8 sm:px-12 py-6 flex items-center justify-between text-xs text-[var(--text-muted)] mono">
        <span>CS161 · TEAM 2 · SPRING 2026</span>
        <span>v0.3</span>
      </footer>
    </div>
  )
}
