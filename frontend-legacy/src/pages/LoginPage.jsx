import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  return (
    <div className="auth-shell">
      <header className="relative z-10">
        <div className="auth-frame flex items-center justify-between gap-4 py-6 sm:py-8">
          <Link to="/login" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--lime)] shadow-[0_16px_28px_rgba(30,215,96,0.18)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="eyebrow text-[var(--text-dim)]">Daily Accountability</div>
              <span className="display text-xl text-[var(--text-primary)]">Checkpoint</span>
            </div>
          </Link>

          <Link
            to="/register"
            className="inline-flex min-h-11 items-center rounded-full border border-white/8 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--lime)]"
          >
            Create Account
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <div className="auth-frame auth-grid">
          <section className="auth-story anim-enter-up">
            <div className="space-y-6">
              <div className="eyebrow text-[var(--lime)]">Welcome Back</div>
              <h1 className="display max-w-[12ch] text-5xl leading-[0.92] text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
                Rejoin the room where the streak stays visible.
              </h1>
              <p className="max-w-[34rem] text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                Checkpoint works best when the context is immediate: the right server, the right people,
                and today&apos;s progress already in view when you arrive.
              </p>
            </div>

            <div className="auth-proof-list stagger">
              <article className="auth-proof">
                <div className="auth-proof-number">01</div>
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">See today before you type</h2>
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">
                    Open straight into the conversations, check-ins, and streak movement that matter right now.
                  </p>
                </div>
              </article>

              <article className="auth-proof">
                <div className="auth-proof-number">02</div>
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Move between goals cleanly</h2>
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">
                    Each channel stays focused on one target so momentum feels organized instead of noisy.
                  </p>
                </div>
              </article>

              <article className="auth-proof">
                <div className="auth-proof-number">03</div>
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Keep the group in view</h2>
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">
                    Daily streaks work because progress is shared, visible, and hard to ignore once you&apos;re back in.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="auth-panel anim-enter-up" style={{ animationDelay: '0.08s' }}>
            <div className="auth-panel-content">
              <div className="space-y-3">
                <div className="eyebrow text-[var(--text-dim)]">Log In</div>
                <h2 className="display text-3xl leading-tight text-[var(--text-primary)] sm:text-4xl">
                  Continue today&apos;s check-in rhythm.
                </h2>
                <p className="max-w-[32ch] text-sm leading-7 text-[var(--text-secondary)]">
                  Use the account tied to your server so your streaks, channels, and dashboard stay in sync.
                </p>
              </div>

              <LoginForm />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-5 text-xs text-[var(--text-dim)] mono">
                <span>CS161 · TEAM 2 · SPRING 2026</span>
                <span>Secure session · v0.3</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
