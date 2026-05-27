// Pure server component — no hooks, no 'use client'
// Covers all (app) route transitions: /dashboard, /doctor, /admin

export default function AppLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-3">
        <div className="h-9 w-72 bg-surface-container-high rounded-full" />
        <div className="h-4 w-48 bg-surface-container-high rounded-full opacity-60" />
      </div>

      {/* Stats / metric cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-6 space-y-4 border border-surface-container-high">
            <div className="w-11 h-11 rounded-full bg-surface-container-high" />
            <div className="h-8 w-20 bg-surface-container-high rounded-full" />
            <div className="h-3 w-24 bg-surface-container-high rounded-full opacity-60" />
          </div>
        ))}
      </div>

      {/* Content cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-5 space-y-3 border border-surface-container-high">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-surface-container-high rounded-full w-3/4" />
                <div className="h-3 bg-surface-container-high rounded-full w-1/2 opacity-60" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-surface-container-high rounded-full" />
              <div className="h-3 bg-surface-container-high rounded-full w-5/6" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-container-high">
          <div className="h-5 w-48 bg-surface-container-high rounded-full" />
        </div>
        <div className="divide-y divide-surface-container-high">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-container-high rounded-full w-1/3" />
                <div className="h-3 bg-surface-container-high rounded-full w-1/4 opacity-60" />
              </div>
              <div className="h-7 w-20 bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
