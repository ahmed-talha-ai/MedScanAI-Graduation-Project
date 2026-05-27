// Pure server component — no hooks, no 'use client'
// Covers (auth) route transitions: /login, /register, /forgot-password, etc.

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        {/* Logo placeholder */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high" />
          <div className="h-6 w-40 bg-surface-container-high rounded-full" />
          <div className="h-4 w-56 bg-surface-container-high rounded-full opacity-60" />
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 space-y-5 border border-surface-container-high">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-7 w-36 bg-surface-container-high rounded-full" />
            <div className="h-4 w-52 bg-surface-container-high rounded-full opacity-60" />
          </div>

          {/* Form fields */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 bg-surface-container-high rounded-full" />
              <div className="h-12 bg-surface-container-high rounded-xl" />
            </div>
          ))}

          {/* Button */}
          <div className="h-12 bg-surface-container-high rounded-full mt-2" />
        </div>
      </div>
    </div>
  );
}
