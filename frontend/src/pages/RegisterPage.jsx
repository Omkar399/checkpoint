import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RegisterForm from '../components/auth/RegisterForm'

export default function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Checkpoint</h1>
          <p className="text-[var(--text-muted)] mt-2">
            Social accountability, together.
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-lg p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] text-center mb-6">
            Create an account
          </h2>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
