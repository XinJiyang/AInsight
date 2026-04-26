import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { LogIn, Zap } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { DEMO_ACCOUNTS, DEMO_MODE } from '../demo'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      await login(email, password)
      navigate('/')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to log in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to AInsight"
      description="Save AI updates, keep a personal reading list, and come back to your important articles."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {DEMO_MODE ? (
          <div className="rounded-[8px] border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700">
            <p className="mb-2 font-semibold text-brand-900">Static demo accounts</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                  }}
                  className="block w-full rounded-[8px] border border-brand-200 bg-white px-3 py-2 text-left transition-colors hover:bg-brand-100"
                >
                  <span className="block font-semibold">{account.name}</span>
                  <span className="block text-xs text-brand-500">
                    {account.email} / {account.password}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-brand-500">
              Demo mode stores the session locally and never calls a backend API.
            </p>
          </div>
        ) : null}

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
        />

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
          <LogIn size={16} />
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-sm text-brand-500">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-brand-accent hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-128px)] max-w-6xl items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[8px] border border-brand-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent text-white">
            <Zap size={18} className="fill-current" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">{eyebrow}</p>
            <h1 className="text-2xl font-bold tracking-tight text-brand-900">{title}</h1>
          </div>
        </div>
        <p className="mb-6 text-sm leading-6 text-brand-500">{description}</p>
        {children}
      </section>
    </main>
  )
}

export function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-brand-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[8px] border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-accent/40 focus:ring-2 focus:ring-brand-accent/15"
      />
    </label>
  )
}
