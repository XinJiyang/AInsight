import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Bookmark, LogIn } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { NewsFeed } from '../components/NewsFeed'
import {
  DEMO_MODE,
  getDemoBookmarkedItems,
  removeDemoBookmark,
  subscribeToDemoBookmarks,
} from '../demo'
import type { ApiNewsItem } from '../types/news'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export function BookmarksPage() {
  const { user, authHeaders } = useAuth()
  const [bookmarkedItems, setBookmarkedItems] = useState<ApiNewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setBookmarkedItems([])
      return
    }

    if (DEMO_MODE) {
      let active = true

      async function loadDemoBookmarks() {
        try {
          setIsLoading(true)
          setError(null)
          const items = await getDemoBookmarkedItems()

          if (active) {
            setBookmarkedItems(items)
          }
        } catch (nextError) {
          if (active) {
            setError(nextError instanceof Error ? nextError.message : 'Unable to load demo bookmarks')
          }
        } finally {
          if (active) {
            setIsLoading(false)
          }
        }
      }

      void loadDemoBookmarks()

      const unsubscribe = subscribeToDemoBookmarks(() => {
        void loadDemoBookmarks()
      })

      return () => {
        active = false
        unsubscribe()
      }
    }

    let active = true

    async function loadBookmarks() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
          headers: authHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Failed to load bookmarks: ${response.status}`)
        }

        const payload = (await response.json()) as { items?: ApiNewsItem[] }

        if (active) {
          setBookmarkedItems(payload.items ?? [])
        }
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load bookmarks')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadBookmarks()

    return () => {
      active = false
    }
  }, [user, authHeaders])

  async function handleToggleBookmark(item: ApiNewsItem) {
    if (DEMO_MODE) {
      removeDemoBookmark(item.id)
      setBookmarkedItems((current) => current.filter((bookmark) => bookmark.id !== item.id))
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    if (response.ok) {
      setBookmarkedItems((current) => current.filter((bookmark) => bookmark.id !== item.id))
    }
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-[calc(100vh+1px)] max-w-4xl px-4 py-8">
        <div className="flex min-h-[calc(100vh-192px)] flex-col items-center justify-center rounded-[8px] border border-dashed border-brand-300 bg-white px-6 py-24 text-center shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-accent">
            <LogIn size={24} />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-brand-900">Log in to view bookmarks</h1>
          <p className="mb-6 max-w-md text-sm leading-6 text-brand-500">
            Your saved AI updates are tied to your account. Log in or create an account to start collecting articles.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="rounded-[8px] bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-[8px] border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[calc(100vh+1px)] max-w-4xl px-4 py-8">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-[8px] bg-brand-100 p-3 text-brand-accent">
            <Bookmark size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Saved Insights</h1>
            <p className="mt-1 text-brand-600">Your personal collection of important AI updates and papers.</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-[8px] border border-brand-200 bg-white px-4 py-3 text-sm text-brand-accent shadow-sm">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center rounded-[8px] border border-brand-200 bg-white px-4 py-10 text-center text-sm text-brand-500 shadow-sm">
          Loading your saved articles...
        </div>
      ) : bookmarkedItems.length > 0 ? (
        <NewsFeed
          items={bookmarkedItems}
          bookmarkedIds={new Set(bookmarkedItems.map((item) => item.id))}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : (
        <div className="flex min-h-[calc(100vh-300px)] flex-col items-center justify-center rounded-[8px] border border-dashed border-brand-300 bg-white py-24 text-center">
          <Bookmark size={48} className="mb-4 text-brand-300" />
          <h3 className="mb-2 text-xl font-semibold text-brand-700">No bookmarks yet</h3>
          <p className="max-w-sm text-brand-500">
            When you see an insight you want to keep, tap the bookmark icon to save it here.
          </p>
        </div>
      )}
    </main>
  )
}
