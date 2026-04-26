import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { UserPlus } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { DEMO_MODE } from '../demo'
import { AuthShell, Field } from './LoginPage'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      await register(name, email, password)
      navigate('/')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to register')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Join AInsight"
      description="Create a local account to save AI updates and build your personal knowledge list."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {DEMO_MODE ? (
          <p className="rounded-[8px] border border-brand-200 bg-brand-50 px-3 py-2 text-sm leading-6 text-brand-600">
            Static demo mode creates a local-only account in this browser. No backend or database request is made.
          </p>
        ) : null}

        <Field label="Name" type="text" value={name} onChange={setName} placeholder="Your name" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />

        {error ? (
          <p className="rounded-[8px] border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-accent">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          <UserPlus size={16} />
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-brand-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
