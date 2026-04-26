import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BrainCircuit,
  Cpu,
  Layers3,
  Lock,
  RefreshCw,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { modelDirectory, type ModelDirectoryItem } from '../data/models';
import { useAuth } from '../auth/AuthContext';
import { DEMO_MODE } from '../demo';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export function ModelsPage() {
  const { isAdmin, authHeaders } = useAuth()
  const [models, setModels] = useState<ModelDirectoryItem[]>(modelDirectory)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  const featuredCount = useMemo(
    () => models.filter((model) => model.isFeatured).length,
    [models],
  )

  async function handleRefreshModels() {
    if (DEMO_MODE) {
      setIsRefreshing(true)
      setRefreshError(null)
      window.setTimeout(() => {
        setLastUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        setIsRefreshing(false)
      }, 450)
      return
    }

    try {
      setIsRefreshing(true)
      setRefreshError(null)

      const response = await fetch(`${API_BASE_URL}/api/models/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          models,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? `Models refresh failed: ${response.status}`)
      }

      const payload = (await response.json()) as {
        cached: boolean
        models: ModelDirectoryItem[]
      }

      if (Array.isArray(payload.models) && payload.models.length > 0) {
        setModels(payload.models)
        setLastUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Unable to refresh models')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-[8px] border border-brand-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-brand-100 text-brand-accent">
              <Cpu size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-accent">
                Model Directory
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">
                Major AI Models
              </h1>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={!isAdmin || isRefreshing}
              className="inline-flex items-center gap-2 rounded-[8px] border border-brand-200 bg-brand-100 px-4 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-200 disabled:cursor-not-allowed disabled:opacity-70"
              title={isAdmin ? 'Refresh model information with AI' : 'Display only. Admin access is required to use AI and avoid API costs.'}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing models...' : 'AI refresh'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-3xl text-base leading-7 text-brand-600">
            A front-end model directory built from official model pages and vendor
            docs. Each card links directly to the model&apos;s official product or
            documentation page.
          </p>

          <div className="text-sm text-brand-500">
            <span className="font-semibold text-brand-800">{models.length}</span> tracked models
            <span className="mx-2 text-brand-300">&bull;</span>
            <span className="font-semibold text-brand-800">{featuredCount}</span> featured
            {lastUpdatedAt ? (
              <>
                <span className="mx-2 text-brand-300">&bull;</span>
                Refreshed at {lastUpdatedAt}
              </>
            ) : null}
          </div>
        </div>

        {refreshError ? (
          <p className="mt-4 rounded-[8px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-accent">
            {refreshError}
          </p>
        ) : null}
        {!isAdmin ? (
          <p className="mt-4 rounded-[8px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-600">
            Display only. Admin access is required to use AI refresh and avoid API costs.
          </p>
        ) : null}
        {DEMO_MODE && isAdmin ? (
          <p className="mt-4 rounded-[8px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-600">
            Static demo mode is enabled. AI refresh is simulated locally and no API cost is incurred.
          </p>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => (
          <article
            key={model.id}
            className="group flex h-full flex-col rounded-[8px] border border-brand-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-brand-100">
                  <img
                    src={model.logoPath}
                    alt={`${model.company} logo`}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-600">
                    {model.company}
                  </p>
                  <h2 className="text-xl font-bold leading-tight text-brand-900">
                    {model.name}
                  </h2>
                </div>
              </div>

              {model.isFeatured ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-accent px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  <Sparkles size={12} />
                  Featured
                </span>
              ) : null}
            </div>

            <p className="mb-5 text-sm leading-6 text-brand-700">
              {model.description}
            </p>

            <div className="mb-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <DetailRow
                label="Availability"
                value={model.availability}
                icon={
                  model.availability === 'Open-weight' ? (
                    <Unlock size={14} />
                  ) : (
                    <Lock size={14} />
                  )
                }
              />
              <DetailRow
                label="Parameters"
                value={model.parameters}
                icon={<Layers3 size={14} />}
              />
              <DetailRow
                label="Context"
                value={model.contextWindow}
                icon={<BrainCircuit size={14} />}
              />
              <DetailRow
                label="Released"
                value={model.released}
                icon={<Cpu size={14} />}
              />
            </div>

            <div className="mb-6 rounded-[8px] bg-brand-50 px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                Best for
              </p>
              <p className="text-sm font-medium leading-6 text-brand-800">
                {model.bestFor}
              </p>
            </div>

            <a
              href={model.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-100 px-4 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-200"
            >
              Learn more
              <ArrowUpRight size={16} />
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-brand-200 bg-brand-50 px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
        <span className="text-brand-accent">{icon}</span>
        {label}
      </div>
      <p className="text-sm font-semibold leading-6 text-brand-900">{value}</p>
    </div>
  );
}
