export function NewsCardSkeleton() {
  return (
    <div className="flex flex-col gap-5 rounded-[8px] border border-brand-200 bg-white p-5 shadow-sm sm:flex-row sm:p-7">
      <div className="hidden sm:block">
        <div className="h-11 w-11 animate-pulse rounded-full bg-brand-100" />
      </div>

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 animate-pulse rounded bg-brand-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-brand-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-brand-100" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded bg-brand-100" />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-brand-50" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-brand-50" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-brand-50" />
        </div>

        <div className="space-y-3">
          <div className="h-10 w-11/12 animate-pulse rounded bg-brand-100" />
          <div className="h-10 w-8/12 animate-pulse rounded bg-brand-100" />
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-5 w-full animate-pulse rounded bg-brand-50" />
          <div className="h-5 w-10/12 animate-pulse rounded bg-brand-50" />
          <div className="h-5 w-7/12 animate-pulse rounded bg-brand-50" />
        </div>

        <div className="mt-5 h-8 w-28 animate-pulse rounded-full bg-brand-50" />

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-16 animate-pulse rounded-full bg-brand-50" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-brand-50" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-brand-50" />
          </div>

          <div className="h-8 w-8 animate-pulse rounded bg-brand-100" />
        </div>
      </div>
    </div>
  )
}
