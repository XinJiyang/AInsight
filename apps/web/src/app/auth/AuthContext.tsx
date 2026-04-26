import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEMO_ACCOUNTS, DEMO_MODE, DEMO_TOKEN } from '../demo'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const TOKEN_STORAGE_KEY = 'ainsight_auth_token'
const DEMO_USER_STORAGE_KEY = 'ainsight_demo_user'

export type AuthUser = {
  id: string
  name: string
  email: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<AuthUser | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY) ? loadStoredDemoUser() : null,
  )
  const [isLoading, setIsLoading] = useState(Boolean(token) && !DEMO_MODE)
  const isAdmin = !DEMO_MODE && Boolean(ADMIN_EMAIL) && user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  useEffect(() => {
    if (DEMO_MODE) {
      if (token && !user) {
        setUser(loadStoredDemoUser())
      }
      setIsLoading(false)
      return
    }

    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    let active = true

    async function loadCurrentUser() {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const payload = await response.json()

        if (!active) {
          return
        }

        if (payload.user) {
          setUser(payload.user)
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      active = false
    }
  }, [token])

  async function login(email: string, password: string) {
    if (DEMO_MODE) {
      const account = DEMO_ACCOUNTS.find(
        (candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password,
      )

      if (!account) {
        throw new Error('Use one of the demo accounts shown on this page.')
      }

      persistSession(DEMO_TOKEN, {
        id: `demo-${account.email}`,
        name: account.name,
        email: account.email,
      })
      return
    }

    const payload = await requestAuth('/api/auth/login', {
      email,
      password,
    })
    persistSession(payload.token, payload.user)
  }

  async function register(name: string, email: string, password: string) {
    if (DEMO_MODE) {
      if (!name || !email || password.length < 8) {
        throw new Error('Use a name, email, and a password with at least 8 characters.')
      }

      persistSession(DEMO_TOKEN, {
        id: `demo-${email.toLowerCase()}`,
        name,
        email,
      })
      return
    }

    const payload = await requestAuth('/api/auth/register', {
      name,
      email,
      password,
    })
    persistSession(payload.token, payload.user)
  }

  async function logout() {
    if (token && !DEMO_MODE) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null)
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(DEMO_USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  function persistSession(nextToken: string, nextUser: AuthUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    if (DEMO_MODE) {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(nextUser))
    }
    setToken(nextToken)
    setUser(nextUser)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAdmin,
      isLoading,
      login,
      register,
      logout,
      authHeaders: () => (token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [user, token, isAdmin, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function loadStoredDemoUser(): AuthUser | null {
  if (!DEMO_MODE) {
    return null
  }

  const rawUser = localStorage.getItem(DEMO_USER_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY)
    return null
  }
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}

async function requestAuth(path: string, body: Record<string, string>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error ?? `Authentication request failed: ${response.status}`)
  }

  return payload as {
    user: AuthUser
    token: string
  }
}
